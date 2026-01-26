from django.core.management.base import BaseCommand
from blog.models import CustomUser


class Command(BaseCommand):
    help = 'Create a superuser for the blog'

    def handle(self, *args, **options):
        # Check if admin user already exists
        if CustomUser.objects.filter(email='admin@gmail.com').exists():
            admin_user = CustomUser.objects.get(email='admin@gmail.com')
            # Update the existing user to ensure it's a superuser
            admin_user.is_staff = True
            admin_user.is_superuser = True
            admin_user.is_active = True
            admin_user.user_type = 'admin'
            admin_user.set_password('admin')
            admin_user.save()
            self.stdout.write(
                self.style.SUCCESS('Admin user updated successfully!')
            )
        else:
            # Create new admin user
            admin_user = CustomUser.objects.create_user(
                username='admin',
                email='admin@gmail.com',
                password='admin',
                first_name='Admin',
                last_name='User',
                user_type='admin',
                is_staff=True,
                is_superuser=True,
                is_active=True,
            )
            self.stdout.write(
                self.style.SUCCESS('Admin user created successfully!')
            )
        
        self.stdout.write(
            self.style.SUCCESS('Admin credentials: admin@gmail.com / admin')
        )