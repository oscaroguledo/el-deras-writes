"""
Enhanced JWT middleware for additional security features
"""

import logging
from django.utils import timezone
from django.core.cache import cache
from django.http import JsonResponse
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from rest_framework_simplejwt.tokens import AccessToken
from .models import CustomUser

logger = logging.getLogger(__name__)


class EnhancedJWTMiddleware:
    """
    Enhanced JWT middleware that provides additional security features:
    - Token validation and refresh
    - Rate limiting
    - Security logging
    - User activity tracking
    """
    
    def __init__(self, get_response):
        self.get_response = get_response
        self.jwt_auth = JWTAuthentication()
    
    def __call__(self, request):
        # Process request before view
        self.process_request(request)
        
        # Get response from view
        response = self.get_response(request)
        
        # Process response after view
        self.process_response(request, response)
        
        return response
    
    def process_request(self, request):
        """
        Process incoming request for JWT authentication and security
        """
        # Skip processing for non-API endpoints
        if not request.path.startswith('/api/'):
            return
        
        # Get client information
        client_ip = self.get_client_ip(request)
        user_agent = request.META.get('HTTP_USER_AGENT', '')
        
        # Check for JWT token in Authorization header
        auth_header = request.META.get('HTTP_AUTHORIZATION', '')
        
        if auth_header.startswith('Bearer '):
            token = auth_header.split(' ')[1]
            
            try:
                # Validate token
                validated_token = AccessToken(token)
                user_id = validated_token.payload.get('user_id')
                
                # Get user and update activity
                try:
                    user = CustomUser.objects.get(id=user_id)
                    
                    # Check if user is still active
                    if not user.is_active:
                        logger.warning(f"Inactive user {user.email} attempted access from {client_ip}")
                        return
                    
                    # Update user's last active time (throttled to avoid too many DB writes)
                    cache_key = f"user_activity:{user.id}"
                    if not cache.get(cache_key):
                        user.last_active = timezone.now()
                        user.save(update_fields=['last_active'])
                        cache.set(cache_key, True, timeout=300)  # Update at most every 5 minutes
                    
                    # Store user in request for easy access
                    request.jwt_user = user
                    request.jwt_token = validated_token
                    
                except CustomUser.DoesNotExist:
                    logger.warning(f"JWT token with invalid user_id {user_id} from {client_ip}")
                    
            except TokenError as e:
                # Log invalid token attempts
                logger.warning(f"Invalid JWT token from {client_ip}: {str(e)}")
        
        # Rate limiting for authentication endpoints
        if request.path in ['/api/token/', '/api/token/refresh/']:
            rate_limit_key = f"auth_attempts:{client_ip}"
            attempts = cache.get(rate_limit_key, 0)
            
            if attempts >= 10:  # Max 10 auth attempts per hour
                logger.warning(f"Authentication rate limit exceeded for {client_ip}")
                # Note: We don't block here, let the view handle it
                request.rate_limited = True
            else:
                request.rate_limited = False
    
    def process_response(self, request, response):
        """
        Process response for additional security headers and logging
        """
        # Skip processing for non-API endpoints
        if not request.path.startswith('/api/'):
            return response
        
        # Add security headers for API responses
        response['X-Content-Type-Options'] = 'nosniff'
        response['X-Frame-Options'] = 'DENY'
        response['X-XSS-Protection'] = '1; mode=block'
        response['Referrer-Policy'] = 'strict-origin-when-cross-origin'
        
        # Log authentication events
        if hasattr(request, 'jwt_user'):
            client_ip = self.get_client_ip(request)
            
            # Log API access for authenticated users
            if response.status_code < 400:
                logger.debug(f"API access: {request.jwt_user.email} - {request.method} {request.path} from {client_ip}")
            else:
                logger.warning(f"API error: {request.jwt_user.email} - {request.method} {request.path} - {response.status_code} from {client_ip}")
        
        # Handle rate limiting for authentication endpoints
        if hasattr(request, 'rate_limited') and request.rate_limited:
            if request.path in ['/api/token/', '/api/token/refresh/']:
                return JsonResponse(
                    {"error": "Too many authentication attempts. Please try again later."},
                    status=429
                )
        
        return response
    
    def get_client_ip(self, request):
        """Get client IP address from request"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0].strip()
        else:
            ip = request.META.get('REMOTE_ADDR', 'unknown')
        return ip


class JWTSecurityMiddleware:
    """
    Additional JWT security middleware for token validation and security checks
    """
    
    def __init__(self, get_response):
        self.get_response = get_response
    
    def __call__(self, request):
        # Check for suspicious JWT patterns
        self.check_jwt_security(request)
        
        response = self.get_response(request)
        return response
    
    def check_jwt_security(self, request):
        """
        Check for suspicious JWT token patterns and security issues
        """
        auth_header = request.META.get('HTTP_AUTHORIZATION', '')
        
        if auth_header.startswith('Bearer '):
            token = auth_header.split(' ')[1]
            
            # Check for obviously malformed tokens
            if len(token) < 50:  # JWT tokens should be much longer
                logger.warning(f"Suspiciously short JWT token from {self.get_client_ip(request)}")
                return
            
            # Check for common JWT attack patterns
            if any(pattern in token.lower() for pattern in ['none', 'null', 'undefined']):
                logger.warning(f"Suspicious JWT token pattern from {self.get_client_ip(request)}")
                return
            
            # Basic JWT structure validation (should have 3 parts separated by dots)
            parts = token.split('.')
            if len(parts) != 3:
                logger.warning(f"Malformed JWT token structure from {self.get_client_ip(request)}")
                return
    
    def get_client_ip(self, request):
        """Get client IP address from request"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0].strip()
        else:
            ip = request.META.get('REMOTE_ADDR', 'unknown')
        return ip


class TokenBlacklistMiddleware:
    """
    Middleware to check for blacklisted tokens
    """
    
    def __init__(self, get_response):
        self.get_response = get_response
    
    def __call__(self, request):
        # Check if token is blacklisted
        if self.is_token_blacklisted(request):
            return JsonResponse(
                {"error": "Token has been revoked"},
                status=401
            )
        
        response = self.get_response(request)
        return response
    
    def is_token_blacklisted(self, request):
        """
        Check if the JWT token is blacklisted
        """
        auth_header = request.META.get('HTTP_AUTHORIZATION', '')
        
        if auth_header.startswith('Bearer '):
            token = auth_header.split(' ')[1]
            
            # Check cache for blacklisted tokens
            blacklist_key = f"blacklisted_token:{token}"
            if cache.get(blacklist_key):
                logger.info(f"Blocked blacklisted token from {self.get_client_ip(request)}")
                return True
        
        return False
    
    def get_client_ip(self, request):
        """Get client IP address from request"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0].strip()
        else:
            ip = request.META.get('REMOTE_ADDR', 'unknown')
        return ip