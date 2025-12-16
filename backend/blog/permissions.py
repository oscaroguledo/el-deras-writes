from rest_framework import permissions
from django.utils import timezone
from django.core.cache import cache
import logging

logger = logging.getLogger(__name__)


class IsAdminUser(permissions.BasePermission):
    """
    Allows access only to admin users.
    """
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and (request.user.is_staff or request.user.is_superuser)


class IsAdminOrReadOnly(permissions.BasePermission):
    """
    The request is authenticated as an admin user, or is a read-only request.
    """
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user and request.user.is_authenticated and (request.user.is_staff or request.user.is_superuser)


class IsAuthorOrAdmin(permissions.BasePermission):
    """
    Custom permission to only allow owners of an object or admin users to edit it.
    """
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        return (request.user and request.user.is_authenticated and (request.user.is_staff or request.user.is_superuser)) or \
               (obj.author == request.user)


class EnhancedIsAuthenticated(permissions.BasePermission):
    """
    Enhanced authentication permission with additional security checks
    """
    
    def has_permission(self, request, view):
        # Check basic authentication
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Check if user account is active
        if not request.user.is_active:
            logger.warning(f"Inactive user {request.user.email} attempted access")
            return False
        
        # Check for suspicious activity (rate limiting)
        user_id = str(request.user.id)
        rate_limit_key = f"user_requests:{user_id}"
        requests_count = cache.get(rate_limit_key, 0)
        
        # Allow up to 1000 requests per hour per user
        if requests_count > 1000:
            logger.warning(f"Rate limit exceeded for user {request.user.email}")
            return False
        
        # Increment request counter
        cache.set(rate_limit_key, requests_count + 1, timeout=3600)
        
        return True


class RoleBasedPermission(permissions.BasePermission):
    """
    Role-based permission system with granular access control
    """
    
    # Define role hierarchy
    ROLE_HIERARCHY = {
        'guest': 0,
        'normal': 1,
        'admin': 2,
    }
    
    # Define required roles for different actions
    ACTION_ROLES = {
        'list': 'guest',
        'retrieve': 'guest',
        'create': 'normal',
        'update': 'normal',
        'partial_update': 'normal',
        'destroy': 'admin',
    }
    
    def has_permission(self, request, view):
        # Get the action being performed
        action = getattr(view, 'action', None)
        
        # If no specific action, check HTTP method
        if not action:
            if request.method in permissions.SAFE_METHODS:
                action = 'retrieve'
            elif request.method == 'POST':
                action = 'create'
            elif request.method in ['PUT', 'PATCH']:
                action = 'update'
            elif request.method == 'DELETE':
                action = 'destroy'
        
        # Get required role for this action
        required_role = self.ACTION_ROLES.get(action, 'admin')
        
        # Check if user meets role requirement
        return self.user_has_role(request.user, required_role)
    
    def has_object_permission(self, request, view, obj):
        # For object-level permissions, check if user is owner or has sufficient role
        if hasattr(obj, 'author') and obj.author == request.user:
            return True
        
        # Otherwise, check role-based permission
        return self.has_permission(request, view)
    
    def user_has_role(self, user, required_role):
        """Check if user has the required role or higher"""
        if not user or not user.is_authenticated:
            user_role = 'guest'
        else:
            user_role = getattr(user, 'user_type', 'guest')
        
        user_level = self.ROLE_HIERARCHY.get(user_role, 0)
        required_level = self.ROLE_HIERARCHY.get(required_role, 0)
        
        return user_level >= required_level


class AdminOnlyPermission(permissions.BasePermission):
    """
    Permission that only allows admin users
    """
    
    def has_permission(self, request, view):
        return (
            request.user and 
            request.user.is_authenticated and 
            request.user.user_type == 'admin' and
            request.user.is_active
        )


class OwnerOrAdminPermission(permissions.BasePermission):
    """
    Permission that allows owners of objects or admin users
    """
    
    def has_permission(self, request, view):
        # Basic authentication check
        return request.user and request.user.is_authenticated and request.user.is_active
    
    def has_object_permission(self, request, view, obj):
        # Check if user is the owner of the object
        if hasattr(obj, 'author') and obj.author == request.user:
            return True
        
        if hasattr(obj, 'user') and obj.user == request.user:
            return True
        
        if hasattr(obj, 'owner') and obj.owner == request.user:
            return True
        
        # Check if user is admin
        return request.user.user_type == 'admin'


class ContentModerationPermission(permissions.BasePermission):
    """
    Permission for content moderation actions
    """
    
    def has_permission(self, request, view):
        # Only authenticated users can moderate
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Check if user has moderation privileges
        return (
            request.user.user_type == 'admin' or
            getattr(request.user, 'can_moderate', False)
        )
    
    def has_object_permission(self, request, view, obj):
        # Admins can moderate any content
        if request.user.user_type == 'admin':
            return True
        
        # Authors can moderate their own content
        if hasattr(obj, 'author') and obj.author == request.user:
            return True
        
        return False


class SecureAPIPermission(permissions.BasePermission):
    """
    Enhanced API permission with security checks
    """
    
    def has_permission(self, request, view):
        # Check basic authentication
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Check user account status
        if not request.user.is_active:
            return False
        
        # Check for JWT token validity (if available)
        if hasattr(request, 'jwt_token'):
            # Token is already validated by middleware
            return True
        
        # Check session-based authentication
        if request.user.is_authenticated:
            return True
        
        return False