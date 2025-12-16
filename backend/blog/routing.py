"""
WebSocket routing configuration for Django Channels
"""

from django.urls import re_path
from . import consumers

websocket_urlpatterns = [
    # General blog updates WebSocket
    re_path(r'ws/blog/$', consumers.BlogConsumer.as_asgi()),
    
    # User-specific notifications WebSocket
    re_path(r'ws/notifications/(?P<user_id>[0-9a-f-]+)/$', consumers.NotificationConsumer.as_asgi()),
]