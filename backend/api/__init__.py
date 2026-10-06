from .accounts import admin_users_router, auth_router
from .analytics import analytics_router
from .content import (
    admin_articles_router, admin_comments_router, articles_router, category_router,
    comments_router, tag_router,
)
from .system import admin_feedback_router, health_router, system_router

__all__ = [
    "auth_router", "admin_users_router",
    "articles_router", "admin_articles_router", "comments_router", "admin_comments_router",
    "category_router", "tag_router",
    "system_router", "admin_feedback_router", "health_router",
    "analytics_router",
]
