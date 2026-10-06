import base64
import hashlib

from core.config import to_async_url, to_sync_url
from core.security import verify_password


def test_verifies_django_pbkdf2_hash():
    salt, iterations = "abc123", 1000
    digest = base64.b64encode(hashlib.pbkdf2_hmac("sha256", b"secret", salt.encode(), iterations))
    encoded = f"pbkdf2_sha256${iterations}${salt}${digest.decode()}"
    assert verify_password("secret", encoded)
    assert not verify_password("wrong", encoded)
    assert not verify_password("secret", "argon2$unsupported")


def test_database_url_conversion():
    neon = "postgresql://u:p@host/db?sslmode=require&channel_binding=require"
    assert to_async_url(neon) == "postgresql+asyncpg://u:p@host/db?ssl=require"
    assert to_sync_url(neon) == "postgresql+psycopg2://u:p@host/db?sslmode=require&channel_binding=require"
    assert to_async_url("postgres://u:p@host/db") == "postgresql+asyncpg://u:p@host/db"
    assert to_async_url("sqlite:///./x.db") == "sqlite+aiosqlite:///./x.db"
    assert to_async_url("sqlite://") == "sqlite+aiosqlite://"
