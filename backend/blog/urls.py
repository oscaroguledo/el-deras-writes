from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ArticleViewSet, 
    CommentViewSet, 
    CategoryViewSet, 
    TagViewSet, 
    CustomUserViewSet,
    AdminDashboardViewSet, 
    AdminArticleViewSet, 
    AdminCommentViewSet, 
    AdminCategoryViewSet, 
    AdminTagViewSet, 
    AdminUserViewSet)

router = DefaultRouter()
router.register(r'articles', ArticleViewSet)
router.register(r'comments', CommentViewSet)
router.register(r'categories', CategoryViewSet)
router.register(r'tags', TagViewSet)
router.register(r'users', CustomUserViewSet)
router.register(r'admin/dashbaord', AdminDashboardViewSet)
router.register(r'admin/articles', AdminArticleViewSet)
router.register(r'admin/comments', AdminCommentViewSet)
router.register(r'admin/categories', AdminCategoryViewSet)
router.register(r'admin/tags', AdminTagViewSet)
router.register(r'admin/users', AdminUserViewSet)
urlpatterns = [
    path('', include(router.urls)),
]