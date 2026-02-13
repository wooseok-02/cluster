from pydantic import BaseModel, EmailStr

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    nick_name: str
    age: int
    gender: str

class UserRead(BaseModel):
    status: int
    message: str
    id : int
    email : str
    nick_name : str
    age : int
    gender : str
    access_token : str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserLoginResponse(BaseModel):
    status: int
    message: str
    id : int
    email : str
    nick_name : str
    age : int
    gender : str
    access_token : str
