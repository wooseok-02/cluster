from datetime import datetime, timedelta
from jose import jwt, JWTError
from pydantic_settings import BaseSettings, SettingsConfigDict
from sqlalchemy.orm import Session
from fastapi import Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from config.database import get_db
from auth.model import User

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


oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


def get_current_user(db : Session = Depends(get_db), token = Depends(oauth2_scheme)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise Exception("Invalid token")
    except JWTError as e:
        raise Exception("Could not validate credentials") from e
    except Exception as e:
        raise Exception("Could not validate credentials") from e
    user = db.query(User).filter(User.email == email).first()
    if user is None:
        raise HTTPException("User not found")
    return user

    
    

