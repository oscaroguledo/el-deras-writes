from __future__ import annotations

import uuid

from sqlalchemy import delete, func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from core.exceptions import APIException
from models.content.article import Article, article_tags
from models.content.tag import Tag
from schemas.content.tag import Create


class TagService:
    def __init__(self, db: AsyncSession):
        self.db = db

    def _with_counts(self):
        return (
            select(Tag, func.count(Article.id))
            .outerjoin(article_tags, article_tags.c.tag_id == Tag.id)
            .outerjoin(
                Article, (Article.id == article_tags.c.article_id) & (Article.status == "published")
            )
            .group_by(Tag.id)
        )

    async def get(self, tag_id: uuid.UUID) -> Tag | None:
        return await self.db.get(Tag, tag_id)

    async def count(self, tag: Tag) -> int:
        return (await self.db.execute(self._with_counts().where(Tag.id == tag.id))).one()[1]

    async def list(self, search: str | None = None) -> list[tuple[Tag, int]]:
        stmt = self._with_counts().order_by(Tag.name)
        if search:
            stmt = stmt.where(Tag.name.ilike(f"%{search}%"))
        return [(t, n) for t, n in await self.db.execute(stmt)]

    async def popular(self, limit: int = 20) -> list[tuple[Tag, int]]:
        stmt = self._with_counts().order_by(func.count(Article.id).desc(), Tag.name).limit(limit)
        return [(t, n) for t, n in await self.db.execute(stmt)]

    async def _commit(self) -> None:
        try:
            await self.db.commit()
        except IntegrityError:
            await self.db.rollback()
            raise APIException(400, "A tag with this name already exists.") from None

    async def create(self, data: Create) -> Tag:
        tag = Tag(name=data.name)
        self.db.add(tag)
        await self._commit()
        return tag

    async def rename(self, tag: Tag, data: Create) -> Tag:
        tag.name = data.name
        await self._commit()
        return tag

    async def delete(self, tag: Tag) -> None:
        await self.db.execute(delete(article_tags).where(article_tags.c.tag_id == tag.id))
        await self.db.delete(tag)
        await self.db.commit()

    async def articles(self, tag: Tag) -> list[Article]:
        stmt = (
            select(Article)
            .where(Article.status == "published", Article.tags.any(Tag.id == tag.id))
            .order_by(Article.created_at.desc())
        )
        return list((await self.db.scalars(stmt)).unique().all())
