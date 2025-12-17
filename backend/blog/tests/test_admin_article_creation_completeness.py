"""
Property-based tests for admin article creation completeness.

**Feature: django-postgresql-enhancement, Property 10: Admin article creation completeness**
**Validates: Requirements 3.1**
"""

from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from hypothesis import given, strategies as st, settings
from hypothesis.extra.django import TestCase as HypothesisTestCase
from blog.models import Article, Category, Tag, CustomUser
import json
import uuid

User = get_user_model()


class AdminArticleCreationCompletenessTest(HypothesisTestCase):
    """Property-based tests for admin article creation completeness."""
    
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
        
        # Create test category and tags
        self.category = Category.objects.create(
            name=f'Test Category {test_id}',
            description='Test category description'
        )
        
        self.tag1 = Tag.objects.create(name=f'Test Tag 1 {test_id}')
        self.tag2 = Tag.objects.create(name=f'Test Tag 2 {test_id}')

    @given(
        title=st.text(min_size=1, max_size=200, alphabet=st.characters(blacklist_categories=['Cc', 'Cs'])).filter(lambda x: x.strip()),
        content=st.text(min_size=10, max_size=1000, alphabet=st.characters(blacklist_categories=['Cc', 'Cs'])),
        excerpt=st.text(min_size=0, max_size=500, alphabet=st.characters(blacklist_categories=['Cc', 'Cs'])),
        status=st.sampled_from(['draft', 'published', 'archived']),
        featured=st.booleans(),
        read_time=st.integers(min_value=1, max_value=60)
    )
    @settings(max_examples=100, deadline=None)
    def test_admin_article_creation_stores_all_metadata(self, title, content, excerpt, status, featured, read_time):
        """
        Property: For any article created by an administrator, all provided metadata 
        (categories, tags, status) should be properly stored and retrievable.
        
        **Feature: django-postgresql-enhancement, Property 10: Admin article creation completeness**
        **Validates: Requirements 3.1**
        """
        # Authenticate as admin
        self.client.force_authenticate(user=self.admin_user)
        
        # Prepare article data with all metadata
        article_data = {
            'title': title,
            'content': content,
            'excerpt': excerpt,
            'status': status,
            'featured': featured,
            'read_time': read_time,
            'category': str(self.category.id),
            'tags': [str(self.tag1.id), str(self.tag2.id)]
        }
        
        # Create article via admin API
        response = self.client.post('/api/admin/articles/', article_data, format='json')
        
        # Verify article was created successfully
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Get the created article ID
        article_id = response.data['id']
        
        # Retrieve the article from database
        created_article = Article.objects.get(id=article_id)
        
        # Verify all metadata is properly stored
        self.assertEqual(created_article.title, title.strip())  # Title might be stripped
        self.assertEqual(created_article.content, content)
        self.assertEqual(created_article.excerpt, excerpt)
        self.assertEqual(created_article.status, status)
        self.assertEqual(created_article.featured, featured)
        self.assertEqual(created_article.read_time, read_time)
        
        # Verify category association
        self.assertEqual(created_article.category, self.category)
        
        # Verify tag associations
        article_tags = list(created_article.tags.all())
        self.assertIn(self.tag1, article_tags)
        self.assertIn(self.tag2, article_tags)
        self.assertEqual(len(article_tags), 2)
        
        # Verify author is set to admin user
        self.assertEqual(created_article.author, self.admin_user)
        
        # Verify article is retrievable via API
        get_response = self.client.get(f'/api/admin/articles/{article_id}/')
        self.assertEqual(get_response.status_code, status.HTTP_200_OK)
        
        # Verify all metadata is present in API response
        response_data = get_response.data
        self.assertEqual(response_data['title'], title.strip())  # Title might be stripped
        self.assertEqual(response_data['content'], content)
        self.assertEqual(response_data['excerpt'], excerpt)
        self.assertEqual(response_data['status'], status)
        self.assertEqual(response_data['featured'], featured)
        self.assertEqual(response_data['read_time'], read_time)
        self.assertEqual(response_data['category']['id'], str(self.category.id))
        
        # Verify tags in response
        response_tag_ids = [tag['id'] for tag in response_data['tags']]
        self.assertIn(str(self.tag1.id), response_tag_ids)
        self.assertIn(str(self.tag2.id), response_tag_ids)

    @given(
        title=st.text(min_size=1, max_size=200, alphabet=st.characters(blacklist_categories=['Cc', 'Cs'])).filter(lambda x: x.strip()),
        content=st.text(min_size=10, max_size=1000, alphabet=st.characters(blacklist_categories=['Cc', 'Cs']))
    )
    @settings(max_examples=50, deadline=None)
    def test_admin_article_creation_with_minimal_data(self, title, content):
        """
        Property: Admin should be able to create articles with minimal required data,
        and optional fields should have appropriate defaults.
        
        **Feature: django-postgresql-enhancement, Property 10: Admin article creation completeness**
        **Validates: Requirements 3.1**
        """
        # Authenticate as admin
        self.client.force_authenticate(user=self.admin_user)
        
        # Create article with minimal data
        article_data = {
            'title': title,
            'content': content
        }
        
        response = self.client.post('/api/admin/articles/', article_data, format='json')
        
        # Verify article was created successfully
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Retrieve the created article
        article_id = response.data['id']
        created_article = Article.objects.get(id=article_id)
        
        # Verify required fields are set
        self.assertEqual(created_article.title, title.strip())  # Title might be stripped
        self.assertEqual(created_article.content, content)
        self.assertEqual(created_article.author, self.admin_user)
        
        # Verify default values for optional fields
        self.assertEqual(created_article.status, 'draft')  # Default status
        self.assertFalse(created_article.featured)  # Default featured
        self.assertEqual(created_article.views, 0)  # Default views
        self.assertEqual(created_article.likes, 0)  # Default likes
        
        # Verify timestamps are set
        self.assertIsNotNone(created_article.created_at)
        self.assertIsNotNone(created_article.updated_at)

    def test_non_admin_cannot_create_articles_via_admin_endpoint(self):
        """
        Property: Non-admin users should not be able to create articles via admin endpoints.
        
        **Feature: django-postgresql-enhancement, Property 10: Admin article creation completeness**
        **Validates: Requirements 3.1**
        """
        # Authenticate as normal user
        self.client.force_authenticate(user=self.normal_user)
        
        article_data = {
            'title': 'Test Article',
            'content': 'Test content'
        }
        
        response = self.client.post('/api/admin/articles/', article_data, format='json')
        
        # Verify access is denied
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    @given(
        title=st.text(min_size=1, max_size=200, alphabet=st.characters(blacklist_categories=['Cc', 'Cs'])).filter(lambda x: x.strip()),
        content=st.text(min_size=10, max_size=1000, alphabet=st.characters(blacklist_categories=['Cc', 'Cs'])),
        scheduled_minutes=st.integers(min_value=1, max_value=1440)  # 1 minute to 24 hours
    )
    @settings(max_examples=50, deadline=None)
    def test_admin_article_scheduled_publishing(self, title, content, scheduled_minutes):
        """
        Property: Admin should be able to create articles with scheduled publishing,
        and the scheduling metadata should be properly stored.
        
        **Feature: django-postgresql-enhancement, Property 10: Admin article creation completeness**
        **Validates: Requirements 3.1**
        """
        from django.utils import timezone
        from datetime import timedelta
        
        # Authenticate as admin
        self.client.force_authenticate(user=self.admin_user)
        
        # Calculate future publish time
        scheduled_time = timezone.now() + timedelta(minutes=scheduled_minutes)
        
        article_data = {
            'title': title,
            'content': content,
            'status': 'draft',
            'scheduled_publish': scheduled_time.isoformat()
        }
        
        response = self.client.post('/api/admin/articles/', article_data, format='json')
        
        # Verify article was created successfully
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Retrieve the created article
        article_id = response.data['id']
        created_article = Article.objects.get(id=article_id)
        
        # Verify scheduled publish time is stored
        self.assertIsNotNone(created_article.scheduled_publish)
        
        # Verify the scheduled time is approximately correct (within 1 minute tolerance)
        time_diff = abs((created_article.scheduled_publish - scheduled_time).total_seconds())
        self.assertLess(time_diff, 60)  # Within 1 minute
        
        # Verify article is still in draft status
        self.assertEqual(created_article.status, 'draft')
        self.assertIsNone(created_article.published_at)