from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from auth.api import router as auth_router
from people.api import router as people_router
from place.api import router as place_router
from schedule.api import router as schedule_router
from activity.api import router as activity_router
from config.database import engine, Base
import uvicorn
import os
from fastapi.middleware.cors import CORSMiddleware
import config.cloudinary

Base.metadata.create_all(bind=engine)

# 마이그레이션 — PEOPLE 테이블에 누락 컬럼 추가 (없을 때만)
try:
    with engine.connect() as conn:
        from sqlalchemy import text, inspect
        inspector = inspect(engine)
        # PostgreSQL은 인용 부호 없이 생성된 테이블을 소문자로 저장
        # SQLAlchemy는 __tablename__ = "PEOPLE"을 그대로 사용하므로 양쪽 모두 시도
        try:
            existing_cols = [c["name"] for c in inspector.get_columns("PEOPLE")]
        except Exception:
            existing_cols = [c["name"] for c in inspector.get_columns("people")]
        changed = False
        if "photo_url" not in existing_cols:
            conn.execute(text('ALTER TABLE "PEOPLE" ADD COLUMN photo_url TEXT'))
            changed = True
        if "phone" not in existing_cols:
            conn.execute(text('ALTER TABLE "PEOPLE" ADD COLUMN phone TEXT'))
            changed = True
        if changed:
            conn.commit()
except Exception as e:
    print(f"[migration] PEOPLE 컬럼 추가 건너뜀: {e}")

# 마이그레이션 — ACTIVITY_LOG에 schedule_id 컬럼 추가 (없을 때만)
try:
    with engine.connect() as conn:
        from sqlalchemy import text, inspect
        inspector = inspect(engine)
        try:
            existing_cols = [c["name"] for c in inspector.get_columns("ACTIVITY_LOG")]
        except Exception:
            existing_cols = [c["name"] for c in inspector.get_columns("activity_log")]
        if "schedule_id" not in existing_cols:
            conn.execute(text('ALTER TABLE "ACTIVITY_LOG" ADD COLUMN schedule_id INTEGER'))
            conn.commit()
        if engine.dialect.name == "postgresql":
            conn.execute(text("""
                UPDATE "ACTIVITY_LOG" AS log
                SET schedule_id = schedule.id
                FROM "SCHEDULE" AS schedule
                WHERE log.schedule_id IS NULL
                  AND schedule.user_id = log.user_id
                  AND schedule.place_id IS NOT DISTINCT FROM log.place_id
                  AND schedule.start_time::date = log.date
                  AND schedule.start_time::time = log.time
            """))
            conn.commit()
        elif engine.dialect.name == "sqlite":
            conn.execute(text("""
                UPDATE "ACTIVITY_LOG"
                SET schedule_id = (
                    SELECT "SCHEDULE".id
                    FROM "SCHEDULE"
                    WHERE "SCHEDULE".user_id = "ACTIVITY_LOG".user_id
                      AND (
                          "SCHEDULE".place_id = "ACTIVITY_LOG".place_id
                          OR ("SCHEDULE".place_id IS NULL AND "ACTIVITY_LOG".place_id IS NULL)
                      )
                      AND date("SCHEDULE".start_time) = "ACTIVITY_LOG".date
                      AND time("SCHEDULE".start_time) = "ACTIVITY_LOG".time
                    LIMIT 1
                )
                WHERE schedule_id IS NULL
            """))
            conn.commit()
except Exception as e:
    print(f"[migration] ACTIVITY_LOG schedule_id 마이그레이션 건너뜀: {e}")

origins = [
    "http://localhost:5173",
    "https://cluster-one-beta.vercel.app",
    "https://*.vercel.app",
]

def create_app():
    app = FastAPI()
    app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

    # 사진 파일을 HTTP로 접근 가능하게 서빙
    # /static/photos/abc.jpg → back/static/photos/abc.jpg 파일 반환
    os.makedirs("static/photos", exist_ok=True)
    app.mount("/static", StaticFiles(directory="static"), name="static")

    app.include_router(auth_router)
    app.include_router(people_router)
    app.include_router(place_router)
    app.include_router(schedule_router)
    app.include_router(activity_router)
    return app

app = create_app()


if __name__ == "__main__":
    print("Starting FastAPI application...")
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)

@app.get("/")
async def main():
    return {"message": "Hello World"}
