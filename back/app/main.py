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

Base.metadata.create_all(bind=engine)

# SQLite 마이그레이션 — 기존 테이블에 새 컬럼 추가 (없을 때만)
with engine.connect() as conn:
    from sqlalchemy import text, inspect
    inspector = inspect(engine)
    existing_cols = [c["name"] for c in inspector.get_columns("PEOPLE")]
    if "photo_url" not in existing_cols:
        conn.execute(text("ALTER TABLE PEOPLE ADD COLUMN photo_url TEXT"))

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