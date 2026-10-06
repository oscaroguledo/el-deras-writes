import datetime as dt
import uuid
from datetime import datetime

from sqlalchemy import JSON, Date, Integer, String, Text, Uuid
from sqlalchemy.orm import Mapped, mapped_column

from core.db import Base, UTCDateTime, utcnow
from core.utils.uuid_utils import uuid7


class ContactInfo(Base):
    __tablename__ = "contact_info"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid7)
    address: Mapped[str] = mapped_column(String(255), default="")
    phone: Mapped[str] = mapped_column(String(20), default="")
    email: Mapped[str] = mapped_column(String(254), default="")
    social_media_links: Mapped[dict] = mapped_column(JSON, default=dict)


class VisitorCount(Base):
    __tablename__ = "visitor_counts"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid7)
    count: Mapped[int] = mapped_column(Integer, default=0)


class Visit(Base):
    __tablename__ = "visits"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid7)
    date: Mapped[dt.date] = mapped_column(Date, default=lambda: utcnow().date(), unique=True, index=True)
    count: Mapped[int] = mapped_column(Integer, default=1)


class Feedback(Base):
    __tablename__ = "feedback"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid7)
    name: Mapped[str] = mapped_column(String(100))
    email: Mapped[str] = mapped_column(String(254))
    subject: Mapped[str] = mapped_column(String(200), default="")
    message: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(UTCDateTime(), default=utcnow, index=True)
