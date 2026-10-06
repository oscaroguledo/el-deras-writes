import uuid

from fastapi import APIRouter, Depends, Response
from sqlalchemy.ext.asyncio import AsyncSession

from core.db import get_db
from core.dependencies import require_admin
from core.exceptions import APIException
from models.accounts.user import User
from models.content.tag import Tag
from schemas.content.article import Response as ArticleResponse
from schemas.content.tag import Create
from schemas.content.tag import Response as TagResponse
from services.content.tag import TagService

router = APIRouter(prefix="/tags", tags=["Tags"])


def _response(tag: Tag, count: int = 0) -> TagResponse:
    return TagResponse(id=tag.id, name=tag.name, article_count=count, created_at=tag.created_at)


async def _get(service: TagService, tag_id: uuid.UUID) -> Tag:
    tag = await service.get(tag_id)
    if tag is None:
        raise APIException(404, "Not found.")
    return tag


@router.get("/", response_model=list[TagResponse])
async def list_tags(search: str | None = None, db: AsyncSession = Depends(get_db)):
    return [_response(t, n) for t, n in await TagService(db).list(search)]


@router.get("/popular/", response_model=list[TagResponse])
async def popular_tags(db: AsyncSession = Depends(get_db)):
    return [_response(t, n) for t, n in await TagService(db).popular()]


@router.post("/", response_model=TagResponse, status_code=201)
async def create_tag(
    body: Create, _: User = Depends(require_admin), db: AsyncSession = Depends(get_db)
):
    return _response(await TagService(db).create(body))


@router.get("/{tag_id}/", response_model=TagResponse)
async def get_tag(tag_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    service = TagService(db)
    tag = await _get(service, tag_id)
    return _response(tag, await service.count(tag))


@router.patch("/{tag_id}/", response_model=TagResponse)
@router.put("/{tag_id}/", response_model=TagResponse)
async def update_tag(
    tag_id: uuid.UUID, body: Create,
    _: User = Depends(require_admin), db: AsyncSession = Depends(get_db),
):
    service = TagService(db)
    tag = await service.rename(await _get(service, tag_id), body)
    return _response(tag, await service.count(tag))


@router.delete("/{tag_id}/", status_code=204)
async def delete_tag(
    tag_id: uuid.UUID, _: User = Depends(require_admin), db: AsyncSession = Depends(get_db)
):
    service = TagService(db)
    await service.delete(await _get(service, tag_id))
    return Response(status_code=204)


@router.get("/{tag_id}/articles/", response_model=list[ArticleResponse])
async def tag_articles(tag_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    service = TagService(db)
    return [ArticleResponse.of(a) for a in await service.articles(await _get(service, tag_id))]
