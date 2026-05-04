from pydantic import BaseModel, ConfigDict
from datetime import date, time
from typing import List, Optional


# ── 요청 스키마 ──────────────────────────────────────────────
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
    photos: List[PhotoInfo] = None

    model_config = ConfigDict(from_attributes=True)


# ── 응답 wrapper 스키마 ──────────────────────────────────────
class ActivityRead(BaseModel):
    status: int
    message: str
    data: ActivityData


# ── 사진 업로드 분석 결과 스키마 ─────────────────────────────
class PhotoGroupResult(BaseModel):
    group_index: int
    match_type: str         # "exact" | "date_only" | "none"
    date: date
    time: time
    latitude: float
    longitude: float
    photo_count: int        # 이 그룹의 사진 수
    # match_type == "exact" 일 때
    schedule_id: Optional[int] = None
    schedule_title: Optional[str] = None
    place_id: Optional[int] = None
    place_name: Optional[str] = None
    people: Optional[list] = None
    # match_type == "date_only" 일 때: 같은 날짜 Schedule 목록
    candidates: Optional[list] = []
    # match_type == "none" 일 때: 모두 None / 빈 배열


class PhotoUploadResponse(BaseModel):
    status: int
    message: str
    data: List[PhotoGroupResult]
    skipped_count: int
