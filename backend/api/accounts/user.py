import uuid

from fastapi import APIRouter, BackgroundTasks, Depends, Response
from sqlalchemy.ext.asyncio import AsyncSession

from core.db import get_db
from core.dependencies import require_admin
from core.exceptions import APIException
from core.utils.messages.email import send_email
from core.utils.pagination import PageParams, build_page
from models.accounts.user import User
from schemas.accounts.user import Create, Update
from schemas.accounts.user import Response as UserResponse
from schemas.common.pagination import Page
from services.accounts.user import UserService

admin_router = APIRouter(prefix="/admin-api/users", tags=["Admin: Users"])


async def _get(db: AsyncSession, user_id: uuid.UUID) -> User:
    user = await UserService(db).get(user_id)
    if user is None:
        raise APIException(404, "Not found.")
    return user


@admin_router.get("/", response_model=Page[UserResponse])
async def list_users(
    params: PageParams = Depends(), search: str | None = None,
    _: User = Depends(require_admin), db: AsyncSession = Depends(get_db),
):
    users, total = await UserService(db).list(params.page, params.limit, search)
    return build_page(params, total, [UserResponse.model_validate(u) for u in users])


@admin_router.post("/", response_model=UserResponse, status_code=201)
async def create_user(
    body: Create, background: BackgroundTasks,
    _: User = Depends(require_admin), db: AsyncSession = Depends(get_db),
):
    user = await UserService(db).create(body)
    background.add_task(send_email, user.email, "welcome", {
        "first_name": user.first_name, "username": user.username, "email": user.email,
        "is_admin": user.is_staff,
    })
    return user


@admin_router.get("/{user_id}/", response_model=UserResponse)
async def get_user(
    user_id: uuid.UUID, _: User = Depends(require_admin), db: AsyncSession = Depends(get_db)
):
    return await _get(db, user_id)


@admin_router.patch("/{user_id}/", response_model=UserResponse)
@admin_router.put("/{user_id}/", response_model=UserResponse)
async def update_user(
    user_id: uuid.UUID, body: Update,
    _: User = Depends(require_admin), db: AsyncSession = Depends(get_db),
):
    return await UserService(db).update(await _get(db, user_id), body)


@admin_router.delete("/{user_id}/", status_code=204)
async def delete_user(
    user_id: uuid.UUID, admin: User = Depends(require_admin), db: AsyncSession = Depends(get_db)
):
    await UserService(db).delete(await _get(db, user_id), admin)
    return Response(status_code=204)
