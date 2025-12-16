"""
Property-based tests for search result relevance.
**Feature: django-postgresql-enhancement, Property 4: Search result relevance**
**Validates: Requirements 1.4**
"""

from django.test import TestCase
from django.utils import timezone
from hypothesis import given, strategies as st, settings as hypothesis_settings, assume
from hypothesis.extra.django import TestCase as HypothesisTestCase

from blog.models import CustomUser, Article, Category
from blog.views import ArticleViewSet # Assuming search logic is within this view or its serializer
from rest_framework.test import APIClient
import string
import uuid
from django.urls import reverse

class SearchResultRelevanceTest(HypothesisTestCase):
    """
    Property-based tests to ensure search results are relevant to the query,
    especially with PostgreSQL full-text search.
    """

    def setUp(self):
        """Set up test environment by creating users and articles."""
        self.client = APIClient()
        self.user = CustomUser.objects.create_user(
            email='testuser@example.com',
            username='testuser',
            password='testpassword123',
            first_name='Test',
            last_name='User'
        )
        self.category = Category.objects.create(name='Test Category')
        self.admin_user = CustomUser.objects.create_superuser(
            email='admin@example.com',
            username='adminuser',
            password='adminpassword',
        )

        # Log in admin user to create articles
        self.client.force_authenticate(user=self.admin_user)

    def tearDown(self):
        """Clean up after each test."""
        self.client.force_authenticate(user=None) # Log out
        CustomUser.objects.all().delete()
        Article.objects.all().delete()
        Category.objects.all().delete()

    @given(
        data=st.data(),
        keyword=st.text(min_size=1, max_size=20, alphabet=string.ascii_letters + string.digits),
        num_matching_articles=st.integers(min_value=1, max_value=3),
        num_non_matching_articles=st.integers(min_value=0, max_value=2)
    )
    @hypothesis_settings(max_examples=10, deadline=None)
    def test_search_results_contain_relevant_articles(self, data, keyword, num_matching_articles, num_non_matching_articles):
        """
        Property: When searching with a keyword, all returned articles should contain that keyword,
        and articles without the keyword should not be returned.
        """
        assume(keyword.strip() != '')

        # Create matching articles
        for _ in range(num_matching_articles):
            Article.objects.create(
                title=f"Article about {keyword} {uuid.uuid4().hex[:4]}",
                content=f"This content extensively discusses {keyword} and related topics.",
                author=self.user,
                category=self.category,
                status='published'
            )
        
        # Create non-matching articles
        for _ in range(num_non_matching_articles):
            non_matching_keyword = ""
            while non_matching_keyword == "" or keyword.lower() in non_matching_keyword.lower():
                non_matching_keyword = data.draw(st.text(min_size=5, max_size=15, alphabet=string.ascii_letters))

            Article.objects.create(
                title=f"General article on {non_matching_keyword} {uuid.uuid4().hex[:4]}",
                content=f"This content is about {non_matching_keyword}.",
                author=self.user,
                category=self.category,
                status='published'
            )
        
        search_url = reverse('article-list') # Assuming '/api/articles/' is the base for article list
        response = self.client.get(f"{search_url}?search={keyword}", format='json')
        self.assertEqual(response.status_code, 200)
        
        results = response.json().get('results', [])
        
        # Verify that all returned articles contain the keyword
        for article_data in results:
            article_content = article_data.get('title', '') + " " + article_data.get('content', '')
            self.assertIn(keyword.lower(), article_content.lower(), 
                          f"Article '{article_data.get('title')}' should contain the keyword '{keyword}'")
        
        # Verify that the number of matching articles is correct
        # This assumes the search is perfect and returns only matching articles
        # and that all matching articles are returned. This might be too strict for full-text search.
        # A more robust test would verify that _some_ relevant articles are returned and _no_ irrelevant ones.
        # For now, we will verify that the number of returned articles is equal to the number of matching articles created.
        self.assertEqual(len(results), num_matching_articles, 
                         f"Expected {num_matching_articles} matching articles for keyword '{keyword}', but got {len(results)}")