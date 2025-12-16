"""
WebSocket consumers for real-time functionality
"""

import json
import logging
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth.models import AnonymousUser
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import AccessToken
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError

logger = logging.getLogger(__name__)
User = get_user_model()


class BlogConsumer(AsyncWebsocketConsumer):
    """Enhanced WebSocket consumer for real-time blog updates"""
    
    async def connect(self):
        """Handle WebSocket connection with authentication"""
        # Extract token from query string or headers
        token = self.get_token_from_request()
        
        # Authenticate user
        self.user = await self.authenticate_user(token)
        
        # Set up room groups
        self.general_room = 'blog_updates'
        self.user_room = f'user_{self.user.id}' if self.user and self.user.is_authenticated else None
        self.admin_room = 'admin_updates' if self.user and self.user.is_staff else None
        
        # Join general room
        await self.channel_layer.group_add(
            self.general_room,
            self.channel_name
        )
        
        # Join user-specific room if authenticated
        if self.user_room:
            await self.channel_layer.group_add(
                self.user_room,
                self.channel_name
            )
        
        # Join admin room if admin
        if self.admin_room:
            await self.channel_layer.group_add(
                self.admin_room,
                self.channel_name
            )
        
        await self.accept()
        
        # Send connection confirmation
        await self.send(text_data=json.dumps({
            'type': 'connection_established',
            'user_id': str(self.user.id) if self.user and self.user.is_authenticated else None,
            'is_authenticated': self.user.is_authenticated if self.user else False,
            'is_admin': self.user.is_staff if self.user else False,
            'timestamp': self.get_current_timestamp()
        }))
        
        logger.info(f"WebSocket connected: user={self.user}, rooms={[self.general_room, self.user_room, self.admin_room]}")

    async def disconnect(self, close_code):
        """Handle WebSocket disconnection"""
        # Leave all room groups
        await self.channel_layer.group_discard(
            self.general_room,
            self.channel_name
        )
        
        if self.user_room:
            await self.channel_layer.group_discard(
                self.user_room,
                self.channel_name
            )
        
        if self.admin_room:
            await self.channel_layer.group_discard(
                self.admin_room,
                self.channel_name
            )
        
        logger.info(f"WebSocket disconnected: user={self.user}, close_code={close_code}")

    async def receive(self, text_data):
        """Handle messages from WebSocket"""
        try:
            data = json.loads(text_data)
            message_type = data.get('type', 'ping')
            
            if message_type == 'ping':
                # Handle ping/pong for connection health
                await self.send(text_data=json.dumps({
                    'type': 'pong',
                    'timestamp': self.get_current_timestamp()
                }))
            elif message_type == 'subscribe':
                # Handle subscription to specific events
                await self.handle_subscription(data)
            elif message_type == 'unsubscribe':
                # Handle unsubscription from events
                await self.handle_unsubscription(data)
            else:
                # Handle other message types
                await self.handle_custom_message(data)
                
        except json.JSONDecodeError:
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': 'Invalid JSON format',
                'timestamp': self.get_current_timestamp()
            }))
        except Exception as e:
            logger.error(f"Error handling WebSocket message: {e}")
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': 'Internal server error',
                'timestamp': self.get_current_timestamp()
            }))

    async def handle_subscription(self, data):
        """Handle subscription to specific event types"""
        event_types = data.get('events', [])
        
        # Store subscriptions in connection state
        if not hasattr(self, 'subscriptions'):
            self.subscriptions = set()
        
        for event_type in event_types:
            if event_type in ['article_created', 'article_updated', 'comment_created', 'user_authenticated', 'admin_action']:
                self.subscriptions.add(event_type)
        
        await self.send(text_data=json.dumps({
            'type': 'subscription_confirmed',
            'subscribed_events': list(self.subscriptions),
            'timestamp': self.get_current_timestamp()
        }))

    async def handle_unsubscription(self, data):
        """Handle unsubscription from specific event types"""
        event_types = data.get('events', [])
        
        if hasattr(self, 'subscriptions'):
            for event_type in event_types:
                self.subscriptions.discard(event_type)
        
        await self.send(text_data=json.dumps({
            'type': 'unsubscription_confirmed',
            'remaining_events': list(getattr(self, 'subscriptions', [])),
            'timestamp': self.get_current_timestamp()
        }))

    async def handle_custom_message(self, data):
        """Handle custom message types"""
        # For now, just echo back with confirmation
        await self.send(text_data=json.dumps({
            'type': 'message_received',
            'original_type': data.get('type'),
            'timestamp': self.get_current_timestamp()
        }))

    # Event handlers for different types of real-time updates
    
    async def article_created(self, event):
        """Handle article creation notifications"""
        if self.should_send_event('article_created'):
            await self.send(text_data=json.dumps({
                'type': 'article_created',
                'article': event['article'],
                'timestamp': event.get('timestamp', self.get_current_timestamp())
            }))

    async def article_updated(self, event):
        """Handle article update notifications"""
        if self.should_send_event('article_updated'):
            await self.send(text_data=json.dumps({
                'type': 'article_updated',
                'article': event['article'],
                'changes': event.get('changes', {}),
                'timestamp': event.get('timestamp', self.get_current_timestamp())
            }))

    async def comment_created(self, event):
        """Handle comment creation notifications"""
        if self.should_send_event('comment_created'):
            await self.send(text_data=json.dumps({
                'type': 'comment_created',
                'comment': event['comment'],
                'article_id': event.get('article_id'),
                'timestamp': event.get('timestamp', self.get_current_timestamp())
            }))

    async def user_authenticated(self, event):
        """Handle user authentication state changes"""
        if self.should_send_event('user_authenticated'):
            await self.send(text_data=json.dumps({
                'type': 'user_authenticated',
                'user': event['user'],
                'action': event.get('action', 'login'),  # login/logout
                'timestamp': event.get('timestamp', self.get_current_timestamp())
            }))

    async def admin_action(self, event):
        """Handle admin action notifications"""
        if self.should_send_event('admin_action') and self.user and self.user.is_staff:
            await self.send(text_data=json.dumps({
                'type': 'admin_action',
                'action': event['action'],
                'target': event.get('target'),
                'admin_user': event.get('admin_user'),
                'timestamp': event.get('timestamp', self.get_current_timestamp())
            }))

    async def content_moderated(self, event):
        """Handle content moderation notifications"""
        if self.should_send_event('content_moderated'):
            await self.send(text_data=json.dumps({
                'type': 'content_moderated',
                'content_type': event['content_type'],
                'content_id': event['content_id'],
                'action': event['action'],
                'moderator': event.get('moderator'),
                'timestamp': event.get('timestamp', self.get_current_timestamp())
            }))

    # Helper methods
    
    def get_token_from_request(self):
        """Extract JWT token from WebSocket request"""
        # Try to get token from query parameters
        query_string = self.scope.get('query_string', b'').decode()
        if 'token=' in query_string:
            for param in query_string.split('&'):
                if param.startswith('token='):
                    return param.split('=', 1)[1]
        
        # Try to get token from headers (if available)
        headers = dict(self.scope.get('headers', []))
        auth_header = headers.get(b'authorization', b'').decode()
        if auth_header.startswith('Bearer '):
            return auth_header[7:]
        
        return None

    @database_sync_to_async
    def authenticate_user(self, token):
        """Authenticate user using JWT token"""
        if not token:
            return AnonymousUser()
        
        try:
            # Validate JWT token
            access_token = AccessToken(token)
            user_id = access_token['user_id']
            
            # Get user from database
            user = User.objects.get(id=user_id)
            return user
            
        except (InvalidToken, TokenError, User.DoesNotExist) as e:
            logger.warning(f"WebSocket authentication failed: {e}")
            return AnonymousUser()

    def should_send_event(self, event_type):
        """Check if this connection should receive the event"""
        # Check if user is subscribed to this event type
        if hasattr(self, 'subscriptions') and event_type not in self.subscriptions:
            return False
        
        # Default to sending all events if no specific subscriptions
        return True

    def get_current_timestamp(self):
        """Get current timestamp in ISO format"""
        from django.utils import timezone
        return timezone.now().isoformat()


class NotificationConsumer(AsyncWebsocketConsumer):
    """Specialized consumer for user notifications"""
    
    async def connect(self):
        """Handle connection for user notifications"""
        # Get user ID from URL route
        self.user_id = self.scope['url_route']['kwargs'].get('user_id')
        
        if not self.user_id:
            await self.close()
            return
        
        # Authenticate user
        token = self.get_token_from_request()
        self.user = await self.authenticate_user(token)
        
        # Verify user can access this notification channel
        if not self.user.is_authenticated or str(self.user.id) != self.user_id:
            await self.close()
            return
        
        # Join user-specific notification room
        self.room_group_name = f'notifications_{self.user_id}'
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        
        await self.accept()
        
        # Send unread notifications count
        unread_count = await self.get_unread_notifications_count()
        await self.send(text_data=json.dumps({
            'type': 'unread_count',
            'count': unread_count,
            'timestamp': self.get_current_timestamp()
        }))

    async def disconnect(self, close_code):
        """Handle disconnection"""
        if hasattr(self, 'room_group_name'):
            await self.channel_layer.group_discard(
                self.room_group_name,
                self.channel_name
            )

    async def receive(self, text_data):
        """Handle incoming messages"""
        try:
            data = json.loads(text_data)
            message_type = data.get('type')
            
            if message_type == 'mark_read':
                # Mark notifications as read
                notification_ids = data.get('notification_ids', [])
                await self.mark_notifications_read(notification_ids)
                
                await self.send(text_data=json.dumps({
                    'type': 'notifications_marked_read',
                    'count': len(notification_ids),
                    'timestamp': self.get_current_timestamp()
                }))
                
        except json.JSONDecodeError:
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': 'Invalid JSON format'
            }))

    async def notification(self, event):
        """Send notification to user"""
        await self.send(text_data=json.dumps({
            'type': 'notification',
            'notification': event['notification'],
            'timestamp': event.get('timestamp', self.get_current_timestamp())
        }))

    # Helper methods (similar to BlogConsumer)
    def get_token_from_request(self):
        """Extract JWT token from WebSocket request"""
        query_string = self.scope.get('query_string', b'').decode()
        if 'token=' in query_string:
            for param in query_string.split('&'):
                if param.startswith('token='):
                    return param.split('=', 1)[1]
        return None

    @database_sync_to_async
    def authenticate_user(self, token):
        """Authenticate user using JWT token"""
        if not token:
            return AnonymousUser()
        
        try:
            access_token = AccessToken(token)
            user_id = access_token['user_id']
            user = User.objects.get(id=user_id)
            return user
        except (InvalidToken, TokenError, User.DoesNotExist):
            return AnonymousUser()

    @database_sync_to_async
    def get_unread_notifications_count(self):
        """Get count of unread notifications for user"""
        # This would integrate with a notification system
        # For now, return 0 as placeholder
        return 0

    @database_sync_to_async
    def mark_notifications_read(self, notification_ids):
        """Mark notifications as read"""
        # This would integrate with a notification system
        # For now, just log the action
        logger.info(f"Marking notifications as read: {notification_ids}")

    def get_current_timestamp(self):
        """Get current timestamp in ISO format"""
        from django.utils import timezone
        return timezone.now().isoformat()

class CommentConsumer(AsyncWebsocketConsumer):
    """WebSocket consumer for real-time comment updates for a specific article"""
    
    async def connect(self):
        self.article_id = self.scope['url_route']['kwargs']['article_id']
        self.room_group_name = f'comments_{self.article_id}'

        # Join room group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )

        await self.accept()
        logger.info(f"Comment WebSocket connected for article {self.article_id}")

    async def disconnect(self, close_code):
        # Leave room group
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )
        logger.info(f"Comment WebSocket disconnected for article {self.article_id}")

    async def receive(self, text_data):
        # We don't expect to receive messages from the client for now
        pass

    async def comment_created(self, event):
        """Receive message from room group when a comment is created"""
        await self.send(text_data=json.dumps({
            'type': 'comment_created',
            'comment': event['comment'],
            'article_id': event['article_id'],
            'timestamp': event.get('timestamp', self.get_current_timestamp())
        }))

    def get_current_timestamp(self):
        """Get current timestamp in ISO format"""
        from django.utils import timezone
        return timezone.now().isoformat()