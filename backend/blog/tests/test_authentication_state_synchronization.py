"""
Property-based tests for authentication state synchronization.
**Feature: django-postgresql-enhancement, Property 33: Authentication state synchronization**
**Validates: Requirements 8.2**
"""

from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from hypothesis import given, strategies as st, settings as hypothesis_settings
from hypothesis.extra.django import TestCase as HypothesisTestCase
from unittest.mock import patch, MagicMock

from blog.models import CustomUser
from blog.websocket_utils import broadcast_user_authenticated  # Import the function to be patched
import string

class AuthenticationStateSynchronizationTest(HypothesisTestCase):
    """
    Property-based tests to ensure authentication state changes (login/logout)
    are correctly synchronized (e.g., via WebSocket broadcasts).
    """

    def setUp(self):
        """Set up test environment by creating a test user."""
        self.client = APIClient()
        self.test_user_password = 'testpassword123'
        self.test_user = CustomUser.objects.create_user(
            email='syncuser@example.com',
            username='syncuser',
            password=self.test_user_password,
            first_name='Sync',
            last_name='User'
        )

    def tearDown(self):
        """Clean up after each test."""
        CustomUser.objects.all().delete()

    @hypothesis_settings(max_examples=1, deadline=None) # Only need one example for this specific test
    @patch('blog.websocket_utils.broadcast_user_authenticated')
    def test_user_login_broadcasts_authentication_state(self, mock_broadcast_user_authenticated):
        """
        Property: Upon successful user login, a broadcast event should be triggered
        to synchronize authentication state.
        """
        login_url = reverse('token_obtain_pair') # Assuming this is the JWT login endpoint
        response = self.client.post(login_url, {'email': self.test_user.email, 'password': self.test_user_password}, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        mock_broadcast_user_authenticated.assert_called_once_with(
            self.test_user, 
            'login'
        )

    @hypothesis_settings(max_examples=1, deadline=None)
    @patch('blog.websocket_utils.broadcast_user_authenticated')
    def test_user_logout_broadcasts_authentication_state(self, mock_broadcast_user_authenticated):
        """
        Property: Upon user logout, a broadcast event should be triggered
        to synchronize authentication state.
        """
        # First, log in the user to get tokens
        login_url = reverse('token_obtain_pair')
        login_response = self.client.post(login_url, {'email': self.test_user.email, 'password': self.test_user_password}, format='json')
        self.assertEqual(login_response.status_code, status.HTTP_200_OK)
        
        access_token = login_response.json()['access']
        refresh_token = login_response.json()['refresh']
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')

        # Reset mock call count after login broadcast
        mock_broadcast_user_authenticated.reset_mock()

        logout_url = reverse('logout') # Assuming this is the JWT logout/blacklist endpoint
        response = self.client.post(logout_url, {'refresh_token': refresh_token})
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        mock_broadcast_user_authenticated.assert_called_once_with(
            self.test_user, 
            'logout'
        )
