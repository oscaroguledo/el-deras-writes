from .article import admin_router as admin_articles_router
from .article import router as articles_router
from .category import router as category_router
from .comment import admin_router as admin_comments_router
from .comment import router as comments_router
from .tag import router as tag_router

__all__ = [
    "articles_router", "admin_articles_router", "comments_router", "admin_comments_router",
    "category_router", "tag_router",
]
