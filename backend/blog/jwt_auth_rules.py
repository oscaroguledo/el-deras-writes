from django.contrib.auth import authenticate

def custom_user_authentication_rule(user):
    # This rule is used by Simple JWT to determine if a user is allowed to obtain a token.
    # We simply check if the user is active.
    return user.is_active
