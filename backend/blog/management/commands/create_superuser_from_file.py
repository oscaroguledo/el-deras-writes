import os
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model

class Command(BaseCommand):
    help = 'Creates a superuser using credentials from user.txt'

    def handle(self, *args, **options):
        User = get_user_model()
        user_file_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), '../../../../user.txt')

        if not os.path.exists(user_file_path):
            self.stdout.write(self.style.ERROR(f"user.txt not found at {user_file_path}"))
            return

        with open(user_file_path, 'r') as f:
            lines = f.readlines()
            if len(lines) < 2:
                self.stdout.write(self.style.ERROR("user.txt must contain at least two lines: email and password."))
                return
            email = lines[0].strip()
            password = lines[1].strip()
            username = email.split('@')[0] # Derive username from email

        if User.objects.filter(email=email).exists():
            self.stdout.write(self.style.WARNING(f"Superuser with email '{email}' already exists. Skipping creation."))
            return

        try:
            User.objects.create_superuser(email=email, username=username, password=password)
            self.stdout.write(self.style.SUCCESS(f"Successfully created superuser: {username} ({email})"))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"Error creating superuser: {e}"))
