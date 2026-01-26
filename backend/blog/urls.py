from django.urls import path, include

# Import URL patterns from the urls package
from blog.urls.api import api_urlpatterns
from blog.urls.auth import auth_urlpatterns  
from blog.urls.admin import admin_urlpatterns

urlpatterns = [
    # API endpoints - remove the extra 'api/' prefix
    path('', include(api_urlpatterns)),
    
    # Authentication endpoints
    path('auth/', include(auth_urlpatterns)),
    
    # Admin endpoints
    path('admin-api/', include(admin_urlpatterns)),
]