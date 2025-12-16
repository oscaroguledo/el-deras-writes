"""
Property-based tests for API response consistency.
**Feature: django-postgresql-enhancement, Property 22: API response consistency**
**Validates: Requirements 6.1**
"""

from django.test import TestCase
from django.urls import reverse
from hypothesis import given, strategies as st, settings as hypothesis_settings, assume
from hypothesis.extra.django import TestCase as HypothesisTestCase

from rest_framework.test import APIClient
from blog.models import CustomUser, Article, Category, Comment
import string
import uuid
import json

class APIResponseConsistencyTest(HypothesisTestCase):
    """
    Property-based tests to ensure API responses maintain consistent structure and data types.
    """

    def setUp(self):
        """Set up test environment."""
        self.client = APIClient()
        self.user = CustomUser.objects.create_user(
            email='testuser@example.com',
            username='testuser',
            password='testpassword123',
            first_name='Test',
            last_name='User'
        )
        self.category = Category.objects.create(name='Test Category')
        self.article = Article.objects.create(
            title='Test Article',
            content='This is the content of a test article.',
            author=self.user,
            category=self.category,
            status='published'
        )
        self.comment = Comment.objects.create(
            article=self.article,
            author=self.user,
            content='This is a test comment.',
            approved=True
        )

    def tearDown(self):
        """Clean up after each test."""
        CustomUser.objects.all().delete()
        Article.objects.all().delete()
        Category.objects.all().delete()
        Comment.objects.all().delete()

    @given(
        resource_type=st.sampled_from(['articles', 'categories', 'comments']),
        item_id=st.uuids()
    )
    @hypothesis_settings(max_examples=10, deadline=None)
    def test_api_detail_response_structure(self, resource_type, item_id):
        """
        Property: API detail responses for various resources should conform to expected structure.
        """
        url = None
        expected_fields = []
        actual_id = None

        if resource_type == 'articles':
            url = reverse('article-detail', kwargs={'pk': self.article.id})
            expected_fields = ['id', 'title', 'content', 'author', 'category', 'status', 'created_at']
            actual_id = self.article.id
        elif resource_type == 'categories':
            url = reverse('category-detail', kwargs={'pk': self.category.id})
            expected_fields = ['id', 'name', 'description', 'created_at']
            actual_id = self.category.id
        elif resource_type == 'comments':
            url = reverse('article-comments-detail', kwargs={'article_pk': self.article.id, 'pk': self.comment.id})
            expected_fields = ['id', 'article', 'author', 'content', 'created_at']
            actual_id = self.comment.id

        assume(url is not None)

        response = self.client.get(url, format='json')
        self.assertEqual(response.status_code, 200)
        
        data = response.json()
        
        self.assertIsInstance(data, dict, "Response should be a dictionary")
        
        # Check for presence of expected fields
        for field in expected_fields:
            self.assertIn(field, data, f"Response for {resource_type} should contain '{field}' field")
        
        # Check ID consistency
        self.assertEqual(str(data['id']), str(actual_id), f"ID in response for {resource_type} should match requested ID")
        
        # Basic type checking for common fields
        self.assertIsInstance(data['id'], str)
        if 'title' in data:
            self.assertIsInstance(data['title'], str)
        if 'name' in data:
            self.assertIsInstance(data['name'], str)
        if 'content' in data:
            self.assertIsInstance(data['content'], str)
        if 'created_at' in data:
            self.assertIsInstance(data['created_at'], str) # datetime strings

    @given(
        page_size=st.integers(min_value=1, max_value=5),
        page_number=st.integers(min_value=1, max_value=3)
    )
    @hypothesis_settings(max_examples=5, deadline=None)
    def test_api_list_response_pagination_structure(self, page_size, page_number):
        """
        Property: API list responses should consistently use pagination structure.
        """
        # Create enough articles to test pagination
        for i in range(10):
            Article.objects.create(
                title=f'Pagination Article {i}',
                content=f'Content for pagination article {i}',
                author=self.user,
                status='published'
            )
        
        url = reverse('article-list')
        response = self.client.get(f"{url}?page_size={page_size}&page={page_number}", format='json')
        self.assertEqual(response.status_code, 200)
        
        data = response.json()
        
        self.assertIsInstance(data, dict, "List response should be a dictionary")
        self.assertIn('results', data, "List response should contain 'results' key")
        self.assertIsInstance(data['results'], list, "'results' should be a list")
        
        self.assertIn('pagination', data, "List response should contain 'pagination' key")
        self.assertIsInstance(data['pagination'], dict, "'pagination' should be a dictionary")
        self.assertIn('count', data['pagination'], "Pagination data should contain 'count' key")
        self.assertIsInstance(data['pagination']['count'], int, "Pagination 'count' should be an integer")
        
        # Optional pagination fields
        if 'next' in data['pagination']:
            self.assertIsInstance(data['pagination']['next'], (str, type(None)), "'next' should be a string or None")
        if 'previous' in data['pagination']:
            self.assertIsInstance(data['pagination']['previous'], (str, type(None)), "'previous' should be a string or None")

    @given(
        invalid_id_type=st.sampled_from(['abc', '123-invalid-uuid', '']),
        resource_type=st.sampled_from(['articles', 'categories', 'comments'])
    )
    @hypothesis_settings(max_examples=5, deadline=None)
    def test_api_error_response_consistency(self, invalid_id_type, resource_type):
        """
        Property: API error responses (e.g., 404 Not Found) should have a consistent structure.
        """
        assume(invalid_id_type != '')
        url = None
        if resource_type == 'articles':
            url = reverse('article-detail', kwargs={'pk': invalid_id_type})
        elif resource_type == 'categories':
            url = reverse('category-detail', kwargs={'pk': invalid_id_type})
        elif resource_type == 'comments':
            # Comments are nested, so we need a valid article_pk even for an invalid comment pk
            url = reverse('article-comments-detail', kwargs={'article_pk': self.article.id, 'pk': invalid_id_type})
        
        assume(url is not None)

        response = self.client.get(url, format='json')
        
        # Expecting 404 Not Found or 400 Bad Request for invalid UUIDs
        self.assertIn(response.status_code, [404, 400], "Invalid ID requests should result in 404 or 400")
        
        data = response.json()
        
        self.assertIsInstance(data, dict, "Error response should be a dictionary")
        self.assertIn('detail', data, "Error response should contain a 'detail' field")
        self.assertIsInstance(data['detail'], str, "'detail' field should be a string")
