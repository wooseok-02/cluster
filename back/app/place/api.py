from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional
from place.schema import PlaceCreate, PlaceRead, PlaceKakaoResponse, PlaceListRead
from place.service import get_place, kakao_place_search, create_place_from_kakao, get_placeList
from config.database import get_db
from auth.token import get_current_user

router = APIRouter(
    prefix="/place",
    tags=["place"]
)


# 장소 찾기
@router.get("/kakao/find_place", response_model=PlaceKakaoResponse)
async def kakao_search_place(query: str, current_user=Depends(get_current_user)):
    results = await kakao_place_search(query)
    return {
        "status": 200,
        "message": f"'{query}' 검색 결과 {len(results)}건",
        "data": results
    }


# 장소 저장
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

@router.get("/load/placeList", response_model=PlaceListRead)
def load_placeList(
    lat: Optional[float] = Query(None),
    lon: Optional[float] = Query(None),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    placeList = get_placeList(db, current_user, lat=lat, lon=lon)
    return {
        "status": 200,
        "message": "장소 리스트가 성공적으로 반환되었습니다.",
        "data": placeList
    }
