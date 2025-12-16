"""
Property-based tests for migration relationship preservation.
**Feature: django-postgresql-enhancement, Property 17: Relationship preservation**
**Validates: Requirements 4.3**
"""

import os
import sqlite3
import tempfile
import uuid
from datetime import datetime, timezone
from pathlib import Path

from django.test import TestCase, override_settings
from django.db import connection, transaction
from hypothesis import given, strategies as st, settings, assume
from hypothesis.extra.django import TestCase as HypothesisTestCase

from blog.models import CustomUser, Article, Comment, Category, Tag
from blog.utils.migration_utils import (
    SQLiteToPostgreSQLConverter,
    DataTransferManager,
    MigrationVerifier
)


class RelationshipPreservationTest(HypothesisTestCase):
    """
    Property-based tests to verify that migration preserves all relationships
    from SQLite to PostgreSQL without loss.
    """

    def setUp(self):
        """Set up test environment"""
        from blog.models import CustomUser, Article, Comment, Category, Tag
        CustomUser.objects.all().delete()
        Article.objects.all().delete()
        Comment.objects.all().delete()
        Category.objects.all().delete()
        Tag.objects.all().delete()
        
        self.temp_dir = tempfile.mkdtemp()
        self.sqlite_db_path = os.path.join(self.temp_dir, 'test_migration.db')
        
        self.sqlite_conn = sqlite3.connect(self.sqlite_db_path)
        self._create_sqlite_schema()

    def tearDown(self):
        """Clean up test environment"""
        if hasattr(self, 'sqlite_conn'):
            self.sqlite_conn.close()
        
        import shutil
        if os.path.exists(self.temp_dir):
            shutil.rmtree(self.temp_dir)

    def _create_sqlite_schema(self):
        """Create SQLite schema matching Django models"""
        cursor = self.sqlite_conn.cursor()
        
        cursor.execute('''
            CREATE TABLE blog_customuser (
                id TEXT PRIMARY KEY,
                username TEXT UNIQUE NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                first_name TEXT,
                last_name TEXT,
                title TEXT,
                bio TEXT,
                user_type TEXT DEFAULT 'normal',
                preferences TEXT DEFAULT '{}',
                avatar_base64 TEXT,
                location TEXT,
                timezone TEXT,
                ip_address TEXT,
                country TEXT,
                region TEXT,
                city TEXT,
                last_active TEXT,
                is_staff INTEGER DEFAULT 0,
                is_active INTEGER DEFAULT 1,
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
                excerpt TEXT,
                content TEXT NOT NULL,
                content_vector TEXT,
                image_base64 TEXT,
                image TEXT,
                readTime TEXT,
                read_time INTEGER,
                author_id TEXT NOT NULL,
                category_id TEXT,
                status TEXT DEFAULT 'draft',
                featured INTEGER DEFAULT 0,
                views INTEGER DEFAULT 0,
                likes INTEGER DEFAULT 0,
                scheduled_publish TEXT,
                created_at TEXT,
                updated_at TEXT,
                published_at TEXT,
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
                content_vector TEXT,
                ip_address TEXT,
                user_agent TEXT,
                approved INTEGER DEFAULT 0,
                is_flagged INTEGER DEFAULT 0,
                moderation_notes TEXT,
                moderated_by_id TEXT,
                moderated_at TEXT,
                created_at TEXT,
                updated_at TEXT,
                FOREIGN KEY (article_id) REFERENCES blog_article (id),
                FOREIGN KEY (author_id) REFERENCES blog_customuser (id),
                FOREIGN KEY (parent_id) REFERENCES blog_comment (id),
                FOREIGN KEY (moderated_by_id) REFERENCES blog_customuser (id)
            )
        ''')
        
        self.sqlite_conn.commit()

    @given(
        st.integers(min_value=1, max_value=3)
    )
    @settings(max_examples=10, deadline=None)
    def test_all_relationships_preserved(self, comment_count):
        """
        Property: Migration should preserve relationships between users, articles, comments, and categories.
        """
        cursor = self.sqlite_conn.cursor()

        user_id = str(uuid.uuid4())
        category_id = str(uuid.uuid4())
        article_id = str(uuid.uuid4())
        unique_suffix = uuid.uuid4().hex[:8]

        cursor.execute("INSERT INTO blog_customuser (id, username, email, password, first_name, last_name, date_joined) VALUES (?, ?, ?, ?, ?, ?, ?)",
                       (user_id, f'user_{unique_suffix}', f'user_{unique_suffix}@test.com', 'password', '', '', datetime.now().isoformat()))
        
        cursor.execute("INSERT INTO blog_category (id, name, created_at) VALUES (?, ?, ?)",
                       (category_id, f'Category {unique_suffix}', datetime.now().isoformat()))

        cursor.execute("INSERT INTO blog_article (id, title, slug, content, author_id, category_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
                       (article_id, f'Article {unique_suffix}', f'article-{unique_suffix}', 'Content', user_id, category_id, datetime.now().isoformat()))

        for i in range(comment_count):
            comment_id = str(uuid.uuid4())
            cursor.execute("INSERT INTO blog_comment (id, article_id, author_id, content, created_at) VALUES (?, ?, ?, ?, ?)",
                           (comment_id, article_id, user_id, f'Comment {i}', datetime.now().isoformat()))

        self.sqlite_conn.commit()

        converter = SQLiteToPostgreSQLConverter()
        schema_mapping = converter.convert_schema(self.sqlite_db_path)
        
        transfer_manager = DataTransferManager()
        transfer_results = transfer_manager.transfer_data(self.sqlite_db_path, schema_mapping, dry_run=False)
        
        verifier = MigrationVerifier()
        verification_results = verifier.verify_migration(self.sqlite_db_path, transfer_results)
        
        self.assertTrue(verification_results['success'], f"Migration verification failed: {verification_results['errors']}")
        
        migrated_article = Article.objects.get(id=article_id)
        self.assertEqual(migrated_article.author.id, uuid.UUID(user_id))
        self.assertEqual(migrated_article.category.id, uuid.UUID(category_id))
        self.assertEqual(migrated_article.comments.count(), comment_count)
        for comment in migrated_article.comments.all():
            self.assertEqual(comment.author.id, uuid.UUID(user_id))
