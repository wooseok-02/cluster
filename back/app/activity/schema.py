from pydantic import BaseModel, ConfigDict
from datetime import date as Date, time as Time
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
    date: Date
    time: Time
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
    # EXIF 없는 사진은 날짜·위치 정보가 없으므로 None
    date: Optional[Date] = None
    time: Optional[Time] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    photo_count: int        # 이 그룹의 사진 수
    # match_type == "exact" 일 때
    schedule_id: Optional[int] = None
    schedule_title: Optional[str] = None
    place_id: Optional[int] = None
    place_name: Optional[str] = None
    people: Optional[list] = None
    # match_type == "date_only" 일 때: 같은 날짜 Schedule 목록
    candidates: Optional[list] = []
    # 얼굴 매칭 결과 — ai_server POST /detect 호출 결과
    matched_people_ids: list[int] = []   # 매칭된 People ID 목록
    unmatched_face_count: int = 0        # 미등록 얼굴 수
    self_detected: bool = False          # 사용자 본인 얼굴 감지 여부


class PhotoUploadResponse(BaseModel):
    status: int
    message: str
    data: List[PhotoGroupResult]
    skipped_count: int


# ── 사진 검증 결과 스키마 ─────────────────────────────────────
class PhotoVerifyResponse(BaseModel):
    match: bool
    date_match: bool
    location_match: bool
    photo_date: Optional[Date] = None
    photo_place_name: Optional[str] = None
    schedule_date: Optional[Time] = None
    schedule_place_name: Optional[str] = None
