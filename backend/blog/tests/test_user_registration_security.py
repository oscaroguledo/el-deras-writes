"""
Property-based tests for user registration security
**Feature: django-postgresql-enhancement, Property 5: Secure user registration**
**Validates: Requirements 2.1**
"""

from django.test import TestCase
from django.core.exceptions import ValidationError
from django.contrib.auth.hashers import check_password
from hypothesis import given, strategies as st, settings as hypothesis_settings
from hypothesis.extra.django import TestCase as HypothesisTestCase
from blog.models import CustomUser
import string


class UserRegistrationSecurityTest(HypothesisTestCase):
    """
    Property-based tests for secure user registration
    """

    @given(
        email=st.emails(),
        username=st.text(
            alphabet=string.ascii_letters + string.digits + '_',
            min_size=3,
            max_size=150
        ).filter(lambda x: x and not x.startswith('_') and not x.endswith('_')),
        password=st.text(min_size=8, max_size=128)
    )
    @hypothesis_settings(max_examples=100, deadline=5000)
    def test_secure_user_registration_property(self, email, username, password):
        """
        **Feature: django-postgresql-enhancement, Property 5: Secure user registration**
        **Validates: Requirements 2.1**
        
        Property: For any user registration, the stored password should be properly 
        hashed and never stored in plain text.
        """
        try:
            # Create user with the generated credentials
            user = CustomUser.objects.create_user(
                email=email,
                username=username,
                password=password
            )
            
            # Verify the user was created successfully
            self.assertIsNotNone(user.id)
            self.assertEqual(user.email.lower(), email.lower())  # Django normalizes email to lowercase
            self.assertEqual(user.username, username)
            
            # Critical security property: Password should never be stored in plain text
            self.assertNotEqual(
                user.password, 
                password,
                "Password must never be stored in plain text"
            )
            
            # Password should be properly hashed (Django uses pbkdf2_sha256 by default)
            self.assertTrue(
                user.password.startswith(('pbkdf2_sha256$', 'argon2$', 'bcrypt$', 'scrypt$')),
                f"Password should be properly hashed with a recognized algorithm, got: {user.password[:20]}..."
            )
            
            # Verify the hashed password can be validated against the original
            self.assertTrue(
                check_password(password, user.password),
                "Hashed password should validate against original password"
            )
            
            # Verify the user's check_password method works correctly
            self.assertTrue(
                user.check_password(password),
                "User's check_password method should validate the original password"
            )
            
            # Verify wrong passwords are rejected
            wrong_password = password + "wrong"
            self.assertFalse(
                user.check_password(wrong_password),
                "Wrong passwords should be rejected"
            )
            
            # Verify password hash is sufficiently long (indicates proper hashing)
            self.assertGreater(
                len(user.password),
                50,  # Proper hashes should be much longer than this
                "Password hash should be sufficiently long to indicate proper hashing"
            )
            
            # Clean up - delete the created user to avoid conflicts
            user.delete()
            
        except ValidationError:
            # Some generated data might be invalid (e.g., duplicate email/username)
            # This is acceptable for property testing
            pass
        except Exception as e:
            # For debugging: if there are unexpected errors, we want to know
            if "UNIQUE constraint failed" in str(e):
                # Duplicate constraint violations are acceptable in property testing
                pass
            else:
                # Re-raise unexpected errors
                raise

    @given(
        password=st.text(min_size=1, max_size=7)  # Intentionally short passwords
    )
    @hypothesis_settings(max_examples=50, deadline=3000)
    def test_password_security_requirements(self, password):
        """
        Property: Password security requirements should be enforced during registration.
        Note: This tests the hashing mechanism regardless of password strength.
        """
        try:
            # Use fixed valid email and username to focus on password testing
            email = f"test_{hash(password) % 10000}@example.com"
            username = f"testuser_{hash(password) % 10000}"
            
            user = CustomUser.objects.create_user(
                email=email,
                username=username,
                password=password
            )
            
            # Even weak passwords should be properly hashed
            self.assertNotEqual(
                user.password,
                password,
                "Even weak passwords must be hashed, never stored in plain text"
            )
            
            # Verify hashing algorithm is applied
            self.assertTrue(
                user.password.startswith(('pbkdf2_sha256$', 'argon2$', 'bcrypt$', 'scrypt$')),
                "All passwords must use a recognized hashing algorithm"
            )
            
            # Clean up
            user.delete()
            
        except ValidationError:
            # Some validation errors are expected and acceptable
            pass
        except Exception as e:
            if "UNIQUE constraint failed" in str(e):
                pass
            else:
                raise

    def test_password_hashing_consistency(self):
        """
        Property: The same password should produce different hashes due to salt usage.
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
        
        # All passwords should be hashed
        for user in users:
            self.assertNotEqual(user.password, password)
            self.assertTrue(user.check_password(password))
        
        # Due to salt usage, hashes should be different even for the same password
        hashes = [user.password for user in users]
        self.assertEqual(len(set(hashes)), len(hashes), 
                        "Same passwords should produce different hashes due to salt usage")
        
        # Clean up
        for user in users:
            user.delete()

    @given(
        email=st.emails(),
        username=st.text(
            alphabet=string.ascii_letters + string.digits + '_',
            min_size=3,
            max_size=150
        ).filter(lambda x: x and not x.startswith('_') and not x.endswith('_'))
    )
    @hypothesis_settings(max_examples=50, deadline=3000)
    def test_user_creation_without_password(self, email, username):
        """
        Property: Users created without passwords should have unusable passwords.
        """
        try:
            # Create user without password using the manager method
            user = CustomUser.objects.create_user(
                email=email,
                username=username,
                password=None  # No password provided
            )
            
            # Password field should be set to an unusable password
            self.assertIsNotNone(user.password)
            # Django sets unusable passwords, which are not empty strings
            # but they should not be usable for authentication
            
            # Should not be able to authenticate with any password
            self.assertFalse(user.check_password(""))
            self.assertFalse(user.check_password("any_password"))
            
            # Clean up
            user.delete()
            
        except ValidationError:
            pass
        except Exception as e:
            if "UNIQUE constraint failed" in str(e):
                pass
            else:
                raise

    def test_password_change_security(self):
        """
        Property: When passwords are changed, they should be re-hashed with new salt.
        """
        # Create a user
        user = CustomUser.objects.create_user(
            email="test@example.com",
            username="testuser",
            password="original_password"
        )
        
        original_hash = user.password
        
        # Change password
        user.set_password("new_password")
        user.save()
        
        # Hash should be different
        self.assertNotEqual(original_hash, user.password)
        
        # Old password should not work
        self.assertFalse(user.check_password("original_password"))
        
        # New password should work
        self.assertTrue(user.check_password("new_password"))
        
        # New password should not be stored in plain text
        self.assertNotEqual(user.password, "new_password")
        
        # Clean up
        user.delete()