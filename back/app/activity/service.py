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
    """EXIF 추출 → 그룹화 → 매칭 결과 반환 (DB 저장 없음)"""
    photo_data_list = []
    face_only_bytes_list = []   # EXIF 추출 실패 사진 — 얼굴 감지만 시도
    skipped_count = 0
    results = []

    # photo 리스트에서 하나씩 꺼내서 위치·시간 추출
    # EXIF 실패 사진은 버리지 않고 얼굴 감지 시도용으로 보관
    for photo in photos:
        try:
            photo_bytes = await photo.read()
            latitude, longitude, dt = _extract_info_from_exif(photo_bytes)
            photo_data_list.append({
                "latitude": latitude,
                "longitude": longitude,
                "datetime": dt,
                "bytes": photo_bytes,   # 얼굴 매칭에 재사용하기 위해 bytes 보존
            })
        except HTTPException:
            # EXIF 없음 → 날짜·위치는 모르지만 얼굴은 감지할 수 있으므로 따로 보관
            face_only_bytes_list.append(photo_bytes)

    print(f"[upload_photos] EXIF 성공: {len(photo_data_list)}장, EXIF 실패(face_only 시도): {len(face_only_bytes_list)}장")

    # ── face_only 그룹 처리 ───────────────────────────────────
    # EXIF 실패 사진들을 ai_server에 보내 얼굴이 있으면 face_only 그룹으로 추가
    if face_only_bytes_list:
        try:
            # 1단계: /embed-group으로 EXIF 없는 사진에서 얼굴 임베딩 추출
            print(f"[upload_photos] face_only /embed-group 호출 전 - {len(face_only_bytes_list)}장")
            files = [("photos", ("photo.jpg", b, "image/jpeg")) for b in face_only_bytes_list]
            async with httpx.AsyncClient(timeout=60.0) as client:
                response = await client.post(
                    f"{settings.AI_SERVER_URL}/embed-group",
                    files=files,
                )
            embed_result = response.json()
            face_embeddings = embed_result.get("face_embeddings", [])
            print(f"[upload_photos] face_only /embed-group 완료 - 감지된 얼굴 수: {len(face_embeddings)}")

            if face_embeddings:
                # 2단계: DB에서 embedding이 있는 People 조회 후 /match 호출
                people = db.query(PeopleModel).filter(
                    PeopleModel.user_id == current_user.id,
                    PeopleModel.embedding.isnot(None),
                ).all()
                candidates = [{"people_id": p.id, "embedding": p.embedding} for p in people]

                print(f"[upload_photos] face_only /match 호출 전 - 얼굴: {len(face_embeddings)}개, candidates: {len(candidates)}명")
                async with httpx.AsyncClient(timeout=60.0) as client:
                    match_response = await client.post(
                        f"{settings.AI_SERVER_URL}/match",
                        json={
                            "face_embeddings": face_embeddings,
                            "self_embedding": current_user.embedding,
                            "candidates": candidates,
                        },
                    )
                match_result = match_response.json()
                print(f"[upload_photos] face_only /match 완료 - matched: {len(match_result.get('matched', []))}, unmatched: {len(match_result.get('unmatched', []))}, self: {len(match_result.get('self', []))}")

                # face_only 그룹 — 날짜·위치 없이 얼굴 매칭 결과만 포함
                # group_index는 마지막에 enumerate로 재할당
                face_only_group = {
                    "group_index": None,
                    "match_type": "face_only",
                    "date": None,
                    "time": None,
                    "latitude": None,
                    "longitude": None,
                    "photo_count": len(face_only_bytes_list),
                    "schedule_id": None,
                    "schedule_title": None,
                    "place_id": None,
                    "place_name": None,
                    "people": None,
                    "candidates": [],
                    "matched_people_ids": [m["people_id"] for m in match_result.get("matched", [])],
                    "unmatched_face_count": len(match_result.get("unmatched", [])),
                    "unmatched_embeddings": [
                        face_embeddings[u["face_index"]] for u in match_result.get("unmatched", [])
                    ],
                    "self_detected": len(match_result.get("self", [])) > 0,
                }
                results.append(face_only_group)
            else:
                # 얼굴도 없음 → 진짜 스킵
                skipped_count += len(face_only_bytes_list)

        except Exception as e:
            # ai_server 호출 실패 → face_only 사진 전체 스킵 처리
            print(f"[upload_photos] face_only 처리 실패: {e}")
            skipped_count += len(face_only_bytes_list)

    # face_only 그룹이 있으면 유효한 사진으로 인정
    has_valid = bool(photo_data_list) or any(
        r.get("match_type") == "face_only" for r in results
    )
    if not has_valid and not photo_data_list:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="유효한 사진이 없습니다"
        )

    # EXIF 기반 그룹 처리 (기존 로직 유지)
    groups = _group_photos(photo_data_list)
    print(f"[upload_photos] EXIF 그룹 수: {len(groups)}개")
    for idx, group in enumerate(groups):
        print(f"[upload_photos] 그룹 {idx} 처리 시작 - 사진 {len(group)}장")
        # 일정 매칭 (GPS + 날짜 기반)
        match_result = _match_group(db, group, current_user)
        print(f"[upload_photos] 그룹 {idx} _match_group 완료 - match_type: {match_result.get('match_type')}")
        # 얼굴 매칭 (ai_server 호출) — 실패해도 fallback 값으로 merge
        face_result = await _face_match_group(group, current_user, db)
        print(f"[upload_photos] 그룹 {idx} _face_match_group 완료 - matched_people: {face_result.get('matched_people_ids')}, self: {face_result.get('self_detected')}")
        match_result.update(face_result)
        results.append(match_result)

    # 모든 그룹(face_only 포함)에 순서대로 group_index 재할당
    for idx, result in enumerate(results):
        result["group_index"] = idx

    print(f"[upload_photos] 전체 완료 - 총 그룹: {len(results)}개, skipped: {skipped_count}장")
    return {"results": results, "skipped_count": skipped_count}


# ── 얼굴 매칭 (ai_server 호출) ───────────────────────────────
async def _face_match_group(group: list[dict], current_user, db: Session) -> dict:
    """
    단체 사진 그룹에서 얼굴을 추출하고 등록된 People과 매칭한다.

    처리 흐름:
        1. ai_server POST /embed-group → 그룹 내 사진에서 전체 얼굴 임베딩 추출
        2. DB에서 현재 유저의 People 중 embedding이 있는 것만 candidates로 구성
        3. ai_server POST /match → self / matched / unmatched 분류
        4. 결과 파싱 후 반환

    실패 정책:
        - ai_server 호출 오류, 얼굴 미감지 등 모든 예외는 fallback 값으로 흡수
        - 서비스 전체 중단 없이 항상 dict 반환

    Returns:
        {
            "matched_people_ids": [int, ...],
            "unmatched_face_count": int,
            "unmatched_embeddings": [[float, ...], ...],
            "self_detected": bool
        }
    """
    # 실패 시 반환할 기본값 — 항상 이 구조로 반환되어야 한다
    default = {
        "matched_people_ids": [],
        "unmatched_face_count": 0,
        "unmatched_embeddings": [],
        "self_detected": False,
    }

    # ── 1단계: /embed-group 호출 — 그룹 내 사진에서 얼굴 임베딩 추출 ──
    photo_bytes_list = [item["bytes"] for item in group if "bytes" in item]
    if not photo_bytes_list:
        return default
    print("=== _face_match_group 시작 ===")
    try:
        # multipart/form-data로 여러 사진 전송, 필드명은 "photos"
        files = [("photos", ("photo.jpg", b, "image/jpeg")) for b in photo_bytes_list]
        print("embed-group 호출 전")
        print(f"AI_SERVER_URL: {settings.AI_SERVER_URL}")
        print(f"photo_bytes_list 길이: {len(photo_bytes_list)}")
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                f"{settings.AI_SERVER_URL}/embed-group",
                files=files,
            )
        response.raise_for_status()
        embed_data = response.json()
        face_embeddings = embed_data["face_embeddings"]
        print(f"embed-group 결과: {face_embeddings}")
        face_count = embed_data["face_count"]
    except Exception as e:
        # 네트워크 오류, 서버 오류, 파싱 오류 등 모두 fallback
        print(f"[_face_match_group] embed-group 실패: {e}")
        return default

    # 감지된 얼굴이 없으면 매칭 불필요
    if face_count == 0:
        return default

    # ── 2단계: DB에서 embedding이 있는 People만 candidates로 구성 ──
    people_list = db.query(PeopleModel).filter(
        PeopleModel.user_id == current_user.id
    ).all()
    # embedding이 None인 People은 매칭 대상에서 제외
    candidates = [
        {"people_id": p.id, "embedding": p.embedding}
        for p in people_list if p.embedding is not None
    ]

    # ── 3단계: /match 호출 — self / matched / unmatched 분류 ──
    try:
        match_body = {
            "face_embeddings": face_embeddings,
            "self_embedding": current_user.embedding,   # 본인 임베딩 (없으면 null)
            "candidates": candidates,
        }
        print("match 호출 전")
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                f"{settings.AI_SERVER_URL}/match",
                json=match_body,
            )
        print(f"match 결과: {response}")
        response.raise_for_status()
        result = response.json()
    except Exception as e:
        print(f"에러 발생: {e}")
        # /match 호출 실패 시 fallback
        return default

    # ── 4단계: 결과 파싱 ──────────────────────────────────────
    matched_people_ids = [m["people_id"] for m in result["matched"]]
    unmatched_face_count = len(result["unmatched"])
    # 미등록 얼굴의 임베딩 — face_index로 원본 임베딩 참조
    unmatched_embeddings = [
        face_embeddings[u["face_index"]] for u in result["unmatched"]
    ]
    self_detected = len(result["self"]) > 0

    return {
        "matched_people_ids": matched_people_ids,
        "unmatched_face_count": unmatched_face_count,
        "unmatched_embeddings": unmatched_embeddings,
        "self_detected": self_detected,
    }


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

    # 해당 스케쥴이 이미 확정 상태일 경우 에러 처리
    if schedule.status == "Completed":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="이미 완료된 일정입니다"
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
