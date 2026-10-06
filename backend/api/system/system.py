import uuid

from fastapi import APIRouter, BackgroundTasks, Depends, Response
from fastapi.responses import JSONResponse
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncSession

from core.config import settings
from core.db import get_db, utcnow
from core.dependencies import require_admin
from core.exceptions import APIException
from core.utils.messages.email import send_email
from core.utils.pagination import PageParams, build_page
from models.accounts.user import User
from schemas.common.pagination import Page
from schemas.system.system import (
    Contact, ContactUpdate, FeedbackCreate, FeedbackResponse, VisitorCount,
)
from services.system.system import ContactService, FeedbackService, VisitorService

health_router = APIRouter(tags=["System"])
system_router = APIRouter(tags=["System"])
admin_feedback_router = APIRouter(prefix="/admin-api/feedback", tags=["Admin: Feedback"])


@health_router.get("/health/")
async def health(db: AsyncSession = Depends(get_db)):
    try:
        await db.execute(text("SELECT 1"))
    except SQLAlchemyError as exc:
        return JSONResponse(
            {"status": "unhealthy", "timestamp": utcnow().isoformat(), "error": str(exc)},
            status_code=503,
        )
    return {"status": "healthy", "timestamp": utcnow().isoformat(), "database": "connected"}


@system_router.get("/contact/", response_model=Contact)
async def get_contact(db: AsyncSession = Depends(get_db)):
    return await ContactService(db).get()


@system_router.patch("/contact/", response_model=Contact)
async def update_contact(
    body: ContactUpdate, _: User = Depends(require_admin), db: AsyncSession = Depends(get_db)
):
    return await ContactService(db).update(body)


@system_router.post("/visitor-count/", response_model=VisitorCount)
async def visitor_count(db: AsyncSession = Depends(get_db)):
    return await VisitorService(db).record()


@system_router.post("/feedback/", response_model=FeedbackResponse, status_code=201)
async def submit_feedback(
    body: FeedbackCreate, background: BackgroundTasks, db: AsyncSession = Depends(get_db)
):
    feedback = await FeedbackService(db).create(body)
    context = {
        "name": feedback.name, "email": feedback.email,
        "feedback_subject": feedback.subject, "message": feedback.message,
    }
    background.add_task(
        send_email, settings.SUPPORT_EMAIL, "feedback_received", context, reply_to=feedback.email
    )
    background.add_task(send_email, feedback.email, "feedback_ack", context)
    return feedback


@admin_feedback_router.get("/", response_model=Page[FeedbackResponse])
async def list_feedback(
    params: PageParams = Depends(), search: str | None = None,
    _: User = Depends(require_admin), db: AsyncSession = Depends(get_db),
):
    rows, total = await FeedbackService(db).list(params.page, params.limit, search)
    return build_page(params, total, [FeedbackResponse.model_validate(f) for f in rows])


@admin_feedback_router.get("/{feedback_id}/", response_model=FeedbackResponse)
async def get_feedback(
    feedback_id: uuid.UUID, _: User = Depends(require_admin), db: AsyncSession = Depends(get_db)
):
    feedback = await FeedbackService(db).get(feedback_id)
    if feedback is None:
        raise APIException(404, "Not found.")
    return feedback


@admin_feedback_router.delete("/{feedback_id}/", status_code=204)
async def delete_feedback(
    feedback_id: uuid.UUID, _: User = Depends(require_admin), db: AsyncSession = Depends(get_db)
):
    service = FeedbackService(db)
    feedback = await service.get(feedback_id)
    if feedback is None:
        raise APIException(404, "Not found.")
    await service.delete(feedback)
    return Response(status_code=204)
