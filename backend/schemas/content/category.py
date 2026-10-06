import uuid

from pydantic import BaseModel, ConfigDict, Field


class Response(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    name: str
    slug: str
    description: str
    parent_id: uuid.UUID | None
    sort_order: int
    is_active: bool
    article_count: int = 0  # published articles, including those in sub-sections
    children: list["Response"] = []


class Create(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    slug: str | None = Field(None, max_length=150)
    description: str = ""
    parent: str | None = Field(None, description="Parent section's slug or id")
    sort_order: int = 0
    is_active: bool = True


class Update(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=100)
    slug: str | None = Field(None, max_length=150)
    description: str | None = None
    parent: str | None = Field(None, description="Parent section's slug or id; '' makes it top-level")
    sort_order: int | None = None
    is_active: bool | None = None
