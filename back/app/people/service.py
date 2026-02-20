from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from people.model import People
from auth.model import User
from auth.token import get_current_user

def create_people(db: Session, people_data: People, current_user : get_current_user):
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

def get_people(db: Session, current_user : get_current_user):
    user_id = current_user.id
    people_info = db.query(People).filter(User.id == user_id).first()
    if not people_info:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No people information found for the current user"
        )
    #리턴할 스키마대로 반환하기
    return people_info