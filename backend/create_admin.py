#!/usr/bin/env python
"""
Simple script to create or update admin user
Run this on Render if the admin login isn't working
"""
import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'blog_project.settings')
django.setup()

from blog.models import CustomUser

def create_admin():
    try:
        # Check if admin user exists
        if CustomUser.objects.filter(email='admin@gmail.com').exists():
            admin_user = CustomUser.objects.get(email='admin@gmail.com')
            print("Admin user found, updating...")
        else:
            print("Creating new admin user...")
            admin_user = CustomUser(
                username='admin',
                email='admin@gmail.com',
                first_name='Admin',
                last_name='User'
            )
        
        # Set all required fields
        admin_user.is_staff = True
        admin_user.is_superuser = True
        admin_user.is_active = True
        admin_user.user_type = 'admin'
        admin_user.set_password('admin')
        admin_user.save()
        
        print("✅ Admin user created/updated successfully!")
        print("📧 Email: admin@gmail.com")
        print("🔑 Password: admin")
        print("🔗 Admin URL: /admin/")
        
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    create_admin()