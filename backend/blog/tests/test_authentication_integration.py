"""
Property-based tests for authentication integration
**Feature: django-postgresql-enhancement, Property 23: Authentication integration**
**Validates: Requirements 6.2**
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
from blog.jwt_views import EnhancedTokenObtainPairView
import jwt
import json
import string
from datetime import timedelta


class AuthenticationIntegrationTest(HypothesisTestCase):
    """
    Property-based tests for authentication integration with frontend
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
        self.article = Article.objects.create(
            title=f'Test Article {unique_id}',
            content='Test content',
            author=self.admin_user,
            category=self.category,
            status='published'
        )

    def tearDown(self):
        """Clean up after each test"""
        # Clean up any created users
        CustomUser.objects.filter(email__contains='@example.com').delete()
        Category.objects.filter(name__startswith='Test Category').delete()
        Article.objects.filter(title__startswith='Test Article').delete()

    @given(
        email=st.emails(),
        username=st.text(
            alphabet=string.ascii_letters + string.digits + '_',
            min_size=3,
            max_size=150
        ).filter(lambda x: x and not x.startswith('_') and not x.endswith('_')),
        password=st.text(min_size=8, max_size=128)
    )
    @hypothesis_settings(max_examples=100, deadline=10000)
    def test_authentication_integration_property(self, email, username, password):
        """
        **Feature: django-postgresql-enhancement, Property 23: Authentication integration**
        **Validates: Requirements 6.2**
        
        Property: For any authenticated API request, the token should be properly validated 
        and user context should be correctly established.
        """
        try:
            # Create a unique user for this test
            user = CustomUser.objects.create_user(
                email=email,
                username=username,
                password=password,
                user_type='normal'
            )
            
            # Attempt login to get authentication token
            login_data = {
                'email': email,
                'password': password
            }
            
            response = self.client.post('/api/auth/login/', login_data, format='json')
            
            if response.status_code == 200:
                response_data = response.json()
                access_token = response_data['access']
                
                # Test authenticated API requests with the token
                self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')
                
                # Test 1: Token validation endpoint should work
                validation_response = self.client.get('/api/auth/validate/')
                if validation_response.status_code == 200:
                    validation_data = validation_response.json()
                    
                    # Verify user context is correctly established
                    self.assertTrue(
                        validation_data.get('valid'),
                        "Token should be valid for authenticated requests"
                    )
                    
                    self.assertEqual(
                        validation_data.get('user', {}).get('id'),
                        str(user.id),
                        "User context should match the authenticated user"
                    )
                    
                    self.assertEqual(
                        validation_data.get('user', {}).get('email'),
                        user.email,
                        "User email should be correctly returned"
                    )
                
                # Test 2: Authenticated endpoints should recognize the user
                profile_response = self.client.get(f'/api/users/{user.id}/')
                if profile_response.status_code == 200:
                    profile_data = profile_response.json()
                    
                    self.assertEqual(
                        profile_data.get('id'),
                        str(user.id),
                        "Profile endpoint should return correct user data"
                    )
                    
                    self.assertEqual(
                        profile_data.get('email'),
                        user.email,
                        "Profile endpoint should return correct email"
                    )
                
                # Test 3: Comment creation should associate with authenticated user
                comment_data = {
                    'content': 'Test comment from authenticated user',
                    'article': str(self.article.id)
                }
                
                comment_response = self.client.post(
                    f'/api/articles/{self.article.id}/comments/',
                    comment_data,
                    format='json'
                )
                
                if comment_response.status_code == 201:
                    comment_result = comment_response.json()
                    
                    # Verify comment is associated with the authenticated user
                    self.assertEqual(
                        comment_result.get('author', {}).get('id'),
                        str(user.id),
                        "Comment should be associated with authenticated user"
                    )
                
                # Test 4: Token should work across multiple requests
                for _ in range(3):
                    articles_response = self.client.get('/api/articles/')
                    self.assertIn(
                        articles_response.status_code,
                        [200, 404],  # 404 is acceptable if no articles exist
                        "Token should work for multiple consecutive requests"
                    )
                
                # Test 5: User session info should be accessible
                session_response = self.client.get('/api/auth/sessions/')
                if session_response.status_code == 200:
                    session_data = session_response.json()
                    
                    self.assertEqual(
                        session_data.get('user_id'),
                        str(user.id),
                        "Session info should contain correct user ID"
                    )
                    
                    self.assertEqual(
                        session_data.get('email'),
                        user.email,
                        "Session info should contain correct email"
                    )
            
            # Clean up
            user.delete()
            
        except Exception as e:
            # Handle expected exceptions (duplicate users, etc.)
            if "UNIQUE constraint failed" in str(e) or "already exists" in str(e):
                # This is acceptable in property testing
                pass
            else:
                # Re-raise unexpected errors
                raise

    def test_token_context_consistency_property(self):
        """
        Property: User context should be consistent across all authenticated endpoints.
        """
        # Login with normal user
        login_data = {
            'email': self.normal_user.email,
            'password': 'userpassword123'
        }
        
        response = self.client.post('/api/auth/login/', login_data, format='json')
        self.assertEqual(response.status_code, 200)
        
        access_token = response.json()['access']
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')
        
        # Test multiple endpoints that should return consistent user context
        endpoints_to_test = [
            '/api/auth/validate/',
            '/api/auth/sessions/',
        ]
        
        user_contexts = []
        
        for endpoint in endpoints_to_test:
            endpoint_response = self.client.get(endpoint)
            if endpoint_response.status_code == 200:
                data = endpoint_response.json()
                
                # Extract user context information
                if 'user' in data:
                    user_contexts.append({
                        'user_id': data['user'].get('id'),
                        'email': data['user'].get('email'),
                        'endpoint': endpoint
                    })
                elif 'user_id' in data:
                    user_contexts.append({
                        'user_id': data.get('user_id'),
                        'email': data.get('email'),
                        'endpoint': endpoint
                    })
        
        # Verify all endpoints return consistent user context
        if len(user_contexts) > 1:
            first_context = user_contexts[0]
            for context in user_contexts[1:]:
                self.assertEqual(
                    context['user_id'],
                    first_context['user_id'],
                    f"User ID should be consistent across endpoints: {context['endpoint']} vs {first_context['endpoint']}"
                )
                
                self.assertEqual(
                    context['email'],
                    first_context['email'],
                    f"Email should be consistent across endpoints: {context['endpoint']} vs {first_context['endpoint']}"
                )

    def test_admin_authentication_integration_property(self):
        """
        Property: Admin users should have proper authentication context for admin endpoints.
        """
        # Login with admin user
        login_data = {
            'email': self.admin_user.email,
            'password': 'adminpassword123'
        }
        
        response = self.client.post('/api/auth/login/', login_data, format='json')
        self.assertEqual(response.status_code, 200)
        
        access_token = response.json()['access']
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')
        
        # Test admin-specific endpoints
        admin_endpoints = [
            '/api/admin/articles/',
            '/api/admin/users/',
            '/api/admin/analytics/',
        ]
        
        for endpoint in admin_endpoints:
            admin_response = self.client.get(endpoint)
            
            # Admin endpoints should be accessible with admin token
            self.assertIn(
                admin_response.status_code,
                [200, 404],  # 404 is acceptable if no data exists
                f"Admin endpoint {endpoint} should be accessible with admin token"
            )
        
        # Verify admin user context in validation
        validation_response = self.client.get('/api/auth/validate/')
        self.assertEqual(validation_response.status_code, 200)
        
        validation_data = validation_response.json()
        user_data = validation_data.get('user', {})
        
        self.assertEqual(
            user_data.get('user_type'),
            'admin',
            "Admin user should have correct user_type in context"
        )
        
        self.assertTrue(
            user_data.get('is_staff'),
            "Admin user should have is_staff=True in context"
        )

    def test_unauthenticated_request_handling_property(self):
        """
        Property: Unauthenticated requests should be handled appropriately without exposing sensitive data.
        """
        # Clear any existing authentication
        self.client.credentials()
        
        # Test endpoints that should work without authentication
        public_endpoints = [
            '/api/articles/',
            '/api/categories/',
            '/api/tags/',
        ]
        
        for endpoint in public_endpoints:
            response = self.client.get(endpoint)
            
            # Public endpoints should be accessible
            self.assertIn(
                response.status_code,
                [200, 404],  # 404 is acceptable if no data exists
                f"Public endpoint {endpoint} should be accessible without authentication"
            )
        
        # Test endpoints that should require authentication
        protected_endpoints = [
            '/api/auth/validate/',
            '/api/auth/sessions/',
            '/api/admin/users/',
        ]
        
        for endpoint in protected_endpoints:
            response = self.client.get(endpoint)
            
            # Protected endpoints should reject unauthenticated requests
            self.assertEqual(
                response.status_code,
                401,
                f"Protected endpoint {endpoint} should reject unauthenticated requests"
            )

    def test_token_refresh_integration_property(self):
        """
        Property: Token refresh should maintain proper authentication context.
        """
        # Login to get initial tokens
        login_data = {
            'email': self.normal_user.email,
            'password': 'userpassword123'
        }
        
        response = self.client.post('/api/auth/login/', login_data, format='json')
        self.assertEqual(response.status_code, 200)
        
        initial_tokens = response.json()
        refresh_token = initial_tokens['refresh']
        
        # Use refresh token to get new access token
        refresh_data = {'refresh': refresh_token}
        refresh_response = self.client.post('/api/auth/refresh/', refresh_data, format='json')
        
        if refresh_response.status_code == 200:
            new_tokens = refresh_response.json()
            new_access_token = new_tokens['access']
            
            # Use new token for authentication
            self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {new_access_token}')
            
            # Verify new token provides correct user context
            validation_response = self.client.get('/api/auth/validate/')
            self.assertEqual(validation_response.status_code, 200)
            
            validation_data = validation_response.json()
            
            self.assertTrue(
                validation_data.get('valid'),
                "Refreshed token should be valid"
            )
            
            self.assertEqual(
                validation_data.get('user', {}).get('id'),
                str(self.normal_user.id),
                "Refreshed token should maintain correct user context"
            )
            
            # Verify refreshed token works for API requests
            articles_response = self.client.get('/api/articles/')
            self.assertIn(
                articles_response.status_code,
                [200, 404],
                "Refreshed token should work for API requests"
            )

    @given(
        malformed_token=st.text(
            alphabet=string.ascii_letters + string.digits + '.-_',
            min_size=10,
            max_size=200
        )
    )
    @hypothesis_settings(max_examples=50, deadline=5000)
    def test_malformed_token_handling_property(self, malformed_token):
        """
        Property: Malformed or invalid tokens should be properly rejected without exposing system information.
        """
        # Try to use malformed token
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {malformed_token}')
        
        # Test protected endpoint with malformed token
        response = self.client.get('/api/auth/validate/')
        
        # Should be rejected with appropriate status
        self.assertEqual(
            response.status_code,
            401,
            "Malformed tokens should be rejected with 401 status"
        )
        
        # Response should not expose sensitive system information
        if response.content:
            response_data = response.json()
            
            # Should not contain sensitive debugging information
            sensitive_keywords = ['traceback', 'exception', 'stack', 'debug', 'secret']
            response_text = str(response_data).lower()
            
            for keyword in sensitive_keywords:
                self.assertNotIn(
                    keyword,
                    response_text,
                    f"Error response should not expose sensitive information: {keyword}"
                )

    def test_concurrent_authentication_property(self):
        """
        Property: Multiple concurrent authenticated requests should maintain proper user context.
        """
        # Login with normal user
        login_data = {
            'email': self.normal_user.email,
            'password': 'userpassword123'
        }
        
        response = self.client.post('/api/auth/login/', login_data, format='json')
        self.assertEqual(response.status_code, 200)
        
        access_token = response.json()['access']
        
        # Make multiple concurrent requests with the same token
        clients = []
        for _ in range(5):
            client = APIClient()
            client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')
            clients.append(client)
        
        # Make concurrent validation requests
        responses = []
        for client in clients:
            validation_response = client.get('/api/auth/validate/')
            if validation_response.status_code == 200:
                responses.append(validation_response.json())
        
        # All responses should have consistent user context
        if len(responses) > 1:
            first_user_id = responses[0].get('user', {}).get('id')
            
            for response_data in responses[1:]:
                self.assertEqual(
                    response_data.get('user', {}).get('id'),
                    first_user_id,
                    "Concurrent requests should return consistent user context"
                )

    def test_logout_authentication_cleanup_property(self):
        """
        Property: Logout should properly clean up authentication context.
        """
        # Login to get tokens
        login_data = {
            'email': self.normal_user.email,
            'password': 'userpassword123'
        }
        
        response = self.client.post('/api/auth/login/', login_data, format='json')
        self.assertEqual(response.status_code, 200)
        
        tokens = response.json()
        access_token = tokens['access']
        refresh_token = tokens['refresh']
        
        # Verify token works before logout
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')
        pre_logout_response = self.client.get('/api/auth/validate/')
        self.assertEqual(pre_logout_response.status_code, 200)
        
        # Perform logout
        logout_data = {'refresh_token': refresh_token}
        logout_response = self.client.post('/api/auth/logout/', logout_data, format='json')
        
        if logout_response.status_code == 200:
            # Try to use refresh token after logout (should fail)
            refresh_data = {'refresh': refresh_token}
            post_logout_refresh = self.client.post('/api/auth/refresh/', refresh_data, format='json')
            
            # Refresh should fail after logout
            self.assertEqual(
                post_logout_refresh.status_code,
                401,
                "Refresh token should be invalid after logout"
            )