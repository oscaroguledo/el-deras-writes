from django.contrib.auth import get_user_model

User = get_user_model()


def custom_user_authentication_rule(user):
    """
    Custom authentication rule for JWT tokens.
    Returns True if the user is active and can authenticate.
    """
    return user is not None and user.is_active