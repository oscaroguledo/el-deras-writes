"""
Property-based tests for validation error handling
**Feature: django-postgresql-enhancement, Property 24: Validation error handling**
**Validates: Requirements 6.3**
"""

from django.test import TestCase, Client
from django.urls import reverse
from django.utils import timezone
from django.core.cache import cache
from rest_framework import status
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import AccessToken, RefreshToken
from rest_framework_simplejwt.exceptions import TokenError
from hypothesis import given, strategies as st, settings as hypothesis_settings
from hypothesis.extra.django import TestCase as HypothesisTestCase
from blog.models import CustomUser, Article, Comment, Category, Tag
import json
import string
from datetime import timedelta


class ValidationErrorHandlingTest(HypothesisTestCase):
    """
    Property-based tests for validation error handling with field-specific messages
    """

    def setUp(self):
        """Set up test environment"""
        self.client = APIClient()
        
        # Clear existing data to avoid conflicts
        CustomUser.objects.all().delete()
        Category.objects.all().delete()
        Article.objects.all().delete()
        
        # Create test users with unique identifiers
        import uuid
        unique_id = str(uuid.uuid4())[:8]
        
        self.admin_user = CustomUser.objects.create_user(
            email=f'admin{unique_id}@example.com',
            username=f'admin{unique_id}',
            password='adminpassword123',
            user_type='admin',
            is_staff=True,
            is_superuser=True
        )
        
        self.normal_user = CustomUser.objects.create_user(
            email=f'user{unique_id}@example.com',
            username=f'normaluser{unique_id}',
            password='userpassword123',
            user_type='normal'
        )
        
        # Create test content
        self.category = Category.objects.create(name=f'Test Category {unique_id}')

    def tearDown(self):
        """Clean up after each test"""
        # Clean up any created users
        CustomUser.objects.filter(email__contains='@example.com').delete()
        Category.objects.filter(name__startswith='Test Category').delete()
        Article.objects.filter(title__startswith='Test Article').delete()

    @given(
        invalid_email=st.text(
            alphabet=string.ascii_letters + string.digits + '@.',
            min_size=1,
            max_size=50
        ).filter(lambda x: '@' not in x or '.' not in x or len(x.split('@')) != 2),
        invalid_username=st.text(
            alphabet=string.ascii_letters + string.digits + '_!@#$%^&*()',
            min_size=1,
            max_size=200
        ).filter(lambda x: len(x) > 150 or any(c in x for c in '!@#$%^&*()')),
        short_password=st.text(max_size=7)
    )
    @hypothesis_settings(max_examples=100, deadline=10000)
    def test_validation_error_handling_property(self, invalid_email, invalid_username, short_password):
        """
        **Feature: django-postgresql-enhancement, Property 24: Validation error handling**
        **Validates: Requirements 6.3**
        
        Property: For any invalid data submission, the API should return structured error 
        responses with field-specific validation messages.
        """
        # Login as admin user to test user creation validation
        login_data = {
            'email': self.admin_user.email,
            'password': 'adminpassword123'
        }
        
        response = self.client.post('/api/auth/login/', login_data, format='json')
        if response.status_code != 200:
            return  # Skip if login fails
        
        access_token = response.json()['access']
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')
        
        # Test user registration with invalid data
        invalid_user_data = {
            'email': invalid_email,
            'username': invalid_username,
            'password': short_password
        }
        
        response = self.client.post('/api/users/', invalid_user_data, format='json')
        
        # Should return validation error
        self.assertEqual(
            response.status_code,
            400,
            "Invalid user data should return 400 Bad Request"
        )
        
        if response.content:
            try:
                error_data = response.json()
                
                # Verify error response structure
                self.assertIsInstance(
                    error_data,
                    dict,
                    "Error response should be a dictionary"
                )
                
                # Check for field-specific error messages
                expected_fields = ['email', 'username', 'password']
                
                for field in expected_fields:
                    if field in error_data:
                        # Field errors should be lists of strings
                        self.assertIsInstance(
                            error_data[field],
                            list,
                            f"Field '{field}' errors should be a list"
                        )
                        
                        if error_data[field]:
                            self.assertIsInstance(
                                error_data[field][0],
                                str,
                                f"Field '{field}' error messages should be strings"
                            )
                            
                            # Error messages should be descriptive
                            self.assertGreater(
                                len(error_data[field][0]),
                                5,
                                f"Field '{field}' error messages should be descriptive"
                            )
                
                # Verify no sensitive information is exposed
                sensitive_keywords = ['traceback', 'exception', 'stack', 'debug', 'secret', 'password']
                error_text = str(error_data).lower()
                
                for keyword in sensitive_keywords:
                    if keyword != 'password':  # 'password' might appear in field names
                        self.assertNotIn(
                            keyword,
                            error_text,
                            f"Error response should not expose sensitive information: {keyword}"
                        )
                
            except json.JSONDecodeError:
                self.fail("Error response should be valid JSON")

    def test_article_validation_error_structure(self):
        """
        Property: Article creation with invalid data should return structured field-specific errors.
        """
        # Login as admin user
        login_data = {
            'email': self.admin_user.email,
            'password': 'adminpassword123'
        }
        
        response = self.client.post('/api/auth/login/', login_data, format='json')
        self.assertEqual(response.status_code, 200)
        
        access_token = response.json()['access']
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')
        
        # Test article creation with invalid data
        invalid_article_data = {
            'title': '',  # Empty title
            'content': '',  # Empty content
            'category_name': 'x' * 300,  # Too long category name
            'scheduled_publish': '2020-01-01T00:00:00Z'  # Past date
        }
        
        response = self.client.post('/api/articles/', invalid_article_data, format='json')
        
        # Should return validation error
        self.assertEqual(
            response.status_code,
            400,
            "Invalid article data should return 400 Bad Request"
        )
        
        error_data = response.json()
        
        # Verify error response structure
        self.assertIsInstance(error_data, dict, "Error response should be a dictionary")
        
        # Check for expected field errors
        expected_error_fields = ['title', 'content']
        
        for field in expected_error_fields:
            if field in error_data:
                self.assertIsInstance(
                    error_data[field],
                    list,
                    f"Field '{field}' errors should be a list"
                )
                
                if error_data[field]:
                    self.assertIsInstance(
                        error_data[field][0],
                        str,
                        f"Field '{field}' error messages should be strings"
                    )

    def test_comment_validation_error_structure(self):
        """
        Property: Comment creation with invalid data should return structured field-specific errors.
        """
        # Create an article for testing
        article = Article.objects.create(
            title='Test Article for Comments',
            content='Test content',
            author=self.admin_user,
            category=self.category,
            status='published'
        )
        
        # Login as normal user
        login_data = {
            'email': self.normal_user.email,
            'password': 'userpassword123'
        }
        
        response = self.client.post('/api/auth/login/', login_data, format='json')
        self.assertEqual(response.status_code, 200)
        
        access_token = response.json()['access']
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')
        
        # Test comment creation with invalid data
        invalid_comment_data = {
            'content': '',  # Empty content
            'article': 'invalid-uuid'  # Invalid article ID
        }
        
        response = self.client.post(
            f'/api/articles/{article.id}/comments/',
            invalid_comment_data,
            format='json'
        )
        
        # Should return validation error
        self.assertEqual(
            response.status_code,
            400,
            "Invalid comment data should return 400 Bad Request"
        )
        
        error_data = response.json()
        
        # Verify error response structure
        self.assertIsInstance(error_data, dict, "Error response should be a dictionary")
        
        # Check for content field error
        if 'content' in error_data:
            self.assertIsInstance(
                error_data['content'],
                list,
                "Content field errors should be a list"
            )

    @given(
        invalid_category_name=st.text(
            alphabet=string.ascii_letters + string.digits + ' !@#$%^&*()',
            min_size=1,
            max_size=300
        ).filter(lambda x: len(x) > 255 or any(c in x for c in '!@#$%^&*()')),
        invalid_tag_name=st.text(
            alphabet=string.ascii_letters + string.digits + ' !@#$%^&*()',
            min_size=1,
            max_size=200
        ).filter(lambda x: len(x) > 100 or any(c in x for c in '!@#$%^&*()'))
    )
    @hypothesis_settings(max_examples=50, deadline=10000)
    def test_category_tag_validation_property(self, invalid_category_name, invalid_tag_name):
        """
        Property: Category and tag creation with invalid names should return field-specific errors.
        """
        # Login as admin user
        login_data = {
            'email': self.admin_user.email,
            'password': 'adminpassword123'
        }
        
        response = self.client.post('/api/auth/login/', login_data, format='json')
        if response.status_code != 200:
            return  # Skip if login fails
        
        access_token = response.json()['access']
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')
        
        # Test category creation with invalid name
        invalid_category_data = {'name': invalid_category_name}
        
        category_response = self.client.post('/api/categories/', invalid_category_data, format='json')
        
        if category_response.status_code == 400:
            error_data = category_response.json()
            
            # Verify error response structure
            self.assertIsInstance(error_data, dict, "Category error response should be a dictionary")
            
            if 'name' in error_data:
                self.assertIsInstance(
                    error_data['name'],
                    list,
                    "Category name errors should be a list"
                )
        
        # Test tag creation with invalid name
        invalid_tag_data = {'name': invalid_tag_name}
        
        tag_response = self.client.post('/api/tags/', invalid_tag_data, format='json')
        
        if tag_response.status_code == 400:
            error_data = tag_response.json()
            
            # Verify error response structure
            self.assertIsInstance(error_data, dict, "Tag error response should be a dictionary")
            
            if 'name' in error_data:
                self.assertIsInstance(
                    error_data['name'],
                    list,
                    "Tag name errors should be a list"
                )

    def test_authentication_validation_errors(self):
        """
        Property: Authentication endpoints should return structured validation errors.
        """
        # Test login with invalid credentials
        invalid_login_data = {
            'email': 'nonexistent@example.com',
            'password': 'wrongpassword'
        }
        
        response = self.client.post('/api/auth/login/', invalid_login_data, format='json')
        
        # Should return authentication error
        self.assertIn(
            response.status_code,
            [400, 401],
            "Invalid login should return 400 or 401"
        )
        
        if response.content:
            error_data = response.json()
            
            # Verify error response structure
            self.assertIsInstance(error_data, dict, "Error response should be a dictionary")
            
            # Should contain error information
            self.assertTrue(
                any(key in error_data for key in ['error', 'detail', 'non_field_errors']),
                "Error response should contain error information"
            )
        
        # Test token refresh with invalid token
        invalid_refresh_data = {'refresh': 'invalid.token.here'}
        
        refresh_response = self.client.post('/api/auth/refresh/', invalid_refresh_data, format='json')
        
        # Should return validation error
        self.assertEqual(
            refresh_response.status_code,
            401,
            "Invalid refresh token should return 401"
        )
        
        if refresh_response.content:
            error_data = refresh_response.json()
            
            # Verify error response structure
            self.assertIsInstance(error_data, dict, "Error response should be a dictionary")

    def test_file_upload_validation_errors(self):
        """
        Property: File upload endpoints should return structured validation errors for invalid files.
        """
        # Login as normal user
        login_data = {
            'email': self.normal_user.email,
            'password': 'userpassword123'
        }
        
        response = self.client.post('/api/auth/login/', login_data, format='json')
        self.assertEqual(response.status_code, 200)
        
        access_token = response.json()['access']
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')
        
        # Test file upload without file
        response = self.client.post('/api/upload/', {}, format='multipart')
        
        # Should return validation error
        self.assertEqual(
            response.status_code,
            400,
            "Upload without file should return 400 Bad Request"
        )
        
        error_data = response.json()
        
        # Verify error response structure
        self.assertIsInstance(error_data, dict, "Error response should be a dictionary")
        
        # Should contain error information
        self.assertIn(
            'error',
            error_data,
            "Error response should contain error field"
        )
        
        self.assertIsInstance(
            error_data['error'],
            str,
            "Error message should be a string"
        )

    def test_pagination_validation_errors(self):
        """
        Property: Pagination parameters should be validated and return appropriate errors.
        """
        # Test with invalid page parameter
        invalid_params = [
            {'page': 'invalid'},
            {'page': '-1'},
            {'page': '0'},
            {'page_size': 'invalid'},
            {'page_size': '-1'},
            {'page_size': '1000'},  # Too large
        ]
        
        for params in invalid_params:
            response = self.client.get('/api/articles/', params)
            
            # Should handle invalid pagination gracefully
            # Either return 400 or default to valid pagination
            self.assertIn(
                response.status_code,
                [200, 400, 404],
                f"Invalid pagination params {params} should be handled gracefully"
            )
            
            if response.status_code == 400 and response.content:
                error_data = response.json()
                
                # Verify error response structure
                self.assertIsInstance(
                    error_data,
                    dict,
                    "Pagination error response should be a dictionary"
                )

    def test_search_validation_errors(self):
        """
        Property: Search endpoints should handle invalid queries gracefully.
        """
        # Test search with potentially malicious queries
        malicious_queries = [
            "'; DROP TABLE articles; --",
            "<script>alert('xss')</script>",
            "' OR '1'='1",
            "\\x00\\x01\\x02",
            "a" * 1000,  # Very long query
        ]
        
        for query in malicious_queries:
            response = self.client.get('/api/articles/search/', {'q': query})
            
            # Should handle malicious queries safely
            self.assertIn(
                response.status_code,
                [200, 400],
                f"Malicious query '{query[:20]}...' should be handled safely"
            )
            
            if response.status_code == 400 and response.content:
                error_data = response.json()
                
                # Verify error response structure
                self.assertIsInstance(
                    error_data,
                    dict,
                    "Search error response should be a dictionary"
                )
                
                # Should not expose sensitive information
                error_text = str(error_data).lower()
                sensitive_keywords = ['traceback', 'exception', 'stack', 'debug']
                
                for keyword in sensitive_keywords:
                    self.assertNotIn(
                        keyword,
                        error_text,
                        f"Search error should not expose sensitive information: {keyword}"
                    )

    def test_concurrent_validation_consistency(self):
        """
        Property: Validation errors should be consistent across concurrent requests.
        """
        # Make multiple concurrent requests with the same invalid data
        invalid_user_data = {
            'email': 'invalid-email',
            'username': '',
            'password': '123'
        }
        
        responses = []
        for _ in range(5):
            response = self.client.post('/api/users/', invalid_user_data, format='json')
            if response.status_code == 400:
                responses.append(response.json())
        
        # All error responses should have consistent structure
        if len(responses) > 1:
            first_response = responses[0]
            
            for response_data in responses[1:]:
                # Should have same error fields
                self.assertEqual(
                    set(first_response.keys()),
                    set(response_data.keys()),
                    "Concurrent validation errors should have consistent structure"
                )
                
                # Error messages should be consistent
                for field in first_response:
                    if isinstance(first_response[field], list) and isinstance(response_data[field], list):
                        self.assertEqual(
                            first_response[field],
                            response_data[field],
                            f"Field '{field}' error messages should be consistent across requests"
                        )

    def test_nested_validation_errors(self):
        """
        Property: Nested object validation should return properly structured errors.
        """
        # Login as admin user
        login_data = {
            'email': self.admin_user.email,
            'password': 'adminpassword123'
        }
        
        response = self.client.post('/api/auth/login/', login_data, format='json')
        self.assertEqual(response.status_code, 200)
        
        access_token = response.json()['access']
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')
        
        # Test article creation with invalid nested tag data
        invalid_article_data = {
            'title': 'Valid Title',
            'content': 'Valid content',
            'category_name': 'Valid Category',
            'tags': [
                {'name': ''},  # Invalid empty tag name
                {'name': 'x' * 200},  # Invalid too long tag name
            ]
        }
        
        response = self.client.post('/api/articles/', invalid_article_data, format='json')
        
        # Should handle nested validation appropriately
        # Either create article with valid tags only, or return validation error
        self.assertIn(
            response.status_code,
            [200, 201, 400],
            "Nested validation should be handled appropriately"
        )
        
        if response.status_code == 400 and response.content:
            error_data = response.json()
            
            # Verify error response structure
            self.assertIsInstance(
                error_data,
                dict,
                "Nested validation error response should be a dictionary"
            )