from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from datetime import date, datetime
from schedule.model import Schedule
from place.model import Place
from people.model import People
from auth.model import User
from schedule.schema import ScheduleCreate
from sqlalchemy import extract


def create_schedule(db: Session, schedule_data: ScheduleCreate, current_user: User):
    # date 기준으로 status 자동 결정
    today = date.today()
    schedule_status = "Planned" if schedule_data.date >= today else "Completed"

    # date + time → 전체 datetime 조합
    start_datetime = datetime.combine(schedule_data.date, schedule_data.start_time)
    end_datetime = datetime.combine(schedule_data.date, schedule_data.end_time)

    # place_id 유효성 검증 (입력된 경우에만)
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
    return schedule

def scheList(db : Session, year, month, current_user) :
    List = db.query(Schedule).filter(
        Schedule.user_id == current_user.id,
        extract("year", Schedule.start_time) == year,
        extract("month", Schedule.start_time) == month
    ).all()

    if not List :
        raise HTTPException(
            status_code = status.HTTP_404_NOT_FOUND,
            detail = "일치하는 날짜의 일정을 찾지 못했습니다."
        )
    return [{"date" : i.start_time, "title" : i.title}for i in List]
