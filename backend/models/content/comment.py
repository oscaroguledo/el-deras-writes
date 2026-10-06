import uuid
from datetime import datetime

from sqlalchemy import Boolean, ForeignKey, Text, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from core.db import Base, UTCDateTime, utcnow
from core.utils.uuid_utils import uuid7
from models.accounts.user import User

MAX_REPLY_DEPTH = 4  # nesting levels eagerly loaded and serialized


class Comment(Base):
    __tablename__ = "comments"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid7)
    article_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("articles.id", ondelete="CASCADE"), index=True
    )
    author_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=True
    )
    parent_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("comments.id", ondelete="CASCADE"), nullable=True, index=True
    )
    content: Mapped[str] = mapped_column(Text)
    approved: Mapped[bool] = mapped_column(Boolean, default=False, index=True)
    is_flagged: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(UTCDateTime(), default=utcnow, index=True)
    updated_at: Mapped[datetime] = mapped_column(UTCDateTime(), default=utcnow, onupdate=utcnow)

    article = relationship("Article", back_populates="comments", lazy="joined")
    author: Mapped[User | None] = relationship(lazy="joined")
    parent: Mapped["Comment | None"] = relationship(back_populates="replies", remote_side=[id])
    replies: Mapped[list["Comment"]] = relationship(
        back_populates="parent", cascade="all, delete-orphan", order_by="Comment.created_at",
        lazy="selectin", join_depth=MAX_REPLY_DEPTH,
    )
