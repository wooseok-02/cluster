from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from people.schema import PersonCreate, PersonRead, PersonData, PersonListRead, PersonName
from people.service import create_people, get_people, load_personList
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

@router.get("/load/people/{people_name}", response_model=PersonData)
def load_people(db: Session = Depends(get_db), people_name = str, current_user = Depends(get_current_user)):
    people_info = get_people(db, people_name, current_user)
    return people_info

@router.get("/load/peopleList", response_model= PersonListRead)
def load_people_List(db : Session = Depends(get_db), current_user = Depends(get_current_user)) :
    peopleList = load_personList(db, current_user)
    return {
        "status" : 200,
        "message" : "성공적으로 사람 리스트를 가져왔습니다",
        "data" : peopleList
    }