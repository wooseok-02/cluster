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
    """그룹 대표 좌표·날짜로 Schedule → Place → none 순서로 매칭 시도"""
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
    }

    # Step 1: Schedule 매칭 (같은 날짜 + GPS 반경 200m)
    schedules = db.query(Schedule).filter(
        Schedule.user_id == current_user.id,
        Schedule.status == "Planned"
    ).all()

    for schedule in schedules:
        if schedule.start_time.date() != rep_date or not schedule.place_id:
            continue
        place = db.query(Place).filter(Place.id == schedule.place_id).first()
        if place and _haversine(rep_lat, rep_lon, place.latitude, place.longitude) <= 200:
            return {
                **base,
                "match_type": "schedule",
                "schedule_id": schedule.id,
                "schedule_title": schedule.title,
                "place_id": place.id,
                "place_name": place.name,
                "people": [{"id": p.id, "name": p.name} for p in schedule.people],
            }

    # Step 2: Place 매칭 (등록된 장소만 있는 경우)
    places = db.query(Place).filter(Place.user_id == current_user.id).all()
    for place in places:
        if _haversine(rep_lat, rep_lon, place.latitude, place.longitude) <= 200:
            return {
                **base,
                "match_type": "place",
                "place_id": place.id,
                "place_name": place.name,
            }

    # Step 3: 매칭 없음
    return {**base, "match_type": "none"}


# ── 사진 업로드 메인 함수 ─────────────────────────────────────
async def upload_photos(db: Session, photos: list, current_user: User) -> dict:
    """EXIF 추출 → 그룹화 → 매칭 결과 반환 (DB 저장 없음)"""
    photo_data_list = []
    skipped_count = 0

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
    if not schedule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Schedule not found"
        )

    if schedule.status == "Completed":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="이미 완료된 일정입니다"
        )

    if schedule.start_time.date() > date.today():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="아직 완료할 수 없는 일정입니다"
        )

    activity_date = schedule.start_time.date()

    activity_log = ActivityLog(
        user_id=current_user.id,
        place_id=schedule.place_id,
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
    if schedule.place_id:
        place = db.query(Place).filter(Place.id == schedule.place_id).first()
        if place and schedule.place_id not in counted_place_ids:
            place.visit_count += 1

    db.add(activity_log)
    schedule.status = "Completed"
    db.commit()
    db.refresh(activity_log)

    # 사진이 함께 전달된 경우 디스크에 저장하고 Photo 레코드 생성
    # photo_url 형식: /static/photos/{uuid}.jpg
    # 나중에 S3로 교체할 때는 이 블록의 저장 경로와 photo_url 값만 바꾸면 됨
    if photo_bytes_list:
        import cloudinary
        import cloudinary.uploader
        import io
        from urllib.parse import urlparse
        parsed = urlparse(settings.CLOUDINARY_URL)
        cloudinary.config(
            cloud_name=parsed.hostname,
            api_key=parsed.username,
            api_secret=parsed.password,
        )

        for photo_bytes in photo_bytes_list:
            upload_result = cloudinary.uploader.upload(
                io.BytesIO(photo_bytes),
                folder="cluster/photos"
            )
            photo_url = upload_result["secure_url"]
            db.add(Photo(log_id=activity_log.log_id, photo_url=photo_url))
        db.commit()
        db.refresh(activity_log)

    return activity_log


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
