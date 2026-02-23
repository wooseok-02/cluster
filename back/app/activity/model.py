from sqlalchemy import Column, Integer, String, ForeignKey, Table, Date, Time
from sqlalchemy.orm import relationship
from config.database import Base

# ActivityLog ↔ People 다대다 연결 테이블
log_people = Table(
    "LOG_PEOPLE",
    Base.metadata,
    Column("log_id", Integer, ForeignKey("ACTIVITY_LOG.log_id"), primary_key=True),
    Column("people_id", Integer, ForeignKey("PEOPLE.id"), primary_key=True)
)


class ActivityLog(Base):
    __tablename__ = "ACTIVITY_LOG"

    log_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("USER.id"))
    place_id = Column(Integer, ForeignKey("PLACE.id"), nullable=True)
    date = Column(Date)
    time = Column(Time)
    memo = Column(String)

    # relationship은 ()안의 테이블 자체에 대한 연결을 할 수 있도록 함. ActivityLog.place
    place = relationship("Place")
    people = relationship("People", secondary=log_people)
    #back_populates는 상대 테이블의 정보로 자동으로 업데이트해주는 양방향 업데이트 기능.
    photos = relationship("Photo", back_populates="activity_log")


class Photo(Base):
    __tablename__ = "PHOTO"

    id = Column(Integer, primary_key=True, index=True)
    log_id = Column(Integer, ForeignKey("ACTIVITY_LOG.log_id"))
    photo_url = Column(String)

    activity_log = relationship("ActivityLog", back_populates="photos")
