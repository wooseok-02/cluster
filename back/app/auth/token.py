from fastapi import Depends, HTTPException
from sqlalchemy.orm import Session
from config.database import get_db
from auth.model import User
from config.security import oauth2_scheme
from config.config import decoder_token

def get_current_user(db : Session = Depends(get_db), token = Depends(oauth2_scheme)):
    email = decoder_token(token)
    user = db.query(User).filter(User.email == email).first()
    if user is None:
        raise HTTPException("User not found")
    return user