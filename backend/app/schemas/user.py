from datetime import datetime
from pydantic import BaseModel, EmailStr
from app.models.enums import RoleName


class RoleResponse(BaseModel):
    id: int
    name: str
    permissions: list[str]

    class Config:
        from_attributes = True


class UserBase(BaseModel):
    email: EmailStr
    full_name: str


class UserCreate(UserBase):
    password: str
    role_name: RoleName = RoleName.WRITER


class UserUpdate(BaseModel):
    email: EmailStr | None = None
    full_name: str | None = None
    role_name: RoleName | None = None
    is_active: bool | None = None


class UserResponse(UserBase):
    id: int
    is_active: bool
    role: RoleResponse
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class UserInDB(UserResponse):
    hashed_password: str
