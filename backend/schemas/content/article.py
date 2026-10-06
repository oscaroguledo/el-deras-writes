import uuid
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field

from models.content.article import Article


class Response(BaseModel):
    id: uuid.UUID
    title: str
    slug: str
    content: str
    excerpt: str
    image: str | None
    readTime: int
    formatted_read_time: str
    author: str
    category: str
    category_slug: str
    tags: list[str]
    status: str
    featured: bool
    views: int
    created_at: datetime
    updated_at: datetime
    published_at: datetime | None

    @classmethod
    def of(cls, a: Article) -> "Response":
        return cls(
            id=a.id, title=a.title, slug=a.slug, content=a.content, excerpt=a.excerpt,
            image=a.image, readTime=a.readTime, formatted_read_time=a.formatted_read_time,
            author=str(a.author), category=a.category.name, category_slug=a.category.slug,
            tags=sorted(t.name for t in a.tags), status=a.status, featured=a.featured, views=a.views,
            created_at=a.created_at, updated_at=a.updated_at, published_at=a.published_at,
        )


class Create(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    content: str = Field(min_length=1)
    category: str = Field(min_length=1, description="Category name, slug or id")
    excerpt: str = ""
    image: str | None = Field(None, max_length=200)
    readTime: int = Field(0, ge=0)
    tags: list[str] = []
    status: Literal["draft", "published"] = "draft"
    featured: bool = False
    published_at: datetime | None = None


class Update(BaseModel):
    title: str | None = Field(None, min_length=1, max_length=200)
    content: str | None = Field(None, min_length=1)
    category: str | None = Field(None, min_length=1)
    excerpt: str | None = None
    image: str | None = Field(None, max_length=200)
    readTime: int | None = Field(None, ge=0)
    tags: list[str] | None = None
    status: Literal["draft", "published"] | None = None
    featured: bool | None = None
    published_at: datetime | None = None


class Suggestions(BaseModel):
    suggestions: list[str]
