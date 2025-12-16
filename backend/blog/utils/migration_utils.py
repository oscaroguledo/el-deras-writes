"""
Utility classes for SQLite to PostgreSQL migration.
Handles schema conversion, data transfer, verification, and backup operations.
"""

import os
import json
import sqlite3
import logging
import shutil
from datetime import datetime
from typing import Dict, List, Any, Optional, Tuple
from pathlib import Path
import uuid

from django.db import connections, transaction
from django.conf import settings
from django.apps import apps
from django.core.serializers import serialize, deserialize
from django.db.models import Model

logger = logging.getLogger(__name__)


class SQLiteToPostgreSQLConverter:
    """Handles schema conversion from SQLite to PostgreSQL"""
    
    # SQLite to PostgreSQL type mapping
    TYPE_MAPPING = {
        'INTEGER': 'INTEGER',
        'TEXT': 'TEXT',
        'REAL': 'REAL',
        'BLOB': 'BYTEA',
        'NUMERIC': 'NUMERIC',
        'VARCHAR': 'VARCHAR',
        'CHAR': 'CHAR',
        'BOOLEAN': 'BOOLEAN',
        'DATE': 'DATE',
        'DATETIME': 'TIMESTAMP WITH TIME ZONE',
        'TIME': 'TIME',
        'DECIMAL': 'DECIMAL',
        'FLOAT': 'DOUBLE PRECISION',
        'BIGINT': 'BIGINT',
        'SMALLINT': 'SMALLINT',
    }

    def __init__(self):
        self.schema_mapping = {}

    def convert_schema(self, sqlite_db_path: str) -> Dict[str, Dict[str, Any]]:
        """
        Convert SQLite schema to PostgreSQL compatible schema.
        Returns mapping of table names to their schema conversion info.
        """
        conn = sqlite3.connect(sqlite_db_path)
        cursor = conn.cursor()
        
        try:
            # Get all tables
            cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
            tables = cursor.fetchall()
            
            for (table_name,) in tables:
                if table_name.startswith('sqlite_'):
                    continue  # Skip SQLite system tables
                
                self.schema_mapping[table_name] = self._convert_table_schema(
                    cursor, table_name
                )
            
            return self.schema_mapping
            
        finally:
            conn.close()

    def _convert_table_schema(self, cursor, table_name: str) -> Dict[str, Any]:
        """Convert individual table schema"""
        # Get table info
        cursor.execute(f"PRAGMA table_info({table_name})")
        columns = cursor.fetchall()
        
        # Get foreign keys
        cursor.execute(f"PRAGMA foreign_key_list({table_name})")
        foreign_keys = cursor.fetchall()
        
        # Get indexes
        cursor.execute(f"PRAGMA index_list({table_name})")
        indexes = cursor.fetchall()
        
        converted_columns = []
        for col in columns:
            cid, name, type_name, notnull, default_value, pk = col
            
            converted_col = {
                'name': name,
                'type': self._convert_column_type(type_name),
                'nullable': not bool(notnull),
                'default': self._convert_default_value(default_value, type_name),
                'primary_key': bool(pk)
            }
            converted_columns.append(converted_col)
        
        return {
            'columns': converted_columns,
            'foreign_keys': self._convert_foreign_keys(foreign_keys),
            'indexes': self._convert_indexes(cursor, table_name, indexes),
            'constraints': self._get_table_constraints(cursor, table_name)
        }

    def _convert_column_type(self, sqlite_type: str) -> str:
        """Convert SQLite column type to PostgreSQL type"""
        # Handle type with parameters like VARCHAR(255)
        base_type = sqlite_type.split('(')[0].upper()
        
        if base_type in self.TYPE_MAPPING:
            # Preserve parameters for types that need them
            if '(' in sqlite_type and base_type in ['VARCHAR', 'CHAR', 'DECIMAL', 'NUMERIC']:
                return sqlite_type.replace(base_type, self.TYPE_MAPPING[base_type])
            return self.TYPE_MAPPING[base_type]
        
        # Default fallback
        logger.warning(f"Unknown SQLite type: {sqlite_type}, using TEXT")
        return 'TEXT'

    def _convert_default_value(self, default_value: Any, type_name: str) -> Any:
        """Convert SQLite default value to PostgreSQL compatible format"""
        if default_value is None:
            return None
        
        # Handle string defaults
        if isinstance(default_value, str):
            # Remove SQLite-specific quotes
            if default_value.startswith("'") and default_value.endswith("'"):
                return default_value[1:-1]
            
            # Handle special SQLite functions
            if default_value.upper() in ['CURRENT_TIMESTAMP', 'CURRENT_DATE', 'CURRENT_TIME']:
                return f"NOW()"
            
            # Handle UUID generation
            if 'uuid4' in default_value.lower():
                return 'gen_random_uuid()'
        
        return default_value

    def _convert_foreign_keys(self, foreign_keys: List[Tuple]) -> List[Dict[str, Any]]:
        """Convert foreign key constraints"""
        converted_fks = []
        for fk in foreign_keys:
            id, seq, table, from_col, to_col, on_update, on_delete, match = fk
            converted_fks.append({
                'from_column': from_col,
                'to_table': table,
                'to_column': to_col,
                'on_update': on_update,
                'on_delete': on_delete
            })
        return converted_fks

    def _convert_indexes(self, cursor, table_name: str, indexes: List[Tuple]) -> List[Dict[str, Any]]:
        """Convert table indexes"""
        converted_indexes = []
        for idx in indexes:
            seq, name, unique, origin, partial = idx
            
            # Get index columns
            cursor.execute(f"PRAGMA index_info({name})")
            index_columns = cursor.fetchall()
            
            columns = [col[2] for col in index_columns]  # col[2] is column name
            
            converted_indexes.append({
                'name': name,
                'columns': columns,
                'unique': bool(unique),
                'type': 'btree'  # Default to btree for PostgreSQL
            })
        
        return converted_indexes

    def _get_table_constraints(self, cursor, table_name: str) -> List[Dict[str, Any]]:
        """Get table constraints (CHECK, UNIQUE, etc.)"""
        constraints = []
        
        # Get CREATE TABLE statement to parse constraints
        cursor.execute(f"SELECT sql FROM sqlite_master WHERE type='table' AND name='{table_name}'")
        create_sql = cursor.fetchone()
        
        if create_sql and create_sql[0]:
            sql = create_sql[0]
            # Basic constraint parsing (can be enhanced)
            if 'CHECK' in sql.upper():
                # Extract CHECK constraints (simplified)
                constraints.append({
                    'type': 'check',
                    'definition': 'Extracted from CREATE TABLE'
                })
        
        return constraints


class DataTransferManager:
    """Manages data transfer from SQLite to PostgreSQL"""
    
    def __init__(self):
        self.transfer_stats = {}

    def transfer_data(self, sqlite_db_path: str, schema_mapping: Dict[str, Any], 
                     dry_run: bool = False, raise_on_error: bool = False) -> Dict[str, int]:
        """
        Transfer data from SQLite to PostgreSQL.
        Returns dictionary of table names to record counts transferred.
        """
        sqlite_conn = sqlite3.connect(sqlite_db_path)
        sqlite_conn.row_factory = sqlite3.Row  # Enable column access by name
        
        try:
            # Get Django models for our app
            blog_models = apps.get_app_config('blog').get_models()
            model_mapping = {model._meta.db_table: model for model in blog_models}
            
            transfer_results = {}
            
            for table_name, schema_info in schema_mapping.items():
                if table_name not in model_mapping:
                    logger.warning(f"No Django model found for table: {table_name}")
                    continue
                
                model_class = model_mapping[table_name]
                
                # Get data from SQLite
                sqlite_cursor = sqlite_conn.cursor()
                sqlite_cursor.execute(f"SELECT * FROM {table_name}")
                rows = sqlite_cursor.fetchall()
                
                if dry_run:
                    transfer_results[table_name] = len(rows)
                    continue
                
                # Transfer to PostgreSQL
                transferred_count = self._transfer_table_data(
                    model_class, rows, schema_info, raise_on_error
                )
                transfer_results[table_name] = transferred_count
                
                logger.info(f"Transferred {transferred_count} records from {table_name}")
            
            return transfer_results
            
        finally:
            sqlite_conn.close()

    def _transfer_table_data(self, model_class: Model, rows: List[sqlite3.Row], 
                           schema_info: Dict[str, Any], raise_on_error: bool = False) -> int:
        """Transfer data for a specific table"""
        transferred_count = 0
        
        for row in rows:
            try:
                with transaction.atomic():
                    # Convert SQLite row to Django model instance
                    instance_data = self._convert_row_data(row, schema_info)
                    
                    # Create model instance
                    instance = model_class(**instance_data)
                    instance.save()
                    
                    transferred_count += 1
                    
            except Exception as e:
                logger.error(f"Error transferring row from {model_class._meta.db_table}: {e}")
                logger.error(f"Row data: {dict(row)}")
                if raise_on_error:
                    raise
                # Continue with other rows
                continue
        
        return transferred_count

    def _convert_row_data(self, row: sqlite3.Row, schema_info: Dict[str, Any]) -> Dict[str, Any]:
        """Convert SQLite row data to Django model compatible format"""
        converted_data = {}
        
        for column_info in schema_info['columns']:
            column_name = column_info['name']
            column_type = column_info['type']
            
            if column_name in row.keys():
                value = row[column_name]
                
                # Convert value based on type
                converted_value = self._convert_field_value(value, column_type)
                converted_data[column_name] = converted_value
        
        return converted_data

    def _convert_field_value(self, value: Any, postgresql_type: str) -> Any:
        """Convert field value from SQLite to PostgreSQL format"""
        if value is None:
            return None
        
        # Handle UUID fields
        if postgresql_type.upper() == 'UUID':
            if isinstance(value, str):
                try:
                    return uuid.UUID(value)
                except ValueError:
                    return uuid.uuid4()  # Generate new UUID if invalid
            return value
        
        # Handle JSON fields
        if postgresql_type.upper() == 'JSONB' or 'JSON' in postgresql_type.upper():
            if isinstance(value, str):
                try:
                    return json.loads(value)
                except json.JSONDecodeError:
                    return {}
            return value
        
        # Handle boolean fields
        if postgresql_type.upper() == 'BOOLEAN':
            if isinstance(value, (int, str)):
                return bool(int(value))
            return bool(value)
        
        # Handle datetime fields
        if 'TIMESTAMP' in postgresql_type.upper() or postgresql_type.upper() == 'DATE':
            if isinstance(value, str):
                try:
                    return datetime.fromisoformat(value.replace('Z', '+00:00'))
                except ValueError:
                    return datetime.now()
            return value
        
        return value


class MigrationVerifier:
    """Verifies migration integrity and completeness"""
    
    def verify_migration(self, sqlite_db_path: str, 
                        transfer_results: Dict[str, int]) -> Dict[str, Any]:
        """
        Verify that migration was successful by comparing record counts
        and checking data integrity.
        """
        verification_results = {
            'success': True,
            'errors': [],
            'warnings': [],
            'table_comparisons': {},
            'timestamp': datetime.now().isoformat()
        }
        
        sqlite_conn = sqlite3.connect(sqlite_db_path)
        
        try:
            # Compare record counts
            for table_name, transferred_count in transfer_results.items():
                sqlite_count = self._get_sqlite_record_count(sqlite_conn, table_name)
                postgresql_count = self._get_postgresql_record_count(table_name)
                
                comparison = {
                    'sqlite_count': sqlite_count,
                    'postgresql_count': postgresql_count,
                    'transferred_count': transferred_count,
                    'match': sqlite_count == postgresql_count
                }
                
                verification_results['table_comparisons'][table_name] = comparison
                
                if not comparison['match']:
                    error_msg = (f"Record count mismatch for {table_name}: "
                               f"SQLite={sqlite_count}, PostgreSQL={postgresql_count}")
                    verification_results['errors'].append(error_msg)
                    verification_results['success'] = False
            
            # Verify foreign key relationships
            fk_verification = self._verify_foreign_keys(sqlite_conn)
            if not fk_verification['success']:
                verification_results['errors'].extend(fk_verification['errors'])
                verification_results['success'] = False
            
            # Verify data integrity
            integrity_verification = self._verify_data_integrity()
            if not integrity_verification['success']:
                verification_results['errors'].extend(integrity_verification['errors'])
                verification_results['success'] = False
            
        finally:
            sqlite_conn.close()
        
        return verification_results

    def _get_sqlite_record_count(self, conn: sqlite3.Connection, table_name: str) -> int:
        """Get record count from SQLite table"""
        try:
            cursor = conn.cursor()
            cursor.execute(f"SELECT COUNT(*) FROM {table_name}")
            return cursor.fetchone()[0]
        except Exception as e:
            logger.error(f"Error getting SQLite count for {table_name}: {e}")
            return 0

    def _get_postgresql_record_count(self, table_name: str) -> int:
        """Get record count from PostgreSQL table"""
        try:
            from django.db import connection
            with connection.cursor() as cursor:
                cursor.execute(f"SELECT COUNT(*) FROM {table_name}")
                return cursor.fetchone()[0]
        except Exception as e:
            logger.error(f"Error getting PostgreSQL count for {table_name}: {e}")
            return 0

    def _verify_foreign_keys(self, sqlite_conn: sqlite3.Connection) -> Dict[str, Any]:
        """Verify foreign key relationships are maintained"""
        result = {'success': True, 'errors': []}
        
        try:
            # This is a simplified check - in a real implementation,
            # you'd want to verify specific foreign key relationships
            from django.db import connection
            with connection.cursor() as cursor:
                # Check for orphaned records (basic check)
                cursor.execute("""
                    SELECT COUNT(*) FROM blog_comment c 
                    LEFT JOIN blog_article a ON c.article_id = a.id 
                    WHERE a.id IS NULL
                """)
                orphaned_comments = cursor.fetchone()[0]
                
                if orphaned_comments > 0:
                    result['errors'].append(f"Found {orphaned_comments} orphaned comments")
                    result['success'] = False
                
        except Exception as e:
            result['errors'].append(f"Error verifying foreign keys: {e}")
            result['success'] = False
        
        return result

    def _verify_data_integrity(self) -> Dict[str, Any]:
        """Verify data integrity constraints"""
        result = {'success': True, 'errors': []}
        
        try:
            from django.db import connection
            with connection.cursor() as cursor:
                # Check for invalid UUIDs
                cursor.execute("""
                    SELECT COUNT(*) FROM blog_customuser 
                    WHERE id IS NULL OR id = ''
                """)
                invalid_user_ids = cursor.fetchone()[0]
                
                if invalid_user_ids > 0:
                    result['errors'].append(f"Found {invalid_user_ids} users with invalid IDs")
                    result['success'] = False
                
                # Check for required fields
                cursor.execute("""
                    SELECT COUNT(*) FROM blog_article 
                    WHERE title IS NULL OR title = '' OR content IS NULL OR content = ''
                """)
                invalid_articles = cursor.fetchone()[0]
                
                if invalid_articles > 0:
                    result['errors'].append(f"Found {invalid_articles} articles with missing required fields")
                    result['success'] = False
                
        except Exception as e:
            result['errors'].append(f"Error verifying data integrity: {e}")
            result['success'] = False
        
        return result


class BackupManager:
    """Manages backup and rollback operations"""
    
    def __init__(self, backup_dir: str):
        self.backup_dir = Path(backup_dir)
        self.backup_dir.mkdir(exist_ok=True)

    def create_backup(self, sqlite_db_path: str) -> str:
        """Create a backup of the SQLite database"""
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        backup_filename = f"sqlite_backup_{timestamp}.db"
        backup_path = self.backup_dir / backup_filename
        
        # Copy SQLite database
        shutil.copy2(sqlite_db_path, backup_path)
        
        # Create metadata file
        metadata = {
            'original_path': sqlite_db_path,
            'backup_path': str(backup_path),
            'timestamp': timestamp,
            'backup_type': 'sqlite_migration_backup'
        }
        
        metadata_path = self.backup_dir / f"backup_metadata_{timestamp}.json"
        with open(metadata_path, 'w') as f:
            json.dump(metadata, f, indent=2)
        
        logger.info(f"Backup created: {backup_path}")
        return str(backup_path)

    def rollback_to_sqlite(self) -> Dict[str, Any]:
        """Rollback to the most recent SQLite backup"""
        try:
            # Find the most recent backup
            backup_files = list(self.backup_dir.glob("sqlite_backup_*.db"))
            if not backup_files:
                return {'success': False, 'error': 'No backup files found'}
            
            # Get the most recent backup
            latest_backup = max(backup_files, key=os.path.getctime)
            
            # Find corresponding metadata
            timestamp = latest_backup.stem.split('_')[-1]
            metadata_path = self.backup_dir / f"backup_metadata_{timestamp}.json"
            
            if metadata_path.exists():
                with open(metadata_path, 'r') as f:
                    metadata = json.load(f)
                original_path = metadata['original_path']
            else:
                # Default path if metadata not found
                original_path = 'db.sqlite3'
            
            # Restore the backup
            shutil.copy2(latest_backup, original_path)
            
            logger.info(f"Rollback completed: {latest_backup} -> {original_path}")
            return {
                'success': True, 
                'backup_file': str(latest_backup),
                'restored_to': original_path
            }
            
        except Exception as e:
            logger.error(f"Rollback failed: {e}")
            return {'success': False, 'error': str(e)}

    def list_backups(self) -> List[Dict[str, Any]]:
        """List all available backups"""
        backups = []
        
        for backup_file in self.backup_dir.glob("sqlite_backup_*.db"):
            timestamp = backup_file.stem.split('_')[-1]
            metadata_path = self.backup_dir / f"backup_metadata_{timestamp}.json"
            
            backup_info = {
                'file': str(backup_file),
                'timestamp': timestamp,
                'size': backup_file.stat().st_size
            }
            
            if metadata_path.exists():
                try:
                    with open(metadata_path, 'r') as f:
                        metadata = json.load(f)
                    backup_info.update(metadata)
                except Exception as e:
                    logger.warning(f"Could not read metadata for {backup_file}: {e}")
            
            backups.append(backup_info)
        
        return sorted(backups, key=lambda x: x['timestamp'], reverse=True)