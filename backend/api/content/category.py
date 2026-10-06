from fastapi import APIRouter, Depends, Response
from sqlalchemy.ext.asyncio import AsyncSession

from core.db import get_db
from core.dependencies import require_admin
from core.exceptions import APIException
from models.accounts.user import User
from models.content.category import Category
from schemas.content.article import Response as ArticleResponse
from schemas.content.category import Create, Update
from schemas.content.category import Response as CategoryResponse
from services.content.category import CategoryService

router = APIRouter(prefix="/categories", tags=["Categories"])


def _response(category: Category, total: int, children: list | None = None) -> CategoryResponse:
    return CategoryResponse(
        id=category.id, name=category.name, slug=category.slug, description=category.description,
        parent_id=category.parent_id, sort_order=category.sort_order, is_active=category.is_active,
        article_count=total, children=[_response(*c) for c in children or []],
    )


async def _get(service: CategoryService, ref: str) -> Category:
    category = await service.get_by_ref(ref)
    if category is None:
        raise APIException(404, "Category not found")
    return category


@router.get("/", response_model=list[CategoryResponse])
async def list_categories(
    parent: str | None = None, top_level: bool = False, search: str | None = None,
    active_only: bool = False, db: AsyncSession = Depends(get_db),
):
    """Flat list. `parent=<slug|id>` gives a section's sub-sections; `top_level=true` the sections."""
    rows = await CategoryService(db).list(parent, top_level, search, active_only)
    return [_response(c, n) for c, n in rows]


@router.get("/tree/", response_model=list[CategoryResponse])
async def category_tree(active_only: bool = False, db: AsyncSession = Depends(get_db)):
    """Sections with their sub-sections nested under `children`."""
    return [_response(*node) for node in await CategoryService(db).tree(active_only)]


@router.post("/", response_model=CategoryResponse, status_code=201)
async def create_category(
    body: Create, _: User = Depends(require_admin), db: AsyncSession = Depends(get_db)
):
    service = CategoryService(db)
    return _response(*await service.with_total(await service.create(body)))


@router.get("/{ref}/", response_model=CategoryResponse)
async def get_category(ref: str, db: AsyncSession = Depends(get_db)):
    service = CategoryService(db)
    return _response(*await service.with_total(await _get(service, ref)))


@router.patch("/{ref}/", response_model=CategoryResponse)
@router.put("/{ref}/", response_model=CategoryResponse)
async def update_category(
    ref: str, body: Update, _: User = Depends(require_admin), db: AsyncSession = Depends(get_db)
):
    service = CategoryService(db)
    category = await service.update(await _get(service, ref), body)
    return _response(*await service.with_total(category))


@router.delete("/{ref}/", status_code=204)
async def delete_category(
    ref: str, _: User = Depends(require_admin), db: AsyncSession = Depends(get_db)
):
    service = CategoryService(db)
    await service.delete(await _get(service, ref))
    return Response(status_code=204)


@router.get("/{ref}/articles/", response_model=list[ArticleResponse])
async def category_articles(ref: str, db: AsyncSession = Depends(get_db)):
    """Published articles in a category, including its sub-sections."""
    service = CategoryService(db)
    return [ArticleResponse.of(a) for a in await service.articles(await _get(service, ref))]
