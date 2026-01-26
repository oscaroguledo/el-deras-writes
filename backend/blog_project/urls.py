"""
URL configuration for blog_project project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
# from django.contrib import admin
from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import TokenRefreshView
from blog.views import MyTokenObtainPairView, SuperuserCreateView
# from blog.jwt_views import (
#     EnhancedTokenObtainPairView,
#     EnhancedTokenRefreshView,
#     TokenValidationView,
#     LogoutView,
#     UserSessionsView,
#     revoke_token
# )

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', include('blog.urls')),
    # Enhanced JWT endpoints
    # path('auth/login/', EnhancedTokenObtainPairView.as_view(), name='enhanced_token_obtain_pair'),
    # path('auth/refresh/', EnhancedTokenRefreshView.as_view(), name='enhanced_token_refresh'),
    # path('auth/validate/', TokenValidationView.as_view(), name='token_validate'),
    # path('auth/logout/', LogoutView.as_view(), name='logout'),
    # path('auth/revoke/', revoke_token, name='revoke_token'),
    # path('auth/sessions/', UserSessionsView.as_view(), name='user_sessions'),
    
    # Legacy JWT endpoints (for backward compatibility)
    path('token/', MyTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    path('create-superuser/', SuperuserCreateView.as_view(), name='create_superuser'),
]
