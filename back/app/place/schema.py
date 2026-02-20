from pydantic import BaseModel, ConfigDict


class PlaceCreate(BaseModel):
    name: str
    longitude: float
    latitude: float


class PlaceData(BaseModel):
    id: int
    name: str
    longitude: float
    latitude: float
    visit_count: int
    status: str
    user_id: int

    model_config = ConfigDict(from_attributes=True)


class PlaceRead(BaseModel):
    status: int
    message: str
    data: PlaceData
