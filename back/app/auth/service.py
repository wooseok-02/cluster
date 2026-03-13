#회원가입
from sqlalchemy.orm import Session
from auth.schema import UserCreate, UserLogin, UserLoginResponse
from auth.model import User
from config.security import create_access_token, hash_password, verify_password
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm


def register_user(db : Session, user_data : UserCreate):
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
    token = create_access_token(data={"sub": new_user.email})
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user, token

def login_user(db : Session, form_data: OAuth2PasswordRequestForm):
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    token = create_access_token(data={"sub": user.email})
    return user, token