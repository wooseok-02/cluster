from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import date
class PersonCreate(BaseModel):
    name: str
    age: int
    relation: str
    address: str
    embedding: Optional[list[float]] = None

class PersonData(BaseModel) :
    id : int
    name : str
    age : int
    relation : str
    address : str
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

class PersonLoadDetail(BaseModel) :
    name : str
    age : int
    relation : str
    address : Optional[str]
    photo_url : Optional[str] = None
    count : int
    status : str
    logs : list[PersonLog]


