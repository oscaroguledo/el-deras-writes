from django.urls import path
from .views import SocialMediaLinksView

urlpatterns = [
    path('social-media/', SocialMediaLinksView.as_view(), name='social-media-links'),
]