import os

import pytest
from fastapi.testclient import TestClient


TEST_DATABASE_URL = (
    "postgresql://cluster:cluster_local_dev@127.0.0.1:5432/cluster_test"
)

# FastAPI 앱을 import하기 전에 테스트 DB를 지정한다.
os.environ["DATABASE_URL"] = TEST_DATABASE_URL

from config.database import Base, engine  # noqa: E402
from main import app  # noqa: E402

def clear_database():
    with engine.begin() as connection:
        for table in reversed(Base.metadata.sorted_tables):
            connection.execute(table.delete())

# fastapi 엔진 실행해주는 초기 함수
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