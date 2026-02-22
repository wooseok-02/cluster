from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from datetime import date
from typing import Optional

from activity.model import ActivityLog
from schedule.model import Schedule
from place.model import Place
from people.model import People
from auth.model import User
from activity.schema import ActivityCreate


def confirm_schedule(db: Session, schedule_id: int, memo: Optional[str], current_user: User):
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

    # ActivityLog 생성 (date/time은 schedule의 start_time에서 추출)
    activity_log = ActivityLog(
        user_id=current_user.id,
        place_id=schedule.place_id,
        date=schedule.start_time.date(),
        time=schedule.start_time.time(),
        memo=memo if memo is not None else schedule.memo
    )

    # SCHEDULE_PEOPLE → LOG_PEOPLE 복사
    activity_log.people = list(schedule.people)

    db.add(activity_log)

    # Schedule 확정 처리
    schedule.status = "Completed"

    # People count += 1
    for person in activity_log.people:
        person.count += 1

    # Place visit_count += 1
    if schedule.place_id:
        place = db.query(Place).filter(Place.id == schedule.place_id).first()
        if place:
            place.visit_count += 1

    db.commit()
    db.refresh(activity_log)
    return activity_log


def create_activity_direct(db: Session, activity_data: ActivityCreate, current_user: User):
    # place 검증 (입력된 경우에만)
    if activity_data.place_id is not None:
        place = db.query(Place).filter(
            Place.id == activity_data.place_id,
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

    # people 검증 (입력된 경우에만)
    people_list = []
    if activity_data.people_ids:
        people_list = db.query(People).filter(
            People.id.in_(activity_data.people_ids),
            People.user_id == current_user.id
        ).all()

        if len(people_list) != len(set(activity_data.people_ids)):
            found_ids = {p.id for p in people_list}
            missing_ids = set(activity_data.people_ids) - found_ids
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={
                    "message": "존재하지 않는 인물이 포함되어 있습니다",
                    "redirect_to": "/people/register/people",
                    "missing_people_ids": sorted(missing_ids)
                }
            )

    activity_log = ActivityLog(
        user_id=current_user.id,
        place_id=activity_data.place_id,
        date=activity_data.date,
        time=activity_data.time,
        memo=activity_data.memo
    )
    activity_log.people = people_list

    db.add(activity_log)

    # People count += 1
    for person in people_list:
        person.count += 1

    # Place visit_count += 1
    if activity_data.place_id:
        place = db.query(Place).filter(Place.id == activity_data.place_id).first()
        if place:
            place.visit_count += 1

    db.commit()
    db.refresh(activity_log)
    return activity_log


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
