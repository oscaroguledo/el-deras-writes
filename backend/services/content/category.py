from __future__ import annotations

import uuid

from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from core.exceptions import APIException
from core.logging import get_logger
from core.utils.text import parse_uuid, slugify
from models.content.article import Article
from models.content.category import Category
from schemas.content.category import Create, Update

logger = get_logger(__name__)

# (section name, slug, [(sub-section name, slug), ...])
DEFAULT_SECTIONS = [
    ("Books", "books", [
        ("Christian Non-Fiction Books", "christian-non-fiction-books"),
        ("Children's Bible Stories", "childrens-bible-stories"),
    ]),
    ("Every Word Series", "every-word-series", [
        ("Teaching Series", "teaching-series"),
        ("Questions Young People Ask!", "questions-young-people-ask"),
    ]),
    ("Health and Healing", "health-and-healing", [
        ("Health Education", "health-education"),
        ("Health and Fitness Equipment", "health-and-fitness-equipment"),
    ]),
]


class CategoryService:
    def __init__(self, db: AsyncSession):
        self.db = db

    # ---- lookup ----------------------------------------------------------------------------
    async def get(self, category_id: uuid.UUID) -> Category | None:
        return await self.db.get(Category, category_id)

    async def get_by_ref(self, ref: str) -> Category | None:
        """Find a category by id, slug, or (case-insensitive) name."""
        as_id = parse_uuid(ref)
        if as_id is not None:
            return await self.get(as_id)
        return await self.db.scalar(
            select(Category).where(
                (Category.slug == ref) | (func.lower(Category.name) == ref.lower())
            )
        )

    async def ids_for(self, ref: str) -> list[uuid.UUID]:
        """The category's id plus those of everything beneath it; empty if `ref` is unknown."""
        category = await self.get_by_ref(ref)
        if category is None:
            return []
        ids, frontier = [category.id], [category.id]
        while frontier:
            frontier = list(
                await self.db.scalars(select(Category.id).where(Category.parent_id.in_(frontier)))
            )
            ids.extend(frontier)
        return ids

    # ---- listing ---------------------------------------------------------------------------
    async def _all(self, active_only: bool = False) -> list[Category]:
        stmt = select(Category).order_by(Category.sort_order, Category.name)
        if active_only:
            stmt = stmt.where(Category.is_active.is_(True))
        return list((await self.db.scalars(stmt)).all())

    async def _totals(self, categories: list[Category]) -> dict[uuid.UUID, int]:
        """Published-article count per category, rolled up so a section includes its sub-sections."""
        own = dict(
            (
                await self.db.execute(
                    select(Article.category_id, func.count(Article.id))
                    .where(Article.status == "published")
                    .group_by(Article.category_id)
                )
            ).all()
        )
        children: dict[uuid.UUID, list[uuid.UUID]] = {}
        for c in categories:
            if c.parent_id:
                children.setdefault(c.parent_id, []).append(c.id)

        def total(cid: uuid.UUID) -> int:
            return own.get(cid, 0) + sum(total(k) for k in children.get(cid, []))

        return {c.id: total(c.id) for c in categories}

    async def list(
        self, parent: str | None = None, top_level: bool = False, search: str | None = None,
        active_only: bool = False,
    ) -> list[tuple[Category, int]]:
        cats = await self._all(active_only)
        totals = await self._totals(cats)
        if parent:
            parent_cat = await self.get_by_ref(parent)
            cats = [c for c in cats if parent_cat and c.parent_id == parent_cat.id]
        if top_level:
            cats = [c for c in cats if c.parent_id is None]
        if search:
            cats = [c for c in cats if search.lower() in c.name.lower()]
        return [(c, totals[c.id]) for c in cats]

    async def tree(self, active_only: bool = False) -> list[tuple[Category, int, list]]:
        """Top-level sections, each as (category, total, [(child, total, []), ...])."""
        cats = await self._all(active_only)
        totals = await self._totals(cats)

        def node(c: Category):
            return (c, totals[c.id], [node(k) for k in cats if k.parent_id == c.id])

        return [node(c) for c in cats if c.parent_id is None]

    async def with_total(self, category: Category) -> tuple[Category, int]:
        totals = await self._totals(await self._all())
        return category, totals.get(category.id, 0)

    # ---- writes ----------------------------------------------------------------------------
    async def _resolve_parent(self, ref: str | None, self_id: uuid.UUID | None = None):
        if not ref:
            return None
        parent = await self.get_by_ref(ref)
        if parent is None:
            raise APIException(400, f"Parent category '{ref}' does not exist.")
        if parent.parent_id is not None:
            raise APIException(400, "Categories nest only two levels deep.")
        if self_id is not None and parent.id == self_id:
            raise APIException(400, "A category cannot be its own parent.")
        return parent

    async def _commit(self) -> None:
        try:
            await self.db.commit()
        except IntegrityError:
            await self.db.rollback()
            raise APIException(400, "A category with this name or slug already exists.") from None

    async def create(self, data: Create) -> Category:
        parent = await self._resolve_parent(data.parent)
        category = Category(
            name=data.name, slug=slugify(data.slug or data.name, "category"),
            description=data.description, parent_id=parent.id if parent else None,
            sort_order=data.sort_order, is_active=data.is_active,
        )
        self.db.add(category)
        await self._commit()
        return category

    async def update(self, category: Category, data: Update) -> Category:
        values = data.model_dump(exclude_unset=True)
        if "parent" in values:
            ref = values.pop("parent")
            parent = await self._resolve_parent(ref, category.id)
            if parent and await self.db.scalar(
                select(func.count()).select_from(Category).where(Category.parent_id == category.id)
            ):
                raise APIException(400, "A section that has sub-sections cannot become a sub-section.")
            category.parent_id = parent.id if parent else None
        if values.get("slug"):
            values["slug"] = slugify(values["slug"], "category")
        for key, value in values.items():
            if value is not None:
                setattr(category, key, value)
        await self._commit()
        return category

    async def delete(self, category: Category) -> None:
        if await self.db.scalar(
            select(func.count()).select_from(Article).where(Article.category_id == category.id)
        ):
            raise APIException(409, "Cannot delete a category that still has articles.")
        if await self.db.scalar(
            select(func.count()).select_from(Category).where(Category.parent_id == category.id)
        ):
            raise APIException(409, "Cannot delete a category that still has sub-sections.")
        await self.db.delete(category)
        await self.db.commit()

    async def articles(self, category: Category) -> list[Article]:
        ids = await self.ids_for(str(category.id))
        stmt = (
            select(Article)
            .where(Article.status == "published", Article.category_id.in_(ids))
            .order_by(Article.created_at.desc())
        )
        return list((await self.db.scalars(stmt)).unique().all())

    # ---- defaults --------------------------------------------------------------------------
    async def ensure_defaults(self) -> None:
        """Idempotently create the site's sections (Books, Every Word Series, Health and Healing)
        and their sub-sections, adopting same-named categories that already exist."""

        async def ensure(name: str, slug: str, parent_id, order: int) -> Category:
            existing = await self.db.scalar(
                select(Category).where((Category.slug == slug) | (func.lower(Category.name) == name.lower()))
            )
            if existing is None:
                existing = Category(name=name, slug=slug, parent_id=parent_id, sort_order=order)
                self.db.add(existing)
                await self.db.flush()
            elif parent_id is not None and existing.parent_id is None:
                existing.parent_id = parent_id
            return existing

        for i, (name, slug, subs) in enumerate(DEFAULT_SECTIONS):
            section = await ensure(name, slug, None, i)
            for j, (sub_name, sub_slug) in enumerate(subs):
                await ensure(sub_name, sub_slug, section.id, j)
        await self.db.commit()
