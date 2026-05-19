from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import date
class PersonCreate(BaseModel):
    name: str
    age: int
    relation: str
    address: str
    phone: Optional[str] = None
    embedding: Optional[list[float]] = None

class PersonData(BaseModel) :
    id : int
    name : str
    age : int
    relation : str
    address : str
    phone : Optional[str] = None
    embedding: Optional[list[float]] = None
    photo_url : Optional[str] = None
    count : int
    status : str
    


class PersonRead(BaseModel):
    status: int
    message: str
    data: PersonData

    class Config:
        from_attributes = True

class PersonListRead(BaseModel):
    status: int
    message: str
    data: list[PersonData]

class PersonName(BaseModel) : 
    name : str

class PersonLog(BaseModel) :
    log_id : int
    date : date
    schedule_id : Optional[int] = None
    schedule_title : Optional[str] = None
    place_name : Optional[str] = None

class PersonPlannedSchedule(BaseModel) :
    id : int
    title : str
    date : date
    place_name : Optional[str] = None
    status : str

class PersonLoadDetail(BaseModel) :
    name : str
    age : int
    relation : str
    address : Optional[str]
    phone : Optional[str] = None
    photo_url : Optional[str] = None
    count : int
    status : str
    logs : list[PersonLog]
    planned_schedules : list[PersonPlannedSchedule] = []
