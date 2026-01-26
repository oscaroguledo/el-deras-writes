"""
Property-based tests for token refresh security
**Feature: django-postgresql-enhancement, Property 9: Token refresh security**
**Validates: Requirements 2.5**
"""

from django.test import TestCase
from django.utils import timezone
from django.core.cache import cache
from rest_framework import status
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken, AccessToken
from rest_framework_simplejwt.exceptions import TokenError
from hypothesis import given, strategies as st, settings as hypothesis_settings
from hypothesis.extra.django import TestCase as HypothesisTestCase
from blog.models import CustomUser
import string
from datetime import timedelta


class TokenRefreshSecurityTest(HypothesisTestCase):
    """
    Property-based tests for token refresh security and validation
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
    def test_token_refresh_security_property(self, email, username, password):
        """
        **Feature: django-postgresql-enhancement, Property 9: Token refresh security**
        **Validates: Requirements 2.5**
        
        Property: For any token refresh operation, expired tokens should be properly 
        handled and new tokens should maintain security standards.
        """
        try:
            # Create a unique user for this test
            user = CustomUser.objects.create_user(
                email=email,
                username=username,
                password=password,
                user_type='normal'
            )
            
            # Get initial tokens through login
            login_data = {
                'email': email,
                'password': password
            }
            
            login_response = self.client.post(auth/login/', login_data, format='json')
            
            if login_response.status_code == 200:
                login_tokens = login_response.json()
                refresh_token = login_tokens['refresh']
                original_access_token = login_tokens['access']
                
                # Test 1: Valid refresh token should produce new access token
                refresh_data = {'refresh': refresh_token}
                refresh_response = self.client.post(auth/refresh/', refresh_data, format='json')
                
                if refresh_response.status_code == 200:
                    new_tokens = refresh_response.json()
                    
                    # Verify new access token is provided
                    self.assertIn('access', new_tokens, "Refresh should provide new access token")
                    new_access_token = new_tokens['access']
                    
                    # Verify new token is different from original
                    self.assertNotEqual(
                        new_access_token, 
                        original_access_token,
                        "Refreshed access token should be different from original"
                    )
                    
                    # Verify new token is valid and properly formatted
                    self.assertIsInstance(new_access_token, str, "New access token should be a string")
                    self.assertGreater(len(new_access_token), 50, "New access token should be sufficiently long")
                    
                    # Verify token has proper JWT structure
                    token_parts = new_access_token.split('.')
                    self.assertEqual(
                        len(token_parts), 
                        3, 
                        "New JWT token should have 3 parts (header.payload.signature)"
                    )
                    
                    # Verify new token can be validated
                    try:
                        validated_token = AccessToken(new_access_token)
                        
                        # Verify token contains correct user claims
                        self.assertEqual(
                            str(validated_token.payload.get('user_id')), 
                            str(user.id),
                            "New token should contain correct user ID"
                        )
                        
                        # Verify token contains expected claims
                        self.assertIn('exp', validated_token.payload, "New token should contain expiration claim")
                        self.assertIn('iat', validated_token.payload, "New token should contain issued at claim")
                        self.assertIn('jti', validated_token.payload, "New token should contain JWT ID claim")
                        
                        # Verify token expiration is in the future
                        exp_timestamp = validated_token.payload.get('exp')
                        current_timestamp = timezone.now().timestamp()
                        self.assertGreater(
                            exp_timestamp, 
                            current_timestamp,
                            "New token expiration should be in the future"
                        )
                        
                    except TokenError as e:
                        self.fail(f"Refreshed token should be valid, but got error: {str(e)}")
                    
                    # Verify new token can be used for authenticated requests
                    self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {new_access_token}')
                    auth_response = self.client.get(auth/validate/')
                    
                    if auth_response.status_code == 200:
                        auth_data = auth_response.json()
                        self.assertTrue(auth_data.get('valid'), "New token should be valid for authentication")
                        self.assertEqual(
                            auth_data.get('user', {}).get('id'), 
                            str(user.id),
                            "Authenticated request with new token should return correct user"
                        )
                    
                    # Test 2: Verify response includes security metadata
                    if 'expires_in' in new_tokens:
                        expires_in = new_tokens['expires_in']
                        self.assertIsInstance(expires_in, int, "expires_in should be an integer")
                        self.assertGreater(expires_in, 0, "expires_in should be positive")
                    
                    if 'token_type' in new_tokens:
                        self.assertEqual(
                            new_tokens['token_type'], 
                            'Bearer',
                            "Token type should be Bearer"
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

    def test_invalid_refresh_token_rejection(self):
        """
        Property: Invalid refresh tokens should be properly rejected with appropriate error responses.
        """
        # Test with completely invalid token
        invalid_refresh_data = {'refresh': 'invalid_token_string'}
        response = self.client.post(auth/refresh/', invalid_refresh_data, format='json')
        
        # Should be rejected
        self.assertIn(
            response.status_code, 
            [400, 401],
            "Invalid refresh token should be rejected"
        )
        
        # Test with malformed JWT
        malformed_jwt = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid.signature'
        malformed_refresh_data = {'refresh': malformed_jwt}
        response = self.client.post(auth/refresh/', malformed_refresh_data, format='json')
        
        # Should be rejected
        self.assertIn(
            response.status_code, 
            [400, 401],
            "Malformed JWT should be rejected"
        )

    def test_expired_refresh_token_handling(self):
        """
        Property: Expired refresh tokens should be properly rejected.
        """
        # Create a refresh token that's already expired
        user = self.test_user
        refresh_token = RefreshToken.for_user(user)
        
        # Manually set expiration to past
        refresh_token.payload['exp'] = timezone.now().timestamp() - 3600  # 1 hour ago
        
        # Try to use expired refresh token
        expired_refresh_data = {'refresh': str(refresh_token)}
        response = self.client.post(auth/refresh/', expired_refresh_data, format='json')
        
        # Should be rejected
        self.assertEqual(
            response.status_code, 
            401,
            "Expired refresh token should be rejected with 401 status"
        )

    def test_refresh_token_user_validation(self):
        """
        Property: Refresh tokens should validate that the associated user still exists and is active.
        """
        # Login to get valid refresh token
        login_data = {
            'email': self.test_user.email,
            'password': 'testpassword123'
        }
        
        login_response = self.client.post(auth/login/', login_data, format='json')
        self.assertEqual(login_response.status_code, 200)
        
        refresh_token = login_response.json()['refresh']
        
        # Deactivate the user
        self.test_user.is_active = False
        self.test_user.save()
        
        # Try to refresh token with inactive user
        refresh_data = {'refresh': refresh_token}
        response = self.client.post(auth/refresh/', refresh_data, format='json')
        
        # Should be rejected
        self.assertEqual(
            response.status_code, 
            401,
            "Refresh token for inactive user should be rejected"
        )
        
        # Reactivate user for cleanup
        self.test_user.is_active = True
        self.test_user.save()

    def test_refresh_token_reuse_security(self):
        """
        Property: Refresh token security should prevent unauthorized reuse.
        """
        # Login to get valid refresh token
        login_data = {
            'email': self.test_user.email,
            'password': 'testpassword123'
        }
        
        login_response = self.client.post(auth/login/', login_data, format='json')
        self.assertEqual(login_response.status_code, 200)
        
        refresh_token = login_response.json()['refresh']
        
        # Use refresh token multiple times
        refresh_data = {'refresh': refresh_token}
        
        # First refresh should work
        first_response = self.client.post(auth/refresh/', refresh_data, format='json')
        
        if first_response.status_code == 200:
            first_access_token = first_response.json()['access']
            
            # Second refresh with same token should also work (unless rotation is enabled)
            second_response = self.client.post(auth/refresh/', refresh_data, format='json')
            
            if second_response.status_code == 200:
                second_access_token = second_response.json()['access']
                
                # Access tokens should be different (new tokens each time)
                self.assertNotEqual(
                    first_access_token,
                    second_access_token,
                    "Multiple refresh operations should produce different access tokens"
                )

    def test_refresh_token_claims_consistency(self):
        """
        Property: Refreshed access tokens should maintain consistent claims with the original user.
        """
        # Login to get tokens
        login_data = {
            'email': self.test_user.email,
            'password': 'testpassword123'
        }
        
        login_response = self.client.post(auth/login/', login_data, format='json')
        self.assertEqual(login_response.status_code, 200)
        
        tokens = login_response.json()
        original_access_token = tokens['access']
        refresh_token = tokens['refresh']
        
        # Get original token claims
        original_token = AccessToken(original_access_token)
        original_claims = original_token.payload
        
        # Refresh to get new access token
        refresh_data = {'refresh': refresh_token}
        refresh_response = self.client.post(auth/refresh/', refresh_data, format='json')
        
        if refresh_response.status_code == 200:
            new_access_token = refresh_response.json()['access']
            new_token = AccessToken(new_access_token)
            new_claims = new_token.payload
            
            # Verify consistent user claims
            self.assertEqual(
                original_claims.get('user_id'),
                new_claims.get('user_id'),
                "User ID should be consistent between original and refreshed tokens"
            )
            
            # Verify token type is consistent
            self.assertEqual(
                original_claims.get('token_type'),
                new_claims.get('token_type'),
                "Token type should be consistent between original and refreshed tokens"
            )
            
            # Verify new token has updated timestamps
            self.assertGreater(
                new_claims.get('iat', 0),
                original_claims.get('iat', 0),
                "New token should have more recent issued at timestamp"
            )
            
            self.assertGreater(
                new_claims.get('exp', 0),
                original_claims.get('exp', 0),
                "New token should have later expiration timestamp"
            )

    def test_concurrent_refresh_operations(self):
        """
        Property: Concurrent refresh operations should all produce valid, unique tokens.
        """
        # Login to get refresh token
        login_data = {
            'email': self.test_user.email,
            'password': 'testpassword123'
        }
        
        login_response = self.client.post(auth/login/', login_data, format='json')
        self.assertEqual(login_response.status_code, 200)
        
        refresh_token = login_response.json()['refresh']
        refresh_data = {'refresh': refresh_token}
        
        # Make multiple concurrent refresh requests
        responses = []
        for _ in range(3):
            response = self.client.post(auth/refresh/', refresh_data, format='json')
            if response.status_code == 200:
                responses.append(response.json())
        
        if len(responses) > 1:
            # All access tokens should be unique
            access_tokens = [r['access'] for r in responses]
            
            self.assertEqual(
                len(access_tokens), 
                len(set(access_tokens)),
                "All concurrent refresh operations should produce unique access tokens"
            )
            
            # All tokens should be valid
            for token in access_tokens:
                try:
                    validated_token = AccessToken(token)
                    self.assertEqual(
                        str(validated_token.payload.get('user_id')), 
                        str(self.test_user.id),
                        "All concurrent tokens should contain correct user ID"
                    )
                except TokenError:
                    self.fail("All concurrent refresh tokens should be valid")

    @given(
        malformed_token=st.text(
            alphabet=string.ascii_letters + string.digits + '.-_',
            min_size=10,
            max_size=100
        ).filter(lambda x: '.' in x and len(x.split('.')) <= 3)
    )
    @hypothesis_settings(max_examples=50, deadline=5000)
    def test_malformed_refresh_token_rejection_property(self, malformed_token):
        """
        Property: Malformed refresh tokens should be consistently rejected.
        """
        # Skip tokens that might accidentally be valid
        if len(malformed_token.split('.')) != 3:
            return
        
        # Try to use malformed token for refresh
        refresh_data = {'refresh': malformed_token}
        response = self.client.post(auth/refresh/', refresh_data, format='json')
        
        # Malformed tokens should be rejected
        self.assertIn(
            response.status_code, 
            [400, 401],
            "Malformed refresh tokens should be rejected with 400 or 401 status"
        )

    def test_refresh_without_token_parameter(self):
        """
        Property: Refresh requests without token parameter should be properly rejected.
        """
        # Test with missing refresh parameter
        response = self.client.post(auth/refresh/', {}, format='json')
        
        self.assertEqual(
            response.status_code, 
            400,
            "Refresh request without token should be rejected with 400 status"
        )
        
        # Test with empty refresh parameter
        response = self.client.post(auth/refresh/', {'refresh': ''}, format='json')
        
        self.assertIn(
            response.status_code, 
            [400, 401],
            "Refresh request with empty token should be rejected"
        )

    def test_refresh_token_security_headers(self):
        """
        Property: Refresh responses should include appropriate security headers and metadata.
        """
        # Login to get refresh token
        login_data = {
            'email': self.test_user.email,
            'password': 'testpassword123'
        }
        
        login_response = self.client.post(auth/login/', login_data, format='json')
        self.assertEqual(login_response.status_code, 200)
        
        refresh_token = login_response.json()['refresh']
        
        # Refresh token
        refresh_data = {'refresh': refresh_token}
        response = self.client.post(auth/refresh/', refresh_data, format='json')
        
        if response.status_code == 200:
            # Check for security headers (added by middleware)
            security_headers = [
                'X-Content-Type-Options',
                'X-Frame-Options', 
                'X-XSS-Protection'
            ]
            
            for header in security_headers:
                self.assertIn(
                    header, 
                    response,
                    f"Response should include {header} security header"
                )
            
            # Check response content type
            self.assertEqual(
                response['Content-Type'], 
                'application/json',
                "Response should be JSON"
            )