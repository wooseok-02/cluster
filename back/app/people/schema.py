from pydantic import BaseModel, EmailStr

class PersonCreate(BaseModel):
    name: str
    age: int
    relation: str
    address: str
    embedding: bytes  # Assuming embedding is stored as binary data (blob)
    user_id: str  # 로그인한 사용자의 access token을 포함

class PersonRead(BaseModel):
    status: str
    message: str
    data: dict
