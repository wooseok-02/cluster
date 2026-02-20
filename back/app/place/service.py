from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from place.model import Place
from auth.model import User
from place.schema import PlaceCreate
from PIL import Image
from PIL.ExifTags import TAGS, GPSTAGS
import io


def create_place(db: Session, place_data: PlaceCreate, current_user: User):
    new_place = Place(
        name=place_data.name,
        longitude=place_data.longitude,
        latitude=place_data.latitude,
        user_id=current_user.id
    )
    db.add(new_place)
    db.commit()
    db.refresh(new_place)
    return new_place


def _extract_gps_from_exif(photo_bytes: bytes) -> tuple[float, float]:
    """사진 EXIF에서 위도·경도를 추출해 (latitude, longitude) 십진수로 반환"""
    image = Image.open(io.BytesIO(photo_bytes))
    exif_data = image._getexif()

    if not exif_data:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="사진에 EXIF 정보가 없습니다"
        )

    # EXIF 태그 ID → 이름 매핑으로 GPS 태그 찾기
    gps_info_raw = None
    for tag_id, value in exif_data.items():
        if TAGS.get(tag_id) == "GPSInfo":
            gps_info_raw = value
            break

    if not gps_info_raw:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="사진에 GPS 정보가 없습니다"
        )

    # GPS 태그 ID → 이름 매핑
    gps_info = {GPSTAGS.get(k, k): v for k, v in gps_info_raw.items()}

    def dms_to_decimal(dms, ref) -> float:
        """도·분·초(DMS) → 십진수 변환"""
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

    return latitude, longitude


def create_place_from_photo(db: Session, photo_bytes: bytes, name: str, current_user: User):
    latitude, longitude = _extract_gps_from_exif(photo_bytes)

    new_place = Place(
        name=name,
        latitude=latitude,
        longitude=longitude,
        user_id=current_user.id
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
    return place
