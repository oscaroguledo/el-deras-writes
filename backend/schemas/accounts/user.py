import uuid
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class Response(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    username: str
    email: str
    first_name: str
    last_name: str
    bio: str
    user_type: str
    is_staff: bool
    is_active: bool
    date_joined: datetime


class Create(BaseModel):
    username: str = Field(min_length=1, max_length=150)
    email: EmailStr
    password: str = Field(min_length=1, max_length=128)
    first_name: str = Field("", max_length=30)
    last_name: str = Field("", max_length=150)
    bio: str = Field("", max_length=500)
    user_type: Literal["admin", "normal"] = "normal"
    is_active: bool = True


class Update(BaseModel):
    username: str | None = Field(None, min_length=1, max_length=150)
    email: EmailStr | None = None
    password: str | None = Field(None, min_length=1, max_length=128)
    first_name: str | None = Field(None, max_length=30)
    last_name: str | None = Field(None, max_length=150)
    bio: str | None = Field(None, max_length=500)
    user_type: Literal["admin", "normal"] | None = None
    is_active: bool | None = None


class Login(BaseModel):
    email: str
    password: str


class Tokens(BaseModel):
    access: str
    refresh: str
    user: Response


class Refresh(BaseModel):
    refresh: str


class RefreshResponse(BaseModel):
    access: str
    refresh: str
