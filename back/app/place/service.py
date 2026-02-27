from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from place.model import Place
from auth.model import User
from place.schema import PlaceCreate
from PIL import Image
from PIL.ExifTags import TAGS, GPSTAGS
import io
import httpx
from config.config import settings
from datetime import datetime
from activity.model import ActivityLog

def _extract_info_from_exif(photo_bytes: bytes) -> tuple[float, float, datetime]:
    """사진 EXIF에서 위도·경도·촬영일시를 추출해 (latitude, longitude, datetime) 반환"""
    image = Image.open(io.BytesIO(photo_bytes))
    exif_data = image._getexif()

    if not exif_data:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="사진에 EXIF 정보가 없습니다"
        )

    gps_info_raw = None
    date_info_raw = None
    for tag_id, value in exif_data.items():
        if TAGS.get(tag_id) == "GPSInfo":
            gps_info_raw = value
        elif TAGS.get(tag_id) == "DateTimeOriginal":
            date_info_raw = value
            date = datetime.strptime(date_info_raw, "%Y:%m:%d %H:%M:%S")
        if gps_info_raw is not None and date_info_raw is not None:
            break

    if not date_info_raw:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="사진에 날짜 정보가 없습니다"
        )
    if not gps_info_raw:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="사진에 GPS 정보가 없습니다"
        )

    gps_info = {GPSTAGS.get(k, k): v for k, v in gps_info_raw.items()}

    def dms_to_decimal(dms, ref) -> float:
        degrees = float(dms[0])
        minutes = float(dms[1])
        seconds = float(dms[2])
        decimal = degrees + minutes / 60 + seconds / 3600
        if ref in ("S", "W"):
            decimal = -decimal
        return decimal

    if "GPSLatitude" not in gps_info or "GPSLongitude" not in gps_info:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="사진에 위도/경도 데이터가 없습니다"
        )

    latitude = dms_to_decimal(gps_info["GPSLatitude"], gps_info.get("GPSLatitudeRef", "N"))
    longitude = dms_to_decimal(gps_info["GPSLongitude"], gps_info.get("GPSLongitudeRef", "E"))

    return latitude, longitude, date


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
        "name" : place.name,
        "visit_count" : place.visit_count,
        "status" : place.status,
        "logs" : [{"log_id" : i.log_id, "date" : i.date}for i in log]
    }

def get_placeList(db :Session, current_user : User) :
    placeList = db.query(Place).filter(
        Place.user_id == current_user.id).all()
    if not placeList :
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Place not found"
        )
    return placeList
