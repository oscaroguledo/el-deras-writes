#!/usr/bin/env bash
# exit on error
set -o errexit

# Updated: 2025-01-26 - API URLs changed from /api/ to /
# Install dependencies
pip install -r requirements.txt

# Run database migrations
python manage.py migrate

# Create superuser
python manage.py create_superuser

# Collect static files
python manage.py collectstatic --no-input