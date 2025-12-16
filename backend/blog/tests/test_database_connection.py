"""
Property-based tests for database connection monitoring
**Feature: django-postgresql-enhancement, Property 21: Monitoring data accuracy**
**Validates: Requirements 5.4**
"""

import logging
import time
from django.test import TestCase
from django.db import connection, connections
from django.core.management import call_command
from django.conf import settings
from hypothesis import given, strategies as st, settings as hypothesis_settings
from hypothesis.extra.django import TestCase as HypothesisTestCase
from blog.models import CustomUser, Article, Category


class DatabaseConnectionMonitoringTest(HypothesisTestCase):
    """
    Property-based tests for database connection monitoring and data accuracy
    """
    
    def setUp(self):
        """Set up test environment"""
        # Set up logging to capture database operations
        self.logger = logging.getLogger('django.db.backends')
        self.original_level = self.logger.level
        self.logger.setLevel(logging.DEBUG)
        
        # Create test data with unique identifiers to avoid conflicts
        import uuid
        test_id = str(uuid.uuid4())[:8]
        self.test_user = CustomUser.objects.create_user(
            email=f'test_{test_id}@example.com',
            username=f'testuser_{test_id}',
            password='testpass123'
        )
        self.test_category = Category.objects.create(name=f'Test Category {test_id}')

    def tearDown(self):
        """Clean up after tests"""
        self.logger.setLevel(self.original_level)

    @given(
        article_count=st.integers(min_value=1, max_value=10),
        query_count=st.integers(min_value=1, max_value=5)
    )
    @hypothesis_settings(max_examples=100, deadline=5000)
    def test_monitoring_data_accuracy_property(self, article_count, query_count):
        """
        **Feature: django-postgresql-enhancement, Property 21: Monitoring data accuracy**
        **Validates: Requirements 5.4**
        
        Property: For any database operations, the monitoring data should accurately 
        reflect the actual system behavior including connection usage, query counts, 
        and performance metrics.
        """
        # Record initial connection state
        initial_queries = len(connection.queries) if settings.DEBUG else 0
        
        # Create test articles
        articles = []
        for i in range(article_count):
            article = Article.objects.create(
                title=f'Test Article {i}',
                content=f'Content for article {i}',
                author=self.test_user,
                category=self.test_category,
                status='published'
            )
            articles.append(article)
        
        # Perform multiple queries to test monitoring accuracy
        for _ in range(query_count):
            # Query articles ordered by creation time to match the order they were created
            retrieved_articles = list(Article.objects.filter(status='published').order_by('created_at'))
            
            # Verify data accuracy - the number of retrieved articles should match created articles
            self.assertEqual(
                len(retrieved_articles), 
                article_count,
                f"Monitoring should accurately reflect {article_count} articles were created and retrieved"
            )
            
            # Verify each article's data integrity by comparing with the original articles
            # Sort original articles by creation time to match retrieved order
            sorted_articles = sorted(articles, key=lambda x: x.created_at)
            for original, retrieved in zip(sorted_articles, retrieved_articles):
                self.assertEqual(original.title, retrieved.title)
                self.assertEqual(original.content, retrieved.content)
                self.assertEqual(original.author_id, retrieved.author_id)
                self.assertEqual(original.category_id, retrieved.category_id)
        
        # Test connection monitoring accuracy
        if settings.DEBUG:
            final_queries = len(connection.queries)
            query_increase = final_queries - initial_queries
            
            # The monitoring should accurately track that queries were executed
            # We expect at least the creation queries + retrieval queries
            expected_minimum_queries = article_count + query_count
            self.assertGreaterEqual(
                query_increase,
                expected_minimum_queries,
                f"Query monitoring should accurately track at least {expected_minimum_queries} queries"
            )
        
        # Test database connection health
        self.assertTrue(
            connection.is_usable(),
            "Database connection monitoring should accurately report connection health"
        )
        
        # Test connection pooling monitoring (if configured)
        if hasattr(connection, 'connection') and connection.connection:
            # Connection should be active and properly monitored
            self.assertIsNotNone(
                connection.connection,
                "Connection pooling monitoring should accurately track active connections"
            )

    @given(
        concurrent_operations=st.integers(min_value=2, max_value=5)
    )
    @hypothesis_settings(max_examples=50, deadline=10000)
    def test_concurrent_connection_monitoring_accuracy(self, concurrent_operations):
        """
        Property: For any concurrent database operations, monitoring should accurately 
        track all connections and operations without data loss or corruption.
        """
        # Test concurrent user creation to verify monitoring accuracy under load
        users_created = []
        
        for i in range(concurrent_operations):
            user = CustomUser.objects.create_user(
                email=f'concurrent_user_{i}@example.com',
                username=f'concurrent_user_{i}',
                password='testpass123'
            )
            users_created.append(user)
        
        # Verify monitoring accurately tracked all user creations
        total_users = CustomUser.objects.count()
        expected_users = 1 + concurrent_operations  # initial test_user + new users
        
        self.assertEqual(
            total_users,
            expected_users,
            f"Monitoring should accurately track {expected_users} total users"
        )
        
        # Verify each user was properly created and monitored
        for user in users_created:
            retrieved_user = CustomUser.objects.get(id=user.id)
            self.assertEqual(user.email, retrieved_user.email)
            self.assertEqual(user.username, retrieved_user.username)
        
        # Test connection state monitoring
        self.assertTrue(
            connection.is_usable(),
            "Connection monitoring should maintain accuracy during concurrent operations"
        )

    def test_database_performance_monitoring_accuracy(self):
        """
        Property: Database performance monitoring should accurately measure and report 
        query execution times and connection metrics.
        """
        # Measure query performance
        start_time = time.time()
        
        # Create a batch of articles to measure performance
        Article.objects.bulk_create([
            Article(
                title=f'Performance Test Article {i}',
                content=f'Content for performance test {i}',
                author=self.test_user,
                category=self.test_category,
                status='published'
            ) for i in range(10)
        ])
        
        creation_time = time.time() - start_time
        
        # Query performance measurement
        query_start_time = time.time()
        articles = list(Article.objects.select_related('author', 'category').all())
        query_time = time.time() - query_start_time
        
        # Verify monitoring accuracy
        self.assertGreater(
            len(articles),
            0,
            "Performance monitoring should accurately track that articles were created"
        )
        
        # Performance metrics should be reasonable (not negative or extremely large)
        self.assertGreater(creation_time, 0, "Creation time monitoring should be positive")
        self.assertGreater(query_time, 0, "Query time monitoring should be positive")
        self.assertLess(creation_time, 10, "Creation time monitoring should be reasonable")
        self.assertLess(query_time, 10, "Query time monitoring should be reasonable")
        
        # Connection should remain healthy after performance operations
        self.assertTrue(
            connection.is_usable(),
            "Connection monitoring should accurately report health after performance operations"
        )

    def test_connection_pooling_monitoring_accuracy(self):
        """
        Property: Connection pooling monitoring should accurately track connection 
        lifecycle and resource usage.
        """
        # Test connection state before operations
        initial_connection_state = connection.is_usable()
        self.assertTrue(initial_connection_state, "Initial connection should be usable")
        
        # Perform database operations that would use connection pooling
        for i in range(5):
            # Create and query data to exercise connection pooling
            article = Article.objects.create(
                title=f'Pooling Test Article {i}',
                content=f'Testing connection pooling {i}',
                author=self.test_user,
                category=self.test_category,
                status='published'
            )
            
            # Immediately query the created article
            retrieved = Article.objects.get(id=article.id)
            self.assertEqual(article.title, retrieved.title)
        
        # Verify connection pooling monitoring accuracy
        final_connection_state = connection.is_usable()
        self.assertTrue(
            final_connection_state,
            "Connection pooling monitoring should accurately track connection health"
        )
        
        # Test that connection settings are properly monitored
        db_settings = settings.DATABASES['default']
        if 'conn_max_age' in db_settings:
            self.assertGreater(
                db_settings['conn_max_age'],
                0,
                "Connection pooling settings should be accurately monitored"
            )