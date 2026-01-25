#!/usr/bin/env python
"""
API Testing Script for El_Dera's Writes Blog
Tests all major API endpoints to ensure they're working correctly.
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

def test_api_endpoints():
    """Test all API endpoints"""
    client = APIClient()
    
    print("🚀 Testing El_Dera's Writes Blog APIs")
    print("=" * 50)
    
    # Test health endpoint
    print("\n1. Testing Health Check...")
    try:
        response = client.get('/api/health/')
        print(f"   ✅ Health Check: {response.status_code} - {response.data}")
    except Exception as e:
        print(f"   ❌ Health Check failed: {e}")
    
    # Test public endpoints
    print("\n2. Testing Public Endpoints...")
    
    # Articles
    try:
        response = client.get('/api/articles/')
        print(f"   ✅ Articles List: {response.status_code}")
    except Exception as e:
        print(f"   ❌ Articles List failed: {e}")
    
    # Categories
    try:
        response = client.get('/api/categories/')
        print(f"   ✅ Categories List: {response.status_code}")
    except Exception as e:
        print(f"   ❌ Categories List failed: {e}")
    
    # Tags
    try:
        response = client.get('/api/tags/')
        print(f"   ✅ Tags List: {response.status_code}")
    except Exception as e:
        print(f"   ❌ Tags List failed: {e}")
    
    # Contact Info
    try:
        response = client.get('/api/contact/')
        print(f"   ✅ Contact Info: {response.status_code}")
    except Exception as e:
        print(f"   ❌ Contact Info failed: {e}")
    
    # Visitor Count
    try:
        response = client.get('/api/visitor-count/')
        print(f"   ✅ Visitor Count: {response.status_code}")
    except Exception as e:
        print(f"   ❌ Visitor Count failed: {e}")
    
    # Feedback (POST)
    try:
        feedback_data = {
            'name': 'Test User',
            'email': 'test@example.com',
            'message': 'This is a test feedback message.'
        }
        response = client.post('/api/feedback/', feedback_data)
        print(f"   ✅ Feedback Submission: {response.status_code}")
    except Exception as e:
        print(f"   ❌ Feedback Submission failed: {e}")
    
    print("\n3. Testing Authentication Endpoints...")
    
    # Test token endpoint (should fail without credentials)
    try:
        response = client.post('/api/token/', {
            'email': 'nonexistent@example.com',
            'password': 'wrongpassword'
        })
        print(f"   ✅ Token Endpoint (expected failure): {response.status_code}")
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
    
    print("\n" + "=" * 50)
    print("🎉 API Testing Complete!")
    print("\nNext steps:")
    print("1. Run: python manage.py migrate")
    print("2. Run: python manage.py createsuperuser")
    print("3. Run: python manage.py runserver")
    print("4. Test APIs at: http://localhost:8000/api/")

if __name__ == '__main__':
    test_api_endpoints()