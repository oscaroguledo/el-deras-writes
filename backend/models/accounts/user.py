import uuid
from datetime import datetime

from sqlalchemy import Boolean, String, Text, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from core.db import Base, UTCDateTime, utcnow
from core.utils.uuid_utils import uuid7


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid7)
    username: Mapped[str] = mapped_column(String(150), unique=True, index=True)
    email: Mapped[str] = mapped_column(String(254), unique=True, index=True)
    password: Mapped[str] = mapped_column(String(128))
    first_name: Mapped[str] = mapped_column(String(30), default="")
    last_name: Mapped[str] = mapped_column(String(150), default="")
    bio: Mapped[str] = mapped_column(Text, default="")
    user_type: Mapped[str] = mapped_column(String(10), default="normal", index=True)
    is_staff: Mapped[bool] = mapped_column(Boolean, default=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, index=True)
    is_superuser: Mapped[bool] = mapped_column(Boolean, default=False)
    date_joined: Mapped[datetime] = mapped_column(UTCDateTime(), default=utcnow, index=True)
    last_login: Mapped[datetime | None] = mapped_column(UTCDateTime(), nullable=True)

    articles = relationship("Article", back_populates="author", cascade="all, delete-orphan")

    def __str__(self) -> str:
        if self.first_name and self.last_name:
            return f"{self.first_name} {self.last_name}"
        return self.first_name or self.last_name or self.username
