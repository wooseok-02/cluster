from pathlib import Path

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

import config.cloudinary  # noqa: F401
from activity.api import router as activity_router
from auth.api import router as auth_router
from people.api import router as people_router
from place.api import router as place_router
from schedule.api import router as schedule_router

APP_DIR = Path(__file__).resolve().parent
STATIC_DIR = APP_DIR / "static"

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
    (STATIC_DIR / "photos").mkdir(parents=True, exist_ok=True)
    app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

    app.include_router(auth_router)
    app.include_router(people_router)
    app.include_router(place_router)
    app.include_router(schedule_router)
    app.include_router(activity_router)

    @app.get("/")
    async def root():
        return {"message": "Hello World"}

    return app


app = create_app()


if __name__ == "__main__":
    print("Starting FastAPI application...")
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
