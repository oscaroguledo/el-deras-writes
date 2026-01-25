from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_nested import routers
from ..views import (
    ArticleViewSet, CommentViewSet, CategoryViewSet, 
    TagViewSet, ContactInfoView, VisitorCountView, 
    FeedbackView, HealthView
)

# Main router
router = DefaultRouter()
router.register(r'articles', ArticleViewSet)
router.register(r'categories', CategoryViewSet)
router.register(r'tags', TagViewSet)

# Nested router for comments under articles
articles_router = routers.NestedDefaultRouter(router, r'articles', lookup='article')
articles_router.register(r'comments', CommentViewSet, basename='article-comments')

api_urlpatterns = [
    # Router URLs
    path('', include(router.urls)),
    path('', include(articles_router.urls)),
    
    # Utility endpoints
    path('contact/', ContactInfoView.as_view(), name='contact-info'),
    path('visitor-count/', VisitorCountView.as_view(), name='visitor-count'),
    path('feedback/', FeedbackView.as_view(), name='feedback'),
    path('health/', HealthView.as_view(), name='health-check'),
]