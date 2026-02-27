from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from people.schema import PersonCreate, PersonRead, PersonData, PersonListRead, PersonLoadDetail
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

@router.get("/load/people/{people_id}", response_model=PersonLoadDetail) #PersonData
def load_people(db: Session = Depends(get_db), people_id = int, current_user = Depends(get_current_user)):
    detail = get_people(db,people_id,current_user )
    return detail


@router.get("/load/peopleList", response_model= PersonListRead)
def load_people_List(db : Session = Depends(get_db), current_user = Depends(get_current_user)) :
    peopleList = load_personList(db, current_user)
    return {
        "status" : 200,
        "message" : "성공적으로 사람 리스트를 가져왔습니다",
        "data" : peopleList
    }