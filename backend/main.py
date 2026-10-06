from contextlib import asynccontextmanager

from fastapi import APIRouter, FastAPI
from fastapi.middleware.cors import CORSMiddleware

import models  # noqa: F401  (register tables)
from api import (
    admin_articles_router, admin_comments_router, admin_feedback_router, admin_users_router,
    analytics_router, articles_router, auth_router, category_router, comments_router,
    health_router, system_router, tag_router,
)
from core.config import settings
from core.db import SessionLocal, initialize_db
from core.exceptions import register_exception_handlers
from core.logging import get_logger
from services.accounts.superadmin import ensure_superadmin
from services.content.category import CategoryService

logger = get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    validation = settings.validate()
    if not validation["is_valid"]:
        raise RuntimeError(f"Invalid environment configuration: {validation['missing']}")

    await initialize_db()
    async with SessionLocal() as db:
        await CategoryService(db).ensure_defaults()
        try:
            await ensure_superadmin(db)
        except ValueError as exc:
            if settings.is_production:
                raise RuntimeError(str(exc)) from exc
            logger.warning("Superadmin not set up: %s", exc)
    yield


app = FastAPI(
    title="El Dera's Writes API",
    version="2.0.0",
    lifespan=lifespan,
    docs_url=None if settings.is_production else "/docs",
    redoc_url=None,
    openapi_url=None if settings.is_production else "/openapi.json",
)
register_exception_handlers(app)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_origin_regex=settings.CORS_ALLOWED_ORIGIN_REGEX or None,
    allow_methods=["*"],
    allow_headers=["*"],
)

api_router = APIRouter()
for router in (
    health_router, system_router, auth_router, articles_router, comments_router,
    category_router, tag_router, admin_articles_router, admin_comments_router,
    admin_users_router, admin_feedback_router, analytics_router,
):
    api_router.include_router(router)

app.include_router(api_router, prefix="/v1")
# Unprefixed copy so the deployed frontend keeps working; drop once it calls /v1.
app.include_router(api_router, include_in_schema=False)
