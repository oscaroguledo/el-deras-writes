from typing import Annotated

from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from core.db import get_db
from core.exceptions import APIException
from core.security import decode_token
from models.accounts.user import User

_bearer = HTTPBearer(auto_error=False)


async def get_optional_user(
    creds: Annotated[HTTPAuthorizationCredentials | None, Depends(_bearer)],
    db: AsyncSession = Depends(get_db),
) -> User | None:
    if creds is None:
        return None
    try:
        user_id = decode_token(creds.credentials, "access")
    except ValueError:
        raise APIException(401, "Given token not valid for any token type") from None
    user = await db.get(User, user_id)
    if user is None or not user.is_active:
        raise APIException(401, "User not found or inactive")
    return user


async def get_current_user(user: User | None = Depends(get_optional_user)) -> User:
    if user is None:
        raise APIException(401, "Authentication credentials were not provided.")
    return user


async def require_admin(user: User = Depends(get_current_user)) -> User:
    if not user.is_staff:
        raise APIException(403, "You do not have permission to perform this action.")
    return user


def is_staff(user: User | None) -> bool:
    return user is not None and user.is_staff
