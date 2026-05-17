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
import cloudinary.uploader
import httpx

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
                files={"file": ("photo.jpg", photo_bytes, "image/jpeg")}
            )
        response.raise_for_status()
        embedding = response.json()["embedding"]

        #cloudinary IO 자체가 비동기이기 때문에, 별도 스레드 풀에 던진다.
        loop = asyncio.get_running_loop()
        import io
        result = await loop.run_in_executor(None,lambda : cloudinary.uploader.upload(
            io.BytesIO(photo_bytes),
            folder="cluster/people"
        ))
        photo_url = result["secure_url"]

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
    log = db.query(ActivityLog).join(
        log_people, ActivityLog.log_id == log_people.c.log_id).filter(
            log_people.c.people_id == people_id
        ).all()

    # ActivityLog와 날짜가 일치하는 Schedule 매칭
    schedules = db.query(Schedule).filter(
        Schedule.user_id == current_user.id,
    ).all()
    schedule_by_date = {s.start_time.date(): s.id for s in schedules}
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
        "photo_url" : people_info.photo_url,
        "count" : people_info.count,
        "status" : people_info.status,
        "logs" : [
            {"log_id": i.log_id, "date": i.date, "schedule_id": schedule_by_date.get(i.date)}
            for i in log
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
    photo_bytes = await photo.read()

    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.post(
            f"{settings.AI_SERVER_URL}/embed",
            files={"file": ("photo.jpg", photo_bytes, "image/jpeg")}
        )
    response.raise_for_status()
    embedding = response.json()["embedding"]

    result = cloudinary.uploader.upload(io.BytesIO(photo_bytes), folder="cluster/people")
    person.photo_url = result["secure_url"]
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
    return personList
