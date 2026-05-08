from sqlalchemy import Column, Integer, String, JSON
from config.database import Base

class User(Base):
    __tablename__ = "USER"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    password = Column(String)
    nick_name = Column(String, index=True)
    age = Column(Integer)
    gender = Column(String)
    photo_url = Column(String, nullable=True)
    embedding = Column(JSON, nullable=True)