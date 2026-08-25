from pathlib import Path

from pydantic_settings import BaseSettings
from pydantic_settings import SettingsConfigDict
from pathlib import Path

from pydantic_settings import BaseSettings
from pydantic_settings import SettingsConfigDict

ENV_FILE = Path(__file__).resolve().parents[1] / ".env"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=ENV_FILE, env_file_encoding="utf-8")

    SECRET_KEY: str
    ALGORITHM: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int
    DATABASE_URL: str
    KAKAO_REST_API_KEY: str
    CLOUDINARY_URL: str
    AI_SERVER_URL: str
    AI_SERVER_SECRET: str


settings = Settings()

ENV_FILE = Path(__file__).resolve().parents[1] / ".env"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=ENV_FILE, env_file_encoding="utf-8")

    SECRET_KEY: str
    ALGORITHM: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int
    DATABASE_URL: str
    KAKAO_REST_API_KEY: str
    CLOUDINARY_URL: str
    AI_SERVER_URL: str
    AI_SERVER_SECRET: str


settings = Settings()
