from fastapi import FastAPI
from auth.api import router as auth_router  # 1. 라우터 가져오기
from people.api import router as people_router  # 2. 라우터 가져오기
from place.api import router as place_router  # 3. 라우터 가져오기
from config.database import engine, Base
import uvicorn

Base.metadata.create_all(bind=engine)

def create_app():
    app = FastAPI()
    app.include_router(auth_router)
    app.include_router(people_router)
    app.include_router(place_router)
    return app
app = create_app()

if __name__ == "__main__":
    print("Starting FastAPI application...")
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)