from fastapi import HTTPException, status
from PIL import Image
from PIL.ExifTags import TAGS, GPSTAGS
from datetime import datetime
import io


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
