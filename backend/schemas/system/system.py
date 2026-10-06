import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class Contact(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    address: str
    phone: str
    email: str
    social_media_links: dict


class ContactUpdate(BaseModel):
    address: str | None = Field(None, max_length=255)
    phone: str | None = Field(None, max_length=20)
    email: EmailStr | None = None
    social_media_links: dict | None = None


class VisitorCount(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    count: int


class FeedbackCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    email: EmailStr
    subject: str = Field("", max_length=200)
    message: str = Field(min_length=1, max_length=5000)


class FeedbackResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    name: str
    email: str
    subject: str
    message: str
    created_at: datetime
