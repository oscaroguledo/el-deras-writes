from django.urls import path, include
from rest_framework.routers import DefaultRouter
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
    ContactInfoView,
    IncrementVisitorCountView
)

router = DefaultRouter()
router.register(r'articles', ArticleViewSet)
router.register(r'comments', CommentViewSet)
router.register(r'categories', CategoryViewSet)
router.register(r'tags', TagViewSet)
router.register(r'users', CustomUserViewSet),
router.register(r'admin/articles', AdminArticleViewSet, basename='admin-article')
router.register(r'admin/comments', AdminCommentViewSet, basename='admin-comment')
router.register(r'admin/categories', AdminCategoryViewSet, basename='admin-category')
router.register(r'admin/tags', AdminTagViewSet, basename='admin-tag')
router.register(r'admin/users', AdminUserViewSet, basename='admin-user')
urlpatterns = [
    path('', include(router.urls)),
    path('contact-info/', ContactInfoView.as_view(), name='contact-info'),
    path('visitor-count/increment/', IncrementVisitorCountView.as_view(), name='increment-visitor-count'),
]