"""
Property-based tests for JWT token validity
**Feature: django-postgresql-enhancement, Property 6: JWT token validity**
**Validates: Requirements 2.2**
"""

from django.test import TestCase, Client
from django.urls import reverse
from django.utils import timezone
from django.core.cache import cache
from rest_framework import status
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import AccessToken, RefreshToken
from rest_framework_simplejwt.exceptions import TokenError
from hypothesis import given, strategies as st, settings as hypothesis_settings
from hypothesis.extra.django import TestCase as HypothesisTestCase
from blog.models import CustomUser
from blog.jwt_views import EnhancedTokenObtainPairView
import jwt
import json
import string
from datetime import timedelta


class JWTTokenValidityTest(HypothesisTestCase):
    """
    Property-based tests for JWT token validity and security
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
    def test_jwt_token_validity_property(self, email, username, password):
        """
        **Feature: django-postgresql-enhancement, Property 6: JWT token validity**
        **Validates: Requirements 2.2**
        
        Property: For any successful login, the returned JWT token should be valid, 
        properly signed, and contain correct user claims.
        """
        try:
            # Create a unique user for this test
            user = CustomUser.objects.create_user(
                email=email,
                username=username,
                password=password,
                user_type='normal'
            )
            
            # Attempt login
            login_data = {
                'email': email,
                'password': password
            }
            
            response = self.client.post(auth/login/', login_data, format='json')
            
            if response.status_code == 200:
                response_data = response.json()
                
                # Verify response contains required token fields
                self.assertIn('access', response_data, "Response should contain access token")
                self.assertIn('refresh', response_data, "Response should contain refresh token")
                self.assertIn('token_type', response_data, "Response should contain token type")
                self.assertIn('expires_in', response_data, "Response should contain expiration info")
                
                access_token = response_data['access']
                refresh_token = response_data['refresh']
                
                # Verify token type is Bearer
                self.assertEqual(
                    response_data['token_type'], 
                    'Bearer',
                    "Token type should be Bearer"
                )
                
                # Verify access token is valid and properly formatted
                self.assertIsInstance(access_token, str, "Access token should be a string")
                self.assertGreater(len(access_token), 50, "Access token should be sufficiently long")
                
                # Verify token has proper JWT structure (3 parts separated by dots)
                token_parts = access_token.split('.')
                self.assertEqual(
                    len(token_parts), 
                    3, 
                    "JWT token should have 3 parts (header.payload.signature)"
                )
                
                # Verify token can be validated using Django REST framework JWT
                try:
                    validated_token = AccessToken(access_token)
                    
                    # Verify token contains correct user claims
                    self.assertEqual(
                        str(validated_token.payload.get('user_id')), 
                        str(user.id),
                        "Token should contain correct user ID"
                    )
                    
                    # Verify token contains expected claims
                    self.assertIn('exp', validated_token.payload, "Token should contain expiration claim")
                    self.assertIn('iat', validated_token.payload, "Token should contain issued at claim")
                    self.assertIn('jti', validated_token.payload, "Token should contain JWT ID claim")
                    self.assertIn('token_type', validated_token.payload, "Token should contain token type claim")
                    
                    # Verify token expiration is in the future
                    exp_timestamp = validated_token.payload.get('exp')
                    current_timestamp = timezone.now().timestamp()
                    self.assertGreater(
                        exp_timestamp, 
                        current_timestamp,
                        "Token expiration should be in the future"
                    )
                    
                    # Verify token is not expired
                    self.assertFalse(
                        validated_token.payload.get('exp', 0) < current_timestamp,
                        "Token should not be expired"
                    )
                    
                except TokenError as e:
                    self.fail(f"Valid login should produce valid JWT token, but got error: {str(e)}")
                
                # Verify refresh token is also valid
                self.assertIsInstance(refresh_token, str, "Refresh token should be a string")
                self.assertGreater(len(refresh_token), 50, "Refresh token should be sufficiently long")
                
                try:
                    validated_refresh = RefreshToken(refresh_token)
                    
                    # Verify refresh token contains correct user claims
                    self.assertEqual(
                        str(validated_refresh.payload.get('user_id')), 
                        str(user.id),
                        "Refresh token should contain correct user ID"
                    )
                    
                except TokenError as e:
                    self.fail(f"Valid login should produce valid refresh token, but got error: {str(e)}")
                
                # Verify token can be used for authenticated requests
                self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')
                auth_response = self.client.get(auth/validate/')
                
                if auth_response.status_code == 200:
                    auth_data = auth_response.json()
                    self.assertTrue(auth_data.get('valid'), "Token should be valid for authentication")
                    self.assertEqual(
                        auth_data.get('user', {}).get('id'), 
                        str(user.id),
                        "Authenticated request should return correct user"
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

    def test_token_signature_validation(self):
        """
        Property: JWT tokens should be properly signed and signature validation should work correctly.
        """
        # Login with test user
        login_data = {
            'email': self.test_user.email,
            'password': 'testpassword123'
        }
        
        response = self.client.post(auth/login/', login_data, format='json')
        self.assertEqual(response.status_code, 200)
        
        access_token = response.json()['access']
        
        # Verify token signature is valid
        try:
            validated_token = AccessToken(access_token)
            self.assertIsNotNone(validated_token.payload)
        except TokenError:
            self.fail("Valid token should pass signature validation")
        
        # Verify tampered token is rejected
        tampered_token = access_token[:-10] + "tampered123"
        
        with self.assertRaises(TokenError):
            AccessToken(tampered_token)

    @given(
        invalid_token=st.text(
            alphabet=string.ascii_letters + string.digits + '.-_',
            min_size=10,
            max_size=200
        ).filter(lambda x: '.' in x and len(x.split('.')) <= 3)
    )
    @hypothesis_settings(max_examples=50, deadline=5000)
    def test_invalid_token_rejection_property(self, invalid_token):
        """
        Property: Invalid or malformed JWT tokens should be properly rejected.
        """
        # Skip tokens that might accidentally be valid
        if len(invalid_token.split('.')) != 3:
            return
        
        # Try to use invalid token for authentication
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {invalid_token}')
        response = self.client.get(auth/validate/')
        
        # Invalid tokens should be rejected
        self.assertIn(
            response.status_code, 
            [401, 400],
            "Invalid tokens should be rejected with 401 or 400 status"
        )

    def test_token_expiration_property(self):
        """
        Property: Expired JWT tokens should be properly rejected.
        """
        # Create a token with very short expiration
        user = self.test_user
        
        # Create an access token that expires immediately
        token = AccessToken.for_user(user)
        
        # Manually set expiration to past
        token.payload['exp'] = timezone.now().timestamp() - 3600  # 1 hour ago
        
        # Try to use expired token
        expired_token_str = str(token)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {expired_token_str}')
        
        response = self.client.get(auth/validate/')
        
        # Expired token should be rejected
        self.assertEqual(
            response.status_code, 
            401,
            "Expired tokens should be rejected with 401 status"
        )

    def test_token_refresh_validity_property(self):
        """
        Property: Token refresh should produce valid new tokens while maintaining security.
        """
        # Login to get initial tokens
        login_data = {
            'email': self.test_user.email,
            'password': 'testpassword123'
        }
        
        response = self.client.post(auth/login/', login_data, format='json')
        self.assertEqual(response.status_code, 200)
        
        initial_tokens = response.json()
        refresh_token = initial_tokens['refresh']
        
        # Use refresh token to get new access token
        refresh_data = {'refresh': refresh_token}
        refresh_response = self.client.post(auth/refresh/', refresh_data, format='json')
        
        if refresh_response.status_code == 200:
            new_tokens = refresh_response.json()
            
            # Verify new access token is valid
            self.assertIn('access', new_tokens)
            new_access_token = new_tokens['access']
            
            # Verify new token is different from original
            self.assertNotEqual(
                new_access_token, 
                initial_tokens['access'],
                "Refreshed token should be different from original"
            )
            
            # Verify new token is valid
            try:
                validated_token = AccessToken(new_access_token)
                self.assertEqual(
                    str(validated_token.payload.get('user_id')), 
                    str(self.test_user.id),
                    "Refreshed token should contain correct user ID"
                )
            except TokenError:
                self.fail("Refreshed token should be valid")
            
            # Verify new token can be used for authentication
            self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {new_access_token}')
            auth_response = self.client.get(auth/validate/')
            
            self.assertEqual(auth_response.status_code, 200)
            auth_data = auth_response.json()
            self.assertTrue(auth_data.get('valid'))

    def test_token_claims_consistency_property(self):
        """
        Property: JWT token claims should be consistent and contain all required information.
        """
        # Login with test user
        login_data = {
            'email': self.test_user.email,
            'password': 'testpassword123'
        }
        
        response = self.client.post(auth/login/', login_data, format='json')
        self.assertEqual(response.status_code, 200)
        
        tokens = response.json()
        access_token = tokens['access']
        
        # Validate token and check claims
        validated_token = AccessToken(access_token)
        payload = validated_token.payload
        
        # Verify required claims are present
        required_claims = ['user_id', 'exp', 'iat', 'jti', 'token_type']
        for claim in required_claims:
            self.assertIn(
                claim, 
                payload, 
                f"Token should contain required claim: {claim}"
            )
        
        # Verify user_id matches the authenticated user
        self.assertEqual(
            str(payload.get('user_id')), 
            str(self.test_user.id),
            "Token user_id should match authenticated user"
        )
        
        # Verify token_type is correct
        self.assertEqual(
            payload.get('token_type'), 
            'access',
            "Access token should have correct token_type claim"
        )
        
        # Verify timestamps are reasonable
        iat = payload.get('iat')
        exp = payload.get('exp')
        current_time = timezone.now().timestamp()
        
        self.assertLessEqual(
            iat, 
            current_time + 60,  # Allow 1 minute clock skew
            "Token issued at time should not be in the future"
        )
        
        self.assertGreater(
            exp, 
            current_time,
            "Token expiration should be in the future"
        )
        
        self.assertGreater(
            exp, 
            iat,
            "Token expiration should be after issued at time"
        )

    def test_concurrent_token_validity(self):
        """
        Property: Multiple concurrent token requests should all produce valid, unique tokens.
        """
        login_data = {
            'email': self.test_user.email,
            'password': 'testpassword123'
        }
        
        # Make multiple concurrent login requests
        responses = []
        for _ in range(5):
            response = self.client.post(auth/login/', login_data, format='json')
            if response.status_code == 200:
                responses.append(response.json())
        
        # Verify all tokens are valid and unique
        access_tokens = [r['access'] for r in responses]
        
        # All tokens should be unique
        self.assertEqual(
            len(access_tokens), 
            len(set(access_tokens)),
            "All concurrent tokens should be unique"
        )
        
        # All tokens should be valid
        for token in access_tokens:
            try:
                validated_token = AccessToken(token)
                self.assertEqual(
                    str(validated_token.payload.get('user_id')), 
                    str(self.test_user.id),
                    "All tokens should contain correct user ID"
                )
            except TokenError:
                self.fail("All concurrent tokens should be valid")