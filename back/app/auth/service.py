#회원가입
from sqlalchemy.orm import Session
from auth.schema import UserCreate, UserLogin, UserLoginResponse
from auth.model import User
from config.config import create_access_token


def register_user(db : Session, user_data : UserCreate):
    new_user = User(
        email=user_data.email,
        password=user_data.password,
        nick_name=user_data.nick_name,
        age=user_data.age,
        gender=user_data.gender
    )
    token = create_access_token(data={"sub": new_user.email})
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return {
        new_user : new_user, 
        token : token
        }

def login_user(db : Session, user_data : UserLogin):
    user = db.query(User).filter(User.email == user_data.email, User.password == user_data.password).first()
    token = create_access_token(data={"sub": user.email})
    return {
        user : user, 
        token :token
    }