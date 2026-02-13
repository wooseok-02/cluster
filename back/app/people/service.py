from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from people.model import People
from auth.model import User

def create_people(db: Session, people_data: People):
    new_people = People(
        name=people_data.name,
        age=people_data.age,
        relation=people_data.relation,
        address=people_data.address,
        user_id=User.id
    )
    db.add(new_people)
    db.commit()
    db.refresh(new_people)
    return new_people