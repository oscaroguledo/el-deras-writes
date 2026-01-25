from django.contrib.auth.backends import BaseBackend
from django.contrib.auth import get_user_model
from django.contrib.auth.hashers import check_password

User = get_user_model()


class CustomUserBackend(BaseBackend):
    """
    Custom authentication backend for CustomUser model.
    Authenticates using email instead of username.
    """
    
    def authenticate(self, request, email=None, password=None, **kwargs):
        """
        Authenticate user with email and password.
        """
        if email is None or password is None:
            return None
            
        try:
            user = User.objects.get(email=email)
            if user.check_password(password) and user.is_active:
                return user
        except User.DoesNotExist:
            return None
        
        return None
    
    def get_user(self, user_id):
        """
        Get user by ID.
        """
        try:
            return User.objects.get(pk=user_id)
        except User.DoesNotExist:
            return None