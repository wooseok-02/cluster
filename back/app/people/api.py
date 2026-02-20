from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from people.schema import PersonCreate, PersonRead, PersonData
from people.service import create_people, get_people
from config.database import get_db
from auth.token import get_current_user
from people.model import People

router = APIRouter(
    prefix="/people",
    tags=["people"]
)

@router.post("/register/people", response_model=PersonRead)
def register_people(people_data: PersonCreate, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    new_people = create_people(db, people_data, current_user)
    return {
        "status" : 200,
        "message": "People registered successfully",
        "data" : new_people
    }

@router.get("/load/people", response_model=PersonData)
def load_people(db: Session = Depends(get_db),current_user = Depends(get_current_user)):
    people_info = get_people(db, current_user)
    return people_info