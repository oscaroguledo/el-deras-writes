from django.urls import path
from .views import SocialMediaLinksView, ContactInfoView

urlpatterns = [
    path('social-media/', SocialMediaLinksView.as_view(), name='social-media-links'),
    path('contact-info/', ContactInfoView.as_view(), name='contact-info'),
]