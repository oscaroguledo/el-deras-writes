#!/usr/bin/env python
"""
Deployment Verification Script

This script performs comprehensive checks to verify the system is ready for deployment.
Run this before deploying to production to catch potential issues.
"""

import os
import sys
import django
from pathlib import Path

# Setup Django
sys.path.insert(0, str(Path(__file__).parent))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'blog_project.settings')
django.setup()

from django.conf import settings
from django.db import connection
from django.core.cache import cache
from django.contrib.auth import get_user_model
from blog.models import Article, Category, Comment, Tag
import json

User = get_user_model()


class DeploymentVerifier:
    """Verifies system readiness for deployment"""
    
    def __init__(self):
        self.results = {
            'passed': [],
            'failed': [],
            'warnings': []
        }
    
    def run_all_checks(self):
        """Run all verification checks"""
        print("=" * 70)
        print("DEPLOYMENT VERIFICATION")
        print("=" * 70)
        print()
        
        self.check_environment_variables()
        self.check_database_connection()
        self.check_database_migrations()
        self.check_database_indexes()
        self.check_cache_system()
        self.check_models()
        self.check_security_settings()
        self.check_static_files()
        
        self.print_results()
        
        return len(self.results['failed']) == 0
    
    def check_environment_variables(self):
        """Check critical environment variables"""
        print("Checking environment variables...")
        
        # Check DEBUG setting
        if settings.DEBUG:
            self.results['warnings'].append("DEBUG is True - should be False in production")
        else:
            self.results['passed'].append("DEBUG is properly set to False")
        
        # Check SECRET_KEY
        if settings.SECRET_KEY == 'django-insecure-4=r#=3)9z+sxmn=)*^p%ujw4!%%s)im7rka!w8mu**r(pwa&8r':
            self.results['failed'].append("SECRET_KEY is using default insecure value")
        else:
            self.results['passed'].append("SECRET_KEY is set to custom value")
        
        # Check ALLOWED_HOSTS
        if not settings.ALLOWED_HOSTS or settings.ALLOWED_HOSTS == ['*']:
            self.results['warnings'].append("ALLOWED_HOSTS should be configured with specific domains")
        else:
            self.results['passed'].append(f"ALLOWED_HOSTS configured: {settings.ALLOWED_HOSTS}")
        
        print("✓ Environment variables checked\n")
    
    def check_database_connection(self):
        """Check database connectivity"""
        print("Checking database connection...")
        
        try:
            with connection.cursor() as cursor:
                cursor.execute("SELECT version();")
                version = cursor.fetchone()[0]
                
                if 'PostgreSQL' in version:
                    self.results['passed'].append(f"PostgreSQL connected: {version.split(',')[0]}")
                else:
                    self.results['warnings'].append(f"Using {version} - PostgreSQL recommended for production")
            
            print("✓ Database connection successful\n")
        except Exception as e:
            self.results['failed'].append(f"Database connection failed: {e}")
            print(f"✗ Database connection failed\n")
    
    def check_database_migrations(self):
        """Check if all migrations are applied"""
        print("Checking database migrations...")
        
        try:
            from django.db.migrations.executor import MigrationExecutor
            executor = MigrationExecutor(connection)
            plan = executor.migration_plan(executor.loader.graph.leaf_nodes())
            
            if plan:
                self.results['failed'].append(f"Unapplied migrations found: {len(plan)} migrations pending")
            else:
                self.results['passed'].append("All migrations applied")
            
            print("✓ Migrations checked\n")
        except Exception as e:
            self.results['failed'].append(f"Migration check failed: {e}")
            print(f"✗ Migration check failed\n")
    
    def check_database_indexes(self):
        """Check if database indexes exist"""
        print("Checking database indexes...")
        
        try:
            with connection.cursor() as cursor:
                # Check for blog-related indexes
                cursor.execute("""
                    SELECT COUNT(*) 
                    FROM pg_indexes 
                    WHERE tablename LIKE 'blog_%'
                """)
                index_count = cursor.fetchone()[0]
                
                if index_count > 0:
                    self.results['passed'].append(f"Database indexes created: {index_count} indexes found")
                else:
                    self.results['warnings'].append("No blog-related indexes found")
            
            print("✓ Indexes checked\n")
        except Exception as e:
            self.results['warnings'].append(f"Index check skipped (may not be PostgreSQL): {e}")
            print("⚠ Index check skipped\n")
    
    def check_cache_system(self):
        """Check cache system functionality"""
        print("Checking cache system...")
        
        try:
            # Test cache operations
            test_key = 'deployment_verification_test'
            test_value = 'test_value_12345'
            
            cache.set(test_key, test_value, 60)
            retrieved_value = cache.get(test_key)
            
            if retrieved_value == test_value:
                self.results['passed'].append("Cache system operational")
                cache.delete(test_key)
            else:
                self.results['failed'].append("Cache system not working correctly")
            
            print("✓ Cache system checked\n")
        except Exception as e:
            self.results['failed'].append(f"Cache system check failed: {e}")
            print(f"✗ Cache system check failed\n")
    
    def check_models(self):
        """Check if models are accessible"""
        print("Checking models...")
        
        try:
            # Check User model
            user_count = User.objects.count()
            self.results['passed'].append(f"User model accessible ({user_count} users)")
            
            # Check Article model
            article_count = Article.objects.count()
            self.results['passed'].append(f"Article model accessible ({article_count} articles)")
            
            # Check Category model
            category_count = Category.objects.count()
            self.results['passed'].append(f"Category model accessible ({category_count} categories)")
            
            # Check Comment model
            comment_count = Comment.objects.count()
            self.results['passed'].append(f"Comment model accessible ({comment_count} comments)")
            
            # Check Tag model
            tag_count = Tag.objects.count()
            self.results['passed'].append(f"Tag model accessible ({tag_count} tags)")
            
            print("✓ Models checked\n")
        except Exception as e:
            self.results['failed'].append(f"Model check failed: {e}")
            print(f"✗ Model check failed\n")
    
    def check_security_settings(self):
        """Check security-related settings"""
        print("Checking security settings...")
        
        # Check CORS settings
        if hasattr(settings, 'CORS_ALLOWED_ORIGINS'):
            if settings.CORS_ALLOWED_ORIGINS:
                self.results['passed'].append("CORS configured")
            else:
                self.results['warnings'].append("CORS_ALLOWED_ORIGINS is empty")
        
        # Check JWT settings
        if hasattr(settings, 'SIMPLE_JWT'):
            jwt_settings = settings.SIMPLE_JWT
            
            if jwt_settings.get('ROTATE_REFRESH_TOKENS'):
                self.results['passed'].append("JWT token rotation enabled")
            else:
                self.results['warnings'].append("JWT token rotation not enabled")
            
            if jwt_settings.get('BLACKLIST_AFTER_ROTATION'):
                self.results['passed'].append("JWT token blacklisting enabled")
            else:
                self.results['warnings'].append("JWT token blacklisting not enabled")
        
        # Check password hashers
        if hasattr(settings, 'PASSWORD_HASHERS'):
            self.results['passed'].append("Password hashers configured")
        
        print("✓ Security settings checked\n")
    
    def check_static_files(self):
        """Check static files configuration"""
        print("Checking static files...")
        
        if hasattr(settings, 'STATIC_ROOT'):
            static_root = Path(settings.STATIC_ROOT)
            if static_root.exists():
                self.results['passed'].append(f"STATIC_ROOT exists: {settings.STATIC_ROOT}")
            else:
                self.results['warnings'].append(f"STATIC_ROOT directory doesn't exist: {settings.STATIC_ROOT}")
        else:
            self.results['warnings'].append("STATIC_ROOT not configured")
        
        if hasattr(settings, 'STATIC_URL'):
            self.results['passed'].append(f"STATIC_URL configured: {settings.STATIC_URL}")
        else:
            self.results['failed'].append("STATIC_URL not configured")
        
        print("✓ Static files checked\n")
    
    def print_results(self):
        """Print verification results"""
        print("=" * 70)
        print("VERIFICATION RESULTS")
        print("=" * 70)
        print()
        
        if self.results['passed']:
            print(f"✓ PASSED ({len(self.results['passed'])} checks)")
            print("-" * 70)
            for item in self.results['passed']:
                print(f"  ✓ {item}")
            print()
        
        if self.results['warnings']:
            print(f"⚠ WARNINGS ({len(self.results['warnings'])} items)")
            print("-" * 70)
            for item in self.results['warnings']:
                print(f"  ⚠ {item}")
            print()
        
        if self.results['failed']:
            print(f"✗ FAILED ({len(self.results['failed'])} checks)")
            print("-" * 70)
            for item in self.results['failed']:
                print(f"  ✗ {item}")
            print()
        
        print("=" * 70)
        
        if self.results['failed']:
            print("RESULT: DEPLOYMENT NOT READY ✗")
            print("Please fix the failed checks before deploying.")
        elif self.results['warnings']:
            print("RESULT: DEPLOYMENT READY WITH WARNINGS ⚠")
            print("Review warnings and address them if necessary.")
        else:
            print("RESULT: DEPLOYMENT READY ✓")
            print("All checks passed successfully!")
        
        print("=" * 70)


def main():
    """Main entry point"""
    verifier = DeploymentVerifier()
    success = verifier.run_all_checks()
    
    sys.exit(0 if success else 1)


if __name__ == '__main__':
    main()
