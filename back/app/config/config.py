from datetime import datetime, timedelta
from jose import jwt
from pydantic_settings import BaseSettings, SettingsConfigDict

# 1. 설정값 (실제로는 환경변수로 관리하는 게 좋아요)
SECRET_KEY = "wooseok_manager_secret_key" 
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30 # 토큰 유효 시간
DATABASE_URL: str

# .env 파일을 읽어오라는 설정
model_config = SettingsConfigDict(env_file=".env")

def create_access_token(data: dict):
    # 복사본을 만들어 원본 데이터 보존
    to_encode = data.copy()
    
    # 만료 시간 설정 (현재 시간 + 30분)
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    # Payload에 만료 시간('exp') 추가
    to_encode.update({"exp": expire})
    
    # 2. ⭐ 토큰 생성 (핵심!) ⭐
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    
    return encoded_jwt


