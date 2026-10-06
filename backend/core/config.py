from urllib.parse import parse_qsl, urlencode

from pydantic_settings import BaseSettings, SettingsConfigDict

_INSECURE_DEFAULT_KEY = "insecure-dev-key-change-me-insecure-dev-key"


def _split(url: str) -> tuple[str, str, list[tuple[str, str]]]:
    """(scheme, everything between the scheme's ':' and the '?', query pairs)"""
    scheme, _, remainder = url.partition(":")
    rest, _, query = remainder.partition("?")
    return scheme, rest, parse_qsl(query)


def to_async_url(url: str) -> str:
    """Runtime driver: asyncpg for PostgreSQL, aiosqlite for SQLite."""
    scheme, rest, query = _split(url)
    if scheme.startswith("sqlite"):
        return f"sqlite+aiosqlite:{rest}"
    # asyncpg takes `ssl`, not libpq's `sslmode`, and rejects `channel_binding`
    query = [("ssl" if k == "sslmode" else k, v) for k, v in query if k != "channel_binding"]
    suffix = f"?{urlencode(query)}" if query else ""
    return f"postgresql+asyncpg:{rest}{suffix}"


def to_sync_url(url: str) -> str:
    """Alembic driver: psycopg2 for PostgreSQL."""
    scheme, rest, query = _split(url)
    if scheme.startswith("sqlite"):
        return f"sqlite:{rest}"
    suffix = f"?{urlencode(query)}" if query else ""
    return f"postgresql+psycopg2:{rest}{suffix}"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=(".env", ".env.dev"), extra="ignore")

    ENVIRONMENT: str = "dev"  # dev | test | production
    SECRET_KEY: str = _INSECURE_DEFAULT_KEY
    DATABASE_URL: str = "sqlite:///./db.sqlite3"

    FRONTEND_URL: str = "http://localhost:5173"
    CORS_ALLOWED_ORIGINS: str = "http://localhost:3000,http://localhost:5173,http://localhost:5174"
    CORS_ALLOWED_ORIGIN_REGEX: str = ""

    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    JWT_ISSUER: str = "django-blog-api"  # unchanged so tokens from the old backend stay valid
    PASSWORD_HASH_ITERATIONS: int = 600_000

    # Optional owner account, ensured at startup (see services/accounts/superadmin.py)
    ADMIN_EMAIL: str = ""
    ADMIN_PASSWORD: str = ""
    ADMIN_USERNAME: str = ""

    @property
    def is_production(self) -> bool:
        return self.ENVIRONMENT.lower() == "production"

    @property
    def SQLALCHEMY_DATABASE_URI(self) -> str:
        return to_async_url(self.DATABASE_URL)

    @property
    def SYNC_DATABASE_URI(self) -> str:
        return to_sync_url(self.DATABASE_URL)

    @property
    def BACKEND_CORS_ORIGINS(self) -> list[str]:
        origins = [o.strip() for o in self.CORS_ALLOWED_ORIGINS.split(",") if o.strip()]
        return [*origins, self.FRONTEND_URL] if self.FRONTEND_URL not in origins else origins

    def validate(self) -> dict:
        missing = []
        if self.is_production:
            if self.SECRET_KEY == _INSECURE_DEFAULT_KEY or len(self.SECRET_KEY) < 32:
                missing.append("SECRET_KEY (>=32 chars)")
            if self.DATABASE_URL.startswith("sqlite"):
                missing.append("DATABASE_URL (PostgreSQL)")
        return {"is_valid": not missing, "missing": missing}


settings = Settings()
