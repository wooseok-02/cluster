from fastapi import APIRouter, Depends, UploadFile, File, Form
from sqlalchemy.orm import Session
from place.schema import PlaceCreate, PlaceRead, PlaceKakaoResponse
from place.service import create_place_from_photo, get_place, kakao_place_search, create_place_from_kakao
from config.database import get_db
from auth.token import get_current_user

router = APIRouter(
    prefix="/place",
    tags=["place"]
)


@router.post("/create/photo", response_model=PlaceRead)
async def register_place_from_photo(
    name: str = Form(...),
    photo: UploadFile = File(...),
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


@router.get("/kakao/find_place", response_model=PlaceKakaoResponse)
async def kakao_search_place(query: str, current_user=Depends(get_current_user)):
    results = await kakao_place_search(query)
    return {
        "status": 200,
        "message": f"'{query}' 검색 결과 {len(results)}건",
        "data": results
    }


@router.post("/create/kakao/place", response_model=PlaceRead)
def register_place_from_kakao(
    place_data: PlaceCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    new_place = create_place_from_kakao(db, place_data, current_user)
    return {
        "status": 200,
        "message": "Place created from kakao successfully",
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
