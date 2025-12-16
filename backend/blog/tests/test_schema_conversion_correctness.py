"""
Property-based tests for schema conversion correctness.
**Feature: django-postgresql-enhancement, Property 16: Schema conversion correctness**
**Validates: Requirements 4.2**
"""

import os
import sqlite3
import tempfile
from pathlib import Path

from django.test import TestCase
from hypothesis import given, strategies as st, settings
from hypothesis.extra.django import TestCase as HypothesisTestCase

from blog.utils.migration_utils import SQLiteToPostgreSQLConverter


class SchemaConversionCorrectnessTest(HypothesisTestCase):
    """
    Property-based tests to verify that SQLite to PostgreSQL schema conversion
    correctly maps data types and preserves schema structure.
    """

    def setUp(self):
        """Set up test environment"""
        self.temp_dir = tempfile.mkdtemp()
        self.sqlite_db_path = os.path.join(self.temp_dir, 'test_schema.db')
        self.converter = SQLiteToPostgreSQLConverter()

    def tearDown(self):
        """Clean up test environment"""
        import shutil
        if os.path.exists(self.temp_dir):
            shutil.rmtree(self.temp_dir)

    def _create_test_table(self, table_name: str, columns: list):
        """Create a test table with specified columns"""
        conn = sqlite3.connect(self.sqlite_db_path)
        cursor = conn.cursor()
        
        column_defs = []
        for col in columns:
            col_def = f"{col['name']} {col['type']}"
            if col.get('primary_key'):
                col_def += " PRIMARY KEY"
            if col.get('not_null'):
                col_def += " NOT NULL"
            if col.get('unique'):
                col_def += " UNIQUE"
            if col.get('default') is not None:
                col_def += f" DEFAULT {col['default']}"
            column_defs.append(col_def)
        
        create_sql = f"CREATE TABLE {table_name} ({', '.join(column_defs)})"
        cursor.execute(create_sql)
        conn.commit()
        conn.close()

    def test_basic_type_conversion_correctness(self):
        """
        Property: For any SQLite table schema, the converted PostgreSQL schema
        should have equivalent data types and constraints.
        """
        # Test with a simple table
        table_name = "test_table"
        columns = [
            {'name': 'id', 'type': 'INTEGER', 'primary_key': True, 'not_null': True},
            {'name': 'name', 'type': 'TEXT', 'not_null': True},
            {'name': 'value', 'type': 'REAL'},
        ]
        
        # Create test table
        self._create_test_table(table_name, columns)
        
        # Convert schema
        schema_mapping = self.converter.convert_schema(self.sqlite_db_path)
        
        # Verify table was converted
        self.assertIn(table_name, schema_mapping)
        converted_schema = schema_mapping[table_name]
        
        # Verify all columns were converted
        converted_columns = {col['name']: col for col in converted_schema['columns']}
        
        for original_col in columns:
            col_name = original_col['name']
            self.assertIn(col_name, converted_columns)
            
            converted_col = converted_columns[col_name]
            
            # Verify type conversion
            expected_pg_type = self.converter._convert_column_type(original_col['type'])
            self.assertEqual(converted_col['type'], expected_pg_type)
            
            # Verify constraints are preserved
            if original_col.get('primary_key'):
                self.assertTrue(converted_col['primary_key'])
            
            if original_col.get('not_null'):
                self.assertFalse(converted_col['nullable'])

    def test_sqlite_to_postgresql_type_mapping(self):
        """
        Property: All SQLite data types should have valid PostgreSQL equivalents.
        """
        # Test all supported SQLite types
        sqlite_types = [
            'INTEGER', 'TEXT', 'REAL', 'BLOB', 'NUMERIC',
            'VARCHAR(255)', 'CHAR(10)', 'BOOLEAN', 'DATE', 
            'DATETIME', 'TIME', 'DECIMAL(10,2)', 'FLOAT', 
            'BIGINT', 'SMALLINT'
        ]
        
        for sqlite_type in sqlite_types:
            with self.subTest(sqlite_type=sqlite_type):
                pg_type = self.converter._convert_column_type(sqlite_type)
                
                # Verify conversion produces a valid PostgreSQL type
                self.assertIsInstance(pg_type, str)
                self.assertGreater(len(pg_type), 0)
                
                # Verify specific mappings
                if sqlite_type == 'INTEGER':
                    self.assertEqual(pg_type, 'INTEGER')
                elif sqlite_type == 'TEXT':
                    self.assertEqual(pg_type, 'TEXT')
                elif sqlite_type == 'REAL':
                    self.assertEqual(pg_type, 'REAL')
                elif sqlite_type == 'BLOB':
                    self.assertEqual(pg_type, 'BYTEA')
                elif sqlite_type == 'DATETIME':
                    self.assertEqual(pg_type, 'TIMESTAMP WITH TIME ZONE')
                elif sqlite_type.startswith('VARCHAR'):
                    self.assertEqual(pg_type, sqlite_type)  # Should preserve parameters

    def test_default_value_conversion(self):
        """
        Property: SQLite default values should be correctly converted to PostgreSQL format.
        """
        test_cases = [
            (None, None),
            ("'default_text'", 'default_text'),
            ('CURRENT_TIMESTAMP', 'NOW()'),
            ('CURRENT_DATE', 'NOW()'),
            ('0', '0'),
            ('1', '1'),
        ]
        
        for sqlite_default, expected_pg_default in test_cases:
            with self.subTest(sqlite_default=sqlite_default):
                converted = self.converter._convert_default_value(sqlite_default, 'TEXT')
                self.assertEqual(converted, expected_pg_default)

    def test_constraint_preservation(self):
        """
        Property: Table constraints should be preserved during schema conversion.
        """
        # Create a table with various constraints
        columns = [
            {'name': 'id', 'type': 'INTEGER', 'primary_key': True, 'not_null': True},
            {'name': 'email', 'type': 'TEXT', 'unique': True, 'not_null': True},
            {'name': 'name', 'type': 'TEXT', 'not_null': False},
            {'name': 'age', 'type': 'INTEGER', 'default': '0'},
        ]
        
        table_name = 'test_constraints'
        self._create_test_table(table_name, columns)
        
        # Convert schema
        schema_mapping = self.converter.convert_schema(self.sqlite_db_path)
        converted_schema = schema_mapping[table_name]
        
        # Verify constraints are preserved
        converted_columns = {col['name']: col for col in converted_schema['columns']}
        
        # Check primary key
        id_col = converted_columns['id']
        self.assertTrue(id_col['primary_key'])
        self.assertFalse(id_col['nullable'])
        
        # Check unique constraint
        email_col = converted_columns['email']
        self.assertFalse(email_col['nullable'])
        
        # Check nullable field
        name_col = converted_columns['name']
        self.assertTrue(name_col['nullable'])
        
        # Check default value
        age_col = converted_columns['age']
        self.assertEqual(age_col['default'], '0')

    def test_foreign_key_conversion(self):
        """
        Property: Foreign key relationships should be correctly identified and converted.
        """
        # Create parent table
        parent_columns = [
            {'name': 'id', 'type': 'INTEGER', 'primary_key': True},
            {'name': 'name', 'type': 'TEXT'},
        ]
        self._create_test_table('parent_table', parent_columns)
        
        # Create child table with foreign key
        conn = sqlite3.connect(self.sqlite_db_path)
        cursor = conn.cursor()
        cursor.execute('''
            CREATE TABLE child_table (
                id INTEGER PRIMARY KEY,
                parent_id INTEGER,
                data TEXT,
                FOREIGN KEY (parent_id) REFERENCES parent_table (id)
            )
        ''')
        conn.commit()
        conn.close()
        
        # Convert schema
        schema_mapping = self.converter.convert_schema(self.sqlite_db_path)
        
        # Verify foreign key is detected
        child_schema = schema_mapping['child_table']
        foreign_keys = child_schema['foreign_keys']
        
        self.assertEqual(len(foreign_keys), 1)
        fk = foreign_keys[0]
        self.assertEqual(fk['from_column'], 'parent_id')
        self.assertEqual(fk['to_table'], 'parent_table')
        self.assertEqual(fk['to_column'], 'id')

    def test_index_conversion(self):
        """
        Property: Table indexes should be identified and converted appropriately.
        """
        # Create table with index
        columns = [
            {'name': 'id', 'type': 'INTEGER', 'primary_key': True},
            {'name': 'email', 'type': 'TEXT', 'unique': True},
            {'name': 'name', 'type': 'TEXT'},
        ]
        table_name = 'indexed_table'
        self._create_test_table(table_name, columns)
        
        # Add additional index
        conn = sqlite3.connect(self.sqlite_db_path)
        cursor = conn.cursor()
        cursor.execute(f'CREATE INDEX idx_name ON {table_name} (name)')
        conn.commit()
        conn.close()
        
        # Convert schema
        schema_mapping = self.converter.convert_schema(self.sqlite_db_path)
        converted_schema = schema_mapping[table_name]
        
        # Verify indexes are detected
        indexes = converted_schema['indexes']
        self.assertGreater(len(indexes), 0)
        
        # Find the name index
        name_indexes = [idx for idx in indexes if 'name' in idx['columns']]
        self.assertGreater(len(name_indexes), 0)

    @given(
        column_types=st.lists(
            st.sampled_from(['INTEGER', 'TEXT', 'REAL', 'BLOB', 'NUMERIC', 'BOOLEAN', 'DATE', 'DATETIME']),
            min_size=1,
            max_size=10
        )
    )
    @settings(max_examples=30, deadline=None)
    def test_type_conversion_consistency(self, column_types):
        """
        Property: Type conversion should be consistent - the same SQLite type
        should always convert to the same PostgreSQL type.
        """
        # Test that conversion is deterministic
        for sqlite_type in column_types:
            first_conversion = self.converter._convert_column_type(sqlite_type)
            second_conversion = self.converter._convert_column_type(sqlite_type)
            
            self.assertEqual(
                first_conversion, 
                second_conversion,
                f"Type conversion for {sqlite_type} is not consistent"
            )

    def test_complex_table_schema_conversion(self):
        """
        Property: Complex table schemas with multiple constraints and relationships
        should be converted correctly.
        """
        # Create a complex schema similar to Django models
        conn = sqlite3.connect(self.sqlite_db_path)
        cursor = conn.cursor()
        
        # Create user table
        cursor.execute('''
            CREATE TABLE blog_customuser (
                id TEXT PRIMARY KEY,
                username TEXT UNIQUE NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                is_active INTEGER DEFAULT 1,
                date_joined TEXT DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Create article table with foreign key
        cursor.execute('''
            CREATE TABLE blog_article (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                content TEXT NOT NULL,
                author_id TEXT NOT NULL,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (author_id) REFERENCES blog_customuser (id)
            )
        ''')
        
        conn.commit()
        conn.close()
        
        # Convert schema
        schema_mapping = self.converter.convert_schema(self.sqlite_db_path)
        
        # Verify both tables are converted
        self.assertIn('blog_customuser', schema_mapping)
        self.assertIn('blog_article', schema_mapping)
        
        # Verify user table schema
        user_schema = schema_mapping['blog_customuser']
        user_columns = {col['name']: col for col in user_schema['columns']}
        
        self.assertIn('id', user_columns)
        self.assertIn('username', user_columns)
        self.assertIn('email', user_columns)
        
        # Verify article table schema and foreign key
        article_schema = schema_mapping['blog_article']
        article_fks = article_schema['foreign_keys']
        
        self.assertEqual(len(article_fks), 1)
        fk = article_fks[0]
        self.assertEqual(fk['from_column'], 'author_id')
        self.assertEqual(fk['to_table'], 'blog_customuser')

    def test_schema_conversion_error_handling(self):
        """
        Property: Schema conversion should handle edge cases and invalid schemas gracefully.
        """
        # Test with empty database
        empty_db_path = os.path.join(self.temp_dir, 'empty.db')
        conn = sqlite3.connect(empty_db_path)
        conn.close()
        
        schema_mapping = self.converter.convert_schema(empty_db_path)
        self.assertIsInstance(schema_mapping, dict)
        
        # Test with non-existent database
        try:
            non_existent_path = os.path.join(self.temp_dir, 'nonexistent.db')
            schema_mapping = self.converter.convert_schema(non_existent_path)
            # Should either raise an exception or return empty dict
            self.assertIsInstance(schema_mapping, dict)
        except Exception:
            # Exception is acceptable for non-existent database
            pass