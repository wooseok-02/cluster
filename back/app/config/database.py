from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# 1) DB 연결 URL — SQLite는 파일 경로로 지정
#    형식: "sqlite:///./파일명.db"
SQLALCHEMY_DATABASE_URL = "sqlite:///./app.db"

# 2) 엔진 생성
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False}
)

# 3) 세션 팩토리 — API 요청마다 DB 세션을 하나씩 만들어 쓸 거예요
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# 4) Base 클래스 — 모든 모델이 이걸 상속받아요
Base = declarative_base()

# 5) 의존성 함수 — FastAPI의 Depends()에 넣어서 쓸 거예요
#    요청 시작 시 세션 열고, 끝나면 닫는 패턴
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
