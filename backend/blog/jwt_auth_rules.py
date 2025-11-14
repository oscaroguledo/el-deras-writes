from django.contrib.auth import authenticate

def custom_user_authentication_rule(user):
    # This rule is used by Simple JWT to determine if a user is allowed to obtain a token.
    # We simply check if the user is not None and is active.
    return user is not None and user.is_active
