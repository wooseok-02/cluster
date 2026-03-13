from pydantic import BaseModel, ConfigDict, Field
from datetime import date, time, datetime
from typing import List, Optional


# ── 요청 스키마 ──────────────────────────────────────────────
class ScheduleCreate(BaseModel):
    title: str
    place_id: Optional[int] = None          # 장소 미지정 허용 (혼자 가는 경우 등)
    people_ids: List[int] = Field(default_factory=list)  # 인원 미지정 허용
    date: date          # 날짜 (status 결정 + start/end_time 조합에 사용)
    start_time: time    # 시작 시각
    end_time: time      # 종료 시각
    memo: str

# ── 응답 중첩 스키마 ──────────────────────────────────────────
class PlaceInfo(BaseModel):
    id: int
    name: str

    model_config = ConfigDict(from_attributes=True)


class PersonInfo(BaseModel):
    id: int
    name: str

    model_config = ConfigDict(from_attributes=True)


class PhotoInfo(BaseModel):
    id: int
    photo_url: str

    model_config = ConfigDict(from_attributes=True)


# ── 응답 data 스키마 ─────────────────────────────────────────
class ScheduleData(BaseModel):
    id: int
    title: str
    start_time: datetime
    end_time: datetime
    memo: str
    status: str
    place: Optional[PlaceInfo] = None   # 장소 미지정 시 null
    people: List[PersonInfo]
    photos: List[PhotoInfo] = []        # Completed 일정의 사진 목록

    model_config = ConfigDict(from_attributes=True)

class ScheduleUpdate(BaseModel):
    title: Optional[str] = None
    place_id: Optional[int] = None
    people_ids: Optional[List[int]] = None
    date: Optional[date] = None
    start_time: Optional[time] = None
    end_time: Optional[time] = None
    memo: Optional[str] = None

class ScheduleList(BaseModel):
    id : int
    date : datetime
    title : str

# ── 응답 wrapper 스키마 ──────────────────────────────────────
class ScheduleRead(BaseModel):
    status: int
    message: str
    data: ScheduleData
