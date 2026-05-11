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
    """
    카카오 키워드 검색 API로 장소 후보를 조회한다.

    - 카카오 API에서 최대 5건의 검색 결과를 반환
    - API 호출 실패 시 502 에러 반환
    """
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
    """
    카카오 검색 결과를 바탕으로 장소를 DB에 등록한다.

    - 같은 유저에게 동일 이름의 장소가 이미 존재하면 400 에러 반환
    - 카테고리·좌표 정보를 포함하여 저장
    """
    new_place = create_place_from_kakao(db, place_data, current_user)
    return {
        "status": 200,
        "message": "Place created from kakao successfully",
        "data": new_place
    }


@router.get("/{place_id}", response_model=PlaceRead)
def load_place(place_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    """
    특정 장소의 정보와 해당 장소에서의 활동 로그를 반환한다.

    - 현재 유저 소유의 장소만 조회 가능
    - 장소를 찾을 수 없으면 404 에러 반환
    - 방문 횟수와 관련 활동 로그를 함께 반환
    """
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
    """
    현재 유저가 등록한 장소 목록을 반환한다.

    - lat, lon 좌표가 제공되면 반경 200m 이내 가까운 순 3곳만 반환
    - 좌표 없이 호출하면 전체 장소 목록을 반환
    - 등록된 장소가 없으면 404 에러 반환
    """
    placeList = get_placeList(db, current_user, lat=lat, lon=lon)
    return {
        "status": 200,
        "message": "장소 리스트가 성공적으로 반환되었습니다.",
        "data": placeList
    }
