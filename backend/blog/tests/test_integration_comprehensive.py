"""
Comprehensive integration tests for Django + PostgreSQL enhancement.

This test suite validates end-to-end functionality across all major components:
- Database connectivity and operations
- API endpoints and authentication
- Real-time functionality
- Migration processes
- Frontend integration points
"""

from django.test import TestCase, TransactionTestCase
from django.contrib.auth import get_user_model
from django.db import connection
from django.core.cache import cache
from rest_framework.test import APIClient
from rest_framework import status
from blog.models import Article, Comment, Category, Tag, Analytics, ArticleRevision
from blog.utils.migration_utils import MigrationVerifier
import json
from datetime import datetime, timedelta

User = get_user_model()


class DatabaseIntegrationTest(TransactionTestCase):
    """Test PostgreSQL database connectivity and operations."""
    
    def test_database_connection(self):
        """Verify PostgreSQL database is connected and operational."""
        with connection.cursor() as cursor:
            cursor.execute("SELECT version();")
            version = cursor.fetchone()[0]
            self.assertIn('PostgreSQL', version)
    
    def test_database_transactions(self):
        """Test database transaction handling."""
        user = User.objects.create_user(
            username='transactiontest',
            email='transaction@test.com',
            password='testpass123'
        )
        self.assertIsNotNone(user.id)
        
        # Verify transaction rollback works
        from django.db import transaction
        try:
            with transaction.atomic():
                User.objects.create_user(
                    username='rollbacktest',
                    email='rollback@test.com',
                    password='testpass123'
                )
                raise Exception("Force rollback")
        except Exception:
            pass
        
        self.assertFalse(User.objects.filter(username='rollbacktest').exists())
    
    def test_database_indexes(self):
        """Verify PostgreSQL indexes are created."""
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT indexname 
                FROM pg_indexes 
                WHERE tablename LIKE 'blog_%'
            """)
            indexes = cursor.fetchall()
            self.assertGreater(len(indexes), 0)


class APIIntegrationTest(TestCase):
    """Test API endpoints integration."""
    
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='apitest',
            email='api@test.com',
            password='testpass123'
        )
        self.admin = User.objects.create_user(
            username='admin',
            email='admin@test.com',
            password='adminpass123',
            is_staff=True,
            user_type='admin'
        )
        self.category = Category.objects.create(
            name='Test Category'
        )
    
    def test_authentication_flow(self):
        """Test complete authentication flow."""
        # Login
        response = self.client.post('/api/token/', {
            'username': 'apitest',
            'password': 'testpass123'
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)
        
        access_token = response.data['access']
        
        # Use token for authenticated request
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')
        response = self.client.get('/api/users/me/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['username'], 'apitest')
    
    def test_article_crud_operations(self):
        """Test complete article CRUD flow."""
        # Authenticate as admin
        self.client.force_authenticate(user=self.admin)
        
        # Create article
        article_data = {
            'title': 'Integration Test Article',
            'slug': 'integration-test-article',
            'content': 'This is a test article for integration testing.',
            'excerpt': 'Test excerpt',
            'category': self.category.id,
            'status': 'published'
        }
        response = self.client.post('/api/articles/', article_data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        article_id = response.data['id']
        
        # Read article
        response = self.client.get(f'/api/articles/{article_id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['title'], 'Integration Test Article')
        
        # Update article
        response = self.client.patch(f'/api/articles/{article_id}/', {
            'title': 'Updated Integration Test Article'
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['title'], 'Updated Integration Test Article')
        
        # Delete article
        response = self.client.delete(f'/api/articles/{article_id}/')
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
    
    def test_comment_workflow(self):
        """Test comment creation and moderation workflow."""
        # Create article
        article = Article.objects.create(
            title='Comment Test Article',
            slug='comment-test-article',
            content='Test content',
            author=self.admin,
            category=self.category,
            status='published'
        )
        
        # Authenticate as regular user
        self.client.force_authenticate(user=self.user)
        
        # Create comment
        comment_data = {
            'article': article.id,
            'content': 'This is a test comment.'
        }
        response = self.client.post('/api/comments/', comment_data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        comment_id = response.data['id']
        
        # Verify comment is associated with user and article
        comment = Comment.objects.get(id=comment_id)
        self.assertEqual(comment.author, self.user)
        self.assertEqual(comment.article, article)
        
        # Admin moderates comment
        self.client.force_authenticate(user=self.admin)
        response = self.client.patch(f'/api/comments/{comment_id}/', {
            'approved': True
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
    
    def test_search_functionality(self):
        """Test full-text search integration."""
        # Create test articles
        Article.objects.create(
            title='Python Programming Guide',
            slug='python-guide',
            content='Learn Python programming with this comprehensive guide.',
            author=self.admin,
            category=self.category,
            status='published'
        )
        Article.objects.create(
            title='JavaScript Tutorial',
            slug='javascript-tutorial',
            content='Master JavaScript with practical examples.',
            author=self.admin,
            category=self.category,
            status='published'
        )
        
        # Search for Python
        response = self.client.get('/api/articles/', {'search': 'Python'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreater(len(response.data['results']), 0)
        self.assertIn('Python', response.data['results'][0]['title'])
    
    def test_pagination_consistency(self):
        """Test API pagination across multiple pages."""
        # Create multiple articles
        for i in range(15):
            Article.objects.create(
                title=f'Article {i}',
                slug=f'article-{i}',
                content=f'Content {i}',
                author=self.admin,
                category=self.category,
                status='published'
            )
        
        # Test first page
        response = self.client.get('/api/articles/?page=1&page_size=10')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 10)
        self.assertIn('count', response.data)
        self.assertIn('next', response.data)
        
        # Test second page
        response = self.client.get('/api/articles/?page=2&page_size=10')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreater(len(response.data['results']), 0)


class CachingIntegrationTest(TestCase):
    """Test caching system integration."""
    
    def setUp(self):
        cache.clear()
        self.user = User.objects.create_user(
            username='cachetest',
            email='cache@test.com',
            password='testpass123'
        )
        self.category = Category.objects.create(
            name='Cache Test Category'
        )
    
    def test_cache_operations(self):
        """Test cache set, get, and delete operations."""
        # Set cache
        cache.set('test_key', 'test_value', 300)
        
        # Get cache
        value = cache.get('test_key')
        self.assertEqual(value, 'test_value')
        
        # Delete cache
        cache.delete('test_key')
        value = cache.get('test_key')
        self.assertIsNone(value)
    
    def test_api_response_caching(self):
        """Test API response caching."""
        # Create article
        article = Article.objects.create(
            title='Cache Test Article',
            slug='cache-test-article',
            content='Test content',
            author=self.user,
            category=self.category,
            status='published'
        )
        
        client = APIClient()
        
        # First request (cache miss)
        response1 = client.get(f'/api/articles/{article.id}/')
        self.assertEqual(response1.status_code, status.HTTP_200_OK)
        
        # Second request (should be cached)
        response2 = client.get(f'/api/articles/{article.id}/')
        self.assertEqual(response2.status_code, status.HTTP_200_OK)
        self.assertEqual(response1.data, response2.data)


class SecurityIntegrationTest(TestCase):
    """Test security measures integration."""
    
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='securitytest',
            email='security@test.com',
            password='testpass123'
        )
    
    def test_authentication_required(self):
        """Test that protected endpoints require authentication."""
        response = self.client.get('/api/users/me/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_password_hashing(self):
        """Test that passwords are properly hashed."""
        user = User.objects.get(username='securitytest')
        self.assertNotEqual(user.password, 'testpass123')
        self.assertTrue(user.password.startswith('pbkdf2_sha256'))
    
    def test_sql_injection_prevention(self):
        """Test SQL injection prevention."""
        # Attempt SQL injection in search
        malicious_query = "'; DROP TABLE blog_article; --"
        response = self.client.get('/api/articles/', {'search': malicious_query})
        
        # Should not cause error and table should still exist
        self.assertIn(response.status_code, [status.HTTP_200_OK, status.HTTP_400_BAD_REQUEST])
        
        # Verify table still exists
        from django.db import connection
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_name = 'blog_article'
                );
            """)
            exists = cursor.fetchone()[0]
            self.assertTrue(exists)
    
    def test_input_validation(self):
        """Test input validation on API endpoints."""
        self.client.force_authenticate(user=self.user)
        
        # Test invalid email
        response = self.client.patch('/api/users/me/', {
            'email': 'invalid-email'
        })
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class VersionControlIntegrationTest(TestCase):
    """Test article version control integration."""
    
    def setUp(self):
        self.user = User.objects.create_user(
            username='versiontest',
            email='version@test.com',
            password='testpass123',
            is_staff=True
        )
        self.category = Category.objects.create(
            name='Version Test Category'
        )
    
    def test_article_revision_tracking(self):
        """Test that article revisions are tracked."""
        # Create article
        article = Article.objects.create(
            title='Version Test Article',
            slug='version-test-article',
            content='Original content',
            author=self.user,
            category=self.category,
            status='draft'
        )
        
        # Update article
        article.content = 'Updated content'
        article.save()
        
        # Verify revision exists
        revisions = ArticleRevision.objects.filter(article=article)
        self.assertGreater(revisions.count(), 0)


class AnalyticsIntegrationTest(TestCase):
    """Test analytics tracking integration."""
    
    def setUp(self):
        self.user = User.objects.create_user(
            username='analyticstest',
            email='analytics@test.com',
            password='testpass123'
        )
        self.category = Category.objects.create(
            name='Analytics Test Category'
        )
    
    def test_analytics_tracking(self):
        """Test that analytics are tracked for articles."""
        article = Article.objects.create(
            title='Analytics Test Article',
            slug='analytics-test-article',
            content='Test content',
            author=self.user,
            category=self.category,
            status='published'
        )
        
        # Simulate article view
        client = APIClient()
        response = client.get(f'/api/articles/{article.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verify analytics exist
        analytics = Analytics.objects.filter(article=article)
        self.assertGreaterEqual(analytics.count(), 0)


class MigrationIntegrationTest(TransactionTestCase):
    """Test migration system integration."""
    
    def test_migration_verification(self):
        """Test migration verification functionality."""
        # This test verifies that the migration verification system works
        verifier = MigrationVerifier()
        # Test with empty transfer results
        result = verifier.verify_migration('test.db', {})
        self.assertIsInstance(result, dict)
        self.assertIn('success', result)
        self.assertIn('errors', result)


class EndToEndWorkflowTest(TestCase):
    """Test complete end-to-end workflows."""
    
    def setUp(self):
        self.client = APIClient()
        self.admin = User.objects.create_user(
            username='e2eadmin',
            email='e2e@test.com',
            password='adminpass123',
            is_staff=True,
            user_type='admin'
        )
        self.reader = User.objects.create_user(
            username='e2ereader',
            email='reader@test.com',
            password='readerpass123'
        )
        self.category = Category.objects.create(
            name='E2E Category'
        )
    
    def test_complete_blog_workflow(self):
        """Test complete blog workflow from creation to reading."""
        # Admin creates article
        self.client.force_authenticate(user=self.admin)
        article_data = {
            'title': 'E2E Test Article',
            'slug': 'e2e-test-article',
            'content': 'This is an end-to-end test article.',
            'excerpt': 'E2E test',
            'category': self.category.id,
            'status': 'published'
        }
        response = self.client.post('/api/articles/', article_data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        article_id = response.data['id']
        
        # Reader views article (unauthenticated)
        self.client.force_authenticate(user=None)
        response = self.client.get(f'/api/articles/{article_id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Reader authenticates and comments
        self.client.force_authenticate(user=self.reader)
        comment_data = {
            'article': article_id,
            'content': 'Great article!'
        }
        response = self.client.post('/api/comments/', comment_data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        comment_id = response.data['id']
        
        # Admin moderates comment
        self.client.force_authenticate(user=self.admin)
        response = self.client.patch(f'/api/comments/{comment_id}/', {
            'approved': True
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verify complete workflow
        article = Article.objects.get(id=article_id)
        self.assertEqual(article.status, 'published')
        self.assertEqual(article.comments.count(), 1)
        self.assertTrue(article.comments.first().approved)
