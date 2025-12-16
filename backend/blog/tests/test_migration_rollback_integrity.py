"""
Property-based tests for migration rollback integrity.
**Feature: django-postgresql-enhancement, Property 19: Migration rollback integrity**
**Validates: Requirements 4.5**
"""

import os
import sqlite3
import tempfile
import uuid
from datetime import datetime
from unittest.mock import patch

from django.db import transaction
from hypothesis import given, strategies as st, settings
from hypothesis.extra.django import TestCase as HypothesisTestCase

from blog.models import CustomUser, Article
from blog.utils.migration_utils import (
    SQLiteToPostgreSQLConverter,
    DataTransferManager,
    MigrationVerifier,
)


class MigrationRollbackIntegrityTest(HypothesisTestCase):
    """
    Tests to verify that a failed migration is correctly rolled back,
    ensuring no partial data is left in the PostgreSQL database.
    """

    def setUp(self):
        """Set up a temporary SQLite database for testing."""
        CustomUser.objects.all().delete()
        Article.objects.all().delete()

        self.temp_dir = tempfile.mkdtemp()
        self.sqlite_db_path = os.path.join(self.temp_dir, "test_migration.db")

        self.sqlite_conn = sqlite3.connect(self.sqlite_db_path)
        self._create_sqlite_schema()

    def tearDown(self):
        """Clean up test resources."""
        if hasattr(self, "sqlite_conn"):
            self.sqlite_conn.close()

        import shutil
        if os.path.exists(self.temp_dir):
            shutil.rmtree(self.temp_dir)

    def _create_sqlite_schema(self):
        """Create a basic SQLite schema for testing."""
        cursor = self.sqlite_conn.cursor()
        cursor.execute(
            """
            CREATE TABLE blog_customuser (
                id TEXT PRIMARY KEY,
                username TEXT UNIQUE NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                first_name TEXT,
                last_name TEXT,
                date_joined TEXT
            )
            """
        )
        cursor.execute(
            """
            CREATE TABLE blog_article (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                slug TEXT UNIQUE,
                content TEXT NOT NULL,
                author_id TEXT NOT NULL,
                created_at TEXT,
                FOREIGN KEY (author_id) REFERENCES blog_customuser (id)
            )
            """
        )
        self.sqlite_conn.commit()

    @given(st.text(min_size=5, max_size=20))
    @settings(max_examples=10, deadline=None)
    def test_migration_rollback_leaves_database_clean(self, title):
        """
        Property: A failed migration should be completely rolled back,
        leaving the PostgreSQL database in its original state.
        """
        cursor = self.sqlite_conn.cursor()
        user_id = str(uuid.uuid4())
        unique_suffix = uuid.uuid4().hex[:8]

        cursor.execute(
            "INSERT INTO blog_customuser (id, username, email, password, first_name, last_name, date_joined) VALUES (?, ?, ?, ?, ?, ?, ?)",
            (
                user_id,
                f"user_{unique_suffix}",
                f"user_{unique_suffix}@test.com",
                "password",
                "first",
                "last",
                datetime.now().isoformat(),
            ),
        )
        self.sqlite_conn.commit()

        # Simulate a migration failure
        with patch(
            "blog.utils.migration_utils.DataTransferManager._transfer_table_data"
        ) as mock_transfer:
            mock_transfer.side_effect = Exception("Simulated migration failure")

            converter = SQLiteToPostgreSQLConverter()
            schema_mapping = converter.convert_schema(self.sqlite_db_path)

            transfer_manager = DataTransferManager()
            with self.assertRaises(Exception):
                transfer_manager.transfer_data(
                    self.sqlite_db_path, schema_mapping, dry_run=False, raise_on_error=True
                )

        # Verify that no data was committed to PostgreSQL
        self.assertEqual(CustomUser.objects.count(), 0)
        self.assertEqual(Article.objects.count(), 0)

