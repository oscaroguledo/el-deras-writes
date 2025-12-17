#!/usr/bin/env python
"""
Script to check the status of all property-based tests
"""
import os
import sys
import subprocess
import django
from django.conf import settings
from django.test.utils import get_runner

# Add the backend directory to the Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'test_settings')
django.setup()

# List of all property-based test files
property_test_files = [
    'blog.tests.test_article_api_pagination_consistency',
    'blog.tests.test_article_completeness', 
    'blog.tests.test_category_hierarchy_organization',
    'blog.tests.test_search_result_relevance',
    'blog.tests.test_user_registration_security',
    'blog.tests.test_jwt_token_validity',
    'blog.tests.test_profile_update_validation',
    'blog.tests.test_comment_association_integrity',
    'blog.tests.test_token_refresh_security',
    'blog.tests.test_admin_article_creation_completeness',
    'blog.tests.test_user_administration_functionality',
    'blog.tests.test_comment_moderation_workflow',
    'blog.tests.test_settings_persistence',
    'blog.tests.test_analytics_accuracy',
    'blog.tests.test_migration_data_preservation',
    'blog.tests.test_schema_conversion_correctness',
    'blog.tests.test_relationship_preservation',
    'blog.tests.test_migration_verification_accuracy',
    'blog.tests.test_migration_rollback_integrity',
    'blog.tests.test_database_connection',
    'blog.tests.test_api_response_consistency',
    'blog.tests.test_authentication_integration',
    'blog.tests.test_validation_error_handling',
    'blog.tests.test_file_upload_handling',
    'blog.tests.test_frontend_state_synchronization',
    'blog.tests.test_article_status_management',
    'blog.tests.test_media_processing',
    'blog.tests.test_content_organization',
    'blog.tests.test_collaboration_workflow',
    'blog.tests.test_version_control',
    'blog.tests.test_real_time_content_notifications',
    'blog.tests.test_authentication_security',
    'blog.tests.test_conflict_resolution',
    'blog.tests.test_input_validation_sql_injection_prevention',
    'blog.tests.test_caching_effectiveness',
]

def run_test_file(test_file):
    """Run a single test file and return the result"""
    try:
        result = subprocess.run([
            'python', 'manage.py', 'test', test_file, 
            '--settings=test_settings', '--verbosity=0'
        ], capture_output=True, text=True, timeout=60)
        
        if result.returncode == 0:
            return 'PASS'
        else:
            return 'FAIL'
    except subprocess.TimeoutExpired:
        return 'TIMEOUT'
    except Exception as e:
        return f'ERROR: {str(e)}'

def main():
    print("Checking all property-based tests...")
    print("=" * 60)
    
    results = {}
    for test_file in property_test_files:
        print(f"Running {test_file}...", end=' ')
        result = run_test_file(test_file)
        results[test_file] = result
        print(result)
    
    print("\n" + "=" * 60)
    print("SUMMARY:")
    print("=" * 60)
    
    passed = 0
    failed = 0
    
    for test_file, result in results.items():
        status_symbol = "✅" if result == 'PASS' else "❌"
        print(f"{status_symbol} {test_file}: {result}")
        if result == 'PASS':
            passed += 1
        else:
            failed += 1
    
    print(f"\nTotal: {len(property_test_files)} tests")
    print(f"Passed: {passed}")
    print(f"Failed: {failed}")
    
    return failed == 0

if __name__ == '__main__':
    success = main()
    sys.exit(0 if success else 1)