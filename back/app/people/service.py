from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from people.model import People
from auth.model import User
from auth.token import get_current_user
from people.schema import PersonCreate
from activity.model import ActivityLog, log_people


def create_people(db: Session, people_data: PersonCreate, current_user : get_current_user):
    # 현재 로그인한 사용자의 ID를 가져옵니다.
    new_people = People(
        name=people_data.name,
        age=people_data.age,
        relation=people_data.relation,
        address=people_data.address,
        embedding=people_data.embedding,
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
    return {
        "name" : people_info.name,
        "age" : people_info.age,
        "relation" : people_info.relation,
        "address" : people_info.address,
        "count" : people_info.count,
        "status" : people_info.status,
        "logs" : [{"log_id" : i.log_id, "date" : i.date}for i in log]
    }

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
