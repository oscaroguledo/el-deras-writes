"""
Property-based tests for relationship preservation during migration.
**Feature: django-postgresql-enhancement, Property 17: Relationship preservation**
**Validates: Requirements 4.3**
"""

import os
import sqlite3
import tempfile
import uuid
from datetime import datetime

from django.test import TestCase
from hypothesis import given, strategies as st, settings
from hypothesis.extra.django import TestCase as HypothesisTestCase

from blog.models import CustomUser, Article, Comment, Category, Tag
from blog.utils.migration_utils import (
    SQLiteToPostgreSQLConverter,
    DataTransferManager,
    MigrationVerifier
)


class RelationshipPreservationTest(HypothesisTestCase):
    """
    Property-based tests to verify that foreign key relationships are preserved
    during SQLite to PostgreSQL migration.
    """

    def setUp(self):
        """Set up test environment"""
        # Clean up Django database first
        CustomUser.objects.all().delete()
        Article.objects.all().delete()
        Comment.objects.all().delete()
        Category.objects.all().delete()
        Tag.objects.all().delete()
        
        self.temp_dir = tempfile.mkdtemp()
        self.sqlite_db_path = os.path.join(self.temp_dir, 'test_relationships.db')
        
        # Create SQLite database for testing
        self.sqlite_conn = sqlite3.connect(self.sqlite_db_path)
        self._create_sqlite_schema()

    def tearDown(self):
        """Clean up test environment"""
        if hasattr(self, 'sqlite_conn'):
            self.sqlite_conn.close()
        
        # Clean up temp files
        import shutil
        if os.path.exists(self.temp_dir):
            shutil.rmtree(self.temp_dir)

    def _create_sqlite_schema(self):
        """Create SQLite schema matching Django models"""
        cursor = self.sqlite_conn.cursor()
        
        # Create tables matching Django models with foreign keys
        cursor.execute('''
            CREATE TABLE blog_customuser (
                id TEXT PRIMARY KEY,
                username TEXT UNIQUE NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                first_name TEXT NOT NULL DEFAULT '',
                last_name TEXT NOT NULL DEFAULT '',
                user_type TEXT DEFAULT 'normal',
                is_active INTEGER DEFAULT 1,
                is_staff INTEGER DEFAULT 0,
                is_superuser INTEGER DEFAULT 0,
                date_joined TEXT
            )
        ''')
        
        cursor.execute('''
            CREATE TABLE blog_category (
                id TEXT PRIMARY KEY,
                name TEXT UNIQUE NOT NULL,
                parent_id TEXT,
                description TEXT,
                created_at TEXT,
                FOREIGN KEY (parent_id) REFERENCES blog_category (id)
            )
        ''')
        
        cursor.execute('''
            CREATE TABLE blog_tag (
                id TEXT PRIMARY KEY,
                name TEXT UNIQUE NOT NULL,
                created_at TEXT
            )
        ''')
        
        cursor.execute('''
            CREATE TABLE blog_article (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                slug TEXT UNIQUE,
                content TEXT NOT NULL,
                author_id TEXT NOT NULL,
                category_id TEXT,
                status TEXT DEFAULT 'draft',
                created_at TEXT,
                FOREIGN KEY (author_id) REFERENCES blog_customuser (id),
                FOREIGN KEY (category_id) REFERENCES blog_category (id)
            )
        ''')
        
        cursor.execute('''
            CREATE TABLE blog_comment (
                id TEXT PRIMARY KEY,
                article_id TEXT NOT NULL,
                author_id TEXT,
                parent_id TEXT,
                content TEXT NOT NULL,
                approved INTEGER DEFAULT 0,
                created_at TEXT,
                FOREIGN KEY (article_id) REFERENCES blog_article (id),
                FOREIGN KEY (author_id) REFERENCES blog_customuser (id),
                FOREIGN KEY (parent_id) REFERENCES blog_comment (id)
            )
        ''')
        
        self.sqlite_conn.commit()

    def test_user_article_relationship_preservation(self):
        """
        Property: User-Article relationships should be preserved during migration.
        """
        # Create test data with relationships
        user_id = str(uuid.uuid4())
        article_id = str(uuid.uuid4())
        
        cursor = self.sqlite_conn.cursor()
        
        # Insert user
        cursor.execute('''
            INSERT INTO blog_customuser (id, username, email, password, date_joined)
            VALUES (?, ?, ?, ?, ?)
        ''', (user_id, 'testuser', 'test@example.com', 'password123', datetime.now().isoformat()))
        
        # Insert article with foreign key to user
        cursor.execute('''
            INSERT INTO blog_article (id, title, slug, content, author_id, created_at)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (article_id, 'Test Article', 'test-article', 'Test content', user_id, datetime.now().isoformat()))
        
        self.sqlite_conn.commit()
        
        # Perform migration
        converter = SQLiteToPostgreSQLConverter()
        schema_mapping = converter.convert_schema(self.sqlite_db_path)
        
        transfer_manager = DataTransferManager()
        transfer_results = transfer_manager.transfer_data(
            self.sqlite_db_path, 
            schema_mapping, 
            dry_run=False
        )
        
        # Verify relationships are preserved
        migrated_user = CustomUser.objects.get(id=user_id)
        migrated_article = Article.objects.get(id=article_id)
        
        # Verify foreign key relationship
        self.assertEqual(migrated_article.author.id, migrated_user.id)
        self.assertEqual(migrated_article.author.username, 'testuser')
        self.assertEqual(migrated_article.title, 'Test Article')

    def test_article_comment_relationship_preservation(self):
        """
        Property: Article-Comment relationships should be preserved during migration.
        """
        # Create test data with relationships
        user_id = str(uuid.uuid4())
        article_id = str(uuid.uuid4())
        comment_id = str(uuid.uuid4())
        
        cursor = self.sqlite_conn.cursor()
        
        # Insert user
        cursor.execute('''
            INSERT INTO blog_customuser (id, username, email, password, date_joined)
            VALUES (?, ?, ?, ?, ?)
        ''', (user_id, 'commenter', 'commenter@example.com', 'password123', datetime.now().isoformat()))
        
        # Insert article
        cursor.execute('''
            INSERT INTO blog_article (id, title, slug, content, author_id, created_at)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (article_id, 'Article with Comments', 'article-comments', 'Article content', user_id, datetime.now().isoformat()))
        
        # Insert comment with foreign keys to article and user
        cursor.execute('''
            INSERT INTO blog_comment (id, article_id, author_id, content, created_at)
            VALUES (?, ?, ?, ?, ?)
        ''', (comment_id, article_id, user_id, 'Test comment', datetime.now().isoformat()))
        
        self.sqlite_conn.commit()
        
        # Perform migration
        converter = SQLiteToPostgreSQLConverter()
        schema_mapping = converter.convert_schema(self.sqlite_db_path)
        
        transfer_manager = DataTransferManager()
        transfer_results = transfer_manager.transfer_data(
            self.sqlite_db_path, 
            schema_mapping, 
            dry_run=False
        )
        
        # Verify relationships are preserved
        migrated_comment = Comment.objects.get(id=comment_id)
        migrated_article = Article.objects.get(id=article_id)
        migrated_user = CustomUser.objects.get(id=user_id)
        
        # Verify foreign key relationships
        self.assertEqual(migrated_comment.article.id, migrated_article.id)
        self.assertEqual(migrated_comment.author.id, migrated_user.id)
        self.assertEqual(migrated_comment.content, 'Test comment')

    def test_hierarchical_comment_relationship_preservation(self):
        """
        Property: Hierarchical comment relationships (parent-child) should be preserved.
        """
        # Create test data with hierarchical relationships
        user_id = str(uuid.uuid4())
        article_id = str(uuid.uuid4())
        parent_comment_id = str(uuid.uuid4())
        child_comment_id = str(uuid.uuid4())
        
        cursor = self.sqlite_conn.cursor()
        
        # Insert user
        cursor.execute('''
            INSERT INTO blog_customuser (id, username, email, password, date_joined)
            VALUES (?, ?, ?, ?, ?)
        ''', (user_id, 'commenter', 'commenter@example.com', 'password123', datetime.now().isoformat()))
        
        # Insert article
        cursor.execute('''
            INSERT INTO blog_article (id, title, slug, content, author_id, created_at)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (article_id, 'Article with Nested Comments', 'nested-comments', 'Article content', user_id, datetime.now().isoformat()))
        
        # Insert parent comment
        cursor.execute('''
            INSERT INTO blog_comment (id, article_id, author_id, content, created_at)
            VALUES (?, ?, ?, ?, ?)
        ''', (parent_comment_id, article_id, user_id, 'Parent comment', datetime.now().isoformat()))
        
        # Insert child comment with parent reference
        cursor.execute('''
            INSERT INTO blog_comment (id, article_id, author_id, parent_id, content, created_at)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (child_comment_id, article_id, user_id, parent_comment_id, 'Child comment', datetime.now().isoformat()))
        
        self.sqlite_conn.commit()
        
        # Perform migration
        converter = SQLiteToPostgreSQLConverter()
        schema_mapping = converter.convert_schema(self.sqlite_db_path)
        
        transfer_manager = DataTransferManager()
        transfer_results = transfer_manager.transfer_data(
            self.sqlite_db_path, 
            schema_mapping, 
            dry_run=False
        )
        
        # Verify hierarchical relationships are preserved
        parent_comment = Comment.objects.get(id=parent_comment_id)
        child_comment = Comment.objects.get(id=child_comment_id)
        
        # Verify parent-child relationship
        self.assertEqual(child_comment.parent.id, parent_comment.id)
        self.assertIsNone(parent_comment.parent)
        self.assertEqual(child_comment.content, 'Child comment')
        self.assertEqual(parent_comment.content, 'Parent comment')

    def test_category_hierarchy_relationship_preservation(self):
        """
        Property: Category hierarchy relationships should be preserved during migration.
        """
        # Create test data with category hierarchy
        parent_category_id = str(uuid.uuid4())
        child_category_id = str(uuid.uuid4())
        
        cursor = self.sqlite_conn.cursor()
        
        # Insert parent category
        cursor.execute('''
            INSERT INTO blog_category (id, name, description, created_at)
            VALUES (?, ?, ?, ?)
        ''', (parent_category_id, 'Parent Category', 'Parent description', datetime.now().isoformat()))
        
        # Insert child category with parent reference
        cursor.execute('''
            INSERT INTO blog_category (id, name, parent_id, description, created_at)
            VALUES (?, ?, ?, ?, ?)
        ''', (child_category_id, 'Child Category', parent_category_id, 'Child description', datetime.now().isoformat()))
        
        self.sqlite_conn.commit()
        
        # Perform migration
        converter = SQLiteToPostgreSQLConverter()
        schema_mapping = converter.convert_schema(self.sqlite_db_path)
        
        transfer_manager = DataTransferManager()
        transfer_results = transfer_manager.transfer_data(
            self.sqlite_db_path, 
            schema_mapping, 
            dry_run=False
        )
        
        # Verify category hierarchy is preserved
        parent_category = Category.objects.get(id=parent_category_id)
        child_category = Category.objects.get(id=child_category_id)
        
        # Verify parent-child relationship
        self.assertEqual(child_category.parent.id, parent_category.id)
        self.assertIsNone(parent_category.parent)
        self.assertEqual(child_category.name, 'Child Category')
        self.assertEqual(parent_category.name, 'Parent Category')

    def test_article_category_relationship_preservation(self):
        """
        Property: Article-Category relationships should be preserved during migration.
        """
        # Create test data with article-category relationship
        user_id = str(uuid.uuid4())
        category_id = str(uuid.uuid4())
        article_id = str(uuid.uuid4())
        
        cursor = self.sqlite_conn.cursor()
        
        # Insert user
        cursor.execute('''
            INSERT INTO blog_customuser (id, username, email, password, date_joined)
            VALUES (?, ?, ?, ?, ?)
        ''', (user_id, 'author', 'author@example.com', 'password123', datetime.now().isoformat()))
        
        # Insert category
        cursor.execute('''
            INSERT INTO blog_category (id, name, description, created_at)
            VALUES (?, ?, ?, ?)
        ''', (category_id, 'Technology', 'Tech articles', datetime.now().isoformat()))
        
        # Insert article with category reference
        cursor.execute('''
            INSERT INTO blog_article (id, title, slug, content, author_id, category_id, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', (article_id, 'Tech Article', 'tech-article', 'Tech content', user_id, category_id, datetime.now().isoformat()))
        
        self.sqlite_conn.commit()
        
        # Perform migration
        converter = SQLiteToPostgreSQLConverter()
        schema_mapping = converter.convert_schema(self.sqlite_db_path)
        
        transfer_manager = DataTransferManager()
        transfer_results = transfer_manager.transfer_data(
            self.sqlite_db_path, 
            schema_mapping, 
            dry_run=False
        )
        
        # Verify article-category relationship is preserved
        migrated_article = Article.objects.get(id=article_id)
        migrated_category = Category.objects.get(id=category_id)
        
        # Verify foreign key relationship
        self.assertEqual(migrated_article.category.id, migrated_category.id)
        self.assertEqual(migrated_article.category.name, 'Technology')
        self.assertEqual(migrated_article.title, 'Tech Article')

    @given(
        user_count=st.integers(min_value=1, max_value=3),
        article_count=st.integers(min_value=1, max_value=5)
    )
    @settings(max_examples=10, deadline=None)
    def test_multiple_relationships_preservation(self, user_count, article_count):
        """
        Property: Multiple complex relationships should be preserved during migration.
        """
        # Generate test data
        users = []
        articles = []
        
        cursor = self.sqlite_conn.cursor()
        
        # Create users
        for i in range(user_count):
            user_id = str(uuid.uuid4())
            users.append(user_id)
            cursor.execute('''
                INSERT INTO blog_customuser (id, username, email, password, date_joined)
                VALUES (?, ?, ?, ?, ?)
            ''', (user_id, f'user_{i}', f'user{i}@example.com', 'password123', datetime.now().isoformat()))
        
        # Create articles with user relationships
        for i in range(article_count):
            article_id = str(uuid.uuid4())
            author_id = users[i % len(users)]  # Distribute articles among users
            articles.append((article_id, author_id))
            
            cursor.execute('''
                INSERT INTO blog_article (id, title, slug, content, author_id, created_at)
                VALUES (?, ?, ?, ?, ?, ?)
            ''', (article_id, f'Article {i}', f'article-{i}', f'Content {i}', author_id, datetime.now().isoformat()))
        
        self.sqlite_conn.commit()
        
        # Perform migration
        converter = SQLiteToPostgreSQLConverter()
        schema_mapping = converter.convert_schema(self.sqlite_db_path)
        
        transfer_manager = DataTransferManager()
        transfer_results = transfer_manager.transfer_data(
            self.sqlite_db_path, 
            schema_mapping, 
            dry_run=False
        )
        
        # Verify all relationships are preserved
        for article_id, expected_author_id in articles:
            migrated_article = Article.objects.get(id=article_id)
            self.assertEqual(migrated_article.author.id, expected_author_id)
        
        # Verify all users were migrated
        self.assertEqual(CustomUser.objects.count(), user_count)
        self.assertEqual(Article.objects.count(), article_count)

    def test_null_relationship_preservation(self):
        """
        Property: NULL foreign key relationships should be preserved during migration.
        """
        # Create test data with NULL foreign keys
        user_id = str(uuid.uuid4())
        article_id = str(uuid.uuid4())
        comment_id = str(uuid.uuid4())
        
        cursor = self.sqlite_conn.cursor()
        
        # Insert user
        cursor.execute('''
            INSERT INTO blog_customuser (id, username, email, password, date_joined)
            VALUES (?, ?, ?, ?, ?)
        ''', (user_id, 'author', 'author@example.com', 'password123', datetime.now().isoformat()))
        
        # Insert article without category (NULL foreign key)
        cursor.execute('''
            INSERT INTO blog_article (id, title, slug, content, author_id, category_id, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', (article_id, 'Uncategorized Article', 'uncategorized', 'Content', user_id, None, datetime.now().isoformat()))
        
        # Insert comment without author (NULL foreign key)
        cursor.execute('''
            INSERT INTO blog_comment (id, article_id, author_id, content, created_at)
            VALUES (?, ?, ?, ?, ?)
        ''', (comment_id, article_id, None, 'Anonymous comment', datetime.now().isoformat()))
        
        self.sqlite_conn.commit()
        
        # Perform migration
        converter = SQLiteToPostgreSQLConverter()
        schema_mapping = converter.convert_schema(self.sqlite_db_path)
        
        transfer_manager = DataTransferManager()
        transfer_results = transfer_manager.transfer_data(
            self.sqlite_db_path, 
            schema_mapping, 
            dry_run=False
        )
        
        # Verify NULL relationships are preserved
        migrated_article = Article.objects.get(id=article_id)
        migrated_comment = Comment.objects.get(id=comment_id)
        
        # Verify NULL foreign keys
        self.assertIsNone(migrated_article.category)
        self.assertIsNone(migrated_comment.author)
        self.assertEqual(migrated_comment.article.id, article_id)

    def test_foreign_key_constraint_verification(self):
        """
        Property: Foreign key constraints should be properly verified after migration.
        """
        # Create test data
        user_id = str(uuid.uuid4())
        article_id = str(uuid.uuid4())
        
        cursor = self.sqlite_conn.cursor()
        
        # Insert user
        cursor.execute('''
            INSERT INTO blog_customuser (id, username, email, password, date_joined)
            VALUES (?, ?, ?, ?, ?)
        ''', (user_id, 'testuser', 'test@example.com', 'password123', datetime.now().isoformat()))
        
        # Insert article
        cursor.execute('''
            INSERT INTO blog_article (id, title, slug, content, author_id, created_at)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (article_id, 'Test Article', 'test-article', 'Content', user_id, datetime.now().isoformat()))
        
        self.sqlite_conn.commit()
        
        # Perform migration
        converter = SQLiteToPostgreSQLConverter()
        schema_mapping = converter.convert_schema(self.sqlite_db_path)
        
        transfer_manager = DataTransferManager()
        transfer_results = transfer_manager.transfer_data(
            self.sqlite_db_path, 
            schema_mapping, 
            dry_run=False
        )
        
        # Verify migration with foreign key verification
        verifier = MigrationVerifier()
        verification_results = verifier.verify_migration(
            self.sqlite_db_path, 
            transfer_results
        )
        
        # Assert that migration verification passes
        self.assertTrue(
            verification_results['success'],
            f"Migration verification failed: {verification_results['errors']}"
        )
        
        # Verify no orphaned records
        migrated_article = Article.objects.get(id=article_id)
        self.assertIsNotNone(migrated_article.author)
        self.assertEqual(migrated_article.author.id, user_id)