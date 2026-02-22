from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Table
from sqlalchemy.orm import relationship
from config.database import Base

# Schedule ↔ People 다대다 연결 테이블
schedule_people = Table(
    "SCHEDULE_PEOPLE",
    Base.metadata,
    Column("schedule_id", Integer, ForeignKey("SCHEDULE.id"), primary_key=True),
    Column("people_id", Integer, ForeignKey("PEOPLE.id"), primary_key=True)
)


class Schedule(Base):
    __tablename__ = "SCHEDULE"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("USER.id"))
    place_id = Column(Integer, ForeignKey("PLACE.id"))
    title = Column(String)
    start_time = Column(DateTime)
    end_time = Column(DateTime)
    memo = Column(String)
    status = Column(String, default="Planned")

    # 조회 시 place, people 자동 로드
    place = relationship("Place")
    people = relationship("People", secondary=schedule_people)
