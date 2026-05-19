from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from datetime import date, datetime
from schedule.model import Schedule
from place.model import Place
from people.model import People
from auth.model import User
from schedule.schema import ScheduleCreate, ScheduleUpdate
from activity.model import ActivityLog, Photo
from sqlalchemy import extract
from utils.cloudinary import get_signed_photo_url


def serialize_schedule(schedule: Schedule) -> dict:
    return {
        "id": schedule.id,
        "title": schedule.title,
        "start_time": schedule.start_time,
        "end_time": schedule.end_time,
        "memo": schedule.memo,
        "status": schedule.status,
        "place": schedule.place,
        "people": schedule.people,
        "photos": [
            {"id": photo.id, "photo_url": get_signed_photo_url(photo.photo_url)}
            for photo in getattr(schedule, "photos", [])
        ],
    }

# 일정 미리 생성 로직
def create_schedule(db: Session, schedule_data: ScheduleCreate, current_user: User):
    # date 기준으로 status 자동 결정
    today = date.today()
    schedule_status = "Planned" if schedule_data.date >= today else "Completed"

    # date + time → 전체 datetime 조합
    start_datetime = datetime.combine(schedule_data.date, schedule_data.start_time)
    end_datetime = datetime.combine(schedule_data.date, schedule_data.end_time)

    # place_id 유효성 검증 (입력된 경우에만)
    place = None
    if schedule_data.place_id is not None:
        place = db.query(Place).filter(
            Place.id == schedule_data.place_id,
            Place.user_id == current_user.id
        ).first()
        if not place:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={
                    "message": "장소가 등록되어 있지 않습니다. 먼저 장소를 등록해주세요.",
                    "redirect_to": "/place/create"
                }
            )

    # people_ids 유효성 검증 (입력된 경우에만)
    people_list = []
    if schedule_data.people_ids:
        people_list = db.query(People).filter(
            People.id.in_(schedule_data.people_ids),
            People.user_id == current_user.id
        ).all()

        found_ids = {p.id for p in people_list}
        missing_ids = set(schedule_data.people_ids) - found_ids
        if missing_ids:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={
                    "message": "등록되지 않은 인물이 포함되어 있습니다. 먼저 인물을 등록해주세요.",
                    "redirect_to": "/people/register/people",
                    "missing_people_ids": sorted(missing_ids)
                }
            )

    new_schedule = Schedule(
        user_id=current_user.id,
        place_id=schedule_data.place_id,
        title=schedule_data.title,
        start_time=start_datetime,
        end_time=end_datetime,
        memo=schedule_data.memo,
        status=schedule_status
    )
    # relationship을 통해 LOG_PEOPLE 자동 삽입
    new_schedule.people = people_list

    db.add(new_schedule)
    db.commit()
    db.refresh(new_schedule)

    return new_schedule


def get_schedule(db: Session, schedule_id: int, current_user: User):
    schedule = db.query(Schedule).filter(
        Schedule.id == schedule_id,
        Schedule.user_id == current_user.id
    ).first()
    if not schedule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Schedule not found"
        )

    # Completed 일정이면 같은 날짜+장소의 ActivityLog에서 사진 가져오기
    photos = []
    if schedule.status == "Completed":
        activity = db.query(ActivityLog).filter(
            ActivityLog.user_id == current_user.id,
            ActivityLog.date == schedule.start_time.date(),
            ActivityLog.place_id == schedule.place_id,
        ).first()
        if activity:
            photos = db.query(Photo).filter(Photo.log_id == activity.log_id).all()

    schedule.photos = photos
    return schedule

def update_schedule(db: Session, schedule_id: int, update_data: ScheduleUpdate, current_user: User):
    schedule = db.query(Schedule).filter(
        Schedule.id == schedule_id,
        Schedule.user_id == current_user.id
    ).first()
    if not schedule:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Schedule not found")
    if schedule.status != "Planned":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Completed 일정은 수정할 수 없습니다.")

    # 날짜/시간 재조합을 위해 현재 값 기준으로 처리
    base_date = update_data.date or schedule.start_time.date()
    base_start = update_data.start_time or schedule.start_time.time()
    base_end = update_data.end_time or schedule.end_time.time()

    if update_data.title is not None:
        schedule.title = update_data.title
    if update_data.memo is not None:
        schedule.memo = update_data.memo

    schedule.start_time = datetime.combine(base_date, base_start)
    schedule.end_time = datetime.combine(base_date, base_end)

    # place_id 변경 (0이면 null로 처리)
    if update_data.place_id is not None:
        if update_data.place_id == 0:
            schedule.place_id = None
        else:
            place = db.query(Place).filter(
                Place.id == update_data.place_id,
                Place.user_id == current_user.id
            ).first()
            if not place:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail={"message": "장소가 등록되어 있지 않습니다."})
            schedule.place_id = update_data.place_id

    # people_ids 변경
    if update_data.people_ids is not None:
        if update_data.people_ids:
            people_list = db.query(People).filter(
                People.id.in_(update_data.people_ids),
                People.user_id == current_user.id
            ).all()
            found_ids = {p.id for p in people_list}
            missing_ids = set(update_data.people_ids) - found_ids
            if missing_ids:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail={"message": "등록되지 않은 인물이 포함되어 있습니다.", "missing_people_ids": sorted(missing_ids)})
            schedule.people = people_list
        else:
            schedule.people = []

    # 날짜 변경 시 status 재계산
    today = date.today()
    schedule.status = "Planned" if base_date >= today else "Completed"

    db.commit()
    db.refresh(schedule)
    return schedule


def scheList(db : Session, year, month, current_user) :
    schedule_list = db.query(Schedule).filter(
        Schedule.user_id == current_user.id,
        extract("year", Schedule.start_time) == year,
        extract("month", Schedule.start_time) == month
    ).all()

    if not schedule_list :
        raise HTTPException(
            status_code = status.HTTP_404_NOT_FOUND,
            detail = "일치하는 날짜의 일정을 찾지 못했습니다."
        )

    response = []
    for schedule in schedule_list:
        photos = []
        if schedule.status == "Completed":
            activity = db.query(ActivityLog).filter(
                ActivityLog.user_id == current_user.id,
                ActivityLog.date == schedule.start_time.date(),
                ActivityLog.place_id == schedule.place_id,
            ).first()
            if activity:
                photos = db.query(Photo).filter(Photo.log_id == activity.log_id).all()

        serialized_photos = [
            {"id": photo.id, "photo_url": get_signed_photo_url(photo.photo_url)}
            for photo in photos
        ]
        response.append({
            "id": schedule.id,
            "date": schedule.start_time,
            "title": schedule.title,
            "status": schedule.status,
            "start_time": schedule.start_time,
            "end_time": schedule.end_time,
            "photos": serialized_photos,
            "photo_count": len(serialized_photos),
        })

    return response
