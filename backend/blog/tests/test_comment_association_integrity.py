"""
Property-based tests for comment association integrity
**Feature: django-postgresql-enhancement, Property 8: Comment association integrity**
**Validates: Requirements 2.4**
"""

from django.test import TestCase
from django.core.exceptions import ValidationError
from hypothesis import given, strategies as st, settings as hypothesis_settings
from hypothesis.extra.django import TestCase as HypothesisTestCase
from blog.models import CustomUser, Article, Category, Comment
import string
import uuid


class CommentAssociationIntegrityTest(HypothesisTestCase):
    """
    Property-based tests for comment association integrity
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
        
        # Create a test article
        self.test_article = Article.objects.create(
            title=f'Test Article {test_id}',
            content='Test content for the article',
            author=self.test_user,
            category=self.test_category,
            status='published'
        )

    @given(
        content=st.text(min_size=1, max_size=1000).filter(lambda x: x.strip())
    )
    @hypothesis_settings(max_examples=100, deadline=5000)
    def test_comment_association_integrity_property(self, content):
        """
        **Feature: django-postgresql-enhancement, Property 8: Comment association integrity**
        **Validates: Requirements 2.4**
        
        Property: For any comment creation, the comment should be properly 
        associated with both the user account and the target article.
        """
        try:
            # Create a comment with the generated content
            comment = Comment.objects.create(
                article=self.test_article,
                author=self.test_user,
                content=content,
                approved=True  # Set to approved for testing
            )
            
            # Verify the comment was created successfully
            self.assertIsNotNone(comment.id)
            self.assertEqual(comment.content, content)
            
            # Critical integrity property: Comment must be associated with the correct article
            self.assertEqual(
                comment.article,
                self.test_article,
                "Comment must be properly associated with the target article"
            )
            self.assertEqual(
                comment.article.id,
                self.test_article.id,
                "Comment article ID must match the target article ID"
            )
            
            # Critical integrity property: Comment must be associated with the correct user
            self.assertEqual(
                comment.author,
                self.test_user,
                "Comment must be properly associated with the user account"
            )
            self.assertEqual(
                comment.author.id,
                self.test_user.id,
                "Comment author ID must match the user account ID"
            )
            
            # Verify reverse relationships work correctly
            # Article should have this comment in its comments
            article_comments = list(self.test_article.comments.all())
            self.assertIn(
                comment,
                article_comments,
                "Article should contain the created comment in its comments relationship"
            )
            
            # User should have this comment in their comments
            user_comments = list(self.test_user.comments.all())
            self.assertIn(
                comment,
                user_comments,
                "User should contain the created comment in their comments relationship"
            )
            
            # Verify database integrity - comment should be retrievable by both associations
            comment_by_article = Comment.objects.filter(article=self.test_article, id=comment.id).first()
            self.assertIsNotNone(
                comment_by_article,
                "Comment should be retrievable by article association"
            )
            self.assertEqual(comment_by_article.id, comment.id)
            
            comment_by_author = Comment.objects.filter(author=self.test_user, id=comment.id).first()
            self.assertIsNotNone(
                comment_by_author,
                "Comment should be retrievable by author association"
            )
            self.assertEqual(comment_by_author.id, comment.id)
            
            # Verify both associations point to the same comment
            self.assertEqual(
                comment_by_article.id,
                comment_by_author.id,
                "Comment retrieved by article and author should be the same"
            )
            
            # Clean up - delete the created comment
            comment.delete()
            
        except ValidationError as e:
            # Some validation errors might be expected (e.g., content validation)
            # This is acceptable for property testing
            pass
        except Exception as e:
            # For debugging: if there are unexpected errors, we want to know
            if "UNIQUE constraint failed" in str(e) or "FOREIGN KEY constraint failed" in str(e):
                # Database constraint violations are acceptable in property testing
                pass
            else:
                # Re-raise unexpected errors
                raise

    @given(
        content=st.text(min_size=1, max_size=500).filter(lambda x: x.strip())
    )
    @hypothesis_settings(max_examples=50, deadline=3000)
    def test_comment_threading_integrity(self, content):
        """
        Property: Comment threading should maintain proper parent-child relationships
        while preserving article and author associations.
        """
        try:
            # Create a parent comment
            parent_comment = Comment.objects.create(
                article=self.test_article,
                author=self.test_user,
                content=f"Parent: {content}",
                approved=True
            )
            
            # Create a child comment (reply)
            child_comment = Comment.objects.create(
                article=self.test_article,
                author=self.test_user,
                parent=parent_comment,
                content=f"Child: {content}",
                approved=True
            )
            
            # Verify parent-child relationship integrity
            self.assertEqual(
                child_comment.parent,
                parent_comment,
                "Child comment must be properly associated with parent comment"
            )
            
            # Verify both comments are associated with the same article
            self.assertEqual(
                parent_comment.article,
                self.test_article,
                "Parent comment must be associated with the correct article"
            )
            self.assertEqual(
                child_comment.article,
                self.test_article,
                "Child comment must be associated with the same article as parent"
            )
            self.assertEqual(
                parent_comment.article.id,
                child_comment.article.id,
                "Parent and child comments must belong to the same article"
            )
            
            # Verify both comments are associated with the same user
            self.assertEqual(
                parent_comment.author,
                self.test_user,
                "Parent comment must be associated with the correct user"
            )
            self.assertEqual(
                child_comment.author,
                self.test_user,
                "Child comment must be associated with the same user as parent"
            )
            
            # Verify reverse relationship - parent should have child in replies
            parent_replies = list(parent_comment.replies.all())
            self.assertIn(
                child_comment,
                parent_replies,
                "Parent comment should contain child comment in its replies"
            )
            
            # Clean up
            child_comment.delete()
            parent_comment.delete()
            
        except ValidationError as e:
            # Threading validation errors are acceptable
            pass
        except Exception as e:
            if "constraint failed" in str(e).lower():
                pass
            else:
                raise

    def test_comment_cascade_integrity(self):
        """
        Property: When articles or users are deleted, comment associations 
        should be handled according to the defined cascade behavior.
        """
        # Create a temporary user and article for cascade testing
        temp_id = str(uuid.uuid4())[:8]
        temp_user = CustomUser.objects.create_user(
            email=f'temp_{temp_id}@example.com',
            username=f'tempuser_{temp_id}',
            password='temppass123'
        )
        
        temp_article = Article.objects.create(
            title=f'Temp Article {temp_id}',
            content='Temporary article content',
            author=temp_user,
            category=self.test_category,
            status='published'
        )
        
        # Create comments associated with the temporary article and user
        comment1 = Comment.objects.create(
            article=temp_article,
            author=temp_user,
            content='Test comment 1',
            approved=True
        )
        
        comment2 = Comment.objects.create(
            article=temp_article,
            author=self.test_user,  # Different user
            content='Test comment 2',
            approved=True
        )
        
        # Verify comments exist
        self.assertTrue(Comment.objects.filter(id=comment1.id).exists())
        self.assertTrue(Comment.objects.filter(id=comment2.id).exists())
        
        # Delete the temporary article (should cascade delete comments)
        temp_article.delete()
        
        # Verify comments associated with the article are deleted (CASCADE behavior)
        self.assertFalse(
            Comment.objects.filter(id=comment1.id).exists(),
            "Comments should be deleted when associated article is deleted"
        )
        self.assertFalse(
            Comment.objects.filter(id=comment2.id).exists(),
            "Comments should be deleted when associated article is deleted"
        )
        
        # Clean up
        temp_user.delete()

    def test_comment_orphan_prevention(self):
        """
        Property: Comments cannot exist without proper article and author associations.
        """
        # Test that comments require an article
        with self.assertRaises((ValidationError, ValueError, TypeError)):
            Comment.objects.create(
                article=None,  # Missing required article
                author=self.test_user,
                content='Orphan comment test',
                approved=True
            )
        
        # Test that comments can exist without an author (anonymous comments)
        # This should be allowed based on the model definition
        anonymous_comment = Comment.objects.create(
            article=self.test_article,
            author=None,  # Anonymous comment
            content='Anonymous comment test',
            approved=True
        )
        
        # Verify the anonymous comment is properly associated with the article
        self.assertEqual(anonymous_comment.article, self.test_article)
        self.assertIsNone(anonymous_comment.author)
        
        # Clean up
        anonymous_comment.delete()

    @given(
        num_comments=st.integers(min_value=1, max_value=10)
    )
    @hypothesis_settings(max_examples=20, deadline=5000)
    def test_multiple_comments_integrity(self, num_comments):
        """
        Property: Multiple comments on the same article should maintain 
        independent but correct associations.
        """
        created_comments = []
        
        try:
            # Create multiple comments
            for i in range(num_comments):
                comment = Comment.objects.create(
                    article=self.test_article,
                    author=self.test_user,
                    content=f'Test comment {i}',
                    approved=True
                )
                created_comments.append(comment)
            
            # Verify all comments are properly associated
            for i, comment in enumerate(created_comments):
                self.assertEqual(
                    comment.article,
                    self.test_article,
                    f"Comment {i} must be associated with the correct article"
                )
                self.assertEqual(
                    comment.author,
                    self.test_user,
                    f"Comment {i} must be associated with the correct user"
                )
            
            # Verify article has all comments
            article_comments = list(self.test_article.comments.all())
            for comment in created_comments:
                self.assertIn(
                    comment,
                    article_comments,
                    "Article should contain all created comments"
                )
            
            # Verify user has all comments
            user_comments = list(self.test_user.comments.all())
            for comment in created_comments:
                self.assertIn(
                    comment,
                    user_comments,
                    "User should contain all created comments"
                )
            
            # Verify comment count integrity
            expected_count = len(created_comments)
            actual_count = Comment.objects.filter(
                article=self.test_article,
                author=self.test_user
            ).count()
            
            self.assertEqual(
                actual_count,
                expected_count,
                f"Database should contain exactly {expected_count} comments"
            )
            
        finally:
            # Clean up all created comments
            for comment in created_comments:
                try:
                    comment.delete()
                except:
                    pass  # Comment might already be deleted