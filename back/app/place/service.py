from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from place.model import Place
from auth.model import User
from place.schema import PlaceCreate
import httpx
from config.config import settings
from activity.model import ActivityLog
from utils.geo import _haversine
from utils.exif import _extract_info_from_exif


async def kakao_place_search(query: str) -> list[dict]:
    url = "https://dapi.kakao.com/v2/local/search/keyword.json"
    headers = {"Authorization": f"KakaoAK {settings.KAKAO_REST_API_KEY}"}
    params = {"query": query, "size": 5}

    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(url, headers=headers, params=params)
            response.raise_for_status()
        except httpx.HTTPError:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="카카오 API 호출에 실패했습니다"
            )

    documents = response.json().get("documents", [])
    return [
        {
            "name": doc["place_name"],
            "longitude": float(doc["x"]),  # x = 경도
            "latitude": float(doc["y"]),   # y = 위도
            "category_code": doc["category_group_code"],
            "category_name": doc["category_group_name"]
        }
        for doc in documents
    ]


def create_place_from_kakao(
    db: Session, place_data: PlaceCreate, current_user: User
) -> Place:
    existing = db.query(Place).filter(
        Place.user_id == current_user.id,
        Place.name == place_data.name,
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="이미 등록된 장소입니다"
        )

    new_place = Place(
        name=place_data.name,
        longitude=place_data.longitude,
        latitude=place_data.latitude,
        user_id=current_user.id,
        category_name=place_data.category_name,
        category_code=place_data.category_code
    )
    db.add(new_place)
    db.commit()
    db.refresh(new_place)
    return new_place


def get_place(db: Session, place_id: int, current_user: User):
    place = db.query(Place).filter(
        Place.id == place_id,
        Place.user_id == current_user.id
    ).first()
    if not place:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Place not found"
        )
    log = db.query(ActivityLog).filter(
        ActivityLog.place_id == place_id
    ).all()
    return {
        "id": place.id,
        "name": place.name,
        "longitude": place.longitude,
        "latitude": place.latitude,
        "visit_count": place.visit_count,
        "status": place.status,
        "logs": [{"log_id": i.log_id, "date": i.date} for i in log]
    }

def get_placeList(db: Session, current_user: User, lat: float = None, lon: float = None):
    placeList = db.query(Place).filter(Place.user_id == current_user.id).all()
    if not placeList:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Place not found"
        )

    if lat is not None and lon is not None:
        # 거리 계산 후 오름차순 정렬, 상위 3개 반환
        for place in placeList:
            place.distance = _haversine(lat, lon, place.latitude, place.longitude)
        placeList = sorted(placeList, key=lambda p: p.distance)[:3]
    else:
        for place in placeList:
            place.distance = None

    return placeList
