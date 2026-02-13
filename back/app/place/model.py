from sqlalchemy import Column, Integer, String, ForeignKey, LargeBinary
from config.database import Base
from auth.model import User

class Place(Base):
    __tablename__ = "PLACE"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    logitude = Column(float)
    latitude = Column(float)
    visit_count = Column(Integer, default=0)
    status = Column(String, default="new")
    user_id = Column(Integer, ForeignKey("USER.id"))