from sqlalchemy.orm import Session
from fastapi import HTTPException, UploadFile, status
from typing import Optional
from people.model import People
from auth.model import User
from auth.token import get_current_user
from people.schema import PersonCreate
from activity.model import ActivityLog, log_people
from schedule.model import Schedule
from config.config import settings
import asyncio
import io
import httpx
from utils.cloudinary import get_signed_photo_url, upload_authenticated_photo


def serialize_person(person: People) -> dict:
    return {
        "id": person.id,
        "name": person.name,
        "age": person.age,
        "relation": person.relation,
        "address": person.address,
        "phone": person.phone,
        "embedding": person.embedding,
        "photo_url": get_signed_photo_url(person.photo_url),
        "count": person.count,
        "status": person.status,
    }

async def create_people(
    db: Session,
    name: str,
    age: int,
    relation: str,
    address: str,
    phone: str,
    current_user: User,
    photo: Optional[UploadFile] = None,
):
    photo_url = None
    embedding = None
    if photo:
        photo_bytes = await photo.read()

        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                f"{settings.AI_SERVER_URL}/embed",
                files={"file": ("photo.jpg", photo_bytes, "image/jpeg")},
                headers={"X-API-KEY": settings.AI_SERVER_SECRET},
            )
        response.raise_for_status()
        embedding = response.json()["embedding"]

        #cloudinary IO 자체가 비동기이기 때문에, 별도 스레드 풀에 던진다.
        loop = asyncio.get_running_loop()
        result = await loop.run_in_executor(None,lambda : upload_authenticated_photo(
            io.BytesIO(photo_bytes),
            folder="cluster/people"
        ))
        photo_url = result["public_id"]

    new_people = People(
        name=name,
        age=age,
        relation=relation,
        address=address,
        phone=phone,
        photo_url=photo_url,
        embedding=embedding,
        user_id=current_user.id
    )
    db.add(new_people)
    db.commit()
    db.refresh(new_people)
    return new_people

#한명의 친구의 정보 조회
def get_people(db: Session, people_id , current_user : User):
    # 해당 유저의 해당 People 정보 가져오기 / people_info
    people_info = db.query(People).filter(
        People.user_id == current_user.id,
        People.id == people_id
    ).first()
    if not people_info:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="People not found"
        )

    logs = db.query(ActivityLog).join(
        log_people, ActivityLog.log_id == log_people.c.log_id).filter(
            ActivityLog.user_id == current_user.id,
            log_people.c.people_id == people_id
        ).order_by(ActivityLog.date.desc(), ActivityLog.log_id.desc()).all()

    # ActivityLog와 날짜가 일치하는 Schedule 매칭
    schedules = db.query(Schedule).filter(
        Schedule.user_id == current_user.id,
    ).all()
    schedule_by_key = {
        (schedule.start_time.date(), schedule.place_id): schedule
        for schedule in schedules
    }
    schedule_by_date = {schedule.start_time.date(): schedule for schedule in schedules}
    def _schedule_for_log(log: ActivityLog):
        return schedule_by_key.get((log.date, log.place_id)) or schedule_by_date.get(log.date)

    log_by_id = {log.log_id: log for log in logs}
    completed_schedules = [
        schedule
        for schedule in schedules
        if schedule.status == "Completed" and any(person.id == people_id for person in schedule.people)
    ]
    for schedule in completed_schedules:
        fallback_log = db.query(ActivityLog).filter(
            ActivityLog.user_id == current_user.id,
            ActivityLog.date == schedule.start_time.date(),
            ActivityLog.place_id == schedule.place_id,
        ).first()
        if fallback_log and fallback_log.log_id not in log_by_id:
            log_by_id[fallback_log.log_id] = fallback_log
    logs = sorted(log_by_id.values(), key=lambda log: (log.date, log.log_id), reverse=True)

    planned_schedules = db.query(Schedule).join(Schedule.people).filter(
        Schedule.user_id == current_user.id,
        People.id == people_id,
        Schedule.status.in_(["Planned", "Planning"])
    ).order_by(Schedule.start_time.asc()).all()

    return {
        "name" : people_info.name,
        "age" : people_info.age,
        "relation" : people_info.relation,
        "address" : people_info.address,
        "phone" : people_info.phone,
        "photo_url" : get_signed_photo_url(people_info.photo_url),
        "count" : people_info.count,
        "status" : people_info.status,
        "logs" : [
            {
                "log_id": log.log_id,
                "date": log.date,
                "schedule_id": _schedule_for_log(log).id if _schedule_for_log(log) else None,
                "schedule_title": _schedule_for_log(log).title if _schedule_for_log(log) else None,
                "place_name": log.place.name if log.place else None,
            }
            for log in logs
        ],
        "planned_schedules" : [
            {
                "id": schedule.id,
                "title": schedule.title,
                "date": schedule.start_time.date(),
                "place_name": schedule.place.name if schedule.place else None,
                "status": schedule.status
            }
            for schedule in planned_schedules
        ]
    }

async def update_person_photo(db: Session, people_id: int, photo: UploadFile, current_user: User):
    person = db.query(People).filter(
        People.id == people_id,
        People.user_id == current_user.id
    ).first()
    if not person:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="사람을 찾을 수 없습니다.")

    photo_bytes = await photo.read()

    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.post(
            f"{settings.AI_SERVER_URL}/embed",
            files={"file": ("photo.jpg", photo_bytes, "image/jpeg")},
            headers={"X-API-KEY": settings.AI_SERVER_SECRET},
        )
    response.raise_for_status()
    embedding = response.json()["embedding"]

    result = upload_authenticated_photo(io.BytesIO(photo_bytes), folder="cluster/people")
    person.photo_url = result["public_id"]
    person.embedding = embedding
    db.commit()
    db.refresh(person)
    return person


def load_personList(db : Session, current_user : User) :
    personList = db.query(People).filter(
        People.user_id == current_user.id
    ).all()
    if not personList :
        raise HTTPException(
            status_code= status.HTTP_404_NOT_FOUND,
            detail = "등록된 사람이 없습니다."
        )
    return [serialize_person(person) for person in personList]
