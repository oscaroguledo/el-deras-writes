from collections.abc import AsyncIterator
from datetime import datetime, timezone

from sqlalchemy import DateTime, TypeDecorator
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy.pool import StaticPool

from core.config import settings
from core.logging import get_logger

logger = get_logger(__name__)


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class Base(DeclarativeBase):
    pass


class UTCDateTime(TypeDecorator):
    """DateTime(timezone=True) that always hands back aware UTC datetimes (SQLite drops tzinfo)."""

    impl = DateTime(timezone=True)
    cache_ok = True

    def process_bind_param(self, value, dialect):
        if isinstance(value, datetime) and value.tzinfo is None:
            return value.replace(tzinfo=timezone.utc)
        return value

    def process_result_value(self, value, dialect):
        if isinstance(value, datetime) and value.tzinfo is None:
            return value.replace(tzinfo=timezone.utc)
        return value


def _make_engine():
    url = settings.SQLALCHEMY_DATABASE_URI
    kwargs: dict = {"pool_pre_ping": True}
    if url.startswith("sqlite"):
        kwargs = {}
        if url in ("sqlite+aiosqlite://", "sqlite+aiosqlite:///:memory:"):
            kwargs = {"poolclass": StaticPool, "connect_args": {"check_same_thread": False}}
    elif "pooler" in url:  # PgBouncer (e.g. Neon's pooled host) can't reuse prepared statements
        kwargs["connect_args"] = {"statement_cache_size": 0, "prepared_statement_cache_size": 0}
    return create_async_engine(url, **kwargs)


engine = _make_engine()
SessionLocal = async_sessionmaker(engine, expire_on_commit=False)


async def get_db() -> AsyncIterator[AsyncSession]:
    async with SessionLocal() as session:
        yield session


async def initialize_db() -> None:
    """Verify connectivity. Schema is managed by Alembic; only SQLite dev DBs are auto-created."""
    import models  # noqa: F401  (register tables on Base.metadata)

    async with engine.begin() as conn:
        if settings.DATABASE_URL.startswith("sqlite"):
            await conn.run_sync(Base.metadata.create_all)
        else:
            from sqlalchemy import text

            await conn.execute(text("SELECT 1"))
