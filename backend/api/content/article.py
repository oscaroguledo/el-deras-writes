from fastapi import APIRouter, Depends, Response
from sqlalchemy.ext.asyncio import AsyncSession

from core.db import get_db
from core.dependencies import get_optional_user, is_staff, require_admin
from core.exceptions import APIException
from core.utils.pagination import PageParams, build_page
from models.accounts.user import User
from models.content.article import Article
from schemas.common.pagination import Page
from schemas.content.article import Create, Suggestions, Update
from schemas.content.article import Response as ArticleResponse
from services.content.article import ArticleService

router = APIRouter(prefix="/articles", tags=["Articles"])
admin_router = APIRouter(prefix="/admin-api/articles", tags=["Admin: Articles"])


def _page(params: PageParams, rows: list[Article], total: int) -> dict:
    return build_page(params, total, [ArticleResponse.of(a) for a in rows])


async def _get(service: ArticleService, ref: str) -> Article:
    article = await service.get(ref)
    if article is None:
        raise APIException(404, "Not found.")
    return article


@router.get("/", response_model=Page[ArticleResponse])
async def list_articles(
    params: PageParams = Depends(), search: str | None = None, category: str | None = None,
    tag: str | None = None, status: str | None = None, featured: str | None = None,
    ordering: str = "-created_at", user: User | None = Depends(get_optional_user),
    db: AsyncSession = Depends(get_db),
):
    """`category` is a name, slug or id; a section also returns its sub-sections' articles."""
    rows, total = await ArticleService(db).list(
        is_staff(user), params.page, params.limit, search, category, tag, status,
        bool(featured and featured.lower() == "true"), ordering,
    )
    return _page(params, rows, total)


@router.get("/search/", response_model=Page[ArticleResponse] | dict)
async def search_articles(
    params: PageParams = Depends(), q: str = "", db: AsyncSession = Depends(get_db)
):
    if not q.strip():
        return {"results": []}
    rows, total = await ArticleService(db).search(q.strip(), params.page, params.limit)
    return _page(params, rows, total)


@router.get("/suggestions/", response_model=Suggestions)
async def suggestions(q: str = "", db: AsyncSession = Depends(get_db)):
    q = q.strip()
    return Suggestions(suggestions=await ArticleService(db).suggestions(q) if len(q) >= 2 else [])


@router.get("/featured/", response_model=Page[ArticleResponse])
async def featured(params: PageParams = Depends(), db: AsyncSession = Depends(get_db)):
    rows, total = await ArticleService(db).published(
        params.page, params.limit, Article.created_at.desc(), featured=True
    )
    return _page(params, rows, total)


@router.get("/popular/", response_model=Page[ArticleResponse])
async def popular(params: PageParams = Depends(), db: AsyncSession = Depends(get_db)):
    rows, total = await ArticleService(db).published(params.page, params.limit, Article.views.desc())
    return _page(params, rows, total)


@router.get("/recent/", response_model=Page[ArticleResponse])
async def recent(params: PageParams = Depends(), db: AsyncSession = Depends(get_db)):
    rows, total = await ArticleService(db).published(
        params.page, params.limit, Article.created_at.desc()
    )
    return _page(params, rows, total)


@router.get("/{ref}/", response_model=ArticleResponse)
async def get_article(
    ref: str, user: User | None = Depends(get_optional_user), db: AsyncSession = Depends(get_db)
):
    """By id or slug; counts a view."""
    service = ArticleService(db)
    article = await service.get(ref, staff=is_staff(user))
    if article is None:
        raise APIException(404, "Not found.")
    return ArticleResponse.of(await service.view(article))


@router.post("/", response_model=ArticleResponse, status_code=201)
@admin_router.post("/", response_model=ArticleResponse, status_code=201)
async def create_article(
    body: Create, admin: User = Depends(require_admin), db: AsyncSession = Depends(get_db)
):
    return ArticleResponse.of(await ArticleService(db).create(body, admin))


@router.put("/{ref}/", response_model=ArticleResponse)
@router.patch("/{ref}/", response_model=ArticleResponse)
@admin_router.put("/{ref}/", response_model=ArticleResponse)
@admin_router.patch("/{ref}/", response_model=ArticleResponse)
async def update_article(
    ref: str, body: Update, _: User = Depends(require_admin), db: AsyncSession = Depends(get_db)
):
    service = ArticleService(db)
    return ArticleResponse.of(await service.update(await _get(service, ref), body))


@router.delete("/{ref}/", status_code=204)
@admin_router.delete("/{ref}/", status_code=204)
async def delete_article(
    ref: str, _: User = Depends(require_admin), db: AsyncSession = Depends(get_db)
):
    service = ArticleService(db)
    await service.delete(await _get(service, ref))
    return Response(status_code=204)


@admin_router.get("/", response_model=list[ArticleResponse])
async def admin_list_articles(
    search: str | None = None, _: User = Depends(require_admin), db: AsyncSession = Depends(get_db)
):
    return [ArticleResponse.of(a) for a in await ArticleService(db).all_for_admin(search)]


@admin_router.get("/{ref}/", response_model=ArticleResponse)
async def admin_get_article(
    ref: str, _: User = Depends(require_admin), db: AsyncSession = Depends(get_db)
):
    return ArticleResponse.of(await _get(ArticleService(db), ref))
