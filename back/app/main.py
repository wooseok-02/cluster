from fastapi import FastAPI
from auth.api import router as auth_router  # 1. 라우터 가져오기
from config.database import engine, Base
import uvicorn

Base.metadata.create_all(bind=engine)

def client():
    app = FastAPI()
    app.include_router(auth_router)
    return app
app = client()

if __name__ == "__main__":
    print("Starting FastAPI application...")
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)