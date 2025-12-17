from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_nested.routers import NestedDefaultRouter
from .views import (
    ArticleViewSet,
    CommentViewSet,
    CategoryViewSet,
    TagViewSet,
    CustomUserViewSet,
    AdminArticleViewSet,
    AdminCommentViewSet,
    AdminCategoryViewSet,
    AdminTagViewSet,
    AdminUserViewSet,
    AdminAnalyticsViewSet,
    ContactInfoView,
    IncrementVisitorCountView,
    AdminDashboardView,
    AdminSearchView,
    FeedbackViewSet,
    AdminFeedbackViewSet,
    SuperuserCreateView,
    FileUploadView,
    AnalyticsView,
)
from .frontend_api_views import (
    FrontendStateAPIView,
    FrontendValidationAPIView,
    FrontendAuthContextAPIView,
    FrontendConflictResolutionAPIView,
    FrontendAnalyticsAPIView,
)

router = DefaultRouter()
router.register(r'articles', ArticleViewSet)
router.register(r'categories', CategoryViewSet)
router.register(r'tags', TagViewSet)
router.register(r'users', CustomUserViewSet)
router.register(r'feedback', FeedbackViewSet) # Register FeedbackViewSet
router.register(r'admin/articles', AdminArticleViewSet, basename='admin-article')
router.register(r'admin/comments', AdminCommentViewSet, basename='admin-comment')
router.register(r'admin/categories', AdminCategoryViewSet, basename='admin-category')
router.register(r'admin/tags', AdminTagViewSet, basename='admin-tag')
router.register(r'admin/users', AdminUserViewSet, basename='admin-user')
router.register(r'admin/feedback', AdminFeedbackViewSet, basename='admin-feedback') # Register AdminFeedbackViewSet
router.register(r'admin/analytics', AdminAnalyticsViewSet, basename='admin-analytics')

articles_router = NestedDefaultRouter(router, r'articles', lookup='article')
articles_router.register(r'comments', CommentViewSet, basename='article-comments')

urlpatterns = [
    path('', include(router.urls)),
    path('', include(articles_router.urls)),
    path('contact-info/', ContactInfoView.as_view(), name='contact-info'),
    path('visitor-count/increment/', IncrementVisitorCountView.as_view(), name='increment-visitor-count'),
    path('admin/', AdminDashboardView.as_view(), name='admin-dashboard'),
    path('admin/search/', AdminSearchView.as_view(), name='admin-search'),
    path('create-superuser/', SuperuserCreateView.as_view(), name='create-superuser'),
    path('upload/', FileUploadView.as_view(), name='file-upload'),
    path('analytics/', AnalyticsView.as_view(), name='analytics'),
    
    # Frontend-optimized API endpoints
    path('frontend/state/', FrontendStateAPIView.as_view(), name='frontend-state'),
    path('frontend/validate/', FrontendValidationAPIView.as_view(), name='frontend-validate'),
    path('frontend/auth-context/', FrontendAuthContextAPIView.as_view(), name='frontend-auth-context'),
    path('frontend/conflict-resolution/', FrontendConflictResolutionAPIView.as_view(), name='frontend-conflict-resolution'),
    path('frontend/analytics/', FrontendAnalyticsAPIView.as_view(), name='frontend-analytics'),
]