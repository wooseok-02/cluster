# 파이프라인 원칙:
# 모든 경로 → register_schedule → confirm_schedule → ActivityLog
# 사진 업로드: upload_photos(분석만) → [매칭 Schedule 있음] confirm_schedule
#                                    → [매칭 Schedule 없음] register_schedule → confirm_schedule
# 수동 생성: register_schedule → confirm_schedule

from sqlalchemy.orm import Session
from fastapi import HTTPException, UploadFile, status
from datetime import date
from typing import Optional
import math
from config.config import settings
from activity.model import ActivityLog, Photo, log_people
from schedule.model import Schedule
from place.model import Place
from auth.model import User
from place.service import _extract_info_from_exif


# ── Haversine 거리 계산 ───────────────────────────────────────
def _haversine(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """두 GPS 좌표 간 거리를 미터 단위로 반환 (Haversine 공식)"""
    R = 6371000
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


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
    skipped_count = 0

    # photo 리스트에서 하나씩 꺼내서 -> 위치와 시간 추출
    for photo in photos:
        try:
            photo_bytes = await photo.read()
            latitude, longitude, dt = _extract_info_from_exif(photo_bytes)
            photo_data_list.append({
                "latitude": latitude,
                "longitude": longitude,
                "datetime": dt,
            })
        except HTTPException:
            skipped_count += 1

    #사진이 없으면 에러 반환
    if not photo_data_list:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="유효한 사진이 없습니다"
        )

    groups = _group_photos(photo_data_list)
    results = []
    for idx, group in enumerate(groups):
        match_result = _match_group(db, group, current_user)
        match_result["group_index"] = idx
        results.append(match_result)

    return {"results": results, "skipped_count": skipped_count}


# ── 일정 확정 → ActivityLog 생성 ─────────────────────────────
def confirm_schedule(
    db: Session,
    schedule_id: int,
    memo: Optional[str],
    current_user: User,
    photo_bytes_list: list[bytes] = None   # 선택적으로 사진을 함께 저장
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

    # People count 중복 방지 — 같은 날 이미 완료된 다른 일정에 같은 사람이 있으면 증가 안 함
    from schedule.model import Schedule as ScheduleModel, schedule_people
    completed_today = (
        db.query(ScheduleModel)
        .filter(
            ScheduleModel.user_id == current_user.id,
            ScheduleModel.status == "Completed",
            ScheduleModel.id != schedule.id,
        ).all()
    )
    completed_today_same_date = [
        s for s in completed_today if s.start_time.date() == activity_date
    ]
    counted_people_ids = set()
    for s in completed_today_same_date:
        for p in s.people:
            counted_people_ids.add(p.id)
    counted_place_ids = {s.place_id for s in completed_today_same_date if s.place_id}

    for person in activity_log.people:
        if person.id not in counted_people_ids:
            person.count += 1

    # Place visit_count 중복 방지 — 같은 날 이미 완료된 다른 일정에 같은 장소 있으면 증가 안 함
    if final_place_id:
        place = db.query(Place).filter(Place.id == final_place_id).first()
        if place and final_place_id not in counted_place_ids:
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
