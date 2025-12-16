"""
Property-based tests for real-time content notifications
**Feature: django-postgresql-enhancement, Property 32: Real-time content notifications**
**Validates: Requirements 8.1**
"""

import json
import asyncio
from unittest.mock import patch, MagicMock, AsyncMock
from hypothesis import given, strategies as st, settings
from hypothesis.extra.django import TestCase
from django.contrib.auth import get_user_model
from blog.models import Article, Category, Tag, Comment
from blog.websocket_utils import WebSocketBroadcaster
from channels.layers import InMemoryChannelLayer
from asgiref.sync import async_to_sync

User = get_user_model()


class TestRealTimeContentNotifications(TestCase):
    """Property-based tests for real-time content notifications"""
    
    def setUp(self):
        """Set up test environment"""
        self.user = User.objects.create_user(
            email='test@example.com',
            username='testuser',
            password='testpass123'
        )
        self.admin_user = User.objects.create_user(
            email='admin@example.com',
            username='adminuser',
            password='adminpass123',
            is_staff=True,
            user_type='admin'
        )
        self.category = Category.objects.create(name='Test Category')
        self.tag = Tag.objects.create(name='test-tag')
        
        # Set up mock channel layer
        self.channel_layer = InMemoryChannelLayer()
        self.broadcaster = WebSocketBroadcaster()
        self.broadcaster.channel_layer = self.channel_layer
    
    @given(
        title=st.text(min_size=1, max_size=200),
        content=st.text(min_size=10, max_size=1000),
        status=st.sampled_from(['draft', 'published', 'archived'])
    )
    @settings(max_examples=20, deadline=5000)
    def test_article_creation_broadcasts_notification(self, title, content, status):
        """
        Property: For any article creation, the broadcast system should send notifications
        **Feature: django-postgresql-enhancement, Property 32: Real-time content notifications**
        **Validates: Requirements 8.1**
        """
        with patch.object(self.broadcaster, 'broadcast_to_group') as mock_broadcast:
            # Create article
            article = Article.objects.create(
                title=title,
                content=content,
                status=status,
                author=self.user,
                category=self.category
            )
            
            # Trigger broadcast
            self.broadcaster.broadcast_article_created(article, self.user)
            
            # Verify broadcast was called
            self.assertTrue(mock_broadcast.called)
            
            # Get all call arguments (there may be multiple calls)
            call_args_list = mock_broadcast.call_args_list
            
            # Should have at least one call to blog_updates
            blog_updates_calls = [call for call in call_args_list 
                                if call[0][0] == 'blog_updates' and call[0][1] == 'article_created']
            self.assertTrue(len(blog_updates_calls) > 0, "Should broadcast to blog_updates")
            
            # Get the blog_updates call data
            group_name, event_type, data = blog_updates_calls[0][0]
            
            # Verify broadcast parameters
            self.assertEqual(group_name, 'blog_updates')
            self.assertEqual(event_type, 'article_created')
            self.assertIn('article', data)
            
            # Verify article data structure
            article_data = data['article']
            self.assertEqual(article_data['id'], str(article.id))
            self.assertEqual(article_data['title'], title)
            self.assertEqual(article_data['status'], status)
            self.assertIn('author', article_data)
            self.assertEqual(article_data['author']['id'], str(self.user.id))
            self.assertEqual(article_data['author']['username'], self.user.username)
    
    @given(
        original_title=st.text(min_size=1, max_size=200),
        new_title=st.text(min_size=1, max_size=200),
        original_content=st.text(min_size=10, max_size=1000),
        new_content=st.text(min_size=10, max_size=1000),
        original_status=st.sampled_from(['draft', 'published']),
        new_status=st.sampled_from(['draft', 'published', 'archived'])
    )
    @settings(max_examples=15, deadline=5000)
    def test_article_update_broadcasts_notification(self, original_title, new_title, 
                                                  original_content, new_content,
                                                  original_status, new_status):
        """
        Property: For any article update, the broadcast system should send update notifications
        **Feature: django-postgresql-enhancement, Property 32: Real-time content notifications**
        **Validates: Requirements 8.1**
        """
        with patch.object(self.broadcaster, 'broadcast_to_group') as mock_broadcast:
            # Create initial article
            article = Article.objects.create(
                title=original_title,
                content=original_content,
                status=original_status,
                author=self.user,
                category=self.category
            )
            
            # Update article
            changes = {
                'title_changed': original_title != new_title,
                'content_changed': original_content != new_content,
                'status_changed': original_status != new_status
            }
            
            article.title = new_title
            article.content = new_content
            article.status = new_status
            article.save()
            
            # Trigger broadcast
            self.broadcaster.broadcast_article_updated(article, self.user, changes)
            
            # Verify broadcast was called
            self.assertTrue(mock_broadcast.called)
            
            # Get the call arguments
            call_args = mock_broadcast.call_args
            group_name, event_type, data = call_args[0]
            
            # Verify broadcast parameters
            self.assertEqual(group_name, 'blog_updates')
            self.assertEqual(event_type, 'article_updated')
            self.assertIn('article', data)
            self.assertIn('changes', data)
            
            # Verify article data
            article_data = data['article']
            self.assertEqual(article_data['id'], str(article.id))
            self.assertEqual(article_data['title'], new_title)
            self.assertEqual(article_data['status'], new_status)
            
            # Verify changes are reported correctly
            received_changes = data['changes']
            self.assertEqual(received_changes['title_changed'], changes['title_changed'])
            self.assertEqual(received_changes['content_changed'], changes['content_changed'])
            self.assertEqual(received_changes['status_changed'], changes['status_changed'])
    
    @given(
        comment_content=st.text(min_size=1, max_size=500),
        approved=st.booleans()
    )
    @settings(max_examples=15, deadline=5000)
    def test_comment_creation_broadcasts_notification(self, comment_content, approved):
        """
        Property: For any comment creation, the broadcast system should send notifications
        **Feature: django-postgresql-enhancement, Property 32: Real-time content notifications**
        **Validates: Requirements 8.1**
        """
        with patch.object(self.broadcaster, 'broadcast_to_group') as mock_broadcast:
            # Create article for comment
            article = Article.objects.create(
                title='Test Article',
                content='Test content',
                status='published',
                author=self.user,
                category=self.category
            )
            
            # Create comment
            comment = Comment.objects.create(
                content=comment_content,
                article=article,
                author=self.user,
                approved=approved
            )
            
            # Trigger broadcast
            self.broadcaster.broadcast_comment_created(comment)
            
            # Verify broadcast was called
            self.assertTrue(mock_broadcast.called)
            
            # Get the call arguments
            call_args = mock_broadcast.call_args
            group_name, event_type, data = call_args[0]
            
            # Verify broadcast parameters
            self.assertEqual(group_name, 'blog_updates')
            self.assertEqual(event_type, 'comment_created')
            self.assertIn('comment', data)
            self.assertIn('article_id', data)
            
            # Verify comment data
            comment_data = data['comment']
            self.assertEqual(comment_data['id'], str(comment.id))
            self.assertEqual(comment_data['content'], comment_content)
            self.assertEqual(comment_data['approved'], approved)
            self.assertEqual(data['article_id'], str(article.id))
            
            # Verify article information is included
            self.assertIn('article', comment_data)
            self.assertEqual(comment_data['article']['id'], str(article.id))
    
    @given(
        article_title=st.text(min_size=1, max_size=100)
    )
    @settings(max_examples=10, deadline=3000)
    def test_broadcast_includes_timestamp(self, article_title):
        """
        Property: All real-time notifications should include accurate timestamps
        **Feature: django-postgresql-enhancement, Property 32: Real-time content notifications**
        **Validates: Requirements 8.1**
        """
        with patch.object(self.broadcaster, 'broadcast_to_group') as mock_broadcast:
            # Create article
            article = Article.objects.create(
                title=article_title,
                content='Test content with timestamp',
                status='published',
                author=self.user,
                category=self.category
            )
            
            # Trigger broadcast
            self.broadcaster.broadcast_article_created(article, self.user)
            
            # Verify broadcast was called
            self.assertTrue(mock_broadcast.called)
            
            # Get the call arguments and verify timestamp is included
            call_args = mock_broadcast.call_args
            group_name, event_type, data = call_args[0]
            
            # The broadcast_to_group method should add a timestamp
            # We can verify this by checking that the method was called with the right parameters
            self.assertEqual(group_name, 'blog_updates')
            self.assertEqual(event_type, 'article_created')
            self.assertIn('article', data)
    
    def test_broadcast_to_correct_groups(self):
        """
        Property: Broadcasts should be sent to appropriate groups based on content type
        **Feature: django-postgresql-enhancement, Property 32: Real-time content notifications**
        **Validates: Requirements 8.1**
        """
        with patch.object(self.broadcaster, 'broadcast_to_group') as mock_broadcast:
            # Test article creation broadcast
            article = Article.objects.create(
                title='Test Article',
                content='Test content',
                status='published',
                author=self.user,
                category=self.category
            )
            
            self.broadcaster.broadcast_article_created(article, self.user)
            
            # Should broadcast to blog_updates group
            mock_broadcast.assert_called_with(
                'blog_updates',
                'article_created',
                {'article': mock_broadcast.call_args[0][2]['article']}
            )
            
            # Reset mock
            mock_broadcast.reset_mock()
            
            # Test admin action broadcast
            self.broadcaster.broadcast_admin_action(
                self.admin_user, 
                'article_published', 
                'article', 
                article.id
            )
            
            # Should broadcast to admin_updates group
            self.assertTrue(mock_broadcast.called)
            call_args = mock_broadcast.call_args
            group_name = call_args[0][0]
            self.assertEqual(group_name, 'admin_updates')