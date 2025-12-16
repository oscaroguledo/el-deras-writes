"""
Property-based tests for real-time comment updates.
**Feature: django-postgresql-enhancement, Property 34: Real-time comment updates**
**Validates: Requirements 8.3**
"""

import asyncio
import json

from django.test import TestCase, override_settings
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from hypothesis import given, strategies as st, settings as hypothesis_settings
from hypothesis.extra.django import TestCase as HypothesisTestCase
from channels.testing import WebsocketCommunicator
from asgiref.sync import sync_to_async # Import sync_to_async

from blog.models import CustomUser, Article
from blog_project.asgi import application # Assuming your ASGI application is here

class RealTimeCommentUpdatesTest(HypothesisTestCase):
    """
    Property-based tests to ensure real-time comment updates are broadcasted
    via WebSockets and received by connected clients.
    """

    def setUp(self):
        """Set up test environment by creating an article and a user."""
        self.client = APIClient()
        self.user = CustomUser.objects.create_user(
            email='testuser@example.com',
            username='testuser',
            password='testpassword123',
            first_name='Test',
            last_name='User'
        )
        self.article = Article.objects.create(
            title='WebSocket Test Article',
            content='Content for WebSocket test article.',
            author=self.user,
            status='published'
        )
        
        # Log in the user to get a token for API actions
        login_url = reverse('token_obtain_pair')
        response = self.client.post(login_url, {'email': self.user.email, 'password': 'testpassword123'}, format='json')
        self.access_token = response.json()['access']
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.access_token}')

    def tearDown(self):
        """Clean up after each test."""
        CustomUser.objects.all().delete()
        Article.objects.all().delete()

    @hypothesis_settings(max_examples=1, deadline=None)
    async def test_new_comment_broadcasts_real_time_update(self):
        """
        Property: When a new comment is created, a real-time update should be
        broadcasted over WebSocket to all subscribed clients.
        """
        communicator = WebsocketCommunicator(
            application, 
            f"/ws/comments/{self.article.id}/"
        )
        connected, subprotocol = await communicator.connect()
        self.assertTrue(connected)

        # Create a new comment via API
        comment_data = {
            'article': str(self.article.id),
            'content': 'This is a new real-time comment.',
            'author': str(self.user.id)
        }
        comment_create_url = reverse('article-comments-list', kwargs={'article_pk': self.article.id})
        response = await sync_to_async(self.client.post)(comment_create_url, comment_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        new_comment_id = response.json()['id']

        # Wait for the WebSocket message
        response_message = await communicator.receive_json_from()
        
        self.assertIsNotNone(response_message)
        self.assertEqual(response_message['type'], 'comment_created')
        self.assertEqual(str(response_message['comment']['id']), new_comment_id)
        self.assertEqual(response_message['comment']['content'], comment_data['content'])
        
        await communicator.disconnect()