# 파이프라인 원칙:
# 모든 경로 → register_schedule → confirm_schedule → ActivityLog
# 사진 업로드: upload_photos(분석만) → [매칭 Schedule 있음] confirm_schedule
#                                    → [매칭 Schedule 없음] register_schedule → confirm_schedule
# 수동 생성: register_schedule → confirm_schedule

from sqlalchemy.orm import Session
from fastapi import HTTPException, UploadFile, status
from datetime import date
from typing import Optional
from config.config import settings
from activity.model import ActivityLog, Photo, log_people
from schedule.model import Schedule
from place.model import Place
from auth.model import User
from people.model import People as PeopleModel  # People과 이름 충돌 방지
from utils.geo import _haversine
from utils.exif import _extract_info_from_exif
import httpx


# ── 사진 그룹화 ───────────────────────────────────────────────
# 그룹화된 사진 리스트에서 하나씩 꺼냄
def _group_photos(photo_data_list: list[dict]) -> list[list[dict]]:
    """같은 날짜 + GPS 반경 200m 이내 사진을 같은 그룹으로 묶음"""
    groups = []
    for photo in photo_data_list:
        placed = False
        for group in groups:
            rep = group[0]
            if photo["datetime"].date() == rep["datetime"].date():
                dist = _haversine(
                    photo["latitude"], photo["longitude"],
                    rep["latitude"], rep["longitude"]
                )
                if dist <= 200:
                    group.append(photo)
                    placed = True
                    break
        if not placed:
            groups.append([photo])
    return groups


# ── 그룹별 매칭 ───────────────────────────────────────────────
def _match_group(db: Session, group: list[dict], current_user) -> dict:
    """그룹 대표 좌표·날짜로 Schedule 매칭 시도 (날짜 일치 + GPS 200m 기준)"""
    rep = group[0]
    rep_date = rep["datetime"].date()
    rep_lat = rep["latitude"]
    rep_lon = rep["longitude"]

    base = {
        "date": rep_date,
        "time": rep["datetime"].time(),
        "latitude": rep_lat,
        "longitude": rep_lon,
        "photo_count": len(group),
        "schedule_id": None,
        "schedule_title": None,
        "place_id": None,
        "place_name": None,
        "people": None,
        "candidates": [],
    }

    # 같은 날짜의 Planned Schedule 전체 조회
    schedules = db.query(Schedule).filter(
        Schedule.user_id == current_user.id,
        Schedule.status == "Planned"
    ).all()
    same_date = [s for s in schedules if s.start_time.date() == rep_date]

    if not same_date:
        # none: 같은 날짜 Schedule 없음 — GPS 200m 이내 등록 장소가 있으면 place_id/place_name 포함
        places = db.query(Place).filter(Place.user_id == current_user.id).all()
        for place in places:
            if _haversine(rep_lat, rep_lon, place.latitude, place.longitude) <= 200:
                return {**base, "match_type": "none", "place_id": place.id, "place_name": place.name}
        return {**base, "match_type": "none"}

    # exact: 날짜 일치 + GPS 200m 이내
    for schedule in same_date:
        if not schedule.place_id:
            continue
        place = db.query(Place).filter(Place.id == schedule.place_id).first()
        if place and _haversine(rep_lat, rep_lon, place.latitude, place.longitude) <= 200:
            return {
                **base,
                "match_type": "exact",
                "schedule_id": schedule.id,
                "schedule_title": schedule.title,
                "place_id": place.id,
                "place_name": place.name,
                "people": [{"id": p.id, "name": p.name} for p in schedule.people],
            }

    # date_only: 같은 날짜 있지만 GPS 200m 초과 → candidates 반환
    candidates = []
    for s in same_date:
        place_name = None
        if s.place_id:
            p = db.query(Place).filter(Place.id == s.place_id).first()
            place_name = p.name if p else None
        candidates.append({
            "schedule_id": s.id,
            "title": s.title,
            "place_id": s.place_id,
            "place_name": place_name,
        })

    return {**base, "match_type": "date_only", "candidates": candidates}


# ── 사진 업로드 메인 함수 ─────────────────────────────────────
async def upload_photos(db: Session, photos: list, current_user: User) -> dict:
    """EXIF 추출 → ai_server /detect 1회 → 그룹화 → 일정 매칭 결과 반환 (DB 저장 없음)"""
    import json

    # 사진업로드 파이프라인 1번: 사진 bytes 읽기 및 EXIF 추출
    # — photo_index로 각 사진을 추적, EXIF 없는 사진은 datetime/위치를 None으로 보관
    photos_data = []
    for i, photo in enumerate(photos):
        photo_bytes = await photo.read()
        try:
            latitude, longitude, dt = _extract_info_from_exif(photo_bytes)
            photos_data.append({
                "photo_index": i,
                "datetime": dt,        # _group_photos / _match_group 호환용
                "latitude": latitude,
                "longitude": longitude,
                "bytes": photo_bytes,
            })
        except HTTPException:
            # EXIF 없음 → 날짜·위치 None, 독립 그룹으로 처리
            photos_data.append({
                "photo_index": i,
                "datetime": None,
                "latitude": None,
                "longitude": None,
                "bytes": photo_bytes,
            })

    exif_count = sum(1 for p in photos_data if p["datetime"] is not None)
    noexif_count = len(photos_data) - exif_count
    print(f"[upload_photos] 총 사진: {len(photos_data)}장 (EXIF 있음: {exif_count}장, EXIF 없음: {noexif_count}장)")

    if not photos_data:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="유효한 사진이 없습니다"
        )

    # 사진업로드 파이프라인 2번: DB People 쿼리 (1회)
    # — embedding이 있는 People만 candidates로 구성
    people_list = db.query(PeopleModel).filter(
        PeopleModel.user_id == current_user.id,
        PeopleModel.embedding.isnot(None),
    ).all()
    candidates = [{"people_id": p.id, "embedding": p.embedding} for p in people_list]
    print(f"[upload_photos] DB People 쿼리: 1회 — {len(candidates)}명")

    # 사진업로드 파이프라인 3번: ai_server POST /detect 호출 (1회)
    # — 전체 사진을 한 번에 전송, photo_index별 얼굴 매칭 결과 수신
    print(f"[upload_photos] ai_server 호출: 1회 — {len(photos_data)}장")
    detect_result = []
    try:
        files = [("photos", ("photo.jpg", p["bytes"], "image/jpeg")) for p in photos_data]
        data = {
            "self_embedding": json.dumps(current_user.embedding) if current_user.embedding else "null",
            "candidates": json.dumps(candidates),
        }
        async with httpx.AsyncClient(timeout=120.0) as client:
            response = await client.post(
                f"{settings.AI_SERVER_URL}/detect",
                files=files,
                data=data,
            )
        response.raise_for_status()
        detect_result = response.json()
        print(f"[upload_photos] /detect 완료 — {len(detect_result)}개 결과")
    except Exception as e:
        # ai_server 실패 시 모든 사진의 얼굴 매칭 결과를 fallback(빈 값)으로 처리
        print(f"[upload_photos] /detect 실패: {e}")
        detect_result = [
            {"photo_index": p["photo_index"], "matched_people_ids": [], "unmatched_count": 0, "self_detected": False}
            for p in photos_data
        ]

    # 사진업로드 파이프라인 4번: photo_index 기준으로 detect 결과를 각 사진 dict에 합치기
    detect_map = {r["photo_index"]: r for r in detect_result}
    for photo in photos_data:
        photo.update(detect_map.get(photo["photo_index"], {
            "matched_people_ids": [],
            "unmatched_count": 0,
            "self_detected": False,
        }))

    # 사진업로드 파이프라인 5번: EXIF 유무로 분리 후 그룹화
    # — EXIF 있는 사진: 날짜 + GPS 200m 기준 그룹화
    # — EXIF 없는 사진: 각각 독립 그룹 (match_type: "none")
    exif_photos = [p for p in photos_data if p["datetime"] is not None]
    noexif_photos = [p for p in photos_data if p["datetime"] is None]

    results = []

    # EXIF 있는 사진 그룹 처리
    groups = _group_photos(exif_photos)
    print(f"[upload_photos] EXIF 그룹 수: {len(groups)}개")
    for idx, group in enumerate(groups):
        # 사진업로드 파이프라인 6번: 그룹별 일정 매칭 (_match_group)
        # — GPS + 날짜 기반으로 Schedule 후보 탐색
        match_result = _match_group(db, group, current_user)
        print(f"[upload_photos] 그룹 {idx} match_type: {match_result.get('match_type')}")

        # 사진업로드 파이프라인 7번: 그룹 내 얼굴 매칭 결과 집계 (중복 제거)
        # — 같은 사람이 그룹 내 여러 사진에 등장해도 matched_people_ids에 1번만 포함
        group_people = list(set(
            pid
            for photo in group
            for pid in photo.get("matched_people_ids", [])
        ))
        unmatched_face_count = sum(photo.get("unmatched_count", 0) for photo in group)
        self_detected = any(photo.get("self_detected", False) for photo in group)

        match_result["matched_people_ids"] = group_people
        match_result["unmatched_face_count"] = unmatched_face_count
        match_result["unmatched_embeddings"] = []
        match_result["self_detected"] = self_detected
        match_result["photo_indices"] = [photo["photo_index"] for photo in group]
        results.append(match_result)

    # EXIF 없는 사진: 각각 독립 그룹
    for photo in noexif_photos:
        results.append({
            "match_type": "none",
            "date": None,
            "time": None,
            "latitude": None,
            "longitude": None,
            "photo_count": 1,
            "photo_indices": [photo["photo_index"]],
            "schedule_id": None,
            "schedule_title": None,
            "place_id": None,
            "place_name": None,
            "people": None,
            "candidates": [],
            "matched_people_ids": photo.get("matched_people_ids", []),
            "unmatched_face_count": photo.get("unmatched_count", 0),
            "unmatched_embeddings": [],
            "self_detected": photo.get("self_detected", False),
        })

    for idx, result in enumerate(results):
        result["group_index"] = idx

    print(f"[upload_photos] 전체 완료 — 총 그룹: {len(results)}개")
    return {"results": results, "skipped_count": 0}


# ── 일정 확정 → ActivityLog 생성 ─────────────────────────────
def confirm_schedule(
    db: Session,
    schedule_id: int,
    memo: Optional[str],
    current_user: User,
    photo_bytes_list: list[bytes] = None,   # 선택적으로 사진을 함께 저장
    matched_people_ids: list[int] = [],     # 얼굴 매칭으로 추가 식별된 People ID 목록
):
    schedule = db.query(Schedule).filter(
        Schedule.id == schedule_id,
        Schedule.user_id == current_user.id
    ).first()
    
    #일치하는 스케줄이 있는 지 확인 - 1번
    if not schedule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Schedule not found"
        )

    #미래 일정일 경우 임의 complete 막기
    if schedule.start_time.date() > date.today():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="아직 완료할 수 없는 일정입니다"
        )

    activity_date = schedule.start_time.date()

    # 사진 GPS 기반 장소 결정 (커밋 전)
    if photo_bytes_list:
        photo_lat, photo_lon, _ = _extract_info_from_exif(photo_bytes_list[0])
        all_places = db.query(Place).filter(Place.user_id == current_user.id).all()
        matched_place = next(
            (p for p in all_places if _haversine(photo_lat, photo_lon, p.latitude, p.longitude) <= 200),
            None
        )
        final_place_id = matched_place.id if matched_place else None
        schedule.place_id = final_place_id
    else:
        final_place_id = schedule.place_id

    activity_log = ActivityLog(
        user_id=current_user.id,
        place_id=final_place_id,
        date=activity_date,
        time=schedule.start_time.time(),
        memo=memo if memo is not None else schedule.memo
    )
    activity_log.people = list(schedule.people)

    # 얼굴 매칭으로 추가 식별된 People을 합산 (schedule.people과 중복 제거)
    if matched_people_ids:
        matched_people = db.query(PeopleModel).filter(
            PeopleModel.id.in_(matched_people_ids),
            PeopleModel.user_id == current_user.id,  # 타 유저 People 접근 방지
        ).all()
        # id를 키로 dict를 만들어 중복 없이 합산
        people_map = {p.id: p for p in list(schedule.people) + matched_people}
        final_people = list(people_map.values())
        activity_log.people = final_people

    # People count / Place visit_count 중복 방지
    # Schedule 기준이 아닌 ActivityLog 기준으로 같은 날 이미 기록된 항목 조회
    existing_logs = db.query(ActivityLog).filter(
        ActivityLog.user_id == current_user.id,
        ActivityLog.date == activity_date,
    ).all()
    # 같은 날 이미 카운트된 People ID / Place ID 수집
    counted_people_ids = {p.id for log in existing_logs for p in log.people}
    counted_place_ids = {log.place_id for log in existing_logs if log.place_id}

    # 이미 카운트되지 않은 사람만 count 증가
    for person in activity_log.people:
        if person.id not in counted_people_ids:
            person.count += 1

    # Place visit_count 중복 방지 — 같은 날 이미 기록된 장소는 증가 안 함
    if final_place_id and final_place_id not in counted_place_ids:
        place = db.query(Place).filter(Place.id == final_place_id).first()
        if place:
            place.visit_count += 1

    db.add(activity_log)
    schedule.status = "Completed"
    db.commit()
    db.refresh(activity_log)

    # 사진이 함께 전달된 경우 cloudinary에 저장하고 Photo 레코드 생성
    if photo_bytes_list:
        #uploader는 외부 모듈이라 임포트 해야 함
        import cloudinary.uploader
        import io
        for photo_bytes in photo_bytes_list:
            upload_result = cloudinary.uploader.upload(
                io.BytesIO(photo_bytes),
                folder="cluster/photos"
            )
            photo_url = upload_result["secure_url"]
            db.add(Photo(log_id=activity_log.log_id, photo_url=photo_url))
        db.commit()
        db.refresh(activity_log)

    db.refresh(activity_log)
    _ = activity_log.photos
    return activity_log


# ── 사진 검증 ─────────────────────────────────────────────────
def verify_photo(db: Session, schedule_id: int, photo_bytes: bytes, current_user: User) -> dict:
    """사진 EXIF와 일정의 날짜/장소를 비교해 매칭 여부 반환"""
    schedule = db.query(Schedule).filter(
        Schedule.id == schedule_id,
        Schedule.user_id == current_user.id
    ).first()
    if not schedule:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Schedule not found")

    schedule_date = schedule.start_time.date()
    schedule_place_name = None
    sched_place = None
    if schedule.place_id:
        sched_place = db.query(Place).filter(Place.id == schedule.place_id).first()
        if sched_place:
            schedule_place_name = sched_place.name

    # EXIF 추출 실패 시 match=false 반환 (예외 던지지 않음)
    try:
        photo_lat, photo_lon, photo_dt = _extract_info_from_exif(photo_bytes)
        photo_date = photo_dt.date()
    except Exception:
        return {
            "match": False,
            "date_match": False,
            "location_match": False,
            "photo_date": None,
            "photo_place_name": None,
            "schedule_date": schedule_date,
            "schedule_place_name": schedule_place_name,
        }

    date_match = photo_date == schedule_date

    # 장소 없는 일정이면 location_match=False
    location_match = False
    photo_place_name = None
    if sched_place:
        dist = _haversine(photo_lat, photo_lon, sched_place.latitude, sched_place.longitude)
        location_match = dist <= 200
        if location_match:
            photo_place_name = sched_place.name
        else:
            # 200m 초과 시 가장 가까운 등록 장소 이름 표시
            all_places = db.query(Place).filter(Place.user_id == current_user.id).all()
            if all_places:
                closest = min(all_places, key=lambda p: _haversine(photo_lat, photo_lon, p.latitude, p.longitude))
                if _haversine(photo_lat, photo_lon, closest.latitude, closest.longitude) <= 200:
                    photo_place_name = closest.name

    return {
        "match": date_match and location_match,
        "date_match": date_match,
        "location_match": location_match,
        "photo_date": photo_date,
        "photo_place_name": photo_place_name,
        "schedule_date": schedule_date,
        "schedule_place_name": schedule_place_name,
    }


# ── Activity 조회 ─────────────────────────────────────────────
def get_activity(db: Session, log_id: int, current_user: User):
    activity_log = db.query(ActivityLog).filter(
        ActivityLog.log_id == log_id,
        ActivityLog.user_id == current_user.id
    ).first()
    if not activity_log:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Activity not found"
        )
    return activity_log
