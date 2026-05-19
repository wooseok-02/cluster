from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy.orm import Session
from auth.schema import UserCreate, UserRead, UserLogin, UserLoginResponse, UserMeResponse, UserPhotoResponse
from auth.service import register_user, login_user, update_user_photo
from config.database import get_db
from auth.model import User
from auth.token import get_current_user
from fastapi.security import OAuth2PasswordRequestForm, OAuth2PasswordBearer
from utils.file_validation import validate_image
from utils.cloudinary import get_signed_photo_url

router = APIRouter(
    prefix="/auth",
    tags=["auth"]
)

@router.post("/register", response_model=UserRead)
def register(user_data: UserCreate, db: Session = Depends(get_db)):
    """
    이메일 중복 확인 후 새 계정을 생성하고 JWT 토큰을 발급한다.

    - 이메일이 이미 존재하면 400 에러 반환
    - 회원가입 성공 시 유저 정보와 액세스 토큰을 함께 반환
    """
    new_user, token = register_user(db, user_data)
    return {
        "status" : 200,
        "message": "User registered successfully",
        "id": new_user.id,
        "email": new_user.email,
        "nick_name" : new_user.nick_name,
        "age": new_user.age,
        "gender": new_user.gender,
        "access_token" : token
    }

@router.post("/login", response_model=UserLoginResponse)
def login(db: Session = Depends(get_db), form_data: OAuth2PasswordRequestForm = Depends()):
    """
    이메일·비밀번호를 검증하고 JWT 액세스 토큰을 발급한다.

    - 이메일 또는 비밀번호 불일치 시 401 에러 반환
    - OAuth2 Password Flow 형식으로 인증 처리
    """
    user,token = login_user(db, form_data)
    return {
        "status" : 200,
        "message": "Login successful",
        "id": user.id,
        "email": user.email,
        "nick_name" : user.nick_name,
        "age": user.age,
        "gender": user.gender,
        "access_token" : token,
        "token_type" : "bearer",
        "username" : form_data.username
    }

@router.get("/me", response_model=UserMeResponse)
def get_me(current_user: User = Depends(get_current_user)):
    """
    현재 로그인된 유저의 프로필 정보를 반환한다.

    - JWT 토큰으로 현재 유저를 식별
    - 프로필 사진 URL 포함
    """
    return {
        "status": 200,
        "message": "User info retrieved successfully",
        "id": current_user.id,
        "email": current_user.email,
        "nick_name": current_user.nick_name,
        "age": current_user.age,
        "gender": current_user.gender,
        "photo_url": get_signed_photo_url(current_user.photo_url),
    }


# 프로필 사진 업로드: 얼굴 임베딩 추출 후 Cloudinary에 저장
@router.patch("/me/photo", response_model=UserPhotoResponse)
async def upload_my_photo(
    photo: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    프로필 사진을 업로드하고 얼굴 임베딩을 갱신한다.

    - AI 서버에 얼굴 임베딩 추출 요청 후 Cloudinary에 사진 저장
    - 얼굴이 감지되지 않으면 400 에러 반환
    - 임베딩과 사진 URL을 DB에 저장
    """
    await validate_image(photo)
    user = await update_user_photo(db, photo, current_user)
    return {
        "status": 200,
        "message": "프로필 사진이 업데이트되었습니다.",
        "photo_url": get_signed_photo_url(user.photo_url),
    }
