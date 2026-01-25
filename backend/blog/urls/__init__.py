# Main URL configuration
from django.urls import path, include
from .api import api_urlpatterns
from .auth import auth_urlpatterns
from .admin import admin_urlpatterns

urlpatterns = [
    # API endpoints
    path('api/', include(api_urlpatterns)),
    
    # Authentication endpoints
    path('auth/', include(auth_urlpatterns)),
    
    # Admin endpoints
    path('admin-api/', include(admin_urlpatterns)),
]