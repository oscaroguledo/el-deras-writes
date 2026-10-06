import asyncio

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from core.db import utcnow
from core.exceptions import APIException
from core.security import (
    create_access_token, create_refresh_token, decode_token, hash_password, verify_password,
)
from models.accounts.user import User
from schemas.accounts.user import Create


async def hash_in_thread(raw: str) -> str:
    return await asyncio.to_thread(hash_password, raw)  # PBKDF2 is CPU-bound; keep the loop free


class AuthService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_email(self, email: str) -> User | None:
        return await self.db.scalar(select(User).where(func.lower(User.email) == email.lower()))

    async def login(self, email: str, password: str) -> tuple[User, str, str]:
        user = await self.get_by_email(email)
        ok = (
            user is not None and user.is_active
            and await asyncio.to_thread(verify_password, password, user.password)
        )
        if not ok:
            raise APIException(401, "No active account found with the given credentials")
        user.last_login = utcnow()
        await self.db.commit()
        return user, create_access_token(user.id), create_refresh_token(user.id)

    async def refresh(self, token: str) -> tuple[str, str]:
        try:
            user_id = decode_token(token, "refresh")
        except ValueError:
            raise APIException(401, "Token is invalid or expired") from None
        user = await self.db.get(User, user_id)
        if user is None or not user.is_active:
            raise APIException(401, "User not found or inactive")
        return create_access_token(user.id), create_refresh_token(user.id)

    async def create_superuser(self, data: Create, caller: User | None) -> User:
        """Open only to bootstrap the first account, or to an existing admin."""
        if await self.db.scalar(select(func.count()).select_from(User)) and not (
            caller and caller.is_staff
        ):
            raise APIException(403, "Only an admin can create users.")
        if await self.get_by_email(data.email):
            raise APIException(400, "User with this email already exists.")
        if await self.db.scalar(select(User).where(User.username == data.username)):
            raise APIException(400, "User with this username already exists.")
        user = User(
            username=data.username, email=data.email, password=await hash_in_thread(data.password),
            first_name=data.first_name, last_name=data.last_name, bio=data.bio,
            user_type="admin", is_staff=True, is_superuser=True,
        )
        self.db.add(user)
        await self.db.commit()
        return user
