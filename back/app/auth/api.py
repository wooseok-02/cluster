from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from auth.schema import UserCreate, UserRead, UserLogin, UserLoginResponse
from auth.service import register_user, login_user
from config.database import get_db
from auth.model import User

router = APIRouter(
    prefix="/auth",
    tags=["auth"]
)

@router.post("/register", response_model=UserRead)
def register(user_data: UserCreate, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
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
def login(user_data : UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == user_data.email, User.password == user_data.password).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    user,token = login_user(db, user_data)
    return {
        "status" : 200,
        "message": "Login successful",
        "id": user.id,
        "email": user.email,
        "nick_name" : user.nick_name,
        "age": user.age,
        "gender": user.gender,
        "access_token" : token
    }