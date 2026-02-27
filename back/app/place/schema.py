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

class PlaceData(BaseModel):
    name: str
    visit_count: int
    status: str
    logs : list[PlaceLog]


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
