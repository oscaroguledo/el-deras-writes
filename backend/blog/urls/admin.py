from django.urls import path, include
from rest_framework.routers import DefaultRouter
from ..views import (
    AdminArticleViewSet, AdminCommentViewSet, AdminUserViewSet, 
    AdminFeedbackViewSet, AdminDashboardView
)

# Admin router
admin_router = DefaultRouter()
admin_router.register(r'articles', AdminArticleViewSet, basename='admin-articles')
admin_router.register(r'comments', AdminCommentViewSet, basename='admin-comments')
admin_router.register(r'users', AdminUserViewSet, basename='admin-users')
admin_router.register(r'feedback', AdminFeedbackViewSet, basename='admin-feedback')

admin_urlpatterns = [
    # Router URLs
    path('', include(admin_router.urls)),
    
    # Dashboard
    path('dashboard/', AdminDashboardView.as_view(), name='admin-dashboard'),
]