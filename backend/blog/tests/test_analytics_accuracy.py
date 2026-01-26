"""
Property-based tests for analytics accuracy.

**Feature: django-postgresql-enhancement, Property 14: Analytics accuracy**
**Validates: Requirements 3.5**
"""

from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from hypothesis import given, strategies as st, settings
from hypothesis.extra.django import TestCase as HypothesisTestCase
from blog.models import Article, Comment, Category, Tag, CustomUser
from django.utils import timezone
from django.db.models import Count, Avg, Sum
from datetime import timedelta
import json
import uuid

User = get_user_model()


class AnalyticsAccuracyTest(HypothesisTestCase):
    """Property-based tests for analytics accuracy."""
    
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
        
        # Create normal users
        self.users = []
        for i in range(3):
            user = CustomUser.objects.create_user(
                email=f'user{i}-{test_id}@test.com',
                username=f'user{i}-{test_id}',
                password='testpass123',
                user_type='normal'
            )
            self.users.append(user)
        
        # Create test categories
        self.categories = []
        for i in range(2):
            category = Category.objects.create(
                name=f'Category {i} {test_id}',
                description=f'Test category {i} description'
            )
            self.categories.append(category)
        
        # Create test tags
        self.tags = []
        for i in range(3):
            tag = Tag.objects.create(name=f'Tag {i} {test_id}')
            self.tags.append(tag)

    @given(
        num_articles=st.integers(min_value=1, max_value=10),
        views_per_article=st.lists(st.integers(min_value=0, max_value=1000), min_size=1, max_size=10),
        likes_per_article=st.lists(st.integers(min_value=0, max_value=100), min_size=1, max_size=10)
    )
    @settings(max_examples=50, deadline=None)
    def test_article_analytics_aggregation_accuracy(self, num_articles, views_per_article, likes_per_article):
        """
        Property: Analytics aggregations (total views, likes, average engagement) 
        should accurately reflect the actual data in the database.
        
        **Feature: django-postgresql-enhancement, Property 14: Analytics accuracy**
        **Validates: Requirements 3.5**
        """
        # Ensure we have the right number of views and likes for each article
        views_per_article = views_per_article[:num_articles]
        likes_per_article = likes_per_article[:num_articles]
        
        # Pad with zeros if needed
        while len(views_per_article) < num_articles:
            views_per_article.append(0)
        while len(likes_per_article) < num_articles:
            likes_per_article.append(0)
        
        # Create articles with specific view and like counts
        created_articles = []
        for i in range(num_articles):
            article = Article.objects.create(
                title=f'Analytics Test Article {i}',
                content=f'Content for analytics test article {i}',
                author=self.admin_user,
                category=self.categories[i % len(self.categories)],
                status='published',
                views=views_per_article[i],
                likes=likes_per_article[i]
            )
            created_articles.append(article)
        
        # Authenticate as admin
        self.client.force_authenticate(user=self.admin_user)
        
        # Get analytics data via API
        response = self.client.get(admin/analytics/')
        
        # Verify analytics request was successful
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        analytics_data = response.data
        
        # Calculate expected values
        expected_total_views = sum(views_per_article)
        expected_total_likes = sum(likes_per_article)
        expected_avg_views = expected_total_views / num_articles if num_articles > 0 else 0
        expected_avg_likes = expected_total_likes / num_articles if num_articles > 0 else 0
        
        # Verify analytics accuracy
        self.assertEqual(analytics_data.get('total_views', 0), expected_total_views)
        self.assertEqual(analytics_data.get('total_likes', 0), expected_total_likes)
        
        # Allow for small floating point differences in averages
        actual_avg_views = analytics_data.get('avg_views', 0)
        actual_avg_likes = analytics_data.get('avg_likes', 0)
        
        self.assertAlmostEqual(actual_avg_views, expected_avg_views, places=1)
        self.assertAlmostEqual(actual_avg_likes, expected_avg_likes, places=1)
        
        # Verify article count
        # Get total published articles (including any existing ones)
        total_published = Article.objects.filter(status='published').count()
        self.assertEqual(analytics_data.get('total_articles', 0), total_published)

    @given(
        num_comments_per_article=st.lists(st.integers(min_value=0, max_value=20), min_size=1, max_size=5),
        approval_rates=st.lists(st.floats(min_value=0.0, max_value=1.0), min_size=1, max_size=5)
    )
    @settings(max_examples=30, deadline=None)
    def test_comment_analytics_accuracy(self, num_comments_per_article, approval_rates):
        """
        Property: Comment analytics (total comments, approval rates, moderation stats) 
        should accurately reflect the actual comment data.
        
        **Feature: django-postgresql-enhancement, Property 14: Analytics accuracy**
        **Validates: Requirements 3.5**
        """
        # Create articles for comments
        articles = []
        for i in range(len(num_comments_per_article)):
            article = Article.objects.create(
                title=f'Comment Analytics Article {i}',
                content=f'Content for comment analytics test {i}',
                author=self.admin_user,
                category=self.categories[0],
                status='published'
            )
            articles.append(article)
        
        # Create comments with varying approval rates
        total_comments = 0
        total_approved = 0
        
        for i, (article, num_comments, approval_rate) in enumerate(zip(articles, num_comments_per_article, approval_rates)):
            for j in range(num_comments):
                # Determine if this comment should be approved based on approval rate
                should_approve = (j / num_comments) < approval_rate if num_comments > 0 else False
                
                comment = Comment.objects.create(
                    article=article,
                    author=self.users[j % len(self.users)],
                    content=f'Test comment {j} on article {i}',
                    approved=should_approve
                )
                
                total_comments += 1
                if should_approve:
                    total_approved += 1
        
        # Authenticate as admin
        self.client.force_authenticate(user=self.admin_user)
        
        # Get comment analytics via API
        response = self.client.get(admin/analytics/comments/')
        
        # Verify analytics request was successful
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        analytics_data = response.data
        
        # Calculate expected values
        expected_approval_rate = (total_approved / total_comments) if total_comments > 0 else 0
        
        # Verify comment analytics accuracy
        actual_total_comments = Comment.objects.count()
        actual_approved_comments = Comment.objects.filter(approved=True).count()
        
        self.assertEqual(analytics_data.get('total_comments', 0), actual_total_comments)
        self.assertEqual(analytics_data.get('approved_comments', 0), actual_approved_comments)
        
        # Verify approval rate calculation
        actual_approval_rate = analytics_data.get('approval_rate', 0)
        if actual_total_comments > 0:
            expected_rate = actual_approved_comments / actual_total_comments
            self.assertAlmostEqual(actual_approval_rate, expected_rate, places=2)
        else:
            self.assertEqual(actual_approval_rate, 0)

    def test_user_analytics_accuracy(self):
        """
        Property: User analytics (total users, user types distribution, activity stats) 
        should accurately reflect the actual user data.
        
        **Feature: django-postgresql-enhancement, Property 14: Analytics accuracy**
        **Validates: Requirements 3.5**
        """
        # Create additional users with different types
        additional_users = []
        for user_type in ['admin', 'normal', 'guest']:
            for i in range(2):
                user = CustomUser.objects.create_user(
                    email=f'{user_type}{i}@analytics.com',
                    username=f'{user_type}_user_{i}',
                    password='testpass123',
                    user_type=user_type,
                    is_staff=(user_type == 'admin'),
                    is_superuser=(user_type == 'admin')
                )
                additional_users.append(user)
        
        # Authenticate as admin
        self.client.force_authenticate(user=self.admin_user)
        
        # Get user analytics via API
        response = self.client.get(admin/analytics/users/')
        
        # Verify analytics request was successful
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        analytics_data = response.data
        
        # Calculate expected values from database
        total_users = CustomUser.objects.count()
        admin_users = CustomUser.objects.filter(user_type='admin').count()
        normal_users = CustomUser.objects.filter(user_type='normal').count()
        guest_users = CustomUser.objects.filter(user_type='guest').count()
        active_users = CustomUser.objects.filter(is_active=True).count()
        
        # Verify user analytics accuracy
        self.assertEqual(analytics_data.get('total_users', 0), total_users)
        self.assertEqual(analytics_data.get('admin_users', 0), admin_users)
        self.assertEqual(analytics_data.get('normal_users', 0), normal_users)
        self.assertEqual(analytics_data.get('guest_users', 0), guest_users)
        self.assertEqual(analytics_data.get('active_users', 0), active_users)
        
        # Verify user type distribution adds up to total
        type_sum = admin_users + normal_users + guest_users
        self.assertEqual(type_sum, total_users)

    @given(
        days_back=st.integers(min_value=1, max_value=30)
    )
    @settings(max_examples=20, deadline=None)
    def test_time_based_analytics_accuracy(self, days_back):
        """
        Property: Time-based analytics (articles per day, comments per day, user registrations) 
        should accurately reflect data within the specified time range.
        
        **Feature: django-postgresql-enhancement, Property 14: Analytics accuracy**
        **Validates: Requirements 3.5**
        """
        # Calculate date range with some buffer to ensure articles are within range
        end_date = timezone.now() - timedelta(minutes=1)  # End 1 minute ago to avoid edge cases
        start_date = end_date - timedelta(days=days_back)
        
        # Create articles and comments within the time range
        articles_in_range = []
        comments_in_range = []
        
        # Create some articles within the range
        for i in range(3):
            # Create article with a date within the range
            # Ensure the date is always within the range by using hours instead of days
            hours_offset = i * 2  # Space articles 2 hours apart
            article_date = start_date + timedelta(hours=hours_offset + 1)  # Add 1 hour buffer from start
            
            # Ensure we don't exceed the end date
            if article_date >= end_date:
                article_date = end_date - timedelta(hours=1)
            
            article = Article.objects.create(
                title=f'Time Range Article {i}',
                content=f'Content for time range test {i}',
                author=self.admin_user,
                category=self.categories[0],
                status='published'
            )
            
            # Manually set the created_at date
            article.created_at = article_date
            article.save()
            articles_in_range.append(article)
            
            # Create comments for this article
            for j in range(2):
                comment = Comment.objects.create(
                    article=article,
                    author=self.users[0],
                    content=f'Time range comment {j}',
                    approved=True
                )
                comment.created_at = article_date + timedelta(hours=j)
                comment.save()
                comments_in_range.append(comment)
        
        # Authenticate as admin
        self.client.force_authenticate(user=self.admin_user)
        
        # Get time-based analytics via API
        response = self.client.get(fadmin/analytics/timerange/?days={days_back}')
        
        # Verify analytics request was successful
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        analytics_data = response.data
        
        # Calculate expected values from database
        articles_in_period = Article.objects.filter(
            created_at__gte=start_date,
            created_at__lte=end_date
        ).count()
        
        comments_in_period = Comment.objects.filter(
            created_at__gte=start_date,
            created_at__lte=end_date
        ).count()
        
        # Verify time-based analytics accuracy
        # Note: The API counts all articles/comments in the period, including any existing ones
        self.assertEqual(analytics_data.get('articles_in_period', 0), articles_in_period)
        self.assertEqual(analytics_data.get('comments_in_period', 0), comments_in_period)
        
        # Verify the period calculation
        self.assertEqual(analytics_data.get('period_days', 0), days_back)

    def test_non_admin_cannot_access_analytics(self):
        """
        Property: Non-admin users should not be able to access analytics endpoints.
        
        **Feature: django-postgresql-enhancement, Property 14: Analytics accuracy**
        **Validates: Requirements 3.5**
        """
        # Authenticate as normal user
        self.client.force_authenticate(user=self.users[0])
        
        # Try to access various analytics endpoints
        analytics_endpoints = [
            admin/analytics/',
            admin/analytics/comments/',
            admin/analytics/users/',
            admin/analytics/timerange/?days=7'
        ]
        
        for endpoint in analytics_endpoints:
            response = self.client.get(endpoint)
            self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN,
                           f"Non-admin user should not access {endpoint}")

    def test_analytics_data_consistency_across_endpoints(self):
        """
        Property: Analytics data should be consistent across different endpoints 
        when they report the same metrics.
        
        **Feature: django-postgresql-enhancement, Property 14: Analytics accuracy**
        **Validates: Requirements 3.5**
        """
        # Create some test data
        article = Article.objects.create(
            title='Consistency Test Article',
            content='Content for consistency test',
            author=self.admin_user,
            category=self.categories[0],
            status='published',
            views=100,
            likes=50
        )
        
        for i in range(5):
            Comment.objects.create(
                article=article,
                author=self.users[i % len(self.users)],
                content=f'Consistency test comment {i}',
                approved=(i % 2 == 0)  # Alternate approval
            )
        
        # Authenticate as admin
        self.client.force_authenticate(user=self.admin_user)
        
        # Get data from different analytics endpoints
        general_response = self.client.get(admin/analytics/')
        comment_response = self.client.get(admin/analytics/comments/')
        user_response = self.client.get(admin/analytics/users/')
        
        # Verify all requests were successful
        self.assertEqual(general_response.status_code, status.HTTP_200_OK)
        self.assertEqual(comment_response.status_code, status.HTTP_200_OK)
        self.assertEqual(user_response.status_code, status.HTTP_200_OK)
        
        # Verify consistency of overlapping metrics
        general_data = general_response.data
        comment_data = comment_response.data
        user_data = user_response.data
        
        # Total comments should be consistent
        if 'total_comments' in general_data and 'total_comments' in comment_data:
            self.assertEqual(general_data['total_comments'], comment_data['total_comments'])
        
        # Total users should be consistent
        if 'total_users' in general_data and 'total_users' in user_data:
            self.assertEqual(general_data['total_users'], user_data['total_users'])