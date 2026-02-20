from sqlalchemy import Column, Integer, String, ForeignKey, LargeBinary, Float
from config.database import Base
from auth.model import User

class Place(Base):
    __tablename__ = "PLACE"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    longitude = Column(Float)
    latitude = Column(Float)
    visit_count = Column(Integer, default=1)
    status = Column(String, default="new")
    user_id = Column(Integer, ForeignKey("USER.id"))