import uuid
from datetime import datetime

from sqlalchemy import (
    BigInteger, Boolean, Column, ForeignKey, Integer, String, Table, Text, Uuid,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from core.db import Base, UTCDateTime, utcnow
from core.utils.uuid_utils import uuid7
from models.accounts.user import User
from models.content.category import Category
from models.content.tag import Tag

article_tags = Table(
    "articles_tags",
    Base.metadata,
    Column("id", BigInteger().with_variant(Integer, "sqlite"), primary_key=True, autoincrement=True),
    Column("article_id", Uuid, ForeignKey("articles.id", ondelete="CASCADE"), nullable=False),
    Column("tag_id", Uuid, ForeignKey("tags.id", ondelete="CASCADE"), nullable=False),
)


class Article(Base):
    __tablename__ = "articles"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid7)
    title: Mapped[str] = mapped_column(String(200), index=True)
    slug: Mapped[str] = mapped_column(String(200), unique=True, index=True)
    content: Mapped[str] = mapped_column(Text)
    excerpt: Mapped[str] = mapped_column(Text, default="")
    image: Mapped[str | None] = mapped_column(String(200), nullable=True)
    readTime: Mapped[int] = mapped_column(Integer, default=0)
    author_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True
    )
    category_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("categories.id"), index=True)
    status: Mapped[str] = mapped_column(String(10), default="draft", index=True)
    featured: Mapped[bool] = mapped_column(Boolean, default=False, index=True)
    views: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(UTCDateTime(), default=utcnow, index=True)
    updated_at: Mapped[datetime] = mapped_column(UTCDateTime(), default=utcnow, onupdate=utcnow)
    published_at: Mapped[datetime | None] = mapped_column(UTCDateTime(), nullable=True, index=True)

    # Eager loading: AsyncSession cannot lazy-load, and every response needs these.
    author: Mapped[User] = relationship(back_populates="articles", lazy="joined")
    category: Mapped[Category] = relationship(lazy="joined")
    tags: Mapped[list[Tag]] = relationship(secondary=article_tags, lazy="selectin", order_by=Tag.name)
    comments = relationship("Comment", back_populates="article", cascade="all, delete-orphan")

    @property
    def formatted_read_time(self) -> str:
        if self.readTime >= 1:
            return f"{self.readTime} min{'s' if self.readTime != 1 else ''}"
        return "30 secs"
