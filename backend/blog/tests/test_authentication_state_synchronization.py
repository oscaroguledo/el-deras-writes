"""
Property-based tests for authentication state synchronization
**Feature: django-postgresql-enhancement, Property 33: Authentication state synchronization**
**Validates: Requirements 8.2**
"""

import json
from unittest.mock import patch, MagicMock
from hypothesis import given, strategies as st, settings
from hypothesis.extra.django import TestCase
from django.contrib.auth import get_user_model
from blog.websocket_utils import WebSocketBroadcaster
from channels.layers import InMemoryChannelLayer

User = get_user_model()


class TestAuthenticationStateSynchronization(TestCase):
    """Property-based tests for authentication state synchronization"""
    
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
        
        # Set up mock channel layer
        self.channel_layer = InMemoryChannelLayer()
        self.broadcaster = WebSocketBroadcaster()
        self.broadcaster.channel_layer = self.channel_layer
    
    @given(
        action=st.sampled_from(['login', 'logout'])
    )
    @settings(max_examples=10, deadline=3000)
    def test_user_authentication_broadcasts_to_user_room(self, action):
        """
        Property: For any authentication state change, the system should broadcast to user-specific room
        **Feature: django-postgresql-enhancement, Property 33: Authentication state synchronization**
        **Validates: Requirements 8.2**
        """
        with patch.object(self.broadcaster, 'broadcast_to_group') as mock_broadcast:
            # Trigger authentication broadcast
            self.broadcaster.broadcast_user_authenticated(self.user, action)
            
            # Verify broadcast was called
            self.assertTrue(mock_broadcast.called)
            
            # Get all call arguments
            call_args_list = mock_broadcast.call_args_list
            
            # Should broadcast to user-specific room
            user_room_calls = [call for call in call_args_list 
                             if call[0][0] == f'user_{self.user.id}' and call[0][1] == 'user_authenticated']
            self.assertTrue(len(user_room_calls) > 0, "Should broadcast to user-specific room")
            
            # Get the user room call data
            group_name, event_type, data = user_room_calls[0][0]
            
            # Verify broadcast parameters
            self.assertEqual(group_name, f'user_{self.user.id}')
            self.assertEqual(event_type, 'user_authenticated')
            self.assertIn('user', data)
            self.assertIn('action', data)
            
            # Verify user data
            user_data = data['user']
            self.assertEqual(user_data['id'], str(self.user.id))
            self.assertEqual(user_data['username'], self.user.username)
            self.assertEqual(data['action'], action)
    
    @given(
        username=st.text(min_size=1, max_size=150),
        email=st.emails(),
        is_staff=st.booleans()
    )
    @settings(max_examples=15, deadline=5000)
    def test_authentication_broadcast_includes_user_data(self, username, email, is_staff):
        """
        Property: For any user authentication, the broadcast should include complete user data
        **Feature: django-postgresql-enhancement, Property 33: Authentication state synchronization**
        **Validates: Requirements 8.2**
        """
        # Create test user with generated data
        test_user = User.objects.create_user(
            email=email,
            username=username,
            password='testpass123',
            is_staff=is_staff
        )
        
        with patch.object(self.broadcaster, 'broadcast_to_group') as mock_broadcast:
            # Trigger authentication broadcast
            self.broadcaster.broadcast_user_authenticated(test_user, 'login')
            
            # Verify broadcast was called
            self.assertTrue(mock_broadcast.called)
            
            # Get the call arguments
            call_args_list = mock_broadcast.call_args_list
            user_room_calls = [call for call in call_args_list 
                             if call[0][0] == f'user_{test_user.id}']
            self.assertTrue(len(user_room_calls) > 0)
            
            # Get the user data from broadcast
            group_name, event_type, data = user_room_calls[0][0]
            user_data = data['user']
            
            # Verify all required user data is included
            self.assertEqual(user_data['id'], str(test_user.id))
            self.assertEqual(user_data['username'], username)
            self.assertEqual(user_data['is_staff'], is_staff)
            self.assertIn('full_name', user_data)
            self.assertIn('last_login', user_data)
    
    def test_admin_authentication_broadcasts_to_admin_room(self):
        """
        Property: Admin user authentication should broadcast to admin room
        **Feature: django-postgresql-enhancement, Property 33: Authentication state synchronization**
        **Validates: Requirements 8.2**
        """
        with patch.object(self.broadcaster, 'broadcast_to_group') as mock_broadcast:
            # Trigger admin authentication broadcast
            self.broadcaster.broadcast_user_authenticated(self.admin_user, 'login')
            
            # Verify broadcast was called
            self.assertTrue(mock_broadcast.called)
            
            # Get all call arguments
            call_args_list = mock_broadcast.call_args_list
            
            # Should broadcast to both user room and admin room
            user_room_calls = [call for call in call_args_list 
                             if call[0][0] == f'user_{self.admin_user.id}']
            admin_room_calls = [call for call in call_args_list 
                              if call[0][0] == 'admin_updates']
            
            self.assertTrue(len(user_room_calls) > 0, "Should broadcast to user room")
            self.assertTrue(len(admin_room_calls) > 0, "Should broadcast to admin room")
            
            # Verify admin room broadcast
            admin_group_name, admin_event_type, admin_data = admin_room_calls[0][0]
            self.assertEqual(admin_group_name, 'admin_updates')
            self.assertEqual(admin_event_type, 'user_authenticated')
            self.assertEqual(admin_data['user']['is_staff'], True)
    
    @given(
        action=st.sampled_from(['login', 'logout'])
    )
    @settings(max_examples=10, deadline=3000)
    def test_authentication_broadcast_includes_action(self, action):
        """
        Property: Authentication broadcasts should include the specific action performed
        **Feature: django-postgresql-enhancement, Property 33: Authentication state synchronization**
        **Validates: Requirements 8.2**
        """
        with patch.object(self.broadcaster, 'broadcast_to_group') as mock_broadcast:
            # Trigger authentication broadcast
            self.broadcaster.broadcast_user_authenticated(self.user, action)
            
            # Verify broadcast was called
            self.assertTrue(mock_broadcast.called)
            
            # Get the call arguments
            call_args_list = mock_broadcast.call_args_list
            user_room_calls = [call for call in call_args_list 
                             if call[0][0] == f'user_{self.user.id}']
            
            # Verify action is included in broadcast
            group_name, event_type, data = user_room_calls[0][0]
            self.assertEqual(data['action'], action)
    
    def test_multiple_users_get_separate_broadcasts(self):
        """
        Property: Different users should receive separate authentication broadcasts
        **Feature: django-postgresql-enhancement, Property 33: Authentication state synchronization**
        **Validates: Requirements 8.2**
        """
        # Create additional test users
        user2 = User.objects.create_user(
            email='user2@example.com',
            username='testuser2',
            password='testpass123'
        )
        user3 = User.objects.create_user(
            email='user3@example.com',
            username='testuser3',
            password='testpass123'
        )
        
        with patch.object(self.broadcaster, 'broadcast_to_group') as mock_broadcast:
            # Trigger authentication broadcasts for different users
            self.broadcaster.broadcast_user_authenticated(self.user, 'login')
            self.broadcaster.broadcast_user_authenticated(user2, 'logout')
            self.broadcaster.broadcast_user_authenticated(user3, 'login')
            
            # Verify broadcasts were called
            self.assertTrue(mock_broadcast.called)
            self.assertEqual(mock_broadcast.call_count, 3)  # One for each user
            
            # Get all call arguments
            call_args_list = mock_broadcast.call_args_list
            
            # Verify each user gets their own broadcast
            user1_calls = [call for call in call_args_list 
                          if call[0][0] == f'user_{self.user.id}']
            user2_calls = [call for call in call_args_list 
                          if call[0][0] == f'user_{user2.id}']
            user3_calls = [call for call in call_args_list 
                          if call[0][0] == f'user_{user3.id}']
            
            self.assertEqual(len(user1_calls), 1)
            self.assertEqual(len(user2_calls), 1)
            self.assertEqual(len(user3_calls), 1)
            
            # Verify each broadcast has correct user data
            _, _, user1_data = user1_calls[0][0]
            _, _, user2_data = user2_calls[0][0]
            _, _, user3_data = user3_calls[0][0]
            
            self.assertEqual(user1_data['user']['id'], str(self.user.id))
            self.assertEqual(user1_data['action'], 'login')
            
            self.assertEqual(user2_data['user']['id'], str(user2.id))
            self.assertEqual(user2_data['action'], 'logout')
            
            self.assertEqual(user3_data['user']['id'], str(user3.id))
            self.assertEqual(user3_data['action'], 'login')
    
    def test_authentication_broadcast_format_consistency(self):
        """
        Property: Authentication broadcasts should have consistent format
        **Feature: django-postgresql-enhancement, Property 33: Authentication state synchronization**
        **Validates: Requirements 8.2**
        """
        with patch.object(self.broadcaster, 'broadcast_to_group') as mock_broadcast:
            # Trigger authentication broadcast
            self.broadcaster.broadcast_user_authenticated(self.user, 'login')
            
            # Get the call arguments
            call_args_list = mock_broadcast.call_args_list
            user_room_calls = [call for call in call_args_list 
                             if call[0][0] == f'user_{self.user.id}']
            
            # Verify broadcast format
            group_name, event_type, data = user_room_calls[0][0]
            
            # Check required fields are present
            self.assertIn('user', data)
            self.assertIn('action', data)
            
            # Check user data structure
            user_data = data['user']
            required_user_fields = ['id', 'username', 'full_name', 'is_staff', 'last_login']
            for field in required_user_fields:
                self.assertIn(field, user_data, f"User data should include {field}")
            
            # Check data types
            self.assertIsInstance(user_data['id'], str)
            self.assertIsInstance(user_data['username'], str)
            self.assertIsInstance(user_data['is_staff'], bool)
            self.assertIn(data['action'], ['login', 'logout'])