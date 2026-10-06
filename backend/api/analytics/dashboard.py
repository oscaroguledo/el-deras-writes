from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from core.db import get_db
from core.dependencies import require_admin
from models.accounts.user import User
from services.analytics.dashboard import DashboardService

router = APIRouter(prefix="/admin-api/dashboard", tags=["Admin: Dashboard"])


@router.get("/")
async def dashboard(_: User = Depends(require_admin), db: AsyncSession = Depends(get_db)):
    return await DashboardService(db).data()
