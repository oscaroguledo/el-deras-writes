from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from core.config import settings
from core.logging import get_logger
from models.accounts.user import User
from services.accounts.auth import hash_in_thread

logger = get_logger(__name__)
MIN_PRODUCTION_PASSWORD = 12


async def ensure_superadmin(db: AsyncSession, email: str | None = None, password: str | None = None):
    """Create or update the owner account from ADMIN_EMAIL / ADMIN_PASSWORD (no-op if unset).
    Raises ValueError for a weak password in production."""
    email = email or settings.ADMIN_EMAIL
    password = password or settings.ADMIN_PASSWORD
    if not email or not password:
        return None
    if settings.is_production and len(password) < MIN_PRODUCTION_PASSWORD:
        raise ValueError(f"ADMIN_PASSWORD must be at least {MIN_PRODUCTION_PASSWORD} characters")

    user = await db.scalar(select(User).where(func.lower(User.email) == email.lower()))
    created = user is None
    if created:
        user = User(email=email, username=settings.ADMIN_USERNAME or email.split("@")[0])
        db.add(user)
    user.password = await hash_in_thread(password)
    user.user_type, user.is_staff, user.is_superuser, user.is_active = "admin", True, True, True
    await db.commit()
    logger.info("Superadmin %s: %s", "created" if created else "updated", email)
    return user
