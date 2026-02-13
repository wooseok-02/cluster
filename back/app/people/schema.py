from pydantic import BaseModel, EmailStr

class PersonCreate(BaseModel):
    name: str
    age: int
    relation: str
    address: str
    embedding: bytes  # Assuming embedding is stored as binary data (blob)

class PersonRead(BaseModel):
    status: str
    message: str
    data: dict
