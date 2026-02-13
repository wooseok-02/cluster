from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from people.schema import PersonCreate, PersonRead
from people.service import create_people
from config.database import get_db

router = APIRouter(
    prefix="/people",
    tags=["people"]
)

@router.post("register/people", response_model=PersonRead)
def register_people(people_data: PersonCreate, db: Session = Depends(get_db)):
    new_people = create_people(db, people_data)
    return {
        "status" : 200,
        "message": "People registered successfully",
        "data" : new_people
    }
