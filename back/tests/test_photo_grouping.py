from datetime import datetime

from activity.service import _group_photos


def test_group_photos_from_same_visit() :
    photos = [
        {
            "datetime" : datetime(2026, 8, 25, 14, 0),
            "latitude" : 37.0,
            "longitude" : 127.0,
        },
        {
            "datetime": datetime(2026, 8, 25, 14, 30),
            "latitude": 37.0001,
            "longitude": 127.0001,
        }
    ]

    groups = _group_photos(photos)

    assert len(groups) == 1
    assert groups[0] == photos


def test_group_photos_separates_visits_over_60_min() :
    photos = [
        {
            "datetime" : datetime(2026, 8, 25, 14, 0),
            "latitude" : 37.0,
            "longitude" : 127.0,
        },
        {
            "datetime": datetime(2026, 8, 25, 15, 1),
            "latitude" : 37.0,
            "longitude" : 127.0,
        },
    ]

    groups = _group_photos(photos)

    assert len(groups) == 2
    assert groups[0] == [photos[0]]
    assert groups[1] == [photos[1]]


def test_group_photos_separates_visits_over_200m():
    photos = [
        {
            "datetime": datetime(2026, 8, 25, 14, 0),
            "latitude": 37.0,
            "longitude": 127.0,
        },
        {
            "datetime": datetime(2026, 8, 25, 14, 30),
            "latitude": 37.002,
            "longitude": 127.0,
        },
    ]

    groups = _group_photos(photos)

    assert len(groups) == 2
    assert groups[0] == [photos[0]]
    assert groups[1] == [photos[1]]

def test_group_photos_separates_visits_on_different_dates():
    photos = [
        {
            "datetime": datetime(2026, 8, 25, 14, 0),
            "latitude": 37.0,
            "longitude": 127.0,
        },
        {
            "datetime": datetime(2026, 8, 26, 14, 0),
            "latitude": 37.0,
            "longitude": 127.0,
        },
    ]

    groups = _group_photos(photos)

    assert len(groups) == 2
    assert groups[0] == [photos[0]]
    assert groups[1] == [photos[1]]