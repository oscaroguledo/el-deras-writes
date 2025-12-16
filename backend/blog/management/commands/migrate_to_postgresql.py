"""
Django management command for migrating from SQLite to PostgreSQL.
Handles schema conversion, data transfer, and integrity verification.
"""

import os
import json
import sqlite3
import logging
from datetime import datetime
from typing import Dict, List, Any, Optional, Tuple
from pathlib import Path

from django.core.management.base import BaseCommand, CommandError
from django.db import connections, transaction
from django.conf import settings
from django.apps import apps
from django.core.serializers import serialize, deserialize
from django.db.models import Model

from blog.utils.migration_utils import (
    SQLiteToPostgreSQLConverter,
    DataTransferManager,
    MigrationVerifier,
    BackupManager
)

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = 'Migrate data from SQLite to PostgreSQL with integrity checks'

    def add_arguments(self, parser):
        parser.add_argument(
            '--sqlite-db',
            type=str,
            default='db.sqlite3',
            help='Path to SQLite database file (default: db.sqlite3)'
        )
        parser.add_argument(
            '--backup-dir',
            type=str,
            default='migration_backups',
            help='Directory to store migration backups (default: migration_backups)'
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Perform a dry run without actually migrating data'
        )
        parser.add_argument(
            '--verify-only',
            action='store_true',
            help='Only verify existing migration without transferring data'
        )
        parser.add_argument(
            '--rollback',
            action='store_true',
            help='Rollback to SQLite database'
        )
        parser.add_argument(
            '--force',
            action='store_true',
            help='Force migration even if PostgreSQL database is not empty'
        )

    def handle(self, *args, **options):
        """Main command handler"""
        try:
            if options['rollback']:
                self._handle_rollback(options)
            elif options['verify_only']:
                self._handle_verification(options)
            else:
                self._handle_migration(options)
        except Exception as e:
            logger.error(f"Migration failed: {str(e)}")
            raise CommandError(f"Migration failed: {str(e)}")

    def _handle_migration(self, options):
        """Handle the main migration process"""
        sqlite_db_path = options['sqlite_db']
        backup_dir = options['backup_dir']
        dry_run = options['dry_run']
        force = options['force']

        self.stdout.write(self.style.SUCCESS('Starting SQLite to PostgreSQL migration...'))

        # Validate inputs
        if not os.path.exists(sqlite_db_path):
            raise CommandError(f"SQLite database not found: {sqlite_db_path}")

        # Initialize components
        backup_manager = BackupManager(backup_dir)
        converter = SQLiteToPostgreSQLConverter()
        transfer_manager = DataTransferManager()
        verifier = MigrationVerifier()

        # Create backup
        if not dry_run:
            self.stdout.write('Creating backup...')
            backup_path = backup_manager.create_backup(sqlite_db_path)
            self.stdout.write(f'Backup created: {backup_path}')

        # Check PostgreSQL database state
        if not force and not dry_run:
            if not self._is_postgresql_empty():
                raise CommandError(
                    "PostgreSQL database is not empty. Use --force to override."
                )

        # Perform schema conversion
        self.stdout.write('Converting schema...')
        schema_mapping = converter.convert_schema(sqlite_db_path)
        
        if dry_run:
            self.stdout.write('Schema conversion mapping:')
            for table, mapping in schema_mapping.items():
                self.stdout.write(f"  {table}: {mapping}")

        # Transfer data
        self.stdout.write('Transferring data...')
        transfer_results = transfer_manager.transfer_data(
            sqlite_db_path, 
            schema_mapping, 
            dry_run=dry_run
        )

        if dry_run:
            self.stdout.write('Data transfer summary (dry run):')
            for table, count in transfer_results.items():
                self.stdout.write(f"  {table}: {count} records")
        else:
            # Verify migration
            self.stdout.write('Verifying migration...')
            verification_results = verifier.verify_migration(
                sqlite_db_path, 
                transfer_results
            )
            
            if verification_results['success']:
                self.stdout.write(
                    self.style.SUCCESS('Migration completed successfully!')
                )
                self.stdout.write(f"Migration report: {verification_results}")
            else:
                self.stdout.write(
                    self.style.ERROR('Migration verification failed!')
                )
                self.stdout.write(f"Errors: {verification_results['errors']}")
                raise CommandError("Migration verification failed")

    def _handle_verification(self, options):
        """Handle verification-only mode"""
        sqlite_db_path = options['sqlite_db']
        
        if not os.path.exists(sqlite_db_path):
            raise CommandError(f"SQLite database not found: {sqlite_db_path}")

        self.stdout.write('Verifying existing migration...')
        verifier = MigrationVerifier()
        
        # Get current PostgreSQL data counts
        postgresql_counts = self._get_postgresql_record_counts()
        
        verification_results = verifier.verify_migration(
            sqlite_db_path, 
            postgresql_counts
        )
        
        if verification_results['success']:
            self.stdout.write(
                self.style.SUCCESS('Migration verification passed!')
            )
        else:
            self.stdout.write(
                self.style.ERROR('Migration verification failed!')
            )
            self.stdout.write(f"Errors: {verification_results['errors']}")

    def _handle_rollback(self, options):
        """Handle rollback to SQLite"""
        backup_dir = options['backup_dir']
        
        self.stdout.write('Rolling back to SQLite...')
        backup_manager = BackupManager(backup_dir)
        
        try:
            rollback_result = backup_manager.rollback_to_sqlite()
            if rollback_result['success']:
                self.stdout.write(
                    self.style.SUCCESS('Rollback completed successfully!')
                )
            else:
                self.stdout.write(
                    self.style.ERROR('Rollback failed!')
                )
                self.stdout.write(f"Error: {rollback_result['error']}")
        except Exception as e:
            raise CommandError(f"Rollback failed: {str(e)}")

    def _is_postgresql_empty(self) -> bool:
        """Check if PostgreSQL database is empty"""
        try:
            from django.db import connection
            with connection.cursor() as cursor:
                # Check if any of our main tables have data
                tables = ['blog_customuser', 'blog_article', 'blog_comment', 'blog_category', 'blog_tag']
                for table in tables:
                    try:
                        cursor.execute(f"SELECT COUNT(*) FROM {table}")
                        count = cursor.fetchone()[0]
                        if count > 0:
                            return False
                    except Exception:
                        # Table might not exist yet, which is fine
                        continue
                return True
        except Exception as e:
            logger.warning(f"Could not check PostgreSQL state: {e}")
            return True

    def _get_postgresql_record_counts(self) -> Dict[str, int]:
        """Get record counts from PostgreSQL database"""
        counts = {}
        try:
            from django.db import connection
            with connection.cursor() as cursor:
                tables = ['blog_customuser', 'blog_article', 'blog_comment', 'blog_category', 'blog_tag']
                for table in tables:
                    try:
                        cursor.execute(f"SELECT COUNT(*) FROM {table}")
                        counts[table] = cursor.fetchone()[0]
                    except Exception as e:
                        logger.warning(f"Could not get count for {table}: {e}")
                        counts[table] = 0
        except Exception as e:
            logger.error(f"Could not get PostgreSQL counts: {e}")
        
        return counts