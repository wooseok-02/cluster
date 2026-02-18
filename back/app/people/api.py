from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from people.schema import PersonCreate, PersonRead
from people.service import create_people
from config.database import get_db
from config.config import get_current_user

router = APIRouter(
    prefix="/people",
    tags=["people"]
)

@router.post("register/people", response_model=PersonRead)
def register_people(people_data: PersonCreate, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    new_people = create_people(db, people_data, current_user)
    return {
        "status" : 200,
        "message": "People registered successfully",
        "data" : new_people
    }
