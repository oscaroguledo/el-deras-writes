from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from core.db import get_db
from core.dependencies import get_optional_user
from models.accounts.user import User
from schemas.accounts.user import Create, Login, Refresh, RefreshResponse, Tokens
from schemas.accounts.user import Response as UserResponse
from services.accounts.auth import AuthService

router = APIRouter(tags=["Auth"])


@router.post("/auth/token/", response_model=Tokens)
@router.post("/token/", response_model=Tokens, include_in_schema=False)
async def login(body: Login, db: AsyncSession = Depends(get_db)):
    user, access, refresh = await AuthService(db).login(body.email, body.password)
    return Tokens(access=access, refresh=refresh, user=UserResponse.model_validate(user))


@router.post("/auth/token/refresh/", response_model=RefreshResponse)
@router.post("/token/refresh/", response_model=RefreshResponse, include_in_schema=False)
async def refresh(body: Refresh, db: AsyncSession = Depends(get_db)):
    access, new_refresh = await AuthService(db).refresh(body.refresh)
    return RefreshResponse(access=access, refresh=new_refresh)


@router.post("/auth/create-user/", response_model=UserResponse, status_code=201)
@router.post("/create-superuser/", response_model=UserResponse, status_code=201, include_in_schema=False)
async def create_superuser(
    body: Create,
    caller: User | None = Depends(get_optional_user),
    db: AsyncSession = Depends(get_db),
):
    """Create an admin. Open only while no users exist, or to an existing admin."""
    return await AuthService(db).create_superuser(body, caller)
