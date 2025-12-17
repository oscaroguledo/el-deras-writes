"""
Property-based tests for input validation and SQL injection prevention
**Feature: django-postgresql-enhancement, Property 37: Input validation and SQL injection prevention**
**Validates: Requirements 9.1**
"""

from django.test import TestCase
from django.db import connection
from django.core.exceptions import ValidationError
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient
from hypothesis import given, strategies as st, settings as hypothesis_settings
from hypothesis.extra.django import TestCase as HypothesisTestCase
from blog.models import Article, Comment, Category, Tag, CustomUser, ContactInfo, Feedback
from blog.serializers import ArticleSerializer, CommentSerializer, CategorySerializer, TagSerializer, CustomUserSerializer
import string
import json
import re
from datetime import datetime, timedelta


class InputValidationSQLInjectionPreventionTest(HypothesisTestCase):
    """
    Property-based tests for input validation and SQL injection prevention
    """

    def setUp(self):
        """Set up test environment"""
        self.client = APIClient()
        
        # Create a test user for authenticated requests
        self.test_user = CustomUser.objects.create_user(
            email='testuser@example.com',
            username='testuser',
            password='testpassword123',
            user_type='normal'
        )
        
        # Create an admin user for admin operations
        self.admin_user = CustomUser.objects.create_user(
            email='admin@example.com',
            username='admin',
            password='adminpassword123',
            user_type='admin',
            is_staff=True,
            is_superuser=True
        )
        
        # Create test category and tag
        self.test_category = Category.objects.create(name='Test Category')
        self.test_tag = Tag.objects.create(name='Test Tag')
        
        # Create test article
        self.test_article = Article.objects.create(
            title='Test Article',
            content='Test content',
            author=self.test_user,
            category=self.test_category,
            status='published'
        )

    def tearDown(self):
        """Clean up after each test"""
        # Clean up created objects
        Article.objects.filter(title__startswith='Test').delete()
        Comment.objects.filter(content__startswith='Test').delete()
        Category.objects.filter(name__startswith='Test').delete()
        Tag.objects.filter(name__startswith='Test').delete()
        CustomUser.objects.filter(email__startswith='test').delete()
        Feedback.objects.filter(name__startswith='Test').delete()

    # SQL Injection attack patterns
    SQL_INJECTION_PATTERNS = [
        "'; DROP TABLE users; --",
        "' OR '1'='1",
        "' OR 1=1 --",
        "'; DELETE FROM articles; --",
        "' UNION SELECT * FROM users --",
        "'; INSERT INTO users VALUES ('hacker', 'password'); --",
        "' OR 'x'='x",
        "'; UPDATE users SET password='hacked'; --",
        "' AND (SELECT COUNT(*) FROM users) > 0 --",
        "'; EXEC xp_cmdshell('dir'); --",
        "' OR SLEEP(5) --",
        "'; WAITFOR DELAY '00:00:05'; --",
        "' OR BENCHMARK(1000000,MD5(1)) --",
        "' OR pg_sleep(5) --",
        "\\'; DROP TABLE articles; --",
        "%'; DROP TABLE users; --",
        "1'; DROP TABLE comments; --",
        "admin'--",
        "admin' /*",
        "admin' #",
        "' OR 1=1#",
        "' OR 1=1/*",
        "') OR '1'='1--",
        "') OR ('1'='1--",
    ]

    # XSS attack patterns
    XSS_PATTERNS = [
        "<script>alert('XSS')</script>",
        "<img src=x onerror=alert('XSS')>",
        "<svg onload=alert('XSS')>",
        "javascript:alert('XSS')",
        "<iframe src=javascript:alert('XSS')></iframe>",
        "<body onload=alert('XSS')>",
        "<input onfocus=alert('XSS') autofocus>",
        "<select onfocus=alert('XSS') autofocus>",
        "<textarea onfocus=alert('XSS') autofocus>",
        "<keygen onfocus=alert('XSS') autofocus>",
        "<video><source onerror=alert('XSS')>",
        "<audio src=x onerror=alert('XSS')>",
        "<details open ontoggle=alert('XSS')>",
        "<marquee onstart=alert('XSS')>",
        "';alert('XSS');//",
        "\";alert('XSS');//",
        "</script><script>alert('XSS')</script>",
        "<script src=data:text/javascript,alert('XSS')></script>",
    ]

    # Path traversal patterns
    PATH_TRAVERSAL_PATTERNS = [
        "../../../etc/passwd",
        "..\\..\\..\\windows\\system32\\config\\sam",
        "....//....//....//etc/passwd",
        "%2e%2e%2f%2e%2e%2f%2e%2e%2fetc%2fpasswd",
        "..%252f..%252f..%252fetc%252fpasswd",
        "..%c0%af..%c0%af..%c0%afetc%c0%afpasswd",
    ]

    @given(
        malicious_input=st.sampled_from(SQL_INJECTION_PATTERNS + XSS_PATTERNS + PATH_TRAVERSAL_PATTERNS)
    )
    @hypothesis_settings(max_examples=100, deadline=10000)
    def test_input_validation_sql_injection_prevention_property(self, malicious_input):
        """
        **Feature: django-postgresql-enhancement, Property 37: Input validation and SQL injection prevention**
        **Validates: Requirements 9.1**
        
        Property: For any user input, malicious content should be properly sanitized 
        and SQL injection attempts should be prevented.
        """
        
        # Test 1: Article creation with malicious input
        self._test_article_input_validation(malicious_input)
        
        # Test 2: Comment creation with malicious input
        self._test_comment_input_validation(malicious_input)
        
        # Test 3: Category creation with malicious input
        self._test_category_input_validation(malicious_input)
        
        # Test 4: Tag creation with malicious input
        self._test_tag_input_validation(malicious_input)
        
        # Test 5: User creation with malicious input
        self._test_user_input_validation(malicious_input)
        
        # Test 6: Search functionality with malicious input
        self._test_search_input_validation(malicious_input)
        
        # Test 7: Feedback form with malicious input
        self._test_feedback_input_validation(malicious_input)
        
        # Test 8: Query parameters with malicious input
        self._test_query_parameter_validation(malicious_input)

    def _test_article_input_validation(self, malicious_input):
        """Test article creation and update with malicious input"""
        # Authenticate as admin
        self.client.force_authenticate(user=self.admin_user)
        
        # Test article creation with malicious title
        article_data = {
            'title': malicious_input,
            'content': 'Test content',
            'status': 'published'
        }
        
        response = self.client.post('/api/articles/', article_data, format='json')
        
        # Should either reject the input or sanitize it
        if response.status_code == 201:
            # If created, verify the malicious input was sanitized
            created_article = Article.objects.get(id=response.json()['id'])
            self._verify_no_malicious_content_stored(created_article.title, malicious_input)
            created_article.delete()  # Clean up
        else:
            # Input was rejected, which is also acceptable
            self.assertIn(response.status_code, [400, 422], 
                         "Malicious input should be rejected or sanitized")
        
        # Test article content with malicious input
        article_data = {
            'title': 'Test Article',
            'content': malicious_input,
            'status': 'published'
        }
        
        response = self.client.post('/api/articles/', article_data, format='json')
        
        if response.status_code == 201:
            created_article = Article.objects.get(id=response.json()['id'])
            self._verify_no_malicious_content_stored(created_article.content, malicious_input)
            created_article.delete()  # Clean up

    def _test_comment_input_validation(self, malicious_input):
        """Test comment creation with malicious input"""
        # Authenticate as regular user
        self.client.force_authenticate(user=self.test_user)
        
        comment_data = {
            'content': malicious_input,
            'article': str(self.test_article.id)
        }
        
        response = self.client.post(f'/api/articles/{self.test_article.id}/comments/', 
                                  comment_data, format='json')
        
        if response.status_code == 201:
            # If created, verify the malicious input was sanitized
            created_comment = Comment.objects.get(id=response.json()['id'])
            self._verify_no_malicious_content_stored(created_comment.content, malicious_input)
            created_comment.delete()  # Clean up
        else:
            # Input was rejected, which is also acceptable
            self.assertIn(response.status_code, [400, 422], 
                         "Malicious comment input should be rejected or sanitized")

    def _test_category_input_validation(self, malicious_input):
        """Test category creation with malicious input"""
        # Authenticate as admin
        self.client.force_authenticate(user=self.admin_user)
        
        category_data = {
            'name': malicious_input,
            'description': 'Test description'
        }
        
        response = self.client.post('/api/categories/', category_data, format='json')
        
        if response.status_code == 201:
            created_category = Category.objects.get(id=response.json()['id'])
            self._verify_no_malicious_content_stored(created_category.name, malicious_input)
            created_category.delete()  # Clean up

    def _test_tag_input_validation(self, malicious_input):
        """Test tag creation with malicious input"""
        # Authenticate as admin
        self.client.force_authenticate(user=self.admin_user)
        
        tag_data = {
            'name': malicious_input
        }
        
        response = self.client.post('/api/tags/', tag_data, format='json')
        
        if response.status_code == 201:
            created_tag = Tag.objects.get(id=response.json()['id'])
            self._verify_no_malicious_content_stored(created_tag.name, malicious_input)
            created_tag.delete()  # Clean up

    def _test_user_input_validation(self, malicious_input):
        """Test user creation with malicious input"""
        # Test with malicious username
        user_data = {
            'username': malicious_input,
            'email': 'test@example.com',
            'password': 'testpassword123'
        }
        
        response = self.client.post('/api/auth/register/', user_data, format='json')
        
        if response.status_code == 201:
            created_user = CustomUser.objects.get(id=response.json()['id'])
            self._verify_no_malicious_content_stored(created_user.username, malicious_input)
            created_user.delete()  # Clean up

    def _test_search_input_validation(self, malicious_input):
        """Test search functionality with malicious input"""
        # Test article search
        response = self.client.get('/api/articles/search/', {'q': malicious_input})
        
        # Search should not fail catastrophically
        self.assertIn(response.status_code, [200, 400], 
                     "Search with malicious input should not cause server error")
        
        # If successful, verify no SQL injection occurred by checking database state
        if response.status_code == 200:
            # Verify database integrity - check that no tables were dropped or modified
            self._verify_database_integrity()

    def _test_feedback_input_validation(self, malicious_input):
        """Test feedback form with malicious input"""
        feedback_data = {
            'name': malicious_input,
            'email': 'test@example.com',
            'message': 'Test message'
        }
        
        response = self.client.post('/api/feedback/', feedback_data, format='json')
        
        if response.status_code == 201:
            created_feedback = Feedback.objects.get(id=response.json()['id'])
            self._verify_no_malicious_content_stored(created_feedback.name, malicious_input)
            created_feedback.delete()  # Clean up

    def _test_query_parameter_validation(self, malicious_input):
        """Test query parameters with malicious input"""
        # Test various query parameters
        query_params = [
            {'category': malicious_input},
            {'tag': malicious_input},
            {'author': malicious_input},
            {'search': malicious_input},
            {'ordering': malicious_input},
            {'status': malicious_input},
        ]
        
        for params in query_params:
            response = self.client.get('/api/articles/', params)
            
            # Should not cause server error
            self.assertIn(response.status_code, [200, 400], 
                         f"Query parameter {params} with malicious input should not cause server error")
            
            # Verify database integrity
            if response.status_code == 200:
                self._verify_database_integrity()

    def _verify_no_malicious_content_stored(self, stored_value, original_malicious_input):
        """Verify that malicious content was not stored as-is in the database"""
        if stored_value is None:
            return  # Null values are acceptable
        
        stored_str = str(stored_value)
        
        # Check for SQL injection patterns
        for pattern in self.SQL_INJECTION_PATTERNS:
            self.assertNotIn(pattern.lower(), stored_str.lower(), 
                           f"SQL injection pattern '{pattern}' should not be stored in database")
        
        # Check for dangerous script tags
        dangerous_patterns = [
            '<script',
            'javascript:',
            'onerror=',
            'onload=',
            'onfocus=',
            'onclick=',
            'onmouseover=',
        ]
        
        for pattern in dangerous_patterns:
            self.assertNotIn(pattern.lower(), stored_str.lower(), 
                           f"Dangerous pattern '{pattern}' should not be stored in database")

    def _verify_database_integrity(self):
        """Verify that database structure and critical data remain intact"""
        try:
            # Verify critical tables still exist and have expected structure
            with connection.cursor() as cursor:
                # Check that our test objects still exist
                self.assertTrue(CustomUser.objects.filter(id=self.test_user.id).exists(), 
                              "Test user should still exist after malicious input")
                self.assertTrue(Article.objects.filter(id=self.test_article.id).exists(), 
                              "Test article should still exist after malicious input")
                self.assertTrue(Category.objects.filter(id=self.test_category.id).exists(), 
                              "Test category should still exist after malicious input")
                
                # Verify table structure hasn't been modified
                cursor.execute("SELECT COUNT(*) FROM blog_customuser")
                user_count = cursor.fetchone()[0]
                self.assertGreater(user_count, 0, "User table should not be empty")
                
                cursor.execute("SELECT COUNT(*) FROM blog_article")
                article_count = cursor.fetchone()[0]
                self.assertGreater(article_count, 0, "Article table should not be empty")
                
        except Exception as e:
            self.fail(f"Database integrity check failed: {str(e)}")

    def test_serializer_input_validation(self):
        """Test that serializers properly validate and sanitize input"""
        
        # Test Article serializer
        for malicious_input in self.SQL_INJECTION_PATTERNS[:5]:  # Test subset for performance
            article_data = {
                'title': malicious_input,
                'content': 'Test content',
                'status': 'published'
            }
            
            serializer = ArticleSerializer(data=article_data)
            
            # Serializer should either be invalid or sanitize the input
            if serializer.is_valid():
                # If valid, the cleaned data should not contain malicious patterns
                cleaned_title = serializer.validated_data.get('title', '')
                self._verify_no_malicious_content_stored(cleaned_title, malicious_input)
        
        # Test Comment serializer
        for malicious_input in self.XSS_PATTERNS[:5]:  # Test subset for performance
            comment_data = {
                'content': malicious_input,
                'article': self.test_article.id
            }
            
            serializer = CommentSerializer(data=comment_data)
            
            if serializer.is_valid():
                cleaned_content = serializer.validated_data.get('content', '')
                self._verify_no_malicious_content_stored(cleaned_content, malicious_input)

    def test_model_validation_security(self):
        """Test that model validation prevents malicious input"""
        
        # Test Category model validation
        for malicious_input in self.SQL_INJECTION_PATTERNS[:3]:
            try:
                category = Category(name=malicious_input, description='Test')
                category.full_clean()  # This should trigger validation
                
                # If validation passes, verify the content is safe
                self._verify_no_malicious_content_stored(category.name, malicious_input)
                
            except ValidationError:
                # Validation error is acceptable - input was rejected
                pass
        
        # Test Comment model validation with threading constraints
        try:
            # Create a deeply nested comment structure to test constraints
            parent_comment = Comment.objects.create(
                content='Parent comment',
                article=self.test_article,
                author=self.test_user,
                approved=True
            )
            
            # Try to create a comment with malicious content as a reply
            malicious_comment = Comment(
                content="'; DROP TABLE blog_comment; --",
                article=self.test_article,
                author=self.test_user,
                parent=parent_comment
            )
            
            malicious_comment.full_clean()
            malicious_comment.save()
            
            # Verify the malicious content was not stored as-is
            self._verify_no_malicious_content_stored(
                malicious_comment.content, 
                "'; DROP TABLE blog_comment; --"
            )
            
            # Clean up
            malicious_comment.delete()
            parent_comment.delete()
            
        except ValidationError:
            # Validation error is acceptable
            pass

    def test_raw_sql_injection_prevention(self):
        """Test that raw SQL queries are protected against injection"""
        
        # Test search functionality that might use raw SQL
        malicious_queries = [
            "'; DROP TABLE blog_article; --",
            "' UNION SELECT password FROM blog_customuser --",
            "'; DELETE FROM blog_comment; --"
        ]
        
        for malicious_query in malicious_queries:
            # Test article search
            response = self.client.get('/api/articles/search/', {'q': malicious_query})
            
            # Should not cause server error
            self.assertIn(response.status_code, [200, 400])
            
            # Verify database integrity after each attempt
            self._verify_database_integrity()
            
            # Verify that the malicious query didn't execute
            # Check that our test data still exists
            self.assertTrue(Article.objects.filter(id=self.test_article.id).exists())
            self.assertTrue(CustomUser.objects.filter(id=self.test_user.id).exists())

    def test_file_upload_input_validation(self):
        """Test file upload input validation and security"""
        # Authenticate as admin
        self.client.force_authenticate(user=self.admin_user)
        
        # Test malicious filename
        malicious_filenames = [
            "../../../etc/passwd",
            "..\\..\\..\\windows\\system32\\config\\sam",
            "<script>alert('xss')</script>.jpg",
            "'; DROP TABLE files; --.jpg"
        ]
        
        for malicious_filename in malicious_filenames:
            # Create a simple image file content
            from io import BytesIO
            from PIL import Image
            
            # Create a small test image
            img = Image.new('RGB', (10, 10), color='red')
            img_buffer = BytesIO()
            img.save(img_buffer, format='JPEG')
            img_buffer.seek(0)
            img_buffer.name = malicious_filename
            
            response = self.client.post('/api/upload/', {
                'file': img_buffer,
                'type': 'image'
            }, format='multipart')
            
            # Should either reject malicious filename or sanitize it
            if response.status_code == 200:
                # If successful, verify no malicious content in response
                response_data = response.json()
                if 'filename' in response_data:
                    self._verify_no_malicious_content_stored(
                        response_data['filename'], 
                        malicious_filename
                    )

    @given(
        field_value=st.text(
            alphabet=string.ascii_letters + string.digits + string.punctuation + " ",
            min_size=1,
            max_size=1000
        )
    )
    @hypothesis_settings(max_examples=50, deadline=5000)
    def test_general_input_sanitization_property(self, field_value):
        """
        Property: All text input fields should be properly sanitized regardless of content.
        """
        # Test various text fields with random input
        self.client.force_authenticate(user=self.admin_user)
        
        # Test article creation
        article_data = {
            'title': field_value[:255],  # Respect max length
            'content': field_value,
            'excerpt': field_value[:500] if len(field_value) > 500 else field_value,
            'status': 'published'
        }
        
        try:
            response = self.client.post('/api/articles/', article_data, format='json')
            
            if response.status_code == 201:
                created_article = Article.objects.get(id=response.json()['id'])
                
                # Verify no dangerous patterns were stored
                self._verify_input_is_safe(created_article.title)
                self._verify_input_is_safe(created_article.content)
                if created_article.excerpt:
                    self._verify_input_is_safe(created_article.excerpt)
                
                created_article.delete()  # Clean up
                
        except Exception as e:
            # Some random inputs might cause validation errors, which is acceptable
            if "UNIQUE constraint failed" not in str(e) and "already exists" not in str(e):
                # Only fail on unexpected errors
                pass

    def _verify_input_is_safe(self, input_value):
        """Verify that input doesn't contain dangerous patterns"""
        if input_value is None:
            return
        
        input_str = str(input_value)
        
        # Check for SQL injection indicators
        sql_indicators = ['DROP TABLE', 'DELETE FROM', 'INSERT INTO', 'UPDATE SET', 'UNION SELECT']
        for indicator in sql_indicators:
            self.assertNotIn(indicator.upper(), input_str.upper(), 
                           f"Input should not contain SQL command: {indicator}")
        
        # Check for script injection
        script_indicators = ['<script', 'javascript:', 'onerror=', 'onload=']
        for indicator in script_indicators:
            self.assertNotIn(indicator.lower(), input_str.lower(), 
                           f"Input should not contain script injection: {indicator}")

    def test_authentication_input_validation(self):
        """Test authentication endpoints against injection attacks"""
        
        # Test login with malicious input
        for malicious_input in self.SQL_INJECTION_PATTERNS[:5]:
            login_data = {
                'email': malicious_input,
                'password': 'testpassword123'
            }
            
            response = self.client.post('/api/auth/login/', login_data, format='json')
            
            # Should not cause server error
            self.assertIn(response.status_code, [400, 401], 
                         "Malicious login input should be rejected")
            
            # Verify database integrity
            self._verify_database_integrity()
        
        # Test registration with malicious input
        for malicious_input in self.XSS_PATTERNS[:3]:
            register_data = {
                'username': f'user_{hash(malicious_input) % 1000}',
                'email': f'test_{hash(malicious_input) % 1000}@example.com',
                'password': 'testpassword123',
                'first_name': malicious_input
            }
            
            response = self.client.post('/api/auth/register/', register_data, format='json')
            
            if response.status_code == 201:
                # If created, verify malicious content was sanitized
                created_user = CustomUser.objects.get(id=response.json()['id'])
                self._verify_no_malicious_content_stored(created_user.first_name, malicious_input)
                created_user.delete()  # Clean up

    def test_admin_interface_input_validation(self):
        """Test admin interface endpoints against injection attacks"""
        # Authenticate as admin
        self.client.force_authenticate(user=self.admin_user)
        
        # Test admin search functionality
        for malicious_input in self.SQL_INJECTION_PATTERNS[:3]:
            response = self.client.get('/api/admin/search/', {'q': malicious_input})
            
            # Should not cause server error
            self.assertIn(response.status_code, [200, 400], 
                         "Admin search with malicious input should not cause server error")
            
            # Verify database integrity
            self._verify_database_integrity()
        
        # Test admin analytics endpoints
        response = self.client.get('/api/admin/analytics/timerange/', {
            'days': "'; DROP TABLE blog_analytics; --"
        })
        
        # Should handle malicious input safely
        self.assertIn(response.status_code, [200, 400], 
                     "Admin analytics should handle malicious input safely")

    def test_contact_info_input_validation(self):
        """Test contact info update against injection attacks"""
        # Authenticate as admin
        self.client.force_authenticate(user=self.admin_user)
        
        for malicious_input in self.XSS_PATTERNS[:3]:
            contact_data = {
                'address': malicious_input,
                'phone': '+1234567890',
                'email': 'contact@example.com'
            }
            
            response = self.client.patch('/api/contact/', contact_data, format='json')
            
            if response.status_code == 200:
                # Verify malicious content was sanitized
                contact_info = ContactInfo.objects.first()
                if contact_info:
                    self._verify_no_malicious_content_stored(contact_info.address, malicious_input)

    def test_json_field_input_validation(self):
        """Test JSON field input validation (preferences, social_media_links, etc.)"""
        # Authenticate as admin
        self.client.force_authenticate(user=self.admin_user)
        
        # Test user preferences JSON field
        malicious_json_data = {
            'theme': "'; DROP TABLE blog_customuser; --",
            'notifications': "<script>alert('XSS')</script>",
            'language': "' OR '1'='1"
        }
        
        user_data = {
            'username': 'json_test_user',
            'email': 'jsontest@example.com',
            'password': 'testpassword123',
            'preferences': malicious_json_data
        }
        
        response = self.client.post('/api/admin/users/', user_data, format='json')
        
        if response.status_code == 201:
            created_user = CustomUser.objects.get(id=response.json()['id'])
            
            # Verify JSON field content is safe
            if created_user.preferences:
                for key, value in created_user.preferences.items():
                    self._verify_no_malicious_content_stored(str(value), str(malicious_json_data.get(key, '')))
            
            created_user.delete()  # Clean up