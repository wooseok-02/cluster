from datetime import datetime

from utils.exif import _extract_info_from_exif

# 임의 사진 만들기

def test_extract_info_from_exif(make_exif_photo):
    taken_at = datetime(2026,8,25,14,30)
    latitude = 37.0
    longitude = 127.0

    photo_bytes = make_exif_photo(
        taken_at=taken_at,
        latitude=latitude,
        longitude=longitude,
    )

    actual_latitude, actual_longitude,actual_datetime = (_extract_info_from_exif(photo_bytes))

    assert actual_datetime == taken_at
    assert actual_latitude == latitude
    assert actual_longitude == longitude