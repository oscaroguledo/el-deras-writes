"""
Property-based tests for comment moderation workflow.

**Feature: django-postgresql-enhancement, Property 12: Comment moderation workflow**
**Validates: Requirements 3.3**
"""

from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from hypothesis import given, strategies as st, settings
from hypothesis.extra.django import TestCase as HypothesisTestCase
from blog.models import Article, Comment, Category, CustomUser
from django.utils import timezone
import json
import uuid

User = get_user_model()


class CommentModerationWorkflowTest(HypothesisTestCase):
    """Property-based tests for comment moderation workflow."""
    
    def setUp(self):
        """Set up test data."""
        self.client = APIClient()
        
        # Generate unique identifiers for each test run
        test_id = str(uuid.uuid4())[:8]
        
        # Create admin user
        self.admin_user = CustomUser.objects.create_user(
            email=f'admin-{test_id}@test.com',
            username=f'admin-{test_id}',
            password='testpass123',
            user_type='admin',
            is_staff=True,
            is_superuser=True
        )
        
        # Create normal user
        self.normal_user = CustomUser.objects.create_user(
            email=f'user-{test_id}@test.com',
            username=f'user-{test_id}',
            password='testpass123',
            user_type='normal'
        )
        
        # Create test category and article
        self.category = Category.objects.create(
            name=f'Test Category {test_id}',
            description='Test category description'
        )
        
        self.article = Article.objects.create(
            title=f'Test Article {test_id}',
            content='Test article content for comment testing',
            author=self.admin_user,
            category=self.category,
            status='published'
        )

    @given(
        comment_content=st.text(min_size=10, max_size=500, alphabet=st.characters(min_codepoint=32, max_codepoint=126)),
        moderation_notes=st.text(min_size=0, max_size=200, alphabet=st.characters(min_codepoint=32, max_codepoint=126))
    )
    @settings(max_examples=100, deadline=None)
    def test_comment_approval_workflow(self, comment_content, moderation_notes):
        """
        Property: For any comment moderation action (approve, flag, delete), 
        the comment state should change appropriately and persist correctly.
        
        **Feature: django-postgresql-enhancement, Property 12: Comment moderation workflow**
        **Validates: Requirements 3.3**
        """
        # Create a comment that needs moderation
        comment = Comment.objects.create(
            article=self.article,
            author=self.normal_user,
            content=comment_content,
            approved=False,  # Start as unapproved
            is_flagged=False
        )
        
        # Authenticate as admin
        self.client.force_authenticate(user=self.admin_user)
        
        # Approve the comment via admin API
        approval_data = {
            'approved': True,
            'moderation_notes': moderation_notes
        }
        
        response = self.client.patch(fadmin/comments/{comment.id}/', approval_data, format='json')
        
        # Verify approval was successful
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Refresh comment from database
        comment.refresh_from_db()
        
        # Verify comment state changed appropriately
        self.assertTrue(comment.approved)
        self.assertEqual(comment.moderation_notes, moderation_notes)
        self.assertEqual(comment.moderated_by, self.admin_user)
        self.assertIsNotNone(comment.moderated_at)
        
        # Verify changes are reflected in API response
        get_response = self.client.get(fadmin/comments/{comment.id}/')
        self.assertEqual(get_response.status_code, status.HTTP_200_OK)
        
        response_data = get_response.data
        self.assertTrue(response_data['approved'])
        self.assertEqual(response_data['moderation_notes'], moderation_notes)
        self.assertEqual(response_data['moderated_by']['id'], str(self.admin_user.id))

    @given(
        comment_content=st.text(min_size=10, max_size=500, alphabet=st.characters(min_codepoint=32, max_codepoint=126)),
        flag_reason=st.text(min_size=1, max_size=200, alphabet=st.characters(min_codepoint=32, max_codepoint=126))
    )
    @settings(max_examples=50, deadline=None)
    def test_comment_flagging_workflow(self, comment_content, flag_reason):
        """
        Property: For any comment flagging action, the comment should be marked as flagged
        and the moderation state should persist correctly.
        
        **Feature: django-postgresql-enhancement, Property 12: Comment moderation workflow**
        **Validates: Requirements 3.3**
        """
        # Create a comment to flag
        comment = Comment.objects.create(
            article=self.article,
            author=self.normal_user,
            content=comment_content,
            approved=True,  # Start as approved
            is_flagged=False
        )
        
        # Authenticate as admin
        self.client.force_authenticate(user=self.admin_user)
        
        # Flag the comment via admin API
        flag_data = {
            'is_flagged': True,
            'moderation_notes': flag_reason
        }
        
        response = self.client.patch(fadmin/comments/{comment.id}/', flag_data, format='json')
        
        # Verify flagging was successful
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Refresh comment from database
        comment.refresh_from_db()
        
        # Verify comment state changed appropriately
        self.assertTrue(comment.is_flagged)
        self.assertEqual(comment.moderation_notes, flag_reason)
        self.assertEqual(comment.moderated_by, self.admin_user)
        self.assertIsNotNone(comment.moderated_at)
        
        # Verify changes persist in subsequent queries
        get_response = self.client.get(fadmin/comments/{comment.id}/')
        self.assertEqual(get_response.status_code, status.HTTP_200_OK)
        
        response_data = get_response.data
        self.assertTrue(response_data['is_flagged'])
        self.assertEqual(response_data['moderation_notes'], flag_reason)

    def test_comment_deletion_workflow(self):
        """
        Property: For any comment deletion action, the comment should be removed
        and no longer accessible via API.
        
        **Feature: django-postgresql-enhancement, Property 12: Comment moderation workflow**
        **Validates: Requirements 3.3**
        """
        # Create a comment to delete
        comment = Comment.objects.create(
            article=self.article,
            author=self.normal_user,
            content='This comment will be deleted',
            approved=False,
            is_flagged=True
        )
        
        comment_id = comment.id
        
        # Authenticate as admin
        self.client.force_authenticate(user=self.admin_user)
        
        # Verify comment exists before deletion
        self.assertTrue(Comment.objects.filter(id=comment_id).exists())
        
        # Delete comment via admin API
        response = self.client.delete(fadmin/comments/{comment_id}/')
        
        # Verify deletion was successful
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        
        # Verify comment no longer exists in database
        self.assertFalse(Comment.objects.filter(id=comment_id).exists())
        
        # Verify comment is no longer accessible via API
        get_response = self.client.get(fadmin/comments/{comment_id}/')
        self.assertEqual(get_response.status_code, status.HTTP_404_NOT_FOUND)

    def test_comment_moderation_list_filtering(self):
        """
        Property: Admin should be able to filter comments by moderation status
        and the results should accurately reflect the filter criteria.
        
        **Feature: django-postgresql-enhancement, Property 12: Comment moderation workflow**
        **Validates: Requirements 3.3**
        """
        # Authenticate as admin
        self.client.force_authenticate(user=self.admin_user)
        
        # Create comments with different moderation states
        approved_comment = Comment.objects.create(
            article=self.article,
            author=self.normal_user,
            content='This is an approved comment',
            approved=True,
            is_flagged=False
        )
        
        flagged_comment = Comment.objects.create(
            article=self.article,
            author=self.normal_user,
            content='This is a flagged comment',
            approved=False,
            is_flagged=True
        )
        
        pending_comment = Comment.objects.create(
            article=self.article,
            author=self.normal_user,
            content='This is a pending comment',
            approved=False,
            is_flagged=False
        )
        
        # Test filtering by approved status
        approved_response = self.client.get(admin/comments/?approved=true')
        self.assertEqual(approved_response.status_code, status.HTTP_200_OK)
        
        # Test filtering by flagged status
        flagged_response = self.client.get(admin/comments/?is_flagged=true')
        self.assertEqual(flagged_response.status_code, status.HTTP_200_OK)
        
        # Test filtering by pending status (not approved and not flagged)
        pending_response = self.client.get(admin/comments/?approved=false&is_flagged=false')
        self.assertEqual(pending_response.status_code, status.HTTP_200_OK)
        
        # Verify filtering works correctly
        if 'results' in approved_response.data:
            approved_ids = [c['id'] for c in approved_response.data['results']]
        else:
            approved_ids = [c['id'] for c in approved_response.data]
        
        self.assertIn(str(approved_comment.id), approved_ids)

    def test_non_admin_cannot_moderate_comments(self):
        """
        Property: Non-admin users should not be able to perform comment moderation operations.
        
        **Feature: django-postgresql-enhancement, Property 12: Comment moderation workflow**
        **Validates: Requirements 3.3**
        """
        # Create a comment to moderate
        comment = Comment.objects.create(
            article=self.article,
            author=self.normal_user,
            content='This comment needs moderation',
            approved=False,
            is_flagged=False
        )
        
        # Authenticate as normal user
        self.client.force_authenticate(user=self.normal_user)
        
        # Try to approve the comment
        approval_data = {'approved': True}
        approve_response = self.client.patch(fadmin/comments/{comment.id}/', approval_data, format='json')
        self.assertEqual(approve_response.status_code, status.HTTP_403_FORBIDDEN)
        
        # Try to flag the comment
        flag_data = {'is_flagged': True}
        flag_response = self.client.patch(fadmin/comments/{comment.id}/', flag_data, format='json')
        self.assertEqual(flag_response.status_code, status.HTTP_403_FORBIDDEN)
        
        # Try to delete the comment
        delete_response = self.client.delete(fadmin/comments/{comment.id}/')
        self.assertEqual(delete_response.status_code, status.HTTP_403_FORBIDDEN)
        
        # Verify comment state hasn't changed
        comment.refresh_from_db()
        self.assertFalse(comment.approved)
        self.assertFalse(comment.is_flagged)

    @given(
        initial_approved=st.booleans(),
        initial_flagged=st.booleans(),
        new_approved=st.booleans(),
        new_flagged=st.booleans()
    )
    @settings(max_examples=50, deadline=None)
    def test_comment_moderation_state_transitions(self, initial_approved, initial_flagged, new_approved, new_flagged):
        """
        Property: Comment moderation state transitions should be properly handled
        and all state combinations should be valid.
        
        **Feature: django-postgresql-enhancement, Property 12: Comment moderation workflow**
        **Validates: Requirements 3.3**
        """
        # Create a comment with initial moderation state
        comment = Comment.objects.create(
            article=self.article,
            author=self.normal_user,
            content='Test comment for state transitions',
            approved=initial_approved,
            is_flagged=initial_flagged
        )
        
        # Authenticate as admin
        self.client.force_authenticate(user=self.admin_user)
        
        # Change moderation state
        update_data = {
            'approved': new_approved,
            'is_flagged': new_flagged,
            'moderation_notes': f'State changed from approved={initial_approved}, flagged={initial_flagged} to approved={new_approved}, flagged={new_flagged}'
        }
        
        response = self.client.patch(fadmin/comments/{comment.id}/', update_data, format='json')
        
        # Verify update was successful
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Refresh comment from database
        comment.refresh_from_db()
        
        # Verify state transition was applied correctly
        self.assertEqual(comment.approved, new_approved)
        self.assertEqual(comment.is_flagged, new_flagged)
        self.assertEqual(comment.moderated_by, self.admin_user)
        self.assertIsNotNone(comment.moderated_at)
        
        # Verify the state persists in subsequent queries
        get_response = self.client.get(fadmin/comments/{comment.id}/')
        self.assertEqual(get_response.status_code, status.HTTP_200_OK)
        
        response_data = get_response.data
        self.assertEqual(response_data['approved'], new_approved)
        self.assertEqual(response_data['is_flagged'], new_flagged)