from fastapi import APIRouter, Depends, UploadFile, File, Form
from typing import Optional
from sqlalchemy.orm import Session
from people.schema import PersonRead, PersonListRead, PersonLoadDetail
from people.service import create_people, get_people, load_personList, update_person_photo
from config.database import get_db
from auth.token import get_current_user
from people.model import People

router = APIRouter(
    prefix="/people",
    tags=["people"]
)

@router.post("/register/people", response_model=PersonRead)
async def register_people(
    name: str = Form(...),
    age: int = Form(...),
    relation: str = Form(...),
    address: str = Form(""),
    photo: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    new_people = await create_people(
        db, name, age, relation, address, current_user, photo
    )
    return {
        "status": 200,
        "message": "People registered successfully",
        "data": new_people
    }

@router.get("/load/people/{people_id}", response_model=PersonLoadDetail)
def load_people(db: Session = Depends(get_db), people_id = int, current_user = Depends(get_current_user)):
    detail = get_people(db, people_id, current_user)
    return detail


@router.patch("/{people_id}/photo", response_model=PersonRead)
async def patch_person_photo(
    people_id: int,
    photo: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    person = await update_person_photo(db, people_id, photo, current_user)
    return {
        "status": 200,
        "message": "사진이 업데이트되었습니다.",
        "data": person
    }


@router.get("/load/peopleList", response_model=PersonListRead)
def load_people_List(db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    peopleList = load_personList(db, current_user)
    return {
        "status": 200,
        "message": "성공적으로 사람 리스트를 가져왔습니다",
        "data": peopleList
    }
