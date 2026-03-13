from fastapi import Depends, HTTPException
from sqlalchemy.orm import Session
from config.database import get_db
from auth.model import User
from config.security import oauth2_scheme
from config.security import decoder_token

def get_current_user(db : Session = Depends(get_db), token = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=401,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        email = decoder_token(token)
    except Exception:
        raise credentials_exception
    user = db.query(User).filter(User.email == email).first()
    if user is None:
        raise credentials_exception
    return user