from fastapi import APIRouter, Depends, UploadFile, File, Form
from sqlalchemy.orm import Session
from place.schema import PlaceCreate, PlaceRead
from place.service import create_place, create_place_from_photo, get_place
from config.database import get_db
from auth.token import get_current_user

router = APIRouter(
    prefix="/place",
    tags=["place"]
)


@router.post("/create", response_model=PlaceRead)
def register_place(place_data: PlaceCreate, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    new_place = create_place(db, place_data, current_user)
    return {
        "status": 200,
        "message": "Place created successfully",
        "data": new_place
    }


@router.post("/create/photo", response_model=PlaceRead)
async def register_place_from_photo(
    name: str = Form(...), # 텍스트형태 -> 사용자가 직접 입력해야 함.
    photo: UploadFile = File(...), # 파일형태
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    photo_bytes = await photo.read()
    new_place = create_place_from_photo(db, photo_bytes, name, current_user)
    return {
        "status": 200,
        "message": "Place created from photo successfully",
        "data": new_place
    }


@router.get("/{place_id}", response_model=PlaceRead)
def load_place(place_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    place = get_place(db, place_id, current_user)
    return {
        "status": 200,
        "message": "Place retrieved successfully",
        "data": place
    }
