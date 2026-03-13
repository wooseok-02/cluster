from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from auth.schema import UserCreate, UserRead, UserLogin, UserLoginResponse, UserMeResponse
from auth.service import register_user, login_user
from config.database import get_db
from auth.model import User
from auth.token import get_current_user
from fastapi.security import OAuth2PasswordRequestForm, OAuth2PasswordBearer

router = APIRouter(
    prefix="/auth",
    tags=["auth"]
)

@router.post("/register", response_model=UserRead)
def register(user_data: UserCreate, db: Session = Depends(get_db)):
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
    return {
        "status": 200,
        "message": "User info retrieved successfully",
        "id": current_user.id,
        "email": current_user.email,
        "nick_name": current_user.nick_name,
        "age": current_user.age,
        "gender": current_user.gender,
    }