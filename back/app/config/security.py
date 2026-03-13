from datetime import datetime, timedelta, timezone
from jose import jwt, JWTError
from fastapi.security import OAuth2PasswordBearer
from config.config import settings
import bcrypt

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))


def create_access_token(data: dict):
    # 복사본을 만들어 원본 데이터 보존
    to_encode = data.copy()
    
    # 만료 시간 설정 (현재 시간 + 30분)
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    # Payload에 만료 시간('exp') 추가
    to_encode.update({"exp": expire})
    
    # 2. ⭐ 토큰 생성 (핵심!) ⭐
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    
    return encoded_jwt


def decoder_token(token: str):
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise Exception("Invalid token")
        return email
    except JWTError as e:
        raise Exception("Could not validate credentials") from e
    except Exception as e:
        raise Exception("Could not validate credentials") from e

