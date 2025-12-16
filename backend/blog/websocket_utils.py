"""
WebSocket utilities for broadcasting real-time events
"""

import json
import logging
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from django.utils import timezone
from typing import Dict, Any, Optional, List

logger = logging.getLogger(__name__)


class WebSocketBroadcaster:
    """Utility class for broadcasting WebSocket events"""
    
    def __init__(self):
        self.channel_layer = get_channel_layer()
    
    def broadcast_to_group(self, group_name: str, event_type: str, data: Dict[str, Any]):
        """Broadcast event to a specific group"""
        if not self.channel_layer:
            logger.warning("Channel layer not configured, skipping WebSocket broadcast")
            return
        
        try:
            async_to_sync(self.channel_layer.group_send)(
                group_name,
                {
                    'type': event_type,
                    **data,
                    'timestamp': timezone.now().isoformat()
                }
            )
            logger.debug(f"Broadcasted {event_type} to group {group_name}")
        except Exception as e:
            logger.error(f"Failed to broadcast {event_type} to group {group_name}: {e}")
    
    def broadcast_article_created(self, article, author):
        """Broadcast article creation event"""
        article_data = {
            'id': str(article.id),
            'title': article.title,
            'slug': article.slug,
            'author': {
                'id': str(author.id),
                'username': author.username,
                'full_name': author.get_full_name()
            },
            'category': {
                'id': str(article.category.id),
                'name': article.category.name
            } if article.category else None,
            'status': article.status,
            'created_at': article.created_at.isoformat(),
            'excerpt': article.excerpt
        }
        
        # Broadcast to general blog updates
        self.broadcast_to_group(
            'blog_updates',
            'article_created',
            {'article': article_data}
        )
        
        # Broadcast to admin updates if published
        if article.status == 'published':
            self.broadcast_to_group(
                'admin_updates',
                'article_created',
                {'article': article_data}
            )
    
    def broadcast_article_updated(self, article, author, changes=None):
        """Broadcast article update event"""
        article_data = {
            'id': str(article.id),
            'title': article.title,
            'slug': article.slug,
            'author': {
                'id': str(author.id),
                'username': author.username,
                'full_name': author.get_full_name()
            },
            'category': {
                'id': str(article.category.id),
                'name': article.category.name
            } if article.category else None,
            'status': article.status,
            'updated_at': article.updated_at.isoformat(),
            'excerpt': article.excerpt
        }
        
        # Broadcast to general blog updates
        self.broadcast_to_group(
            'blog_updates',
            'article_updated',
            {
                'article': article_data,
                'changes': changes or {}
            }
        )
        
        # Broadcast to admin updates
        self.broadcast_to_group(
            'admin_updates',
            'article_updated',
            {
                'article': article_data,
                'changes': changes or {}
            }
        )
    
    def broadcast_comment_created(self, comment):
        """Broadcast comment creation event"""
        comment_data = {
            'id': str(comment.id),
            'content': comment.content,
            'author': {
                'id': str(comment.author.id),
                'username': comment.author.username,
                'full_name': comment.author.get_full_name()
            } if comment.author else None,
            'article': {
                'id': str(comment.article.id),
                'title': comment.article.title,
                'slug': comment.article.slug
            },
            'parent_id': str(comment.parent.id) if comment.parent else None,
            'approved': comment.approved,
            'created_at': comment.created_at.isoformat()
        }
        
        # Broadcast to general blog updates
        self.broadcast_to_group(
            'blog_updates',
            'comment_created',
            {
                'comment': comment_data,
                'article_id': str(comment.article.id)
            }
        )
        
        # Broadcast to specific article comments group
        self.broadcast_to_group(
            f'comments_{comment.article.id}',
            'comment_created',
            {
                'comment': comment_data,
                'article_id': str(comment.article.id)
            }
        )
        
        # Broadcast to admin updates for moderation
        if not comment.approved:
            self.broadcast_to_group(
                'admin_updates',
                'comment_created',
                {
                    'comment': comment_data,
                    'article_id': str(comment.article.id),
                    'requires_moderation': True
                }
            )
    
    def broadcast_user_authenticated(self, user, action='login'):
        """Broadcast user authentication state change"""
        user_data = {
            'id': str(user.id),
            'username': user.username,
            'full_name': user.get_full_name(),
            'is_staff': user.is_staff,
            'last_login': user.last_login.isoformat() if user.last_login else None
        }
        
        # Broadcast to user-specific room
        self.broadcast_to_group(
            f'user_{user.id}',
            'user_authenticated',
            {
                'user': user_data,
                'action': action
            }
        )
        
        # Broadcast to admin updates if admin user
        if user.is_staff:
            self.broadcast_to_group(
                'admin_updates',
                'user_authenticated',
                {
                    'user': user_data,
                    'action': action
                }
            )
    
    def broadcast_admin_action(self, admin_user, action, target_type, target_id, details=None):
        """Broadcast admin action event"""
        admin_data = {
            'id': str(admin_user.id),
            'username': admin_user.username,
            'full_name': admin_user.get_full_name()
        }
        
        action_data = {
            'admin_user': admin_data,
            'action': action,
            'target': {
                'type': target_type,
                'id': str(target_id)
            },
            'details': details or {}
        }
        
        # Broadcast to admin updates
        self.broadcast_to_group(
            'admin_updates',
            'admin_action',
            action_data
        )
        
        # Also broadcast to general updates for public actions
        public_actions = ['article_published', 'comment_approved']
        if action in public_actions:
            self.broadcast_to_group(
                'blog_updates',
                'admin_action',
                action_data
            )
    
    def broadcast_content_moderated(self, content_type, content_id, action, moderator, details=None):
        """Broadcast content moderation event"""
        moderation_data = {
            'content_type': content_type,
            'content_id': str(content_id),
            'action': action,
            'moderator': {
                'id': str(moderator.id),
                'username': moderator.username,
                'full_name': moderator.get_full_name()
            },
            'details': details or {}
        }
        
        # Broadcast to admin updates
        self.broadcast_to_group(
            'admin_updates',
            'content_moderated',
            moderation_data
        )
        
        # Broadcast to general updates for approved content
        if action in ['approved', 'published']:
            self.broadcast_to_group(
                'blog_updates',
                'content_moderated',
                moderation_data
            )
    
    def broadcast_notification(self, user_id, notification_data):
        """Broadcast notification to specific user"""
        self.broadcast_to_group(
            f'notifications_{user_id}',
            'notification',
            {'notification': notification_data}
        )


# Global broadcaster instance
broadcaster = WebSocketBroadcaster()


# Convenience functions for easy use in views
def broadcast_article_created(article, author):
    """Convenience function to broadcast article creation"""
    broadcaster.broadcast_article_created(article, author)


def broadcast_article_updated(article, author, changes=None):
    """Convenience function to broadcast article update"""
    broadcaster.broadcast_article_updated(article, author, changes)


def broadcast_comment_created(comment):
    """Convenience function to broadcast comment creation"""
    broadcaster.broadcast_comment_created(comment)


def broadcast_user_authenticated(user, action='login'):
    """Convenience function to broadcast user authentication"""
    broadcaster.broadcast_user_authenticated(user, action)


def broadcast_admin_action(admin_user, action, target_type, target_id, details=None):
    """Convenience function to broadcast admin action"""
    broadcaster.broadcast_admin_action(admin_user, action, target_type, target_id, details)


def broadcast_content_moderated(content_type, content_id, action, moderator, details=None):
    """Convenience function to broadcast content moderation"""
    broadcaster.broadcast_content_moderated(content_type, content_id, action, moderator, details)


def broadcast_notification(user_id, notification_data):
    """Convenience function to broadcast notification"""
    broadcaster.broadcast_notification(user_id, notification_data)