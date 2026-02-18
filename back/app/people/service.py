from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from people.model import People
from auth.model import User
from config.config import get_current_user

def create_people(db: Session, people_data: People, current_user : get_current_user):
    # 현재 로그인한 사용자의 ID를 가져옵니다.
    user_id = current_user.id
    new_people = People(
        name=people_data.name,
        age=people_data.age,
        relation=people_data.relation,
        address=people_data.address,
        embedding=people_data.embedding,
        user_id=user_id
    )
    db.add(new_people)
    db.commit()
    db.refresh(new_people)
    return new_people

def get_people():
    #DB에서 사람들 정보 가져오기
    #리턴할 스키마대로 반환하기