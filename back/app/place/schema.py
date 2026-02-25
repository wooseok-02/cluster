from pydantic import BaseModel, ConfigDict
from typing import Optional


class PlaceCreate(BaseModel):
    name: str
    longitude: float
    latitude: float
    category_code: str
    category_name: str


class PlaceData(BaseModel):
    id: int
    name: str
    longitude: float
    latitude: float
    visit_count: int
    status: str
    user_id: int
    category_code: Optional[str] = None
    category_name: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


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
