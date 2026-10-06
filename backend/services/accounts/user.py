from __future__ import annotations

import uuid

from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from core.exceptions import APIException
from core.utils.text import search_terms
from models.accounts.user import User
from schemas.accounts.user import Create, Update
from services.accounts.auth import hash_in_thread


class UserService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get(self, user_id: uuid.UUID) -> User | None:
        return await self.db.get(User, user_id)

    async def list(self, page: int, limit: int, search: str | None = None) -> tuple[list[User], int]:
        conds = [
            (User.username.ilike(f"%{t}%") | User.email.ilike(f"%{t}%")
             | User.first_name.ilike(f"%{t}%") | User.last_name.ilike(f"%{t}%"))
            for t in search_terms(search)
        ]
        total = await self.db.scalar(select(func.count(User.id)).where(*conds)) or 0
        stmt = (
            select(User).where(*conds).order_by(User.date_joined.desc())
            .limit(limit).offset((page - 1) * limit)
        )
        return list((await self.db.scalars(stmt)).all()), total

    async def _commit(self) -> None:
        try:
            await self.db.commit()
        except IntegrityError:
            await self.db.rollback()
            raise APIException(400, "A user with this email or username already exists.") from None

    async def create(self, data: Create) -> User:
        is_admin = data.user_type == "admin"
        user = User(
            **data.model_dump(exclude={"password"}), password=await hash_in_thread(data.password),
            is_staff=is_admin, is_superuser=is_admin,
        )
        self.db.add(user)
        await self._commit()
        return user

    async def update(self, user: User, data: Update) -> User:
        values = data.model_dump(exclude_none=True)
        if "password" in values:
            user.password = await hash_in_thread(values.pop("password"))
        for key, value in values.items():
            setattr(user, key, value)
        if "user_type" in values:
            user.is_staff = user.is_superuser = values["user_type"] == "admin"
        await self._commit()
        return user

    async def delete(self, user: User, acting: User) -> None:
        if user.id == acting.id:
            raise APIException(400, "You cannot delete your own account.")
        await self.db.delete(user)
        await self.db.commit()
