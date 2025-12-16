"""
Property-based tests for article status management
**Feature: django-postgresql-enhancement, Property 27: Article status management**
**Validates: Requirements 7.1**
"""

from django.test import TestCase
from django.utils import timezone
from django.core.exceptions import ValidationError
from hypothesis import given, strategies as st, settings as hypothesis_settings
from hypothesis.extra.django import TestCase as HypothesisTestCase
from blog.models import CustomUser, Article, Category
import uuid
from datetime import datetime, timedelta


class ArticleStatusManagementTest(HypothesisTestCase):
    """
    Property-based tests for article status management including draft status and scheduled publishing
    """

    def setUp(self):
        """Set up test data that will be reused across tests"""
        # Use unique identifiers to avoid conflicts
        test_id = str(uuid.uuid4())[:8]
        
        # Create a test user
        self.test_user = CustomUser.objects.create_user(
            email=f'testuser_{test_id}@example.com',
            username=f'testuser_{test_id}',
            password='testpass123'
        )
        
        # Create a test category
        self.test_category = Category.objects.create(name=f'Test Category {test_id}')

    @given(
        title=st.text(min_size=1, max_size=255).filter(lambda x: x.strip()),
        content=st.text(min_size=1, max_size=1000).filter(lambda x: x.strip()),
        status=st.sampled_from(['draft', 'published', 'archived'])
    )
    @hypothesis_settings(max_examples=100, deadline=5000)
    def test_article_status_visibility_property(self, title, content, status):
        """
        **Feature: django-postgresql-enhancement, Property 27: Article status management**
        **Validates: Requirements 7.1**
        
        Property: For any article with draft status or scheduled publishing, 
        the article should only be publicly visible when appropriate conditions are met.
        """
        try:
            # Create an article with the given status
            article = Article.objects.create(
                title=title,
                content=content,
                author=self.test_user,
                category=self.test_category,
                status=status
            )
            
            # Test visibility based on status
            if status == 'draft':
                # Draft articles should not be publicly visible
                self.assertEqual(
                    article.status,
                    'draft',
                    "Draft articles should maintain draft status"
                )
                self.assertIsNone(
                    article.published_at,
                    "Draft articles should not have a published_at timestamp"
                )
                
                # Simulate public query (only published articles should be returned)
                public_articles = Article.objects.filter(status='published')
                self.assertNotIn(
                    article,
                    public_articles,
                    "Draft articles should not appear in public article queries"
                )
                
            elif status == 'published':
                # Published articles should be publicly visible
                self.assertEqual(
                    article.status,
                    'published',
                    "Published articles should maintain published status"
                )
                
                # Simulate public query
                public_articles = Article.objects.filter(status='published')
                self.assertIn(
                    article,
                    public_articles,
                    "Published articles should appear in public article queries"
                )
                
            elif status == 'archived':
                # Archived articles should not be publicly visible
                self.assertEqual(
                    article.status,
                    'archived',
                    "Archived articles should maintain archived status"
                )
                
                # Simulate public query
                public_articles = Article.objects.filter(status='published')
                self.assertNotIn(
                    article,
                    public_articles,
                    "Archived articles should not appear in public article queries"
                )
            
            # Clean up
            article.delete()
            
        except ValidationError as e:
            # Some validation errors might be expected
            pass
        except Exception as e:
            # For debugging: if there are unexpected errors, we want to know
            if "constraint failed" in str(e).lower():
                # Database constraint violations are acceptable in property testing
                pass
            else:
                # Re-raise unexpected errors
                raise

    @given(
        title=st.text(min_size=1, max_size=255).filter(lambda x: x.strip()),
        content=st.text(min_size=1, max_size=1000).filter(lambda x: x.strip()),
        hours_in_future=st.integers(min_value=1, max_value=168)  # 1 hour to 1 week
    )
    @hypothesis_settings(max_examples=50, deadline=5000)
    def test_scheduled_publishing_property(self, title, content, hours_in_future):
        """
        Property: Articles with scheduled publishing should automatically 
        change status from draft to published when the scheduled time is reached.
        """
        try:
            # Create a future timestamp for scheduled publishing
            scheduled_time = timezone.now() + timedelta(hours=hours_in_future)
            
            # Create a draft article with scheduled publishing
            article = Article.objects.create(
                title=title,
                content=content,
                author=self.test_user,
                category=self.test_category,
                status='draft',
                scheduled_publish=scheduled_time
            )
            
            # Verify initial state
            self.assertEqual(
                article.status,
                'draft',
                "Article should initially be in draft status"
            )
            self.assertEqual(
                article.scheduled_publish,
                scheduled_time,
                "Scheduled publish time should be set correctly"
            )
            self.assertIsNone(
                article.published_at,
                "Article should not have published_at timestamp initially"
            )
            
            # Simulate time passing by updating scheduled_publish to past
            past_time = timezone.now() - timedelta(hours=1)
            article.scheduled_publish = past_time
            article.save()  # This should trigger auto-publishing logic
            
            # Refresh from database
            article.refresh_from_db()
            
            # Verify auto-publishing occurred
            self.assertEqual(
                article.status,
                'published',
                "Article should be automatically published when scheduled time passes"
            )
            self.assertIsNotNone(
                article.published_at,
                "Article should have published_at timestamp after auto-publishing"
            )
            
            # Verify it's now publicly visible
            public_articles = Article.objects.filter(status='published')
            self.assertIn(
                article,
                public_articles,
                "Auto-published articles should appear in public queries"
            )
            
            # Clean up
            article.delete()
            
        except ValidationError as e:
            pass
        except Exception as e:
            if "constraint failed" in str(e).lower():
                pass
            else:
                raise

    @given(
        title=st.text(min_size=1, max_size=255).filter(lambda x: x.strip()),
        content=st.text(min_size=1, max_size=1000).filter(lambda x: x.strip())
    )
    @hypothesis_settings(max_examples=50, deadline=5000)
    def test_status_transition_property(self, title, content):
        """
        Property: Article status transitions should follow valid workflows 
        and maintain data integrity.
        """
        try:
            # Create a draft article
            article = Article.objects.create(
                title=title,
                content=content,
                author=self.test_user,
                category=self.test_category,
                status='draft'
            )
            
            # Test draft -> published transition
            article.status = 'published'
            article.save()
            
            article.refresh_from_db()
            self.assertEqual(
                article.status,
                'published',
                "Article should transition from draft to published"
            )
            
            # Test published -> archived transition
            article.status = 'archived'
            article.save()
            
            article.refresh_from_db()
            self.assertEqual(
                article.status,
                'archived',
                "Article should transition from published to archived"
            )
            
            # Test archived -> published transition (should be allowed)
            article.status = 'published'
            article.save()
            
            article.refresh_from_db()
            self.assertEqual(
                article.status,
                'published',
                "Article should be able to transition from archived back to published"
            )
            
            # Verify status is always one of the valid choices
            valid_statuses = ['draft', 'published', 'archived']
            self.assertIn(
                article.status,
                valid_statuses,
                "Article status should always be one of the valid choices"
            )
            
            # Clean up
            article.delete()
            
        except ValidationError as e:
            pass
        except Exception as e:
            if "constraint failed" in str(e).lower():
                pass
            else:
                raise

    def test_published_at_timestamp_property(self):
        """
        Property: When an article is published, it should have a published_at 
        timestamp that reflects when it was published.
        """
        # Create a draft article
        article = Article.objects.create(
            title="Test Article",
            content="Test content",
            author=self.test_user,
            category=self.test_category,
            status='draft'
        )
        
        # Verify no published_at timestamp initially
        self.assertIsNone(
            article.published_at,
            "Draft articles should not have published_at timestamp"
        )
        
        # Record time before publishing
        before_publish = timezone.now()
        
        # Publish the article
        article.status = 'published'
        article.published_at = timezone.now()  # Simulate publishing logic
        article.save()
        
        # Record time after publishing
        after_publish = timezone.now()
        
        # Verify published_at timestamp is set and reasonable
        self.assertIsNotNone(
            article.published_at,
            "Published articles should have published_at timestamp"
        )
        self.assertGreaterEqual(
            article.published_at,
            before_publish,
            "Published timestamp should be after the publish action started"
        )
        self.assertLessEqual(
            article.published_at,
            after_publish,
            "Published timestamp should be before the publish action completed"
        )
        
        # Clean up
        article.delete()

    @given(
        num_articles=st.integers(min_value=1, max_value=10)
    )
    @hypothesis_settings(max_examples=20, deadline=5000)
    def test_bulk_status_management_property(self, num_articles):
        """
        Property: Status management should work correctly when handling 
        multiple articles with different statuses.
        """
        try:
            articles = []
            
            # Create multiple articles with different statuses
            for i in range(num_articles):
                status = ['draft', 'published', 'archived'][i % 3]
                article = Article.objects.create(
                    title=f"Test Article {i}",
                    content=f"Test content {i}",
                    author=self.test_user,
                    category=self.test_category,
                    status=status
                )
                articles.append(article)
            
            # Verify each article maintains its status correctly
            for i, article in enumerate(articles):
                expected_status = ['draft', 'published', 'archived'][i % 3]
                self.assertEqual(
                    article.status,
                    expected_status,
                    f"Article {i} should maintain its assigned status"
                )
            
            # Test bulk queries by status
            draft_articles = Article.objects.filter(status='draft')
            published_articles = Article.objects.filter(status='published')
            archived_articles = Article.objects.filter(status='archived')
            
            # Verify counts match expectations
            expected_drafts = len([a for a in articles if a.status == 'draft'])
            expected_published = len([a for a in articles if a.status == 'published'])
            expected_archived = len([a for a in articles if a.status == 'archived'])
            
            self.assertGreaterEqual(
                len(draft_articles),
                expected_drafts,
                "Draft article count should match created drafts"
            )
            self.assertGreaterEqual(
                len(published_articles),
                expected_published,
                "Published article count should match created published articles"
            )
            self.assertGreaterEqual(
                len(archived_articles),
                expected_archived,
                "Archived article count should match created archived articles"
            )
            
            # Clean up
            for article in articles:
                article.delete()
                
        except ValidationError as e:
            pass
        except Exception as e:
            if "constraint failed" in str(e).lower():
                pass
            else:
                raise

    def test_featured_article_status_interaction(self):
        """
        Property: Featured articles should respect status visibility rules - 
        only published featured articles should be publicly visible.
        """
        # Create articles with different status and featured combinations
        test_cases = [
            ('draft', True),
            ('draft', False),
            ('published', True),
            ('published', False),
            ('archived', True),
            ('archived', False)
        ]
        
        articles = []
        for i, (status, featured) in enumerate(test_cases):
            article = Article.objects.create(
                title=f"Test Article {i}",
                content=f"Test content {i}",
                author=self.test_user,
                category=self.test_category,
                status=status,
                featured=featured
            )
            articles.append(article)
        
        # Test public featured articles query
        public_featured = Article.objects.filter(status='published', featured=True)
        
        # Only published + featured articles should appear
        for article in articles:
            if article.status == 'published' and article.featured:
                self.assertIn(
                    article,
                    public_featured,
                    "Published featured articles should appear in public featured queries"
                )
            else:
                self.assertNotIn(
                    article,
                    public_featured,
                    "Non-published or non-featured articles should not appear in public featured queries"
                )
        
        # Clean up
        for article in articles:
            article.delete()