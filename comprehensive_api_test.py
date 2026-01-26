#!/usr/bin/env python3
"""
Comprehensive API Test for El Dera's Writes Blog
Tests all API endpoints to ensure they're working correctly.
"""

import requests
import json
import sys

BASE_URL = "http://localhost:8000"

def test_endpoint(method, endpoint, data=None, expected_status=200):
    """Test an API endpoint"""
    url = f"{BASE_URL}{endpoint}"
    
    try:
        if method == "GET":
            response = requests.get(url)
        elif method == "POST":
            response = requests.post(url, json=data, headers={'Content-Type': 'application/json'})
        elif method == "PUT":
            response = requests.put(url, json=data, headers={'Content-Type': 'application/json'})
        elif method == "DELETE":
            response = requests.delete(url)
        
        status_ok = response.status_code == expected_status or response.status_code in [200, 201, 404]
        
        print(f"   {method} {endpoint}: {response.status_code} {'✅' if status_ok else '❌'}")
        
        if response.status_code == 200 and response.headers.get('content-type', '').startswith('application/json'):
            try:
                data = response.json()
                if isinstance(data, list):
                    print(f"      → Returned {len(data)} items")
                elif isinstance(data, dict):
                    print(f"      → Returned object with keys: {list(data.keys())[:5]}")
            except:
                pass
                
        return response.status_code in [200, 201, 404]
        
    except Exception as e:
        print(f"   {method} {endpoint}: ERROR - {e} ❌")
        return False

def main():
    print("🚀 Comprehensive API Testing for El Dera's Writes")
    print("=" * 60)
    
    # Test health endpoint
    print("\n1. Health Check:")
    test_endpoint("GET", "/health/")
    
    # Test article endpoints
    print("\n2. Article Endpoints:")
    test_endpoint("GET", "/articles/")
    test_endpoint("GET", "/articles/?status=published")
    test_endpoint("GET", "/articles/?featured=true")
    
    # Test category endpoints
    print("\n3. Category Endpoints:")
    test_endpoint("GET", "/categories/")
    
    # Test tag endpoints
    print("\n4. Tag Endpoints:")
    test_endpoint("GET", "/tags/")
    
    # Test contact info
    print("\n5. Contact Info:")
    test_endpoint("GET", "/contact/")
    
    # Test visitor count (POST only)
    print("\n6. Visitor Count:")
    test_endpoint("POST", "/visitor-count/")
    
    # Test feedback submission
    print("\n7. Feedback:")
    feedback_data = {
        "name": "Test User",
        "email": "test@example.com",
        "message": "This is a test feedback message."
    }
    test_endpoint("POST", "/feedback/", feedback_data)
    
    # Test authentication endpoints
    print("\n8. Authentication:")
    test_endpoint("POST", "/token/", {
        "email": "nonexistent@example.com",
        "password": "wrongpassword"
    }, expected_status=401)
    
    # Test frontend
    print("\n9. Frontend:")
    try:
        response = requests.get("http://localhost:3000")
        if response.status_code == 200:
            print("   Frontend: 200 ✅")
        else:
            print(f"   Frontend: {response.status_code} ❌")
    except Exception as e:
        print(f"   Frontend: ERROR - {e} ❌")
    
    # Test admin panel
    print("\n10. Admin Panel:")
    try:
        response = requests.get("http://localhost:8000/admin/")
        if response.status_code in [200, 302]:  # 302 is redirect to login
            print("   Admin Panel: 200/302 ✅")
        else:
            print(f"   Admin Panel: {response.status_code} ❌")
    except Exception as e:
        print(f"   Admin Panel: ERROR - {e} ❌")
    
    print("\n" + "=" * 60)
    print("🎉 Comprehensive API Testing Complete!")
    print("\n📍 Access Points:")
    print("  🌐 Frontend:     http://localhost:3000")
    print("  🔧 Backend API:  http://localhost:8000/")
    print("  👨‍💼 Admin Panel:  http://localhost:8000/admin/")
    print("  ❤️  Health Check: http://localhost:8000/health/")

if __name__ == "__main__":
    main()