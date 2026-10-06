import uuid
from datetime import datetime

from pydantic import BaseModel, Field

from models.content.comment import MAX_REPLY_DEPTH, Comment


class Author(BaseModel):
    id: uuid.UUID
    username: str
    first_name: str
    last_name: str
    user_type: str


class ArticleBrief(BaseModel):
    id: uuid.UUID
    title: str
    slug: str


class Response(BaseModel):
    id: uuid.UUID
    content: str
    author: Author | None
    article: ArticleBrief
    parent: uuid.UUID | None
    approved: bool
    is_flagged: bool
    created_at: datetime
    updated_at: datetime
    replies: list["Response"] = []

    @classmethod
    def of(cls, c: Comment, depth: int = 0) -> "Response":
        author = None
        if c.author:
            author = Author(
                id=c.author.id, username=c.author.username, first_name=c.author.first_name,
                last_name=c.author.last_name, user_type=c.author.user_type,
            )
        replies = []
        if depth < MAX_REPLY_DEPTH:  # deeper levels are not eagerly loaded
            replies = [cls.of(r, depth + 1) for r in c.replies if r.approved]
        return cls(
            id=c.id, content=c.content, author=author,
            article=ArticleBrief(id=c.article.id, title=c.article.title, slug=c.article.slug),
            parent=c.parent_id, approved=c.approved, is_flagged=c.is_flagged,
            created_at=c.created_at, updated_at=c.updated_at, replies=replies,
        )


class Create(BaseModel):
    content: str = Field(min_length=1, max_length=5000)
    parent: uuid.UUID | None = None


class Update(BaseModel):
    content: str | None = Field(None, min_length=1, max_length=5000)
    approved: bool | None = None
    is_flagged: bool | None = None
