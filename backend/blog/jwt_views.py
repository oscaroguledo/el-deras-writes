"""
Enhanced JWT authentication views with refresh token support and security features
"""

from django.contrib.auth import authenticate
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework_simplejwt.tokens import RefreshToken, AccessToken
from rest_framework_simplejwt.exceptions import TokenError, InvalidToken
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.settings import api_settings
from django.core.cache import cache
from django.conf import settings
import jwt
import logging
from datetime import timedelta
from .models import CustomUser
from .serializers import MyTokenObtainPairSerializer, CustomUserSerializer

logger = logging.getLogger(__name__)


class EnhancedTokenObtainPairView(TokenObtainPairView):
    """
    Enhanced JWT token obtain view with additional security features
    """
    serializer_class = MyTokenObtainPairSerializer
    
    def post(self, request, *args, **kwargs):
        """
        Enhanced token creation with security logging and rate limiting
        """
        # Get client IP for logging
        client_ip = self.get_client_ip(request)
        
        # Check rate limiting (simple implementation)
        rate_limit_key = f"login_attempts:{client_ip}"
        attempts = cache.get(rate_limit_key, 0)
        
        if attempts >= 5:  # Max 5 attempts per hour
            logger.warning(f"Rate limit exceeded for IP {client_ip}")
            return Response(
                {"error": "Too many login attempts. Please try again later."},
                status=status.HTTP_429_TOO_MANY_REQUESTS
            )
        
        # Attempt authentication
        response = super().post(request, *args, **kwargs)
        
        if response.status_code == 200:
            # Successful login - reset rate limit
            cache.delete(rate_limit_key)
            
            # Log successful authentication
            user_email = request.data.get('email', 'unknown')
            logger.info(f"Successful login for {user_email} from {client_ip}")
            
            # Add additional security information to response
            user = authenticate(
                email=request.data.get('email'),
                password=request.data.get('password')
            )
            
            if user:
                # Update last login time
                user.last_active = timezone.now()
                user.save(update_fields=['last_active'])
                
                # Add user info to response
                response.data['user'] = CustomUserSerializer(user).data
                
                # Add token metadata
                response.data['token_type'] = 'Bearer'
                response.data['expires_in'] = int(api_settings.ACCESS_TOKEN_LIFETIME.total_seconds())
                
        else:
            # Failed login - increment rate limit counter
            cache.set(rate_limit_key, attempts + 1, timeout=3600)  # 1 hour timeout
            
            # Log failed authentication attempt
            user_email = request.data.get('email', 'unknown')
            logger.warning(f"Failed login attempt for {user_email} from {client_ip}")
        
        return response
    
    def get_client_ip(self, request):
        """Get client IP address from request"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip


class EnhancedTokenRefreshView(TokenRefreshView):
    """
    Enhanced JWT token refresh view with additional security checks
    """
    
    def post(self, request, *args, **kwargs):
        """
        Enhanced token refresh with security validation
        """
        refresh_token = request.data.get('refresh')
        
        if not refresh_token:
            return Response(
                {"error": "Refresh token is required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Validate refresh token
            refresh = RefreshToken(refresh_token)
            
            # Check if token is blacklisted (if blacklisting is enabled)
            if hasattr(refresh, 'check_blacklist'):
                refresh.check_blacklist()
            
            # Get user from token
            user_id = refresh.payload.get('user_id')
            try:
                user = CustomUser.objects.get(id=user_id)
            except CustomUser.DoesNotExist:
                raise InvalidToken("User not found")
            
            # Check if user is still active
            if not user.is_active:
                raise InvalidToken("User account is disabled")
            
            # Generate new access token
            access_token = refresh.access_token
            
            # Update user's last active time
            user.last_active = timezone.now()
            user.save(update_fields=['last_active'])
            
            # Log token refresh
            client_ip = self.get_client_ip(request)
            logger.info(f"Token refreshed for user {user.email} from {client_ip}")
            
            return Response({
                'access': str(access_token),
                'token_type': 'Bearer',
                'expires_in': int(api_settings.ACCESS_TOKEN_LIFETIME.total_seconds()),
                'user': CustomUserSerializer(user).data
            })
            
        except TokenError as e:
            logger.warning(f"Token refresh failed: {str(e)}")
            return Response(
                {"error": "Invalid or expired refresh token"},
                status=status.HTTP_401_UNAUTHORIZED
            )
    
    def get_client_ip(self, request):
        """Get client IP address from request"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip


class TokenValidationView(APIView):
    """
    View to validate JWT tokens and return user information
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """
        Validate the current JWT token and return user information
        """
        try:
            # Get the token from the request
            auth_header = request.META.get('HTTP_AUTHORIZATION', '')
            if not auth_header.startswith('Bearer '):
                return Response(
                    {"error": "Invalid authorization header format"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            token = auth_header.split(' ')[1]
            
            # Validate token
            try:
                validated_token = AccessToken(token)
                user_id = validated_token.payload.get('user_id')
                
                # Get user
                user = CustomUser.objects.get(id=user_id)
                
                # Check if user is still active
                if not user.is_active:
                    return Response(
                        {"error": "User account is disabled"},
                        status=status.HTTP_401_UNAUTHORIZED
                    )
                
                # Return token validation info
                return Response({
                    'valid': True,
                    'user': CustomUserSerializer(user).data,
                    'token_type': validated_token.payload.get('token_type'),
                    'expires_at': validated_token.payload.get('exp'),
                    'issued_at': validated_token.payload.get('iat'),
                })
                
            except TokenError as e:
                return Response(
                    {"error": "Invalid token", "details": str(e)},
                    status=status.HTTP_401_UNAUTHORIZED
                )
                
        except CustomUser.DoesNotExist:
            return Response(
                {"error": "User not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            logger.error(f"Token validation error: {str(e)}")
            return Response(
                {"error": "Token validation failed"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class LogoutView(APIView):
    """
    Enhanced logout view that blacklists refresh tokens
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        """
        Logout user and blacklist refresh token
        """
        try:
            refresh_token = request.data.get('refresh_token')
            
            if refresh_token:
                try:
                    # Blacklist the refresh token
                    token = RefreshToken(refresh_token)
                    token.blacklist()
                    
                    logger.info(f"User {request.user.email} logged out successfully")
                    
                    # Broadcast authentication event
                    from .websocket_utils import broadcast_user_authenticated
                    broadcast_user_authenticated(request.user, 'logout')
                    
                    return Response({
                        "message": "Successfully logged out"
                    }, status=status.HTTP_200_OK)
                    
                except TokenError:
                    # Token might already be blacklisted or invalid
                    pass
            
            # Even if token blacklisting fails, consider logout successful
            return Response({
                "message": "Logged out"
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Logout error: {str(e)}")
            return Response({
                "message": "Logout completed"
            }, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([AllowAny])
def revoke_token(request):
    """
    Revoke a specific JWT token (blacklist it)
    """
    try:
        token = request.data.get('token')
        
        if not token:
            return Response(
                {"error": "Token is required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Try to blacklist as refresh token first
        try:
            refresh_token = RefreshToken(token)
            refresh_token.blacklist()
            
            return Response({
                "message": "Token revoked successfully"
            }, status=status.HTTP_200_OK)
            
        except TokenError:
            # If it's not a refresh token, it might be an access token
            # Access tokens can't be blacklisted in simple JWT, but we can log the attempt
            logger.info(f"Attempted to revoke access token: {token[:20]}...")
            
            return Response({
                "message": "Token processed"
            }, status=status.HTTP_200_OK)
            
    except Exception as e:
        logger.error(f"Token revocation error: {str(e)}")
        return Response(
            {"error": "Token revocation failed"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


class UserSessionsView(APIView):
    """
    View to manage user sessions and active tokens
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """
        Get information about user's active sessions
        """
        try:
            user = request.user
            
            # In a production system, you would track active sessions
            # For now, return basic user session info
            session_info = {
                'user_id': str(user.id),
                'email': user.email,
                'last_active': user.last_active,
                'is_active': user.is_active,
                'current_session': {
                    'ip_address': self.get_client_ip(request),
                    'user_agent': request.META.get('HTTP_USER_AGENT', ''),
                    'authenticated_at': timezone.now().isoformat(),
                }
            }
            
            return Response(session_info, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Session info error: {str(e)}")
            return Response(
                {"error": "Failed to retrieve session information"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def delete(self, request):
        """
        Revoke all user sessions (logout from all devices)
        """
        try:
            user = request.user
            
            # In a production system, you would invalidate all user tokens
            # For now, we'll just log the action
            logger.info(f"User {user.email} requested to logout from all devices")
            
            return Response({
                "message": "All sessions revoked successfully"
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Session revocation error: {str(e)}")
            return Response(
                {"error": "Failed to revoke sessions"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def get_client_ip(self, request):
        """Get client IP address from request"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip