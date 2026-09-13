import os

import pytest
from fastapi.testclient import TestClient

from datetime import datetime
from io import BytesIO

from PIL import Image

TEST_DATABASE_URL = (
    "postgresql://cluster:cluster_local_dev@127.0.0.1:5432/cluster_test"
)

# FastAPI 앱을 import하기 전에 테스트 DB를 지정한다.
os.environ["DATABASE_URL"] = TEST_DATABASE_URL

from config.database import Base, engine, SessionLocal  # noqa: E402
from main import app  # noqa: E402

def clear_database():
    with engine.begin() as connection:
        for table in reversed(Base.metadata.sorted_tables):
            connection.execute(table.delete())

# fastapi 엔진 실행해주는 초기 함수 (모든 테스트의 시작점)
@pytest.fixture
def client():
    with TestClient(app) as test_client:
        yield test_client


# DB 초기화 셋업 -> 테스트 작업 -> DB 초기화 teardown
@pytest.fixture
def clean_database():
    clear_database()
    yield
    clear_database()

# 공통 인증 데코
@pytest.fixture
def auth_headers(client, clean_database):
    user_data = {
        "email": "fixture-user@example.com",
        "password": "Test1234!",
        "nick_name": "fixture-user",
        "age": 25,
        "gender": "male",
    }

    response = client.post("/auth/register", json=user_data)

    assert response.status_code == 200

    access_token = response.json()["access_token"]

    return {
        "Authorization": f"Bearer {access_token}"
    }



# mock 사진 데이터 만드는 factory fixture 데코
@pytest.fixture
def make_exif_photo() :
    def decimal_to_dms(value: float):
        absolute = abs(value)
        degrees = int(absolute)
        minutes_float = (absolute - degrees) * 60
        minutes = int(minutes_float)
        seconds = (minutes_float - minutes) * 60

        return float(degrees), float(minutes), seconds

    def make_photo(
            taken_at: datetime,
            latitude: float,
            longitude: float,
    )-> bytes :
        image = Image.new("RGB", (10, 10), "white")

        exif = Image.Exif()
        exif[36867] = taken_at.strftime("%Y:%m:%d %H:%M:%S")
        exif[34853] = {
        1: "N" if latitude >= 0 else "S",
        2: decimal_to_dms(latitude),
        3:  "E" if longitude >= 0 else "W",
        4: decimal_to_dms(longitude),
        }

        buffer = BytesIO()
        image.save(buffer, format="JPEG",exif=exif)

        return buffer.getvalue()

    return make_photo

@pytest.fixture
def db_session(clean_database) :
    db = SessionLocal()

    try :
        yield db
    finally:
        db.close()