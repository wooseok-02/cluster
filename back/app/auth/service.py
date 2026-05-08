from typing import Tuple
from sqlalchemy.orm import Session
from auth.schema import UserCreate, UserLogin, UserLoginResponse
from auth.model import User
from config.security import create_access_token, hash_password, verify_password
from config.config import settings
from fastapi import APIRouter, Depends, HTTPException, UploadFile, status
from fastapi.security import OAuth2PasswordRequestForm
import cloudinary.uploader
import httpx
import io


# 회원가입: 이메일 중복 확인 후 유저 생성 및 JWT 토큰 반환
def register_user(db: Session, user_data: UserCreate) -> Tuple[User, str]:
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    new_user = User(
        email=user_data.email,
        password=hash_password(user_data.password),
        nick_name=user_data.nick_name,
        age=user_data.age,
        gender=user_data.gender
    )
    try:
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
    except Exception:
        db.rollback()
        raise
    token = create_access_token(data={"sub": new_user.email})
    return new_user, token


# 로그인: 이메일/비밀번호 검증 후 JWT 토큰 반환
def login_user(db: Session, form_data: OAuth2PasswordRequestForm) -> Tuple[User, str]:
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    token = create_access_token(data={"sub": user.email})
    return user, token


# 프로필 사진 업데이트: AI 서버에서 얼굴 임베딩 추출 → Cloudinary 업로드 → DB 저장
async def update_user_photo(db: Session, photo: UploadFile, current_user: User) -> User:
    photo_bytes: bytes = await photo.read()

    # AI 서버에서 얼굴 임베딩 추출
    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.post(
            f"{settings.AI_SERVER_URL}/embed",
            files={"file": ("photo.jpg", photo_bytes, "image/jpeg")}
        )
    response.raise_for_status()
    embedding: list | None = response.json()["embedding"]

    # 얼굴 미감지 시 업로드 차단
    if embedding is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="얼굴을 인식할 수 없습니다")

    # Cloudinary에 이미지 업로드 후 URL 저장
    result = cloudinary.uploader.upload(io.BytesIO(photo_bytes), folder="cluster/users")
    current_user.photo_url = result["secure_url"]
    current_user.embedding = embedding
    db.commit()
    db.refresh(current_user)
    return current_user
