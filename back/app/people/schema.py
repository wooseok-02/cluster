from pydantic import BaseModel, EmailStr
from typing import Optional

class PersonCreate(BaseModel):
    name: str
    age: int
    relation: str
    address: str
    embedding: Optional[bytes] = None  # Assuming embedding is stored as binary data (blob)

class PersonData(BaseModel) :
    id : int
    name : str
    age : int
    relation : str
    address : str
    embedding : Optional[bytes] = None
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