def test_create_person_place_and_schedule(client, auth_headers):
    # 1. 사람 등록
    person_response = client.post(
        "/people/register/people",
        headers=auth_headers,
        data={
            "name": "홍길동",
            "age": 25,
            "relation": "친구",
            "address": "대전",
            "phone": "010-1234-5678",
        },
    )

    assert person_response.status_code == 200, person_response.text

    person_id = person_response.json()["data"]["id"]

    # 2. 장소 등록
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

    # 3. 일정 생성
    schedule_response = client.post(
        "/sche/create",
        headers=auth_headers,
        json={
            "title": "테스트 일정",
            "place_id": place_id,
            "people_ids": [person_id],
            "date": (date.today() + timedelta(days=1)).isoformat(),
            "start_time": "14:00:00",
            "end_time": "16:00:00",
            "memo": "일정 생성 테스트",
        },
    )

    assert schedule_response.status_code == 200, schedule_response.text

    schedule = schedule_response.json()["data"]

    # 4. 결과 검증
    assert schedule["title"] == "테스트 일정"
    assert schedule["place"]["id"] == place_id
    assert schedule["people"] == [
        {
            "id": person_id,
            "name": "홍길동",
        }
    ]
    assert schedule["status"] == "Planned"
