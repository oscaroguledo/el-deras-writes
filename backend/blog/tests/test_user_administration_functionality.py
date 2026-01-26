"""
Property-based tests for user administration functionality.

**Feature: django-postgresql-enhancement, Property 11: User administration functionality**
**Validates: Requirements 3.2**
"""

from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from hypothesis import given, strategies as st, settings
from hypothesis.extra.django import TestCase as HypothesisTestCase
from blog.models import CustomUser
import json
import uuid

User = get_user_model()


class UserAdministrationFunctionalityTest(HypothesisTestCase):
    """Property-based tests for user administration functionality."""
    
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
        
        # Create normal user for comparison
        self.normal_user = CustomUser.objects.create_user(
            email=f'user-{test_id}@test.com',
            username=f'user-{test_id}',
            password='testpass123',
            user_type='normal'
        )

    @given(
        username=st.text(min_size=1, max_size=150, alphabet=st.characters(blacklist_categories=['Cc', 'Cs'])).filter(lambda x: x.strip()),
        email=st.emails(),
        first_name=st.text(min_size=0, max_size=30, alphabet=st.characters(blacklist_categories=['Cc', 'Cs'])),
        last_name=st.text(min_size=0, max_size=150, alphabet=st.characters(blacklist_categories=['Cc', 'Cs'])),
        user_type=st.sampled_from(['admin', 'normal', 'guest']),
        is_active=st.booleans()
    )
    @settings(max_examples=100, deadline=None)
    def test_admin_user_creation_management(self, username, email, first_name, last_name, user_type, is_active):
        """
        Property: For any user management operation by an administrator, 
        the changes should be applied correctly and reflected in subsequent queries.
        
        **Feature: django-postgresql-enhancement, Property 11: User administration functionality**
        **Validates: Requirements 3.2**
        """
        # Authenticate as admin
        self.client.force_authenticate(user=self.admin_user)
        
        # Prepare user data
        user_data = {
            'username': username.strip(),
            'email': email,
            'first_name': first_name,
            'last_name': last_name,
            'user_type': user_type,
            'is_active': is_active,
            'password': 'testpass123'
        }
        
        # Create user via admin API
        response = self.client.post(admin/users/', user_data, format='json')
        
        # Verify user was created successfully
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Get the created user ID
        user_id = response.data['id']
        
        # Retrieve the user from database
        created_user = CustomUser.objects.get(id=user_id)
        
        # Verify all user data is properly stored
        self.assertEqual(created_user.username, username.strip())
        self.assertEqual(created_user.email, email)
        self.assertEqual(created_user.first_name, first_name)
        self.assertEqual(created_user.last_name, last_name)
        self.assertEqual(created_user.user_type, user_type)
        self.assertEqual(created_user.is_active, is_active)
        
        # Verify user is retrievable via API
        get_response = self.client.get(fadmin/users/{user_id}/')
        self.assertEqual(get_response.status_code, status.HTTP_200_OK)
        
        # Verify all data is present in API response
        response_data = get_response.data
        self.assertEqual(response_data['username'], username.strip())
        self.assertEqual(response_data['email'], email)
        self.assertEqual(response_data['first_name'], first_name)
        self.assertEqual(response_data['last_name'], last_name)
        self.assertEqual(response_data['user_type'], user_type)
        self.assertEqual(response_data['is_active'], is_active)

    @given(
        new_first_name=st.text(min_size=0, max_size=30, alphabet=st.characters(blacklist_categories=['Cc', 'Cs'])),
        new_last_name=st.text(min_size=0, max_size=150, alphabet=st.characters(blacklist_categories=['Cc', 'Cs'])),
        new_user_type=st.sampled_from(['admin', 'normal', 'guest']),
        new_is_active=st.booleans()
    )
    @settings(max_examples=50, deadline=None)
    def test_admin_user_update_management(self, new_first_name, new_last_name, new_user_type, new_is_active):
        """
        Property: For any user update operation by an administrator, 
        the changes should be applied correctly and reflected in subsequent queries.
        
        **Feature: django-postgresql-enhancement, Property 11: User administration functionality**
        **Validates: Requirements 3.2**
        """
        # Authenticate as admin
        self.client.force_authenticate(user=self.admin_user)
        
        # Create a test user to update
        test_user = CustomUser.objects.create_user(
            email='testupdate@example.com',
            username='testupdate',
            password='testpass123',
            first_name='Original First',
            last_name='Original Last',
            user_type='normal',
            is_active=True
        )
        
        # Prepare update data
        update_data = {
            'first_name': new_first_name,
            'last_name': new_last_name,
            'user_type': new_user_type,
            'is_active': new_is_active
        }
        
        # Update user via admin API
        response = self.client.patch(fadmin/users/{test_user.id}/', update_data, format='json')
        
        # Verify update was successful
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Refresh user from database
        test_user.refresh_from_db()
        
        # Verify all changes were applied
        self.assertEqual(test_user.first_name, new_first_name)
        self.assertEqual(test_user.last_name, new_last_name)
        self.assertEqual(test_user.user_type, new_user_type)
        self.assertEqual(test_user.is_active, new_is_active)
        
        # Verify changes are reflected in API response
        get_response = self.client.get(fadmin/users/{test_user.id}/')
        self.assertEqual(get_response.status_code, status.HTTP_200_OK)
        
        response_data = get_response.data
        self.assertEqual(response_data['first_name'], new_first_name)
        self.assertEqual(response_data['last_name'], new_last_name)
        self.assertEqual(response_data['user_type'], new_user_type)
        self.assertEqual(response_data['is_active'], new_is_active)

    def test_admin_user_deletion_management(self):
        """
        Property: For any user deletion operation by an administrator, 
        the user should be removed and no longer accessible via API.
        
        **Feature: django-postgresql-enhancement, Property 11: User administration functionality**
        **Validates: Requirements 3.2**
        """
        # Authenticate as admin
        self.client.force_authenticate(user=self.admin_user)
        
        # Create a test user to delete
        test_user = CustomUser.objects.create_user(
            email='testdelete@example.com',
            username='testdelete',
            password='testpass123',
            user_type='normal'
        )
        
        user_id = test_user.id
        
        # Verify user exists before deletion
        self.assertTrue(CustomUser.objects.filter(id=user_id).exists())
        
        # Delete user via admin API
        response = self.client.delete(fadmin/users/{user_id}/')
        
        # Verify deletion was successful
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        
        # Verify user no longer exists in database
        self.assertFalse(CustomUser.objects.filter(id=user_id).exists())
        
        # Verify user is no longer accessible via API
        get_response = self.client.get(fadmin/users/{user_id}/')
        self.assertEqual(get_response.status_code, status.HTTP_404_NOT_FOUND)

    def test_admin_user_list_management(self):
        """
        Property: Admin should be able to list all users and the list should 
        reflect current database state.
        
        **Feature: django-postgresql-enhancement, Property 11: User administration functionality**
        **Validates: Requirements 3.2**
        """
        # Authenticate as admin
        self.client.force_authenticate(user=self.admin_user)
        
        # Get initial user count
        initial_count = CustomUser.objects.count()
        
        # Create additional test users
        test_users = []
        for i in range(3):
            user = CustomUser.objects.create_user(
                email=f'testlist{i}@example.com',
                username=f'testlist{i}',
                password='testpass123',
                user_type='normal'
            )
            test_users.append(user)
        
        # Get user list via admin API
        response = self.client.get(admin/users/')
        
        # Verify list request was successful
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verify the count reflects the new users
        if 'results' in response.data:
            # Paginated response
            total_count = response.data['count']
        else:
            # Non-paginated response
            total_count = len(response.data)
        
        expected_count = initial_count + 3
        self.assertEqual(total_count, expected_count)
        
        # Verify all test users are in the response
        if 'results' in response.data:
            user_ids = [user['id'] for user in response.data['results']]
        else:
            user_ids = [user['id'] for user in response.data]
        
        for test_user in test_users:
            self.assertIn(str(test_user.id), user_ids)

    def test_non_admin_cannot_manage_users(self):
        """
        Property: Non-admin users should not be able to perform user management operations.
        
        **Feature: django-postgresql-enhancement, Property 11: User administration functionality**
        **Validates: Requirements 3.2**
        """
        # Authenticate as normal user
        self.client.force_authenticate(user=self.normal_user)
        
        # Try to create a user
        user_data = {
            'username': 'testuser',
            'email': 'test@example.com',
            'password': 'testpass123',
            'user_type': 'normal'
        }
        
        create_response = self.client.post(admin/users/', user_data, format='json')
        self.assertEqual(create_response.status_code, status.HTTP_403_FORBIDDEN)
        
        # Try to list users
        list_response = self.client.get(admin/users/')
        self.assertEqual(list_response.status_code, status.HTTP_403_FORBIDDEN)
        
        # Try to update a user
        update_response = self.client.patch(fadmin/users/{self.admin_user.id}/', 
                                          {'first_name': 'Hacked'}, format='json')
        self.assertEqual(update_response.status_code, status.HTTP_403_FORBIDDEN)
        
        # Try to delete a user
        delete_response = self.client.delete(fadmin/users/{self.admin_user.id}/')
        self.assertEqual(delete_response.status_code, status.HTTP_403_FORBIDDEN)

    @given(
        search_term=st.text(min_size=1, max_size=50, alphabet=st.characters(blacklist_categories=['Cc', 'Cs'])).filter(lambda x: x.strip())
    )
    @settings(max_examples=30, deadline=None)
    def test_admin_user_search_functionality(self, search_term):
        """
        Property: Admin should be able to search users and results should match the search criteria.
        
        **Feature: django-postgresql-enhancement, Property 11: User administration functionality**
        **Validates: Requirements 3.2**
        """
        # Authenticate as admin
        self.client.force_authenticate(user=self.admin_user)
        
        # Create test users with searchable content
        search_term_clean = search_term.strip()
        test_user = CustomUser.objects.create_user(
            email=f'{search_term_clean}@example.com',
            username=f'user_{search_term_clean}',
            first_name=search_term_clean,
            password='testpass123',
            user_type='normal'
        )
        
        # Search for users via admin API
        response = self.client.get(fadmin/users/?search={search_term_clean}')
        
        # Verify search request was successful
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verify search results contain the test user
        if 'results' in response.data:
            user_ids = [user['id'] for user in response.data['results']]
        else:
            user_ids = [user['id'] for user in response.data]
        
        self.assertIn(str(test_user.id), user_ids)
        
        # Verify all results contain the search term in relevant fields
        if 'results' in response.data:
            users = response.data['results']
        else:
            users = response.data
        
        for user in users:
            # Check if search term appears in username, email, first_name, or last_name
            search_fields = [
                user.get('username', '').lower(),
                user.get('email', '').lower(),
                user.get('first_name', '').lower(),
                user.get('last_name', '').lower()
            ]
            
            # At least one field should contain the search term
            contains_search_term = any(search_term_clean.lower() in field for field in search_fields)
            self.assertTrue(contains_search_term, 
                          f"User {user.get('username')} does not contain search term '{search_term_clean}' in any searchable field")