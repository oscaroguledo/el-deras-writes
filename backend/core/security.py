import base64
import hashlib
import hmac
import secrets
import uuid
from datetime import datetime, timedelta, timezone

import jwt

from core.config import settings


def hash_password(raw: str) -> str:
    """PBKDF2-SHA256 in Django's `pbkdf2_sha256$iter$salt$hash` format, so hashes created by the
    old Django backend verify here and vice versa."""
    iterations = settings.PASSWORD_HASH_ITERATIONS
    salt = secrets.token_urlsafe(12)
    digest = hashlib.pbkdf2_hmac("sha256", raw.encode(), salt.encode(), iterations)
    return f"pbkdf2_sha256${iterations}${salt}${base64.b64encode(digest).decode().strip()}"


def verify_password(raw: str, encoded: str) -> bool:
    try:
        algorithm, iterations, salt, expected = encoded.split("$", 3)
        if algorithm != "pbkdf2_sha256":
            return False
        digest = hashlib.pbkdf2_hmac("sha256", raw.encode(), salt.encode(), int(iterations))
    except (ValueError, AttributeError):
        return False
    return hmac.compare_digest(base64.b64encode(digest).decode().strip(), expected)


def _encode(user_id: uuid.UUID, token_type: str, lifetime: timedelta) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "token_type": token_type,
        "user_id": str(user_id),
        "jti": uuid.uuid4().hex,
        "iss": settings.JWT_ISSUER,
        "iat": now,
        "exp": now + lifetime,
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm="HS256")


def create_access_token(user_id: uuid.UUID) -> str:
    return _encode(user_id, "access", timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES))


def create_refresh_token(user_id: uuid.UUID) -> str:
    return _encode(user_id, "refresh", timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS))


def decode_token(token: str, expected_type: str) -> uuid.UUID:
    """Return the user id in a valid token of `expected_type`, or raise ValueError."""
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=["HS256"], issuer=settings.JWT_ISSUER, leeway=10,
            options={"require": ["exp", "user_id", "token_type"]},
        )
        if payload["token_type"] != expected_type:
            raise ValueError("wrong token type")
        return uuid.UUID(payload["user_id"])
    except (jwt.PyJWTError, ValueError, KeyError) as exc:
        raise ValueError("invalid token") from exc
