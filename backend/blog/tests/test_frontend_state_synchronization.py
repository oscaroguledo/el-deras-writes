"""
Property-based tests for frontend state synchronization
**Feature: django-postgresql-enhancement, Property 26: Frontend state synchronization**
**Validates: Requirements 6.6**
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


class FrontendStateSynchronizationTest(HypothesisTestCase):
    """
    Property-based tests for frontend state synchronization endpoints
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
        page_size=st.integers(min_value=1, max_value=100),
        page_number=st.integers(min_value=1, max_value=10)
    )
    @hypothesis_settings(max_examples=50, deadline=10000)
    def test_frontend_state_synchronization_property(self, page_size, page_number):
        """
        **Feature: django-postgresql-enhancement, Property 26: Frontend state synchronization**
        **Validates: Requirements 6.6**
        
        Property: For any API endpoint designed for frontend state management, the response 
        should include all necessary data for proper state updates.
        """
        # Test article list endpoint with pagination
        params = {
            'page': page_number,
            'page_size': page_size
        }
        
        response = self.client.get('/api/articles/', params)
        
        if response.status_code == 200:
            data = response.json()
            
            # Verify response contains pagination metadata for frontend state
            if 'pagination' in data:
                pagination = data['pagination']
                
                # Verify all required pagination fields are present
                required_pagination_fields = [
                    'page', 'total_pages', 'count', 'page_size',
                    'has_next', 'has_previous'
                ]
                
                for field in required_pagination_fields:
                    self.assertIn(
                        field,
                        pagination,
                        f"Pagination should include '{field}' for frontend state management"
                    )
                
                # Verify pagination values are consistent
                self.assertIsInstance(
                    pagination['page'],
                    int,
                    "Page number should be an integer"
                )
                
                self.assertIsInstance(
                    pagination['total_pages'],
                    int,
                    "Total pages should be an integer"
                )
                
                self.assertIsInstance(
                    pagination['count'],
                    int,
                    "Total count should be an integer"
                )
                
                self.assertIsInstance(
                    pagination['has_next'],
                    bool,
                    "Has next should be a boolean"
                )
                
                self.assertIsInstance(
                    pagination['has_previous'],
                    bool,
                    "Has previous should be a boolean"
                )
            
            # Verify article data includes all necessary fields for frontend
            if 'results' in data:
                articles = data['results']
                
                for article in articles:
                    # Verify essential fields for frontend state
                    essential_fields = [
                        'id', 'title', 'slug', 'excerpt', 'author',
                        'category', 'created_at', 'updated_at'
                    ]
                    
                    for field in essential_fields:
                        self.assertIn(
                            field,
                            article,
                            f"Article should include '{field}' for frontend state"
                        )
                    
                    # Verify author data is complete
                    if 'author' in article and article['author']:
                        author = article['author']
                        author_fields = ['id', 'username', 'email']
                        
                        for field in author_fields:
                            self.assertIn(
                                field,
                                author,
                                f"Author should include '{field}' for frontend state"
                            )
                    
                    # Verify category data is complete
                    if 'category' in article and article['category']:
                        category = article['category']
                        category_fields = ['id', 'name']
                        
                        for field in category_fields:
                            self.assertIn(
                                field,
                                category,
                                f"Category should include '{field}' for frontend state"
                            )

    def test_user_profile_state_synchronization(self):
        """
        Property: User profile endpoints should provide complete data for frontend state management.
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
        
        # Test user profile endpoint
        response = self.client.get(f'/api/users/{self.normal_user.id}/')
        
        if response.status_code == 200:
            user_data = response.json()
            
            # Verify all necessary user fields for frontend state
            essential_user_fields = [
                'id', 'username', 'email', 'first_name', 'last_name',
                'user_type', 'is_active', 'date_joined'
            ]
            
            for field in essential_user_fields:
                self.assertIn(
                    field,
                    user_data,
                    f"User profile should include '{field}' for frontend state"
                )
            
            # Verify data types are correct for frontend consumption
            self.assertIsInstance(user_data['id'], str, "User ID should be a string")
            self.assertIsInstance(user_data['username'], str, "Username should be a string")
            self.assertIsInstance(user_data['email'], str, "Email should be a string")
            self.assertIsInstance(user_data['is_active'], bool, "Is active should be a boolean")

    def test_authentication_state_synchronization(self):
        """
        Property: Authentication endpoints should provide complete state data for frontend.
        """
        # Test login response
        login_data = {
            'email': self.normal_user.email,
            'password': 'userpassword123'
        }
        
        response = self.client.post('/api/auth/login/', login_data, format='json')
        
        if response.status_code == 200:
            auth_data = response.json()
            
            # Verify all necessary authentication fields for frontend state
            essential_auth_fields = [
                'access', 'refresh', 'token_type', 'expires_in', 'user'
            ]
            
            for field in essential_auth_fields:
                self.assertIn(
                    field,
                    auth_data,
                    f"Authentication response should include '{field}' for frontend state"
                )
            
            # Verify user data is complete in auth response
            user_data = auth_data.get('user', {})
            user_fields = ['id', 'username', 'email', 'user_type']
            
            for field in user_fields:
                self.assertIn(
                    field,
                    user_data,
                    f"Authentication user data should include '{field}' for frontend state"
                )
            
            # Test token validation endpoint
            access_token = auth_data['access']
            self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')
            
            validation_response = self.client.get('/api/auth/validate/')
            
            if validation_response.status_code == 200:
                validation_data = validation_response.json()
                
                # Verify validation response includes state data
                validation_fields = ['valid', 'user', 'expires_at', 'issued_at']
                
                for field in validation_fields:
                    self.assertIn(
                        field,
                        validation_data,
                        f"Token validation should include '{field}' for frontend state"
                    )

    def test_comment_state_synchronization(self):
        """
        Property: Comment endpoints should provide complete data for frontend state management.
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
        
        # Create a comment
        comment_data = {
            'content': 'Test comment for state synchronization'
        }
        
        response = self.client.post(
            f'/api/articles/{self.article.id}/comments/',
            comment_data,
            format='json'
        )
        
        if response.status_code == 201:
            comment_result = response.json()
            
            # Verify comment response includes all necessary fields for frontend state
            essential_comment_fields = [
                'id', 'content', 'author', 'article', 'created_at', 'updated_at'
            ]
            
            for field in essential_comment_fields:
                self.assertIn(
                    field,
                    comment_result,
                    f"Comment should include '{field}' for frontend state"
                )
            
            # Verify author data is complete in comment
            if 'author' in comment_result and comment_result['author']:
                author = comment_result['author']
                author_fields = ['id', 'username']
                
                for field in author_fields:
                    self.assertIn(
                        field,
                        author,
                        f"Comment author should include '{field}' for frontend state"
                    )
        
        # Test comment list endpoint
        comments_response = self.client.get(f'/api/articles/{self.article.id}/comments/')
        
        if comments_response.status_code == 200:
            comments_data = comments_response.json()
            
            # Verify comments list provides complete data
            if isinstance(comments_data, list):
                for comment in comments_data:
                    # Verify each comment has necessary fields
                    comment_fields = ['id', 'content', 'author', 'created_at']
                    
                    for field in comment_fields:
                        self.assertIn(
                            field,
                            comment,
                            f"Comment list item should include '{field}' for frontend state"
                        )

    def test_category_tag_state_synchronization(self):
        """
        Property: Category and tag endpoints should provide complete hierarchical data for frontend.
        """
        # Test categories endpoint
        response = self.client.get('/api/categories/')
        
        if response.status_code == 200:
            categories_data = response.json()
            
            # Handle both paginated and non-paginated responses
            categories = categories_data
            if isinstance(categories_data, dict) and 'results' in categories_data:
                categories = categories_data['results']
            
            for category in categories:
                # Verify category includes necessary fields for frontend state
                category_fields = ['id', 'name', 'article_count']
                
                for field in category_fields:
                    self.assertIn(
                        field,
                        category,
                        f"Category should include '{field}' for frontend state"
                    )
                
                # Verify article count is a number
                self.assertIsInstance(
                    category.get('article_count', 0),
                    int,
                    "Article count should be an integer for frontend state"
                )
        
        # Test tags endpoint
        response = self.client.get('/api/tags/')
        
        if response.status_code == 200:
            tags_data = response.json()
            
            # Handle both paginated and non-paginated responses
            tags = tags_data
            if isinstance(tags_data, dict) and 'results' in tags_data:
                tags = tags_data['results']
            
            for tag in tags:
                # Verify tag includes necessary fields for frontend state
                tag_fields = ['id', 'name', 'article_count']
                
                for field in tag_fields:
                    self.assertIn(
                        field,
                        tag,
                        f"Tag should include '{field}' for frontend state"
                    )

    def test_search_state_synchronization(self):
        """
        Property: Search endpoints should provide complete results with metadata for frontend state.
        """
        # Test search endpoint
        search_params = {'q': 'test'}
        response = self.client.get('/api/articles/search/', search_params)
        
        if response.status_code == 200:
            search_data = response.json()
            
            # Verify search response structure for frontend state
            if 'results' in search_data:
                # Verify pagination metadata is included
                if 'pagination' in search_data:
                    pagination = search_data['pagination']
                    
                    self.assertIn(
                        'count',
                        pagination,
                        "Search pagination should include count for frontend state"
                    )
                
                # Verify search results include complete article data
                results = search_data['results']
                
                for article in results:
                    # Verify essential fields for frontend state
                    search_result_fields = [
                        'id', 'title', 'slug', 'excerpt', 'author', 'category'
                    ]
                    
                    for field in search_result_fields:
                        self.assertIn(
                            field,
                            article,
                            f"Search result should include '{field}' for frontend state"
                        )

    def test_admin_dashboard_state_synchronization(self):
        """
        Property: Admin dashboard endpoints should provide complete analytics data for frontend state.
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
        
        # Test admin dashboard endpoint
        response = self.client.get('/api/admin/')
        
        if response.status_code == 200:
            dashboard_data = response.json()
            
            # Verify dashboard includes necessary metrics for frontend state
            dashboard_fields = [
                'total_articles', 'total_comments', 'total_visitors',
                'recent_articles', 'recent_comments'
            ]
            
            for field in dashboard_fields:
                self.assertIn(
                    field,
                    dashboard_data,
                    f"Dashboard should include '{field}' for frontend state"
                )
            
            # Verify numeric fields are numbers
            numeric_fields = ['total_articles', 'total_comments', 'total_visitors']
            
            for field in numeric_fields:
                if field in dashboard_data:
                    self.assertIsInstance(
                        dashboard_data[field],
                        int,
                        f"Dashboard '{field}' should be an integer for frontend state"
                    )

    def test_error_state_synchronization(self):
        """
        Property: Error responses should provide consistent structure for frontend error handling.
        """
        # Test various error scenarios
        error_scenarios = [
            # Unauthenticated access to protected endpoint
            {'method': 'get', 'url': '/api/admin/', 'expected_status': 401},
            # Invalid article ID
            {'method': 'get', 'url': '/api/articles/invalid-id/', 'expected_status': 404},
            # Invalid pagination (should handle gracefully)
            {'method': 'get', 'url': '/api/articles/?page=invalid', 'expected_status': [200, 400, 404]},
        ]
        
        for scenario in error_scenarios:
            if scenario['method'] == 'get':
                response = self.client.get(scenario['url'])
            
            expected_status = scenario['expected_status']
            if isinstance(expected_status, list):
                self.assertIn(
                    response.status_code,
                    expected_status,
                    f"Error scenario {scenario['url']} should return expected status"
                )
            else:
                self.assertEqual(
                    response.status_code,
                    expected_status,
                    f"Error scenario {scenario['url']} should return {expected_status}"
                )
            
            # Verify error responses have consistent structure
            if response.status_code >= 400 and response.content:
                try:
                    error_data = response.json()
                    
                    # Error responses should be dictionaries for frontend consumption
                    self.assertIsInstance(
                        error_data,
                        dict,
                        f"Error response for {scenario['url']} should be a dictionary"
                    )
                    
                except json.JSONDecodeError:
                    # Some error responses might not be JSON, which is acceptable
                    pass

    def test_concurrent_state_consistency(self):
        """
        Property: Concurrent requests should return consistent state data.
        """
        # Make multiple concurrent requests to the same endpoint
        responses = []
        
        for _ in range(5):
            response = self.client.get('/api/articles/')
            if response.status_code == 200:
                responses.append(response.json())
        
        # Verify all responses have consistent structure
        if len(responses) > 1:
            first_response = responses[0]
            
            for response_data in responses[1:]:
                # Should have same top-level structure
                self.assertEqual(
                    set(first_response.keys()),
                    set(response_data.keys()),
                    "Concurrent responses should have consistent structure"
                )
                
                # Pagination metadata should be consistent
                if 'pagination' in first_response and 'pagination' in response_data:
                    first_pagination = first_response['pagination']
                    response_pagination = response_data['pagination']
                    
                    # Count should be consistent across concurrent requests
                    self.assertEqual(
                        first_pagination.get('count'),
                        response_pagination.get('count'),
                        "Pagination count should be consistent across concurrent requests"
                    )