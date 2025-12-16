"""
Property-based tests for article completeness.
**Feature: django-postgresql-enhancement, Property 2: Article completeness**
**Validates: Requirements 1.2**
"""

from django.test import TestCase
from django.utils import timezone
from hypothesis import given, strategies as st, settings as hypothesis_settings, assume
from hypothesis.extra.django import TestCase as HypothesisTestCase

from blog.models import CustomUser, Article, Category
import string
import uuid

class ArticleCompletenessTest(HypothesisTestCase):
    """
    Property-based tests to ensure articles are complete and valid,
    especially upon publication.
    """

    def setUp(self):
        """Set up test environment by creating a user and a category."""
        self.user = CustomUser.objects.create_user(
            email='testuser@example.com',
            username='testuser',
            password='testpassword123',
            first_name='Test',
            last_name='User'
        )
        self.category = Category.objects.create(name='Test Category')

    @given(
        title=st.text(min_size=1, max_size=255, alphabet=string.printable),
        content=st.text(min_size=10, max_size=1000, alphabet=string.printable),
        status=st.sampled_from(['draft', 'published']),
        has_category=st.booleans(),
        excerpt=st.text(max_size=500, alphabet=string.printable),
        image_base64=st.just(None) | st.text(min_size=10, max_size=100) # Simple placeholder for image data
    )
    @hypothesis_settings(max_examples=50, deadline=None)
    def test_published_article_completeness(self, title, content, status, has_category, excerpt, image_base64):
        """
        Property: A published article must have a non-empty title, non-empty content,
        a valid author, and if a category is assigned, it must be valid.
        """
        # Ensure title and content are not empty strings after stripping whitespace
        title = title.strip()
        content = content.strip()
        
        # Assume valid data for the core properties to be tested
        assume(len(title) > 0)
        assume(len(content) > 0)

        # Create article instance
        article = Article(
            title=title,
            content=content,
            author=self.user,
            status=status,
            excerpt=excerpt,
            image_base64=image_base64
        )

        if has_category:
            article.category = self.category

        # Attempt to save the article
        try:
            article.save()
        except Exception as e:
            self.fail(f"Article save failed with valid data: {e}")

        # If the article is published, verify its completeness
        if article.status == 'published':
            self.assertIsNotNone(article.title, "Published article must have a title")
            self.assertGreater(len(article.title), 0, "Published article title must not be empty")
            
            self.assertIsNotNone(article.content, "Published article must have content")
            self.assertGreater(len(article.content), 0, "Published article content must not be empty")
            
            self.assertIsNotNone(article.author, "Published article must have an author")
            self.assertIsInstance(article.author, CustomUser, "Author must be a CustomUser instance")
            
            if has_category:
                self.assertIsNotNone(article.category, "Published article with category flag must have a category")
                self.assertIsInstance(article.category, Category, "Category must be a Category instance")
            else:
                self.assertIsNone(article.category, "Published article without category flag should not have a category")

        # Verify that draft articles can be incomplete (e.g., missing a category if not required)
        if article.status == 'draft':
            # Drafts have fewer strict requirements, but title and content are still expected
            self.assertIsNotNone(article.title)
            self.assertGreater(len(article.title), 0)
            self.assertIsNotNone(article.content)
            self.assertGreater(len(article.content), 0)

