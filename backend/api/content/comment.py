import uuid

from fastapi import APIRouter, BackgroundTasks, Depends, Response
from sqlalchemy.ext.asyncio import AsyncSession

from core.config import settings
from core.db import get_db
from core.dependencies import get_optional_user, is_staff, require_admin
from core.exceptions import APIException
from core.utils.messages.email import send_email
from core.utils.pagination import PageParams, build_page
from models.accounts.user import User
from models.content.article import Article
from models.content.comment import Comment
from schemas.common.pagination import Page
from schemas.content.comment import Create, Update
from schemas.content.comment import Response as CommentResponse
from services.content.article import ArticleService
from services.content.comment import CommentService

router = APIRouter(prefix="/articles/{article_id}/comments", tags=["Comments"])
admin_router = APIRouter(prefix="/admin-api/comments", tags=["Admin: Comments"])


async def _article(db: AsyncSession, article_id: uuid.UUID) -> Article:
    article = await ArticleService(db).get(str(article_id))
    if article is None:
        raise APIException(404, "Not found.")
    return article


async def _comment(db: AsyncSession, comment_id: uuid.UUID) -> Comment:
    comment = await CommentService(db).get(comment_id)
    if comment is None:
        raise APIException(404, "Not found.")
    return comment


@router.get("/", response_model=list[CommentResponse])
async def list_comments(
    article_id: uuid.UUID, user: User | None = Depends(get_optional_user),
    db: AsyncSession = Depends(get_db),
):
    article = await _article(db, article_id)
    comments = await CommentService(db).for_article(article, is_staff(user))
    return [CommentResponse.of(c) for c in comments]


@router.post("/", response_model=CommentResponse, status_code=201)
async def create_comment(
    article_id: uuid.UUID, body: Create, background: BackgroundTasks,
    user: User | None = Depends(get_optional_user), db: AsyncSession = Depends(get_db),
):
    article = await _article(db, article_id)
    comment = await CommentService(db).create(article, body, user)
    if not is_staff(user):  # don't notify admins about their own comments
        background.add_task(send_email, settings.SUPPORT_EMAIL, "new_comment", {
            "commenter": str(user) if user else "Someone (anonymous)",
            "article_title": article.title, "article_id": str(article.id),
            "content": comment.content,
        })
    return CommentResponse.of(comment)


@router.get("/{comment_id}/", response_model=CommentResponse)
async def get_comment(
    article_id: uuid.UUID, comment_id: uuid.UUID, user: User | None = Depends(get_optional_user),
    db: AsyncSession = Depends(get_db),
):
    comment = await _comment(db, comment_id)
    if comment.article_id != article_id or not (comment.approved or is_staff(user)):
        raise APIException(404, "Not found.")
    return CommentResponse.of(comment)


# ---- admin moderation --------------------------------------------------------------------------
@admin_router.get("/", response_model=Page[CommentResponse])
async def admin_list_comments(
    params: PageParams = Depends(), search: str | None = None, approved: bool | None = None,
    is_flagged: bool | None = None, article: str | None = None,
    _: User = Depends(require_admin), db: AsyncSession = Depends(get_db),
):
    rows, total = await CommentService(db).list(
        params.page, params.limit, search, approved, is_flagged, article
    )
    return build_page(params, total, [CommentResponse.of(c) for c in rows])


@admin_router.get("/{comment_id}/", response_model=CommentResponse)
async def admin_get_comment(
    comment_id: uuid.UUID, _: User = Depends(require_admin), db: AsyncSession = Depends(get_db)
):
    return CommentResponse.of(await _comment(db, comment_id))


@admin_router.patch("/{comment_id}/", response_model=CommentResponse)
@admin_router.put("/{comment_id}/", response_model=CommentResponse)
async def admin_update_comment(
    comment_id: uuid.UUID, body: Update,
    _: User = Depends(require_admin), db: AsyncSession = Depends(get_db),
):
    return CommentResponse.of(await CommentService(db).update(await _comment(db, comment_id), body))


@admin_router.delete("/{comment_id}/", status_code=204)
@admin_router.delete("/{comment_id}/delete_comment/", status_code=204, include_in_schema=False)
async def admin_delete_comment(
    comment_id: uuid.UUID, _: User = Depends(require_admin), db: AsyncSession = Depends(get_db)
):
    await CommentService(db).delete(await _comment(db, comment_id))
    return Response(status_code=204)


@admin_router.post("/{comment_id}/approve/", response_model=CommentResponse)
@admin_router.post("/{comment_id}/approve_comment/", response_model=CommentResponse, include_in_schema=False)
async def approve_comment(
    comment_id: uuid.UUID, _: User = Depends(require_admin), db: AsyncSession = Depends(get_db)
):
    service = CommentService(db)
    return CommentResponse.of(await service.update(await _comment(db, comment_id), Update(approved=True)))


@admin_router.post("/{comment_id}/flag/", response_model=CommentResponse)
@admin_router.post("/{comment_id}/flag_comment/", response_model=CommentResponse, include_in_schema=False)
async def flag_comment(
    comment_id: uuid.UUID, _: User = Depends(require_admin), db: AsyncSession = Depends(get_db)
):
    service = CommentService(db)
    return CommentResponse.of(await service.update(await _comment(db, comment_id), Update(is_flagged=True)))
