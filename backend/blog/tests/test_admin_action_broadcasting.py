"""
Property-based tests for admin action broadcasting.
**Feature: django-postgresql-enhancement, Property 35: Admin action broadcasting**
**Validates: Requirements 8.4**
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

from blog.models import CustomUser, Article, Comment
from blog_project.asgi import application # Assuming your ASGI application is here

class AdminActionBroadcastingTest(HypothesisTestCase):
    """
    Property-based tests to ensure admin actions are broadcasted
    via WebSockets to relevant groups.
    """

    def setUp(self):
        """Set up test environment by creating an admin user, a regular user, an article, and a comment."""
        self.client = APIClient()
        self.admin_password = 'adminpassword123'
        self.admin_user = CustomUser.objects.create_superuser(
            email='admin@example.com',
            username='adminuser',
            password=self.admin_password,
            first_name='Admin',
            last_name='User'
        )
        self.normal_user = CustomUser.objects.create_user(
            email='normal@example.com',
            username='normaluser',
            password='normalpassword123',
            first_name='Normal',
            last_name='User'
        )
        self.article = Article.objects.create(
            title='Admin Action Test Article',
            content='Content for admin action test article.',
            author=self.normal_user,
            status='published'
        )
        self.comment = Comment.objects.create(
            article=self.article,
            author=self.normal_user,
            content='This is a comment needing approval.',
            approved=False # Unapproved comment
        )
        
        # Log in the admin user to get a token for API actions
        login_url = reverse('enhanced_token_obtain_pair') # Use enhanced login
        response = self.client.post(login_url, {'email': self.admin_user.email, 'password': self.admin_password}, format='json')
        self.access_token = response.json()['access']
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.access_token}')

    def tearDown(self):
        """Clean up after each test."""
        self.client.force_authenticate(user=None)
        CustomUser.objects.all().delete()
        Article.objects.all().delete()
        Comment.objects.all().delete()

    @hypothesis_settings(max_examples=1, deadline=None)
    async def test_admin_approving_comment_broadcasts_action(self):
        """
        Property: When an admin approves a comment, an 'admin_action' and 'content_moderated'
        event should be broadcasted to the 'admin_updates' WebSocket group.
        """
        communicator = WebsocketCommunicator(
            application, 
            f"ws/blog/?token={self.access_token}" # General blog consumer, admin will subscribe to admin_updates group
        )
        connected, subprotocol = await communicator.connect()
        self.assertTrue(connected)

        # Receive initial connection confirmation
        response = await communicator.receive_json_from()
        self.assertEqual(response['type'], 'connection_established')
        
        # Explicitly subscribe to admin_updates from the consumer for this test if not done automatically
        await communicator.send_json_to({
            "type": "subscribe",
            "events": ["admin_action", "content_moderated"]
        })
        # Receive confirmation
        response = await communicator.receive_json_from()
        self.assertEqual(response['type'], 'subscription_confirmed')


        # Perform admin action: approve the comment via API
        approve_url = reverse('admin-comment-approve-comment', kwargs={'pk': self.comment.id})
        response = await sync_to_async(self.client.post)(approve_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Wait for WebSocket messages, collecting the expected number of messages
        messages = []
        overall_timeout = 5  # seconds for each receive attempt
        
        for i in range(4): # Expecting 4 messages
            try:
                message = await communicator.receive_json_from(timeout=overall_timeout)
                messages.append(message)
            except asyncio.TimeoutError:
                self.fail(f"Timeout while waiting for message {i+1} of 4 within {overall_timeout} seconds. Received {len(messages)} messages.")
        
        admin_action_messages = [msg for msg in messages if msg['type'] == 'admin_action']
        content_moderated_messages = [msg for msg in messages if msg['type'] == 'content_moderated']

        self.assertEqual(len(admin_action_messages), 2, "Expected two 'admin_action' messages")
        self.assertEqual(len(content_moderated_messages), 2, "Expected two 'content_moderated' messages")

        # Verify one of the admin_action broadcasts
        admin_action_message = admin_action_messages[0]
        self.assertIsNotNone(admin_action_message)
        self.assertEqual(admin_action_message['action'], 'comment_approved')
        self.assertEqual(str(admin_action_message['target']['id']), str(self.comment.id))
        self.assertEqual(admin_action_message['target']['type'], 'comment')
        self.assertEqual(str(admin_action_message['admin_user']['id']), str(self.admin_user.id))

        # Verify one of the content_moderated broadcasts
        content_moderated_message = content_moderated_messages[0]
        self.assertIsNotNone(content_moderated_message)
        self.assertEqual(content_moderated_message['content_type'], 'comment')
        self.assertEqual(str(content_moderated_message['content_id']), str(self.comment.id))
        self.assertEqual(content_moderated_message['action'], 'approved')
        self.assertEqual(str(content_moderated_message['moderator']['id']), str(self.admin_user.id))
        
        await communicator.disconnect()