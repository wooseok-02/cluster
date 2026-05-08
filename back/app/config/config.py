from pydantic_settings import BaseSettings
from dotenv import load_dotenv

class Settings(BaseSettings):
    SECRET_KEY: str
    ALGORITHM: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int
    DATABASE_URL: str
    KAKAO_REST_API_KEY: str
    CLOUDINARY_URL: str
    AI_SERVER_URL: str
    class Config:
        env_file = ".env"
    
settings = Settings()

