from pydantic import BaseModel, ConfigDict
from datetime import date, time, datetime
from typing import List


# ── 요청 스키마 ──────────────────────────────────────────────
class ScheduleCreate(BaseModel):
    title: str
    place_id: int
    people_ids: List[int]
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


# ── 응답 data 스키마 ─────────────────────────────────────────
class ScheduleData(BaseModel):
    id: int
    title: str
    start_time: datetime
    end_time: datetime
    memo: str
    status: str
    place: PlaceInfo
    people: List[PersonInfo]

    model_config = ConfigDict(from_attributes=True)


# ── 응답 wrapper 스키마 ──────────────────────────────────────
class ScheduleRead(BaseModel):
    status: int
    message: str
    data: ScheduleData
