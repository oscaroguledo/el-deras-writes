"""
Property-based tests for migration data preservation.
**Feature: django-postgresql-enhancement, Property 15: Migration data preservation**
**Validates: Requirements 4.1**
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


class MigrationDataPreservationTest(HypothesisTestCase):
    """
    Property-based tests to verify that migration preserves all data
    from SQLite to PostgreSQL without loss.
    """

    def setUp(self):
        """Set up test environment"""
        # Clean up Django database first
        from blog.models import CustomUser, Article, Comment, Category, Tag
        CustomUser.objects.all().delete()
        Article.objects.all().delete()
        Comment.objects.all().delete()
        Category.objects.all().delete()
        Tag.objects.all().delete()
        
        self.temp_dir = tempfile.mkdtemp()
        self.sqlite_db_path = os.path.join(self.temp_dir, 'test_migration.db')
        
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
        
        # Create tables matching Django models
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
        user_count=st.integers(min_value=1, max_value=5)
    )
    @settings(max_examples=50, deadline=None)
    def test_user_data_preservation(self, user_count):
        """
        Property: For any set of users, migration should preserve all user data
        without loss or corruption.
        """
        # Generate unique users to avoid constraint violations
        users = []
        cursor = self.sqlite_conn.cursor()
        
        for i in range(user_count):
            user_data = {
                'id': uuid.uuid4(),
                'username': f'user_{i}_{uuid.uuid4().hex[:8]}',
                'email': f'user{i}_{uuid.uuid4().hex[:8]}@test.com',
                'password': f'password{i}',
                'first_name': f'First{i}',
                'last_name': f'Last{i}',
                'user_type': 'normal',
                'is_active': True,
                'is_staff': False,
                'is_superuser': False,
            }
            users.append(user_data)
            
            cursor.execute('''
                INSERT INTO blog_customuser 
                (id, username, email, password, first_name, last_name, user_type, 
                 is_active, is_staff, is_superuser, date_joined)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                str(user_data['id']),
                user_data['username'],
                user_data['email'],
                user_data['password'],
                user_data['first_name'],
                user_data['last_name'],
                user_data['user_type'],
                int(user_data['is_active']),
                int(user_data['is_staff']),
                int(user_data['is_superuser']),
                datetime.now().isoformat()
            ))
        
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
        
        # Verify data preservation
        verifier = MigrationVerifier()
        verification_results = verifier.verify_migration(
            self.sqlite_db_path, 
            transfer_results
        )
        
        # Assert that migration preserved all data
        self.assertTrue(
            verification_results['success'],
            f"Migration verification failed: {verification_results['errors']}"
        )
        
        # Verify specific user data
        migrated_users = CustomUser.objects.all()
        self.assertEqual(len(migrated_users), len(users))
        
        for original_user in users:
            try:
                migrated_user = CustomUser.objects.get(id=original_user['id'])
                self.assertEqual(migrated_user.username, original_user['username'])
                self.assertEqual(migrated_user.email, original_user['email'])
                self.assertEqual(migrated_user.user_type, original_user['user_type'])
                self.assertEqual(migrated_user.is_active, original_user['is_active'])
                self.assertEqual(migrated_user.is_staff, original_user['is_staff'])
                self.assertEqual(migrated_user.is_superuser, original_user['is_superuser'])
            except CustomUser.DoesNotExist:
                self.fail(f"User {original_user['id']} not found after migration")

    @given(
        category_count=st.integers(min_value=1, max_value=3)
    )
    @settings(max_examples=30, deadline=None)
    def test_category_data_preservation(self, category_count):
        """
        Property: For any set of categories, migration should preserve all category data
        including hierarchical relationships.
        """
        # Generate unique categories to avoid constraint violations
        unique_categories = []
        cursor = self.sqlite_conn.cursor()
        
        for i in range(category_count):
            cat_data = {
                'id': uuid.uuid4(),
                'name': f'Category_{i}_{uuid.uuid4().hex[:8]}',
                'description': f'Description for category {i}',
            }
            unique_categories.append(cat_data)
            
            cursor.execute('''
                INSERT INTO blog_category (id, name, description, created_at)
                VALUES (?, ?, ?, ?)
            ''', (
                str(cat_data['id']),
                cat_data['name'],
                cat_data['description'],
                datetime.now().isoformat()
            ))
        
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
        
        # Verify data preservation
        verifier = MigrationVerifier()
        verification_results = verifier.verify_migration(
            self.sqlite_db_path, 
            transfer_results
        )
        
        # Assert that migration preserved all data
        self.assertTrue(
            verification_results['success'],
            f"Migration verification failed: {verification_results['errors']}"
        )
        
        # Verify specific category data
        migrated_categories = Category.objects.all()
        self.assertEqual(len(migrated_categories), len(unique_categories))
        
        for original_cat in unique_categories:
            try:
                migrated_cat = Category.objects.get(id=original_cat['id'])
                self.assertEqual(migrated_cat.name, original_cat['name'])
                self.assertEqual(migrated_cat.description, original_cat['description'])
            except Category.DoesNotExist:
                self.fail(f"Category {original_cat['id']} not found after migration")

    @given(
        article_count=st.integers(min_value=1, max_value=3)
    )
    @settings(max_examples=30, deadline=None)
    def test_article_data_preservation_with_relationships(self, article_count):
        """
        Property: For any set of articles with author relationships, migration should 
        preserve all article data and maintain foreign key relationships.
        """
        # Create a unique user for this test
        user_data = {
            'id': uuid.uuid4(),
            'username': f'author_{uuid.uuid4().hex[:8]}',
            'email': f'author_{uuid.uuid4().hex[:8]}@test.com',
            'password': 'password123',
        }
        
        # Insert user first (required for foreign key)
        cursor = self.sqlite_conn.cursor()
        cursor.execute('''
            INSERT INTO blog_customuser (id, username, email, password, date_joined)
            VALUES (?, ?, ?, ?, ?)
        ''', (
            str(user_data['id']),
            user_data['username'],
            user_data['email'],
            user_data['password'],
            datetime.now().isoformat()
        ))
        
        # Generate and insert articles
        articles_data = []
        for i in range(article_count):
            article_data = {
                'id': uuid.uuid4(),
                'title': f'Article {i}',
                'content': f'Content for article {i}',
                'status': 'draft',
                'featured': False,
                'views': 0,
                'likes': 0,
            }
            articles_data.append(article_data)
            
            cursor.execute('''
                INSERT INTO blog_article 
                (id, title, slug, content, status, featured, views, likes, author_id, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                str(article_data['id']),
                article_data['title'],
                f"article-{i}-{uuid.uuid4().hex[:8]}",  # Unique slug
                article_data['content'],
                article_data['status'],
                int(article_data['featured']),
                article_data['views'],
                article_data['likes'],
                str(user_data['id']),
                datetime.now().isoformat()
            ))
        
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
        
        # Verify data preservation
        verifier = MigrationVerifier()
        verification_results = verifier.verify_migration(
            self.sqlite_db_path, 
            transfer_results
        )
        
        # Assert that migration preserved all data
        self.assertTrue(
            verification_results['success'],
            f"Migration verification failed: {verification_results['errors']}"
        )
        
        # Verify specific article data and relationships
        migrated_articles = Article.objects.all()
        self.assertEqual(len(migrated_articles), len(articles_data))
        
        # Verify user was migrated
        migrated_user = CustomUser.objects.get(id=user_data['id'])
        self.assertEqual(migrated_user.username, user_data['username'])
        
        # Verify articles and their relationships
        for original_article in articles_data:
            try:
                migrated_article = Article.objects.get(id=original_article['id'])
                self.assertEqual(migrated_article.title, original_article['title'])
                self.assertEqual(migrated_article.content, original_article['content'])
                self.assertEqual(migrated_article.status, original_article['status'])
                self.assertEqual(migrated_article.featured, original_article['featured'])
                self.assertEqual(migrated_article.views, original_article['views'])
                self.assertEqual(migrated_article.likes, original_article['likes'])
                
                # Verify foreign key relationship is preserved
                self.assertEqual(migrated_article.author.id, user_data['id'])
                
            except Article.DoesNotExist:
                self.fail(f"Article {original_article['id']} not found after migration")

    def test_empty_database_migration(self):
        """
        Property: Migration of an empty database should complete successfully
        without errors.
        """
        # Perform migration on empty database
        converter = SQLiteToPostgreSQLConverter()
        schema_mapping = converter.convert_schema(self.sqlite_db_path)
        
        transfer_manager = DataTransferManager()
        transfer_results = transfer_manager.transfer_data(
            self.sqlite_db_path, 
            schema_mapping, 
            dry_run=False
        )
        
        # Verify migration completed successfully
        verifier = MigrationVerifier()
        verification_results = verifier.verify_migration(
            self.sqlite_db_path, 
            transfer_results
        )
        
        # Assert that migration succeeded even with empty database
        self.assertTrue(
            verification_results['success'],
            f"Empty database migration failed: {verification_results['errors']}"
        )
        
        # Verify all tables have zero records
        for table_name, count in transfer_results.items():
            self.assertEqual(count, 0, f"Expected 0 records for {table_name}, got {count}")

    @given(
        record_count=st.integers(min_value=1, max_value=10)
    )
    @settings(max_examples=10, deadline=None)
    def test_large_dataset_preservation(self, record_count):
        """
        Property: Migration should preserve data integrity regardless of dataset size.
        """
        # Create a user for foreign key relationships
        user_id = str(uuid.uuid4())
        unique_suffix = uuid.uuid4().hex[:8]
        cursor = self.sqlite_conn.cursor()
        cursor.execute('''
            INSERT INTO blog_customuser (id, username, email, password, date_joined)
            VALUES (?, ?, ?, ?, ?)
        ''', (user_id, f'user_{unique_suffix}', f'user{unique_suffix}@test.com', 'password123', datetime.now().isoformat()))
        
        # Insert multiple records
        for i in range(record_count):
            cursor.execute('''
                INSERT INTO blog_article 
                (id, title, slug, content, author_id, created_at)
                VALUES (?, ?, ?, ?, ?, ?)
            ''', (
                str(uuid.uuid4()),
                f'Article {i}',
                f'article-{i}-{unique_suffix}',  # Unique slug
                f'Content for article {i}',
                user_id,
                datetime.now().isoformat()
            ))
        
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
        
        # Verify data preservation
        verifier = MigrationVerifier()
        verification_results = verifier.verify_migration(
            self.sqlite_db_path, 
            transfer_results
        )
        
        # Assert that migration preserved all data
        self.assertTrue(
            verification_results['success'],
            f"Large dataset migration failed: {verification_results['errors']}"
        )
        
        # Verify record counts
        self.assertEqual(Article.objects.count(), record_count)
        self.assertEqual(CustomUser.objects.count(), 1)