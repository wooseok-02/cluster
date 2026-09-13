from datetime import date, datetime, time, timedelta

import pytest

import activity.service as activity_service


class FakeDetectResponse:
    def raise_for_status(self):
        pass

    def json(self):
        return [
            {
                "photo_index": 0,
                "matched_people_ids": [],
                "unmatched_count": 0,
                "self_detected": False,
            }
        ]


class FakeAIClient:
    def __init__(self, *args, **kwargs):
        pass

    async def __aenter__(self):
        return self

    async def __aexit__(self, exc_type, exc, traceback):
        pass

    async def post(self, *args, **kwargs):
        return FakeDetectResponse()


@pytest.mark.parametrize(
    ("schedule_times", "expected_match_type"),
    [
        (("14:00:00", "16:00:00"), "exact"),
        (("18:00:00", "20:00:00"), "date_only"),
        (None, "none"),
    ],
    ids=["exact", "date-only", "none"],
)
def test_upload_photos_matches_schedule_scenarios(
    client,
    auth_headers,
    make_exif_photo,
    monkeypatch,
    schedule_times,
    expected_match_type,
):
    async def fake_get_people_candidates(db, current_user):
        return []

    monkeypatch.setattr(
        activity_service,
        "_get_people_candidates",
        fake_get_people_candidates,
    )
    monkeypatch.setattr(activity_service.httpx, "AsyncClient", FakeAIClient)

    visit_date = date.today() + timedelta(days=1)
    visit_time = time(14, 30)

    place_response = client.post(
        "/place/create/kakao/place",
        headers=auth_headers,
        json={
            "name": "테스트 카페",
            "longitude": 127.0,
            "latitude": 37.0,
            "category_code": "CE7",
            "category_name": "카페",
        },
    )
    assert place_response.status_code == 200, place_response.text
    place_id = place_response.json()["data"]["id"]

    if schedule_times:
        start_time, end_time = schedule_times
        schedule_response = client.post(
            "/sche/create",
            headers=auth_headers,
            json={
                "title": "테스트 일정",
                "place_id": place_id,
                "people_ids": [],
                "date": visit_date.isoformat(),
                "start_time": start_time,
                "end_time": end_time,
                "memo": "",
            },
        )
        assert schedule_response.status_code == 200, schedule_response.text

    photo_bytes = make_exif_photo(
        taken_at=datetime.combine(visit_date, visit_time),
        latitude=37.0,
        longitude=127.0,
    )

    response = client.post(
        "/activity/upload-photos",
        headers=auth_headers,
        files=[("photos", ("visit.jpg", photo_bytes, "image/jpeg"))],
    )

    assert response.status_code == 200, response.text
    assert len(response.json()["data"]) == 1
    assert response.json()["data"][0]["match_type"] == expected_match_type
