from pydantic import BaseModel, EmailStr


class PersonCreate(BaseModel):
    name: str
    age: int
    relation: str
    address: str
    embedding: bytes  # Assuming embedding is stored as binary data (blob)

class PersonData(BaseModel) :
    name : str
    age : int
    relation : str
    address : str
    embedding : str


class PersonRead(BaseModel):
    status: int
    message: str
    data: PersonData

    class Config:
        from_attributes = True
