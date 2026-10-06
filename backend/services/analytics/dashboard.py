from datetime import timedelta

from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from core.db import utcnow
from models.accounts.user import User
from models.content import Article, Category, Comment, Tag
from models.system import Visit, VisitorCount
from schemas.accounts.user import Response as UserResponse
from schemas.content.article import Response as ArticleResponse
from schemas.content.category import Response as CategoryResponse
from schemas.content.comment import Response as CommentResponse
from schemas.content.tag import Response as TagResponse


def _dump(model) -> dict:
    return model.model_dump(mode="json")


class DashboardService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def _n(self, stmt) -> int:
        return await self.db.scalar(stmt) or 0

    async def _rows(self, stmt):
        return (await self.db.scalars(stmt)).unique().all()

    async def data(self) -> dict:
        now = utcnow()
        week_ago = now - timedelta(days=7)
        visitor = await self.db.scalar(select(VisitorCount).limit(1))
        total_articles = await self._n(select(func.count(Article.id)))
        total_comments = await self._n(select(func.count(Comment.id)))

        comment_count = (
            select(func.count(Comment.id)).where(Comment.article_id == Article.id)
            .correlate(Article).scalar_subquery()
        )
        liked = (
            await self.db.execute(
                select(Article, comment_count).where(Article.status == "published")
                .order_by(comment_count.desc()).limit(5)
            )
        ).unique().all()
        authors = (
            await self.db.execute(
                select(User, func.count(Article.id)).join(Article, Article.author_id == User.id)
                .group_by(User.id).order_by(func.count(Article.id).desc()).limit(5)
            )
        ).all()

        return {
            "total_visitors": visitor.count if visitor else 0,
            "total_articles": total_articles,
            "total_comments": total_comments,
            "total_categories": await self._n(select(func.count(Category.id))),
            "total_tags": await self._n(select(func.count(Tag.id))),
            "pending_comments": await self._n(
                select(func.count(Comment.id)).where(Comment.approved.is_(False))
            ),
            "flagged_comments": await self._n(
                select(func.count(Comment.id)).where(Comment.is_flagged.is_(True))
            ),
            "inactive_users": await self._n(
                select(func.count(User.id)).where(
                    User.is_active.is_(True),
                    or_(User.last_login.is_(None), User.last_login < now - timedelta(days=30)),
                )
            ),
            "weekly_visits": await self._n(
                select(func.sum(Visit.count)).where(Visit.date >= week_ago.date())
            ),
            "articles_this_week": await self._n(
                select(func.count(Article.id)).where(Article.created_at >= week_ago)
            ),
            "comments_this_week": await self._n(
                select(func.count(Comment.id)).where(Comment.created_at >= week_ago)
            ),
            "avg_views_per_article": float(await self._n(select(func.avg(Article.views)))),
            "avg_comments_per_article": total_comments / total_articles if total_articles else 0.0,
            "recent_articles": [
                _dump(ArticleResponse.of(a))
                for a in await self._rows(select(Article).order_by(Article.created_at.desc()).limit(5))
            ],
            "recent_comments": [
                _dump(CommentResponse.of(c))
                for c in await self._rows(select(Comment).order_by(Comment.created_at.desc()).limit(5))
            ],
            "recently_registered_users": [
                _dump(UserResponse.model_validate(u))
                for u in await self._rows(select(User).order_by(User.date_joined.desc()).limit(5))
            ],
            "recent_categories": [
                _dump(CategoryResponse.model_validate(c))
                for c in await self._rows(select(Category).order_by(Category.id.desc()).limit(5))
            ],
            "recent_tags": [
                _dump(TagResponse(id=t.id, name=t.name, created_at=t.created_at))
                for t in await self._rows(select(Tag).order_by(Tag.created_at.desc()).limit(5))
            ],
            "top_authors": [
                {**_dump(UserResponse.model_validate(u)), "total_articles": n} for u, n in authors
            ],
            "most_viewed_articles": [
                _dump(ArticleResponse.of(a))
                for a in await self._rows(
                    select(Article).where(Article.status == "published")
                    .order_by(Article.views.desc()).limit(5)
                )
            ],
            "most_liked_articles": [{**_dump(ArticleResponse.of(a)), "likes": n} for a, n in liked],
        }
