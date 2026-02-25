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

Base.metadata.create_all(bind=engine)

def create_app():
    app = FastAPI()

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