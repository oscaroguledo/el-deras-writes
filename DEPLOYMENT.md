# Deployment Guide - Django + PostgreSQL Blog System

## Overview

This guide provides comprehensive instructions for deploying the Django + PostgreSQL blog system to production environments.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Configuration](#environment-configuration)
3. [Database Setup](#database-setup)
4. [Application Deployment](#application-deployment)
5. [Docker Deployment](#docker-deployment)
6. [Security Checklist](#security-checklist)
7. [Monitoring and Maintenance](#monitoring-and-maintenance)
8. [Troubleshooting](#troubleshooting)

## Prerequisites

### System Requirements

- **Operating System**: Linux (Ubuntu 20.04+ recommended) or macOS
- **Python**: 3.10 or higher
- **PostgreSQL**: 15 or higher
- **Node.js**: 18 or higher (for frontend)
- **Docker**: 24.0+ and Docker Compose 2.0+ (for containerized deployment)
- **Memory**: Minimum 2GB RAM (4GB+ recommended)
- **Storage**: Minimum 10GB available space

### Required Software

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install python3 python3-pip python3-venv postgresql postgresql-contrib nginx

# macOS
brew install python postgresql nginx
```

## Environment Configuration

### 1. Environment Variables

Create a `.env.production` file in the project root:

```bash
# Django Settings
DEBUG=0
SECRET_KEY=your-super-secret-key-change-this-in-production
ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com

# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/elderasblog
POSTGRES_PASSWORD=your-secure-database-password

# JWT Configuration
JWT_SECRET_KEY=your-jwt-secret-key-change-this

# CORS Settings
CORS_ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# Cache Configuration
CACHE_KEY_PREFIX=blog_prod

# File Upload Settings
MEDIA_ROOT=/var/www/media
STATIC_ROOT=/var/www/static

# Email Configuration (optional)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=1
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-email-password

# Monitoring (optional)
SENTRY_DSN=your-sentry-dsn
```

### 2. Generate Secret Keys

```bash
# Generate Django SECRET_KEY
python -c 'from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())'

# Generate JWT secret
python -c 'import secrets; print(secrets.token_urlsafe(50))'
```

## Database Setup

### 1. PostgreSQL Installation and Configuration

```bash
# Install PostgreSQL
sudo apt install postgresql postgresql-contrib

# Start PostgreSQL service
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create database and user
sudo -u postgres psql
```

```sql
-- In PostgreSQL shell
CREATE DATABASE elderasblog;
CREATE USER bloguser WITH PASSWORD 'your-secure-password';
ALTER ROLE bloguser SET client_encoding TO 'utf8';
ALTER ROLE bloguser SET default_transaction_isolation TO 'read committed';
ALTER ROLE bloguser SET timezone TO 'UTC';
GRANT ALL PRIVILEGES ON DATABASE elderasblog TO bloguser;
\q
```

### 2. Database Migration

```bash
# Activate virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r backend/requirements.txt

# Run migrations
cd backend
python manage.py migrate

# Create cache tables
python manage.py createcachetable cache_table
python manage.py createcachetable api_cache_table
python manage.py createcachetable session_cache_table
python manage.py createcachetable template_cache_table

# Create superuser
python manage.py createsuperuser

# Collect static files
python manage.py collectstatic --noinput
```

### 3. SQLite to PostgreSQL Migration (if applicable)

```bash
# Backup SQLite database
cp backend/db.sqlite3 backend/db.sqlite3.backup

# Run migration command
python manage.py migrate_to_postgresql --verify

# Verify migration
python manage.py verify_migration
```

## Application Deployment

### Option 1: Traditional Deployment with Gunicorn

#### 1. Install Gunicorn

```bash
pip install gunicorn
```

#### 2. Create Gunicorn Configuration

Create `backend/gunicorn_config.py`:

```python
import multiprocessing

bind = "0.0.0.0:8000"
workers = multiprocessing.cpu_count() * 2 + 1
worker_class = "sync"
worker_connections = 1000
max_requests = 1000
max_requests_jitter = 50
timeout = 30
keepalive = 2
errorlog = "/var/log/gunicorn/error.log"
accesslog = "/var/log/gunicorn/access.log"
loglevel = "info"
```

#### 3. Create Systemd Service

Create `/etc/systemd/system/blog-backend.service`:

```ini
[Unit]
Description=Django Blog Backend
After=network.target postgresql.service

[Service]
Type=notify
User=www-data
Group=www-data
WorkingDirectory=/var/www/blog/backend
Environment="PATH=/var/www/blog/venv/bin"
Environment="DATABASE_URL=postgresql://bloguser:password@localhost:5432/elderasblog"
ExecStart=/var/www/blog/venv/bin/gunicorn blog_project.wsgi:application -c gunicorn_config.py
ExecReload=/bin/kill -s HUP $MAINPID
KillMode=mixed
TimeoutStopSec=5
PrivateTmp=true

[Install]
WantedBy=multi-user.target
```

#### 4. Start Service

```bash
sudo systemctl daemon-reload
sudo systemctl start blog-backend
sudo systemctl enable blog-backend
sudo systemctl status blog-backend
```

### Option 2: Nginx Configuration

Create `/etc/nginx/sites-available/blog`:

```nginx
upstream django_backend {
    server 127.0.0.1:8000;
}

server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;
    
    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    
    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    
    # Static files
    location /static/ {
        alias /var/www/static/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
    
    # Media files
    location /media/ {
        alias /var/www/media/;
        expires 7d;
        add_header Cache-Control "public";
    }
    
    # API endpoints
    location /api/ {
        proxy_pass http://django_backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_redirect off;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # Admin interface
    location /admin/ {
        proxy_pass http://django_backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Frontend
    location / {
        root /var/www/frontend/dist;
        try_files $uri $uri/ /index.html;
    }
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json;
}
```

Enable the site:

```bash
sudo ln -s /etc/nginx/sites-available/blog /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## Docker Deployment

### 1. Production Docker Compose

Use the provided `docker-compose.prod.yml`:

```bash
# Build and start containers
docker-compose -f docker-compose.prod.yml up -d --build

# Run migrations
docker-compose -f docker-compose.prod.yml exec backend python manage.py migrate

# Create cache tables
docker-compose -f docker-compose.prod.yml exec backend python manage.py createcachetable cache_table
docker-compose -f docker-compose.prod.yml exec backend python manage.py createcachetable api_cache_table
docker-compose -f docker-compose.prod.yml exec backend python manage.py createcachetable session_cache_table
docker-compose -f docker-compose.prod.yml exec backend python manage.py createcachetable template_cache_table

# Create superuser
docker-compose -f docker-compose.prod.yml exec backend python manage.py createsuperuser

# Collect static files
docker-compose -f docker-compose.prod.yml exec backend python manage.py collectstatic --noinput
```

### 2. Docker Health Checks

Monitor container health:

```bash
# Check container status
docker-compose -f docker-compose.prod.yml ps

# View logs
docker-compose -f docker-compose.prod.yml logs -f backend
docker-compose -f docker-compose.prod.yml logs -f db

# Check database health
docker-compose -f docker-compose.prod.yml exec db pg_isready -U postgres
```

## Security Checklist

### Pre-Deployment Security

- [ ] Change `SECRET_KEY` to a strong, unique value
- [ ] Set `DEBUG=0` in production
- [ ] Configure `ALLOWED_HOSTS` with your domain
- [ ] Use strong database passwords
- [ ] Enable HTTPS/SSL certificates
- [ ] Configure CORS properly
- [ ] Set up firewall rules (UFW/iptables)
- [ ] Enable PostgreSQL authentication
- [ ] Restrict database access to localhost
- [ ] Set up regular database backups
- [ ] Configure rate limiting
- [ ] Enable security headers
- [ ] Set up monitoring and logging
- [ ] Review and update dependencies

### SSL/TLS Configuration

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Obtain SSL certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renewal
sudo certbot renew --dry-run
```

### Firewall Configuration

```bash
# Enable UFW
sudo ufw enable

# Allow SSH
sudo ufw allow 22/tcp

# Allow HTTP/HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Allow PostgreSQL (only from localhost)
sudo ufw allow from 127.0.0.1 to any port 5432

# Check status
sudo ufw status
```

## Monitoring and Maintenance

### 1. Database Backups

Create backup script `/usr/local/bin/backup-blog-db.sh`:

```bash
#!/bin/bash
BACKUP_DIR="/var/backups/blog"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/blog_backup_$DATE.sql"

mkdir -p $BACKUP_DIR

# Backup database
pg_dump -U bloguser elderasblog > $BACKUP_FILE

# Compress backup
gzip $BACKUP_FILE

# Remove backups older than 30 days
find $BACKUP_DIR -name "*.sql.gz" -mtime +30 -delete

echo "Backup completed: ${BACKUP_FILE}.gz"
```

Schedule with cron:

```bash
# Edit crontab
sudo crontab -e

# Add daily backup at 2 AM
0 2 * * * /usr/local/bin/backup-blog-db.sh
```

### 2. Log Rotation

Create `/etc/logrotate.d/blog`:

```
/var/log/gunicorn/*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 www-data www-data
    sharedscripts
    postrotate
        systemctl reload blog-backend
    endscript
}

/var/www/blog/backend/logs/*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 www-data www-data
}
```

### 3. Performance Monitoring

```bash
# Monitor database performance
docker-compose -f docker-compose.prod.yml exec db psql -U postgres -d elderasblog -c "SELECT * FROM pg_stat_activity;"

# Monitor application logs
tail -f /var/log/gunicorn/access.log
tail -f /var/www/blog/backend/logs/django.log

# Monitor system resources
htop
df -h
free -m
```

### 4. Database Maintenance

```bash
# Vacuum database
docker-compose -f docker-compose.prod.yml exec db psql -U postgres -d elderasblog -c "VACUUM ANALYZE;"

# Reindex database
docker-compose -f docker-compose.prod.yml exec db psql -U postgres -d elderasblog -c "REINDEX DATABASE elderasblog;"

# Check database size
docker-compose -f docker-compose.prod.yml exec db psql -U postgres -d elderasblog -c "SELECT pg_size_pretty(pg_database_size('elderasblog'));"
```

## Troubleshooting

### Common Issues

#### 1. Database Connection Errors

```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Check database connectivity
psql -U bloguser -d elderasblog -h localhost

# Review PostgreSQL logs
sudo tail -f /var/log/postgresql/postgresql-15-main.log
```

#### 2. Static Files Not Loading

```bash
# Recollect static files
python manage.py collectstatic --noinput --clear

# Check permissions
sudo chown -R www-data:www-data /var/www/static
sudo chmod -R 755 /var/www/static
```

#### 3. 502 Bad Gateway

```bash
# Check backend service
sudo systemctl status blog-backend

# Check Gunicorn logs
sudo tail -f /var/log/gunicorn/error.log

# Restart services
sudo systemctl restart blog-backend
sudo systemctl restart nginx
```

#### 4. High Memory Usage

```bash
# Check memory usage
free -m

# Restart services to free memory
sudo systemctl restart blog-backend
sudo systemctl restart postgresql

# Adjust Gunicorn workers in gunicorn_config.py
```

### Performance Optimization

1. **Database Query Optimization**
   - Review slow queries in logs
   - Add appropriate indexes
   - Use `select_related()` and `prefetch_related()`

2. **Caching**
   - Verify cache is working: `python manage.py shell` → `from django.core.cache import cache; cache.set('test', 'value'); cache.get('test')`
   - Clear cache if needed: `python manage.py shell` → `from django.core.cache import cache; cache.clear()`

3. **Static File Optimization**
   - Enable Nginx gzip compression
   - Set appropriate cache headers
   - Consider using a CDN

## Post-Deployment Verification

### 1. Run Integration Tests

```bash
# Run all tests
python manage.py test blog.tests.test_integration_comprehensive

# Run specific test
python manage.py test blog.tests.test_integration_comprehensive.EndToEndWorkflowTest
```

### 2. Verify Endpoints

```bash
# Health check
curl https://yourdomain.com/api/health/

# API endpoints
curl https://yourdomain.com/api/articles/
curl https://yourdomain.com/api/categories/

# Admin interface
curl https://yourdomain.com/admin/
```

### 3. Monitor Logs

```bash
# Watch application logs
tail -f /var/www/blog/backend/logs/django.log

# Watch Nginx logs
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

## Rollback Procedure

If deployment fails:

```bash
# Stop services
sudo systemctl stop blog-backend
sudo systemctl stop nginx

# Restore database backup
gunzip /var/backups/blog/blog_backup_YYYYMMDD_HHMMSS.sql.gz
psql -U bloguser -d elderasblog < /var/backups/blog/blog_backup_YYYYMMDD_HHMMSS.sql

# Restore previous code version
cd /var/www/blog
git checkout previous-stable-tag

# Restart services
sudo systemctl start blog-backend
sudo systemctl start nginx
```

## Support and Resources

- **Documentation**: See README.md and SETUP_SUMMARY.md
- **Issue Tracking**: GitHub Issues
- **Django Documentation**: https://docs.djangoproject.com/
- **PostgreSQL Documentation**: https://www.postgresql.org/docs/

## Conclusion

This deployment guide covers the essential steps for deploying the Django + PostgreSQL blog system to production. Always test thoroughly in a staging environment before deploying to production, and maintain regular backups of your database and application code.
