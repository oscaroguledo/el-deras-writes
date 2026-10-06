from __future__ import annotations

import uuid
from datetime import datetime, timezone

from sqlalchemy import func, or_, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from core.exceptions import APIException
from core.utils.text import parse_uuid, search_terms, slugify
from models.accounts.user import User
from models.content.article import Article
from models.content.category import Category
from models.content.tag import Tag
from schemas.content.article import Create, Update
from services.content.category import CategoryService

ORDERINGS = {
    "created_at": Article.created_at.asc(), "-created_at": Article.created_at.desc(),
    "title": Article.title.asc(), "-title": Article.title.desc(),
    "views": Article.views.asc(), "-views": Article.views.desc(),
}


class ArticleService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.categories = CategoryService(db)

    async def _page(self, conds: list, order, page: int, limit: int) -> tuple[list[Article], int]:
        total = await self.db.scalar(select(func.count(Article.id)).where(*conds)) or 0
        stmt = select(Article).where(*conds).order_by(order).limit(limit).offset((page - 1) * limit)
        return list((await self.db.scalars(stmt)).unique().all()), total

    # ---- reads -----------------------------------------------------------------------------
    async def list(
        self, staff: bool, page: int, limit: int, search: str | None = None,
        category: str | None = None, tag: str | None = None, status: str | None = None,
        featured: bool = False, ordering: str = "-created_at",
    ) -> tuple[list[Article], int]:
        conds: list = [] if staff else [Article.status == "published"]
        for term in search_terms(search):
            like = f"%{term}%"
            conds.append(or_(
                Article.title.ilike(like), Article.content.ilike(like), Article.excerpt.ilike(like),
                Article.author.has(User.username.ilike(like)),
                Article.category.has(Category.name.ilike(like)),
            ))
        if category:
            conds.append(Article.category_id.in_(await self.categories.ids_for(category)))
        if tag:
            conds.append(Article.tags.any(func.lower(Tag.name) == tag.lower()))
        if staff and status in ("draft", "published", "archived"):
            conds.append(Article.status == status)
        if featured:
            conds.append(Article.featured.is_(True))
        return await self._page(conds, ORDERINGS.get(ordering, ORDERINGS["-created_at"]), page, limit)

    async def published(
        self, page: int, limit: int, order, featured: bool = False
    ) -> tuple[list[Article], int]:
        conds = [Article.status == "published"]
        if featured:
            conds.append(Article.featured.is_(True))
        return await self._page(conds, order, page, limit)

    async def search(self, q: str, page: int, limit: int) -> tuple[list[Article], int]:
        like = f"%{q}%"
        conds = [
            Article.status == "published",
            or_(Article.title.ilike(like), Article.content.ilike(like), Article.excerpt.ilike(like)),
        ]
        return await self._page(conds, Article.created_at.desc(), page, limit)

    async def suggestions(self, q: str) -> list[str]:
        titles = await self.db.scalars(
            select(Article.title)
            .where(Article.status == "published", Article.title.ilike(f"%{q}%")).limit(5)
        )
        cats = await self.db.scalars(select(Category.name).where(Category.name.ilike(f"%{q}%")).limit(3))
        return [*titles, *[f"in {c}" for c in cats]][:8]

    async def get(self, ref: str, staff: bool = True) -> Article | None:
        """By id or slug."""
        as_id = parse_uuid(ref)
        stmt = select(Article).where(Article.id == as_id if as_id else Article.slug == ref)
        if not staff:
            stmt = stmt.where(Article.status == "published")
        return (await self.db.scalars(stmt)).unique().one_or_none()

    async def view(self, article: Article) -> Article:
        await self.db.execute(
            update(Article).where(Article.id == article.id).values(views=Article.views + 1)
        )
        await self.db.commit()
        await self.db.refresh(article, ["views"])
        return article

    async def all_for_admin(self, search: str | None = None) -> list[Article]:
        conds = []
        for term in search_terms(search):
            like = f"%{term}%"
            conds.append(or_(
                Article.title.ilike(like), Article.author.has(User.username.ilike(like)),
                Article.category.has(Category.name.ilike(like)),
            ))
        stmt = select(Article).where(*conds).order_by(Article.created_at.desc())
        return list((await self.db.scalars(stmt)).unique().all())

    # ---- writes ----------------------------------------------------------------------------
    async def _slug(self, title: str, exclude_id: uuid.UUID | None = None) -> str:
        base = slugify(title, "article")[:190]
        slug, n = base, 1
        while await self.db.scalar(
            select(Article.id).where(Article.slug == slug, Article.id != exclude_id)
        ) is not None:
            slug, n = f"{base}-{n}", n + 1
        return slug

    async def _category(self, ref: str) -> Category:
        category = await self.categories.get_by_ref(ref)
        if category is None:
            raise APIException(400, f"Category '{ref}' does not exist.")
        return category

    async def _tags(self, names: list[str]) -> list[Tag]:
        tags = []
        for name in dict.fromkeys(n.strip() for n in names if n.strip()):
            tag = await self.db.scalar(select(Tag).where(func.lower(Tag.name) == name.lower()))
            if tag is None:
                tag = Tag(name=name[:50])
                self.db.add(tag)
            tags.append(tag)
        return tags

    async def create(self, data: Create, author: User) -> Article:
        values = data.model_dump(exclude={"category", "tags"})
        article = Article(
            **values, author=author, category=await self._category(data.category),
            tags=await self._tags(data.tags), slug=await self._slug(data.title),
        )
        if article.status == "published" and article.published_at is None:
            article.published_at = datetime.now(timezone.utc)
        self.db.add(article)
        await self.db.commit()
        return article

    async def update(self, article: Article, data: Update) -> Article:
        values = data.model_dump(exclude_unset=True)
        if values.get("category") is not None:
            article.category = await self._category(values["category"])
        if values.get("tags") is not None:
            article.tags = await self._tags(values["tags"])
        values.pop("category", None)
        values.pop("tags", None)
        for key, value in values.items():
            if value is not None or key in ("image", "published_at"):  # these may be cleared
                setattr(article, key, value)
        if article.status == "published" and article.published_at is None:
            article.published_at = datetime.now(timezone.utc)
        await self.db.commit()
        await self.db.refresh(article)
        return article

    async def delete(self, article: Article) -> None:
        await self.db.delete(article)
        await self.db.commit()
