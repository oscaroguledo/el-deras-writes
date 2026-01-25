from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from ..views import TokenView, CreateUserView

auth_urlpatterns = [
    path('token/', TokenView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('create-user/', CreateUserView.as_view(), name='create_user'),
]