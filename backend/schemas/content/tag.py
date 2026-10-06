import uuid
from datetime import datetime

from pydantic import BaseModel, Field


class Response(BaseModel):
    id: uuid.UUID
    name: str
    article_count: int = 0
    created_at: datetime


class Create(BaseModel):
    name: str = Field(min_length=1, max_length=50)


Update = Create
