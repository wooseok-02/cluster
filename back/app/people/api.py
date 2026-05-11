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
    """
    새 인물을 등록하고 선택적으로 대표 사진을 설정한다.

    - 사진이 첨부된 경우 AI 서버에서 얼굴 임베딩을 추출하고 Cloudinary에 업로드
    - 사진 없이 이름·나이·관계·주소만으로도 등록 가능
    """
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
    """
    특정 인물의 상세 정보와 함께 등장한 활동 로그 목록을 반환한다.

    - 현재 유저 소유의 인물만 조회 가능
    - 해당 인물이 포함된 ActivityLog를 함께 반환
    """
    detail = get_people(db, people_id, current_user)
    return detail


@router.patch("/{people_id}/photo", response_model=PersonRead)
async def patch_person_photo(
    people_id: int,
    photo: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """
    기존 인물의 사진을 교체하고 얼굴 임베딩을 갱신한다.

    - 인물을 찾을 수 없으면 404 에러 반환
    - AI 서버에서 새 사진의 얼굴 임베딩을 추출 후 Cloudinary에 업로드
    - 기존 임베딩과 사진 URL을 새 값으로 덮어씀
    """
    person = await update_person_photo(db, people_id, photo, current_user)
    return {
        "status": 200,
        "message": "사진이 업데이트되었습니다.",
        "data": person
    }


@router.get("/load/peopleList", response_model=PersonListRead)
def load_people_List(db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    """
    현재 유저가 등록한 모든 인물 목록을 반환한다.

    - 등록된 인물이 없으면 404 에러 반환
    """
    peopleList = load_personList(db, current_user)
    return {
        "status": 200,
        "message": "성공적으로 사람 리스트를 가져왔습니다",
        "data": peopleList
    }
