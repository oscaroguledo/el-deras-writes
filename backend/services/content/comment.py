from __future__ import annotations

import uuid

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from core.utils.text import parse_uuid, search_terms
from models.accounts.user import User
from models.content.article import Article
from models.content.comment import Comment
from schemas.content.comment import Create, Update


class CommentService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get(self, comment_id: uuid.UUID) -> Comment | None:
        return (
            await self.db.scalars(select(Comment).where(Comment.id == comment_id))
        ).unique().one_or_none()

    async def for_article(self, article: Article, staff: bool) -> list[Comment]:
        stmt = select(Comment).where(Comment.article_id == article.id, Comment.parent_id.is_(None))
        if not staff:
            stmt = stmt.where(Comment.approved.is_(True))
        return list((await self.db.scalars(stmt.order_by(Comment.created_at))).unique().all())

    async def create(self, article: Article, data: Create, author: User | None) -> Comment:
        parent = None
        if data.parent:  # unknown parent: fall back to a top-level comment
            parent = await self.db.scalar(
                select(Comment).where(Comment.id == data.parent, Comment.article_id == article.id)
            )
        comment = Comment(
            content=data.content, article_id=article.id, author_id=author.id if author else None,
            parent_id=parent.id if parent else None, approved=True,
        )
        self.db.add(comment)
        await self.db.commit()
        return await self.get(comment.id)

    async def list(
        self, page: int, limit: int, search: str | None = None, approved: bool | None = None,
        is_flagged: bool | None = None, article: str | None = None,
    ) -> tuple[list[Comment], int]:
        conds = []
        for term in search_terms(search):
            like = f"%{term}%"
            conds.append(
                Comment.content.ilike(like)
                | Comment.author.has(User.username.ilike(like))
                | Comment.article.has(Article.title.ilike(like))
            )
        if approved is not None:
            conds.append(Comment.approved == approved)
        if is_flagged is not None:
            conds.append(Comment.is_flagged == is_flagged)
        if article:
            as_id = parse_uuid(article)
            conds.append(Comment.article_id == (as_id or uuid.UUID(int=0)))
        total = await self.db.scalar(select(func.count(Comment.id)).where(*conds)) or 0
        stmt = (
            select(Comment).where(*conds).order_by(Comment.created_at.desc())
            .limit(limit).offset((page - 1) * limit)
        )
        return list((await self.db.scalars(stmt)).unique().all()), total

    async def update(self, comment: Comment, data: Update) -> Comment:
        for key, value in data.model_dump(exclude_none=True).items():
            setattr(comment, key, value)
        await self.db.commit()
        return comment

    async def delete(self, comment: Comment) -> None:
        await self.db.delete(comment)
        await self.db.commit()
