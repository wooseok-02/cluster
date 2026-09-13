from datetime import datetime

from activity.service import _match_group
from auth.model import User
from place.model import Place
from schedule.model import Schedule


def test_match_group_returns_exact(db_session):
    user = User(
        email="match@example.com",
        password="password",
        nick_name="tester",
        age=25,
        gender="male",
    )
    db_session.add(user)
    db_session.flush()

    place = Place(
        name="테스트 카페",
        latitude=37.0,
        longitude=127.0,
        user_id=user.id,
        category_name="카페",
        category_code="CE7",
    )
    db_session.add(place)
    db_session.flush()

    schedule = Schedule(
        user_id=user.id,
        place_id=place.id,
        title="카페 방문",
        start_time=datetime(2026, 8, 25, 14, 0),
        end_time=datetime(2026, 8, 25, 16, 0),
        memo="",
        status="Planned",
    )
    db_session.add(schedule)
    db_session.commit()

    group = [{
        "datetime": datetime(2026, 8, 25, 14, 30),
        "latitude": 37.0,
        "longitude": 127.0,
    }]

    result = _match_group(db_session, group, user)

    assert result["match_type"] == "exact"
    assert result["schedule_id"] == schedule.id