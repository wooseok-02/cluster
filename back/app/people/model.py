from sqlalchemy import Column, Integer, String, ForeignKey, LargeBinary
from config.database import Base
from auth.model import User

class People(Base):
    __tablename__ = "PEOPLE"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    age = Column(Integer)
    relation = Column(String)
    address = Column(String)
    count = Column(Integer, default=0)
    status = Column(String, default="new")
    embedding = Column(LargeBinary)
    user_id = Column(Integer, ForeignKey("USER.id"))