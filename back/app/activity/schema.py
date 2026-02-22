from pydantic import BaseModel, ConfigDict, Field
from datetime import date, time
from typing import List, Optional


# ── 요청 스키마 ──────────────────────────────────────────────
class ActivityCreate(BaseModel):
    place_id: Optional[int] = None
    people_ids: List[int] = Field(default_factory=list)
    date: date
    time: time
    memo: str


class ConfirmRequest(BaseModel):
    memo: Optional[str] = None


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
class ActivityData(BaseModel):
    log_id: int
    date: date
    time: time
    memo: str
    place: Optional[PlaceInfo] = None
    people: List[PersonInfo]
    photos: List[PhotoInfo]

    model_config = ConfigDict(from_attributes=True)
    #DB객체를 파이썬으로 읽게 해줌. -> ActivityData.people 이런 식


# ── 응답 wrapper 스키마 ──────────────────────────────────────
class ActivityRead(BaseModel):
    status: int
    message: str
    data: ActivityData
