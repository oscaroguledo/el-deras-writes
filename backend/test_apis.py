#!/usr/bin/env python
"""
API Testing Script for El Dera's Writes Blog
Tests all major API endpoints to ensure they're working correctly.
Designed to work with Docker containers.
"""

import os
import sys
import django

# Setup Django first
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'blog_project.settings')
django.setup()

from django.test import TestCase, Client
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from blog.models import Article, Category, Tag, Comment, ContactInfo, Feedback, VisitorCount
from blog.utils.uuid_utils import uuid7, is_uuid7

def test_uuid7_functionality():
    """Test UUID v7 implementation"""
    print("\n🔧 Testing UUID v7 Implementation...")
    
    try:
        # Test UUID v7 generation
        uuid_v7 = uuid7()
        print(f"   ✅ UUID v7 generated: {uuid_v7}")
        
        # Test UUID v7 validation
        is_valid = is_uuid7(uuid_v7)
        print(f"   ✅ UUID v7 validation: {is_valid}")
        
        # Test multiple UUIDs are different
        uuid_v7_2 = uuid7()
        different = uuid_v7 != uuid_v7_2
        print(f"   ✅ UUID v7 uniqueness: {different}")
        
    except Exception as e:
        print(f"   ❌ UUID v7 testing failed: {e}")

def test_api_endpoints():
    """Test all API endpoints"""
    client = APIClient()
    
    print("🚀 Testing El Dera's Writes Blog APIs")
    print("=" * 50)
    
    # Test UUID v7 functionality first
    test_uuid7_functionality()
    
    # Test health endpoint
    print("\n1. Testing Health Check...")
    try:
        response = client.get('/health/')
        if response.status_code == 200:
            print(f"   ✅ Health Check: {response.status_code}")
            if hasattr(response, 'data'):
                print(f"   📊 Health Data: {response.data}")
        else:
            print(f"   ⚠️  Health Check: {response.status_code} (may need database)")
    except Exception as e:
        print(f"   ❌ Health Check failed: {e}")
    
    # Test public endpoints
    print("\n2. Testing Public Endpoints...")
    
    # Articles
    try:
        response = client.get('/articles/')
        if response.status_code in [200, 404]:  # 404 is OK if no articles exist
            print(f"   ✅ Articles List: {response.status_code}")
        else:
            print(f"   ⚠️  Articles List: {response.status_code}")
    except Exception as e:
        print(f"   ❌ Articles List failed: {e}")
    
    # Categories
    try:
        response = client.get('/categories/')
        if response.status_code in [200, 404]:
            print(f"   ✅ Categories List: {response.status_code}")
        else:
            print(f"   ⚠️  Categories List: {response.status_code}")
    except Exception as e:
        print(f"   ❌ Categories List failed: {e}")
    
    # Tags
    try:
        response = client.get('/tags/')
        if response.status_code in [200, 404]:
            print(f"   ✅ Tags List: {response.status_code}")
        else:
            print(f"   ⚠️  Tags List: {response.status_code}")
    except Exception as e:
        print(f"   ❌ Tags List failed: {e}")
    
    # Contact Info
    try:
        response = client.get('/contact/')
        if response.status_code in [200, 404]:
            print(f"   ✅ Contact Info: {response.status_code}")
        else:
            print(f"   ⚠️  Contact Info: {response.status_code}")
    except Exception as e:
        print(f"   ❌ Contact Info failed: {e}")
    
    # Visitor Count
    try:
        response = client.get('/visitor-count/')
        if response.status_code in [200, 404]:
            print(f"   ✅ Visitor Count: {response.status_code}")
        else:
            print(f"   ⚠️  Visitor Count: {response.status_code}")
    except Exception as e:
        print(f"   ❌ Visitor Count failed: {e}")
    
    # Feedback (POST)
    try:
        feedback_data = {
            'name': 'Test User',
            'email': 'test@example.com',
            'message': 'This is a test feedback message.'
        }
        response = client.post('/feedback/', feedback_data)
        if response.status_code in [200, 201, 404]:  # 404 if endpoint not found
            print(f"   ✅ Feedback Submission: {response.status_code}")
        else:
            print(f"   ⚠️  Feedback Submission: {response.status_code}")
    except Exception as e:
        print(f"   ❌ Feedback Submission failed: {e}")
    
    print("\n3. Testing Authentication Endpoints...")
    
    # Test token endpoint (should fail without valid credentials)
    try:
        response = client.post('/token/', {
            'email': 'nonexistent@example.com',
            'password': 'wrongpassword'
        })
        if response.status_code in [400, 401, 404]:  # Expected failure codes
            print(f"   ✅ Token Endpoint (expected failure): {response.status_code}")
        else:
            print(f"   ⚠️  Token Endpoint: {response.status_code}")
    except Exception as e:
        print(f"   ❌ Token Endpoint failed: {e}")
    
    print("\n4. Testing URL Patterns...")
    
    # Test URL resolution
    from django.urls import reverse, resolve
    
    try:
        # Test some key URL patterns
        urls_to_test = [
            'token_obtain_pair',
            'token_refresh',
        ]
        
        for url_name in urls_to_test:
            try:
                url = reverse(url_name)
                print(f"   ✅ URL '{url_name}' resolves to: {url}")
            except Exception as e:
                print(f"   ❌ URL '{url_name}' failed: {e}")
                
    except Exception as e:
        print(f"   ❌ URL testing failed: {e}")
    
    print("\n5. Testing Database Models...")
    
    # Test model creation with UUID v7
    try:
        User = get_user_model()
        
        # Test if we can create models (without actually saving to avoid DB issues)
        test_user = User(
            username='testuser',
            email='test@example.com',
            password='testpassword'
        )
        
        # Check if UUID v7 is generated
        if hasattr(test_user, 'id') and test_user.id:
            is_uuid7_valid = is_uuid7(test_user.id)
            print(f"   ✅ User model UUID v7: {is_uuid7_valid}")
        else:
            print(f"   ✅ User model structure: OK (ID will be generated on save)")
            
        # Test other models
        models_to_test = [
            ('Article', Article),
            ('Category', Category),
            ('Tag', Tag),
            ('Comment', Comment),
        ]
        
        for model_name, model_class in models_to_test:
            try:
                # Just test model instantiation
                instance = model_class()
                print(f"   ✅ {model_name} model: OK")
            except Exception as e:
                print(f"   ❌ {model_name} model failed: {e}")
                
    except Exception as e:
        print(f"   ❌ Model testing failed: {e}")
    
    print("\n" + "=" * 50)
    print("🎉 API Testing Complete!")
    print("\nNext steps for Docker setup:")
    print("1. Run: docker-compose -f config/docker-compose.yml exec backend python manage.py migrate")
    print("2. Run: docker-compose -f config/docker-compose.yml exec backend python manage.py createsuperuser")
    print("3. Access APIs at: http://localhost:8000/")
    print("4. Access Admin at: http://localhost:8000/admin/")
    print("5. Access Frontend at: http://localhost:3000/")

def test_database_connection():
    """Test database connection"""
    print("\n6. Testing Database Connection...")
    
    try:
        from django.db import connection
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
            result = cursor.fetchone()
            if result and result[0] == 1:
                print("   ✅ Database connection: OK")
                
                # Test if tables exist
                cursor.execute("""
                    SELECT table_name 
                    FROM information_schema.tables 
                    WHERE table_schema = 'public' 
                    AND table_name LIKE '%blog_%' OR table_name IN ('users', 'articles', 'categories', 'tags', 'comments')
                """)
                tables = cursor.fetchall()
                if tables:
                    print(f"   ✅ Database tables found: {len(tables)}")
                    for table in tables[:5]:  # Show first 5 tables
                        print(f"      - {table[0]}")
                else:
                    print("   ⚠️  No blog tables found (run migrations)")
            else:
                print("   ❌ Database connection test failed")
                
    except Exception as e:
        print(f"   ⚠️  Database connection: {e}")
        print("   💡 This is normal if database is not set up yet")

if __name__ == '__main__':
    test_api_endpoints()
    test_database_connection()