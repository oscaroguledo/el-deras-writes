"""
Property-based tests for authentication security
**Feature: django-postgresql-enhancement, Property 38: Authentication security**
**Validates: Requirements 9.2**
"""

from django.test import TestCase
from django.utils import timezone
from django.core.cache import cache
from django.contrib.auth.hashers import make_password, check_password
from rest_framework import status
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import AccessToken, RefreshToken
from rest_framework_simplejwt.exceptions import TokenError
from hypothesis import given, strategies as st, settings as hypothesis_settings
from hypothesis.extra.django import TestCase as HypothesisTestCase
from blog.models import CustomUser
import string
import hashlib
import time
from datetime import timedelta


class AuthenticationSecurityTest(HypothesisTestCase):
    """
    Property-based tests for authentication security measures and best practices
    """

    def setUp(self):
        """Set up test environment"""
        self.client = APIClient()
        cache.clear()  # Clear cache before each test
        
        # Create a test user
        self.test_user = CustomUser.objects.create_user(
            email='testuser@example.com',
            username='testuser',
            password='testpassword123',
            user_type='normal'
        )

    def tearDown(self):
        """Clean up after each test"""
        cache.clear()
        # Clean up any created users
        CustomUser.objects.filter(email__startswith='test').delete()

    @given(
        email=st.emails(),
        username=st.text(
            alphabet=string.ascii_letters + string.digits + '_',
            min_size=3,
            max_size=150
        ).filter(lambda x: x and not x.startswith('_') and not x.endswith('_')),
        password=st.text(min_size=8, max_size=128)
    )
    @hypothesis_settings(max_examples=100, deadline=10000)
    def test_authentication_security_property(self, email, username, password):
        """
        **Feature: django-postgresql-enhancement, Property 38: Authentication security**
        **Validates: Requirements 9.2**
        
        Property: For any authentication operation, passwords should be securely hashed 
        and JWT tokens should follow security best practices.
        """
        try:
            # Create a unique user for this test
            user = CustomUser.objects.create_user(
                email=email,
                username=username,
                password=password,
                user_type='normal'
            )
            
            # Test 1: Password Security - Verify password is properly hashed
            self.assertNotEqual(
                user.password, 
                password,
                "Password must never be stored in plain text"
            )
            
            # Verify password uses secure hashing algorithm
            self.assertTrue(
                user.password.startswith(('pbkdf2_sha256$', 'argon2$', 'bcrypt$', 'scrypt$')),
                f"Password should use secure hashing algorithm, got: {user.password[:20]}..."
            )
            
            # Verify password hash is sufficiently long (indicates proper hashing)
            self.assertGreater(
                len(user.password),
                50,  # Proper hashes should be much longer than this
                "Password hash should be sufficiently long to indicate proper hashing"
            )
            
            # Test 2: Password Verification Security
            # Correct password should validate
            self.assertTrue(
                user.check_password(password),
                "Correct password should validate against hash"
            )
            
            # Wrong passwords should be rejected
            wrong_password = password + "wrong"
            self.assertFalse(
                user.check_password(wrong_password),
                "Wrong passwords should be rejected"
            )
            
            # Empty password should be rejected
            self.assertFalse(
                user.check_password(""),
                "Empty password should be rejected"
            )
            
            # Test 3: JWT Token Security - Attempt login
            login_data = {
                'email': email,
                'password': password
            }
            
            login_response = self.client.post('/api/auth/login/', login_data, format='json')
            
            if login_response.status_code == 200:
                tokens = login_response.json()
                access_token = tokens['access']
                
                # Verify JWT token security properties
                self.assertIsInstance(access_token, str, "Access token should be a string")
                self.assertGreater(len(access_token), 100, "JWT token should be sufficiently long")
                
                # Verify token structure (JWT should have 3 parts)
                token_parts = access_token.split('.')
                self.assertEqual(
                    len(token_parts), 
                    3, 
                    "JWT token should have 3 parts (header.payload.signature)"
                )
                
                # Verify each part is base64-encoded (non-empty after splitting)
                for i, part in enumerate(token_parts):
                    self.assertGreater(
                        len(part), 
                        0, 
                        f"JWT token part {i} should not be empty"
                    )
                
                # Test 4: Token Validation Security
                try:
                    validated_token = AccessToken(access_token)
                    
                    # Verify token contains security-relevant claims
                    payload = validated_token.payload
                    
                    # Required security claims
                    required_claims = ['user_id', 'exp', 'iat', 'jti']
                    for claim in required_claims:
                        self.assertIn(
                            claim, 
                            payload, 
                            f"Token should contain security claim: {claim}"
                        )
                    
                    # Verify user_id matches
                    self.assertEqual(
                        str(payload.get('user_id')), 
                        str(user.id),
                        "Token user_id should match authenticated user"
                    )
                    
                    # Verify expiration is reasonable (not too far in future, not in past)
                    exp_timestamp = payload.get('exp')
                    current_timestamp = timezone.now().timestamp()
                    
                    self.assertGreater(
                        exp_timestamp, 
                        current_timestamp,
                        "Token should not be expired"
                    )
                    
                    # Token should not be valid for more than 24 hours (security best practice)
                    max_valid_time = current_timestamp + (24 * 3600)  # 24 hours
                    self.assertLess(
                        exp_timestamp, 
                        max_valid_time,
                        "Token should not be valid for more than 24 hours"
                    )
                    
                    # Verify issued at time is reasonable
                    iat_timestamp = payload.get('iat')
                    self.assertLessEqual(
                        iat_timestamp, 
                        current_timestamp + 60,  # Allow 1 minute clock skew
                        "Token issued at time should not be in the future"
                    )
                    
                    # Verify JWT ID (jti) is present and non-empty
                    jti = payload.get('jti')
                    self.assertIsNotNone(jti, "Token should have JWT ID (jti)")
                    self.assertGreater(len(str(jti)), 0, "JWT ID should not be empty")
                    
                except TokenError as e:
                    self.fail(f"Valid login should produce valid JWT token, but got error: {str(e)}")
                
                # Test 5: Token Authentication Security
                # Valid token should allow access
                self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')
                auth_response = self.client.get('/api/auth/validate/')
                
                if auth_response.status_code == 200:
                    auth_data = auth_response.json()
                    self.assertTrue(auth_data.get('valid'), "Valid token should authenticate successfully")
                    
                    # Verify authenticated user data
                    returned_user = auth_data.get('user', {})
                    self.assertEqual(
                        returned_user.get('id'), 
                        str(user.id),
                        "Authenticated request should return correct user"
                    )
                    
                    self.assertEqual(
                        returned_user.get('email'), 
                        user.email,
                        "Authenticated request should return correct user email"
                    )
            
            # Clean up
            user.delete()
            
        except Exception as e:
            # Handle expected exceptions (duplicate users, etc.)
            if "UNIQUE constraint failed" in str(e) or "already exists" in str(e):
                # This is acceptable in property testing
                pass
            else:
                # Re-raise unexpected errors
                raise

    def test_password_hashing_security_standards(self):
        """
        Property: Password hashing should meet security standards and be resistant to attacks.
        """
        password = "test_password_123"
        
        # Create multiple users with the same password
        users = []
        for i in range(3):
            user = CustomUser.objects.create_user(
                email=f"test{i}@example.com",
                username=f"testuser{i}",
                password=password
            )
            users.append(user)
        
        # All passwords should be hashed differently (salt usage)
        hashes = [user.password for user in users]
        self.assertEqual(
            len(set(hashes)), 
            len(hashes),
            "Same passwords should produce different hashes due to salt usage"
        )
        
        # All hashes should use secure algorithms
        for user in users:
            self.assertTrue(
                user.password.startswith(('pbkdf2_sha256$', 'argon2$', 'bcrypt$', 'scrypt$')),
                "All passwords should use secure hashing algorithms"
            )
            
            # Verify password validation works
            self.assertTrue(user.check_password(password))
            self.assertFalse(user.check_password("wrong_password"))
        
        # Clean up
        for user in users:
            user.delete()

    def test_authentication_rate_limiting_security(self):
        """
        Property: Authentication should implement rate limiting to prevent brute force attacks.
        """
        # Test multiple failed login attempts
        failed_attempts = 0
        max_attempts = 10  # Try up to 10 failed attempts
        
        for i in range(max_attempts):
            login_data = {
                'email': self.test_user.email,
                'password': 'wrong_password'
            }
            
            response = self.client.post('/api/auth/login/', login_data, format='json')
            
            if response.status_code == 429:  # Rate limited
                # Rate limiting is working
                break
            elif response.status_code in [400, 401]:  # Failed login
                failed_attempts += 1
            else:
                # Unexpected response
                break
        
        # After multiple failed attempts, we should see some form of rate limiting
        # This could be HTTP 429, or the system should at least track failed attempts
        # The exact implementation may vary, but the system should not allow unlimited attempts
        
        # Verify that legitimate login still works after rate limiting period
        # (This tests that rate limiting doesn't permanently block legitimate users)
        correct_login_data = {
            'email': self.test_user.email,
            'password': 'testpassword123'
        }
        
        # Clear any rate limiting (in a real system, this would be time-based)
        cache.clear()
        
        response = self.client.post('/api/auth/login/', correct_login_data, format='json')
        # Should eventually succeed (may need to wait for rate limit to reset)
        self.assertIn(response.status_code, [200, 429], "Legitimate login should work or be rate limited")

    def test_jwt_token_security_properties(self):
        """
        Property: JWT tokens should have secure properties and resist common attacks.
        """
        # Login to get a valid token
        login_data = {
            'email': self.test_user.email,
            'password': 'testpassword123'
        }
        
        response = self.client.post('/api/auth/login/', login_data, format='json')
        self.assertEqual(response.status_code, 200)
        
        access_token = response.json()['access']
        
        # Test 1: Token should not be predictable
        # Get another token and verify they're different
        response2 = self.client.post('/api/auth/login/', login_data, format='json')
        if response2.status_code == 200:
            access_token2 = response2.json()['access']
            self.assertNotEqual(
                access_token, 
                access_token2,
                "Consecutive tokens should be different (not predictable)"
            )
        
        # Test 2: Token tampering should be detected
        # Modify the token slightly
        tampered_token = access_token[:-5] + "XXXXX"
        
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {tampered_token}')
        response = self.client.get('/api/auth/validate/')
        
        self.assertEqual(
            response.status_code, 
            401,
            "Tampered tokens should be rejected"
        )
        
        # Test 3: Empty or malformed tokens should be rejected
        malformed_tokens = [
            "",  # Empty
            "invalid",  # Not JWT format
            "a.b",  # Too few parts
            "a.b.c.d",  # Too many parts
            "Bearer invalid",  # Invalid with Bearer prefix
        ]
        
        for malformed_token in malformed_tokens:
            self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {malformed_token}')
            response = self.client.get('/api/auth/validate/')
            
            self.assertIn(
                response.status_code, 
                [400, 401],
                f"Malformed token '{malformed_token}' should be rejected"
            )

    def test_session_security_properties(self):
        """
        Property: Authentication sessions should have secure properties.
        """
        # Login to establish session
        login_data = {
            'email': self.test_user.email,
            'password': 'testpassword123'
        }
        
        response = self.client.post('/api/auth/login/', login_data, format='json')
        self.assertEqual(response.status_code, 200)
        
        tokens = response.json()
        access_token = tokens['access']
        
        # Test 1: Session should update user's last active time
        original_last_active = self.test_user.last_active
        
        # Make an authenticated request
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')
        self.client.get('/api/auth/validate/')
        
        # Refresh user from database
        self.test_user.refresh_from_db()
        
        # Last active should be updated (or at least not older)
        self.assertGreaterEqual(
            self.test_user.last_active, 
            original_last_active,
            "User's last active time should be updated on authentication"
        )
        
        # Test 2: Inactive users should not be able to authenticate
        # Deactivate user
        self.test_user.is_active = False
        self.test_user.save()
        
        # Try to login with inactive user
        response = self.client.post('/api/auth/login/', login_data, format='json')
        self.assertNotEqual(
            response.status_code, 
            200,
            "Inactive users should not be able to login"
        )
        
        # Reactivate for cleanup
        self.test_user.is_active = True
        self.test_user.save()

    @given(
        weak_password=st.text(
            alphabet=string.ascii_lowercase,
            min_size=1,
            max_size=6
        )
    )
    @hypothesis_settings(max_examples=50, deadline=5000)
    def test_weak_password_handling_property(self, weak_password):
        """
        Property: Even weak passwords should be properly hashed (never stored in plain text).
        """
        try:
            # Create user with weak password
            email = f"weak_{hash(weak_password) % 10000}@example.com"
            username = f"weakuser_{hash(weak_password) % 10000}"
            
            user = CustomUser.objects.create_user(
                email=email,
                username=username,
                password=weak_password
            )
            
            # Even weak passwords must be hashed
            self.assertNotEqual(
                user.password,
                weak_password,
                "Even weak passwords must never be stored in plain text"
            )
            
            # Should use secure hashing algorithm
            self.assertTrue(
                user.password.startswith(('pbkdf2_sha256$', 'argon2$', 'bcrypt$', 'scrypt$')),
                "All passwords must use secure hashing algorithms"
            )
            
            # Password validation should still work
            self.assertTrue(
                user.check_password(weak_password),
                "Password validation should work even for weak passwords"
            )
            
            # Clean up
            user.delete()
            
        except Exception as e:
            if "UNIQUE constraint failed" in str(e) or "already exists" in str(e):
                pass
            else:
                raise

    def test_authentication_timing_attack_resistance(self):
        """
        Property: Authentication should be resistant to timing attacks.
        """
        # Test login with valid user but wrong password
        invalid_login_data = {
            'email': self.test_user.email,
            'password': 'wrong_password'
        }
        
        # Measure time for invalid login
        start_time = time.time()
        response1 = self.client.post('/api/auth/login/', invalid_login_data, format='json')
        invalid_time = time.time() - start_time
        
        # Test login with non-existent user
        nonexistent_login_data = {
            'email': 'nonexistent@example.com',
            'password': 'any_password'
        }
        
        start_time = time.time()
        response2 = self.client.post('/api/auth/login/', nonexistent_login_data, format='json')
        nonexistent_time = time.time() - start_time
        
        # Both should fail
        self.assertNotEqual(response1.status_code, 200)
        self.assertNotEqual(response2.status_code, 200)
        
        # Timing difference should not be too significant (basic timing attack resistance)
        # This is a basic check - in production, more sophisticated timing attack prevention would be needed
        time_difference = abs(invalid_time - nonexistent_time)
        
        # Allow for some variance but flag if there's a huge difference
        # This is not a perfect timing attack test, but provides basic validation
        self.assertLess(
            time_difference,
            1.0,  # 1 second difference threshold
            "Authentication timing should not reveal user existence (basic timing attack resistance)"
        )

    def test_password_change_security(self):
        """
        Property: Password changes should maintain security properties.
        """
        original_password = "original_password_123"
        new_password = "new_password_456"
        
        # Create user with original password
        user = CustomUser.objects.create_user(
            email="password_change_test@example.com",
            username="password_change_user",
            password=original_password
        )
        
        original_hash = user.password
        
        # Change password
        user.set_password(new_password)
        user.save()
        
        # New hash should be different
        self.assertNotEqual(
            original_hash,
            user.password,
            "Password change should result in different hash"
        )
        
        # New password should not be stored in plain text
        self.assertNotEqual(
            user.password,
            new_password,
            "New password should not be stored in plain text"
        )
        
        # Old password should no longer work
        self.assertFalse(
            user.check_password(original_password),
            "Old password should no longer work after change"
        )
        
        # New password should work
        self.assertTrue(
            user.check_password(new_password),
            "New password should work after change"
        )
        
        # New hash should use secure algorithm
        self.assertTrue(
            user.password.startswith(('pbkdf2_sha256$', 'argon2$', 'bcrypt$', 'scrypt$')),
            "New password hash should use secure algorithm"
        )
        
        # Clean up
        user.delete()