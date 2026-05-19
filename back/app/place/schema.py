from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import date


class PlaceCreate(BaseModel):
    name: str
    longitude: float
    latitude: float
    category_code: str
    category_name: str

class PlaceLog(BaseModel) :
    log_id : int
    date : date
    schedule_id : Optional[int] = None
    schedule_title : Optional[str] = None

class PlaceCompanion(BaseModel):
    id: int
    name: str
    photo_url: Optional[str] = None
    status: str
    count: int = 0

class PlaceData(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    longitude: float
    latitude: float
    visit_count: int
    status: str
    logs: list[PlaceLog] = []  # 목록 조회 시엔 빈 배열, 상세 조회 시엔 채워짐
    people: list[PlaceCompanion] = []
    distance: Optional[float] = None  # lat/lon 필터링 시 거리(m) 포함, 없으면 None


class PlaceRead(BaseModel):
    status: int
    message: str
    data: PlaceData

class PlaceListRead(BaseModel):
    status: int
    message: str
    data: list[PlaceData]

class PlaceKakaoResult(BaseModel):
    name: str
    longitude: float
    latitude: float
    category_code: str
    category_name: str


class PlaceKakaoResponse(BaseModel):
    status: int
    message: str
    data: list[PlaceKakaoResult]
