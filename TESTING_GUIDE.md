# Testing Guide

## Quick Reference

This guide provides quick commands for running tests and verifying the system.

## Running Tests

### All Tests

```bash
# Run all tests
cd backend
python manage.py test --settings=test_settings

# Run with verbose output
python manage.py test --settings=test_settings -v 2

# Run with coverage
coverage run --source='.' manage.py test --settings=test_settings
coverage report
coverage html
```

### Integration Tests

```bash
# Run all integration tests
python manage.py test blog.tests.test_integration_comprehensive --settings=test_settings

# Run specific integration test class
python manage.py test blog.tests.test_integration_comprehensive.APIIntegrationTest --settings=test_settings

# Run specific test method
python manage.py test blog.tests.test_integration_comprehensive.APIIntegrationTest.test_authentication_flow --settings=test_settings
```

### Property-Based Tests

```bash
# Run all property-based tests
python manage.py test blog.tests.test_* --settings=test_settings --pattern="test_*.py"

# Run specific property test
python manage.py test blog.tests.test_article_api_pagination_consistency --settings=test_settings
python manage.py test blog.tests.test_user_registration_security --settings=test_settings
python manage.py test blog.tests.test_input_validation_sql_injection_prevention --settings=test_settings
```

### Specific Test Categories

```bash
# Authentication tests
python manage.py test blog.tests.test_authentication_security --settings=test_settings
python manage.py test blog.tests.test_jwt_token_validity --settings=test_settings
python manage.py test blog.tests.test_token_refresh_security --settings=test_settings

# API tests
python manage.py test blog.tests.test_api_response_consistency --settings=test_settings
python manage.py test blog.tests.test_article_api_pagination_consistency --settings=test_settings

# Security tests
python manage.py test blog.tests.test_input_validation_sql_injection_prevention --settings=test_settings
python manage.py test blog.tests.test_authentication_security --settings=test_settings

# Migration tests
python manage.py test blog.tests.test_migration_data_preservation --settings=test_settings
python manage.py test blog.tests.test_schema_conversion_correctness --settings=test_settings
python manage.py test blog.tests.test_relationship_preservation --settings=test_settings
```

## Deployment Verification

### Pre-Deployment Checks

```bash
# Run deployment verification script
cd backend
python verify_deployment.py

# Expected output:
# - Environment variable checks
# - Database connectivity checks
# - Migration status
# - Cache system verification
# - Security settings validation
# - Overall deployment readiness status
```

### Manual Verification

```bash
# Check database connection
python manage.py dbshell

# Check migrations
python manage.py showmigrations

# Check for pending migrations
python manage.py migrate --plan

# Create cache tables (if not exists)
python manage.py createcachetable cache_table
python manage.py createcachetable api_cache_table
python manage.py createcachetable session_cache_table
python manage.py createcachetable template_cache_table

# Collect static files
python manage.py collectstatic --noinput

# Check for issues
python manage.py check
python manage.py check --deploy
```

## Docker Testing

### Running Tests in Docker

```bash
# Start services
docker-compose up -d

# Run tests in Docker container
docker-compose exec backend python manage.py test --settings=test_settings

# Run integration tests
docker-compose exec backend python manage.py test blog.tests.test_integration_comprehensive --settings=test_settings

# Run deployment verification
docker-compose exec backend python verify_deployment.py

# View logs
docker-compose logs -f backend
docker-compose logs -f db
```

### Database Testing in Docker

```bash
# Access PostgreSQL shell
docker-compose exec db psql -U postgres -d elderasblog

# Check database size
docker-compose exec db psql -U postgres -d elderasblog -c "SELECT pg_size_pretty(pg_database_size('elderasblog'));"

# Check table sizes
docker-compose exec db psql -U postgres -d elderasblog -c "SELECT schemaname, tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size FROM pg_tables WHERE schemaname = 'public' ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;"

# Check indexes
docker-compose exec db psql -U postgres -d elderasblog -c "SELECT indexname, tablename FROM pg_indexes WHERE schemaname = 'public';"
```

## Performance Testing

### Load Testing

```bash
# Install locust (if not installed)
pip install locust

# Create locustfile.py (example)
cat > locustfile.py << 'EOF'
from locust import HttpUser, task, between

class BlogUser(HttpUser):
    wait_time = between(1, 3)
    
    @task
    def view_articles(self):
        self.client.get("/api/articles/")
    
    @task
    def view_article_detail(self):
        self.client.get("/api/articles/1/")
    
    @task
    def view_categories(self):
        self.client.get("/api/categories/")
EOF

# Run load test
locust -f locustfile.py --host=http://localhost:8000
```

### Database Performance

```bash
# Enable query logging
# Add to settings.py:
# LOGGING['loggers']['django.db.backends']['level'] = 'DEBUG'

# Run tests and check slow queries
python manage.py test --settings=test_settings

# Check query count
python manage.py shell
>>> from django.db import connection
>>> from django.test.utils import override_settings
>>> from blog.models import Article
>>> with override_settings(DEBUG=True):
...     list(Article.objects.all())
...     print(len(connection.queries))
```

## Continuous Integration

### GitHub Actions Example

```yaml
name: Django Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: test_db
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432
    
    steps:
    - uses: actions/checkout@v2
    
    - name: Set up Python
      uses: actions/setup-python@v2
      with:
        python-version: 3.10
    
    - name: Install dependencies
      run: |
        cd backend
        pip install -r requirements.txt
    
    - name: Run tests
      env:
        DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test_db
      run: |
        cd backend
        python manage.py test --settings=test_settings
    
    - name: Run deployment verification
      run: |
        cd backend
        python verify_deployment.py || true
```

## Test Data Management

### Creating Test Data

```bash
# Create test data using Django shell
python manage.py shell

>>> from blog.models import *
>>> from django.contrib.auth import get_user_model
>>> User = get_user_model()
>>> 
>>> # Create test user
>>> user = User.objects.create_user(
...     username='testuser',
...     email='test@example.com',
...     password='testpass123'
... )
>>> 
>>> # Create test category
>>> category = Category.objects.create(name='Test Category')
>>> 
>>> # Create test article
>>> article = Article.objects.create(
...     title='Test Article',
...     content='Test content',
...     author=user,
...     category=category,
...     status='published'
... )
```

### Using Fixtures

```bash
# Create fixture from existing data
python manage.py dumpdata blog.Category --indent 2 > backend/blog/fixtures/categories.json
python manage.py dumpdata blog.Article --indent 2 > backend/blog/fixtures/articles.json

# Load fixtures
python manage.py loaddata categories.json
python manage.py loaddata articles.json
```

## Debugging Tests

### Running Tests with PDB

```bash
# Add breakpoint in test
import pdb; pdb.set_trace()

# Run test
python manage.py test blog.tests.test_integration_comprehensive.APIIntegrationTest.test_authentication_flow --settings=test_settings
```

### Verbose Output

```bash
# Maximum verbosity
python manage.py test --settings=test_settings -v 3

# Show test execution time
python manage.py test --settings=test_settings --timing
```

### Keeping Test Database

```bash
# Keep test database for inspection
python manage.py test --settings=test_settings --keepdb

# Access test database
python manage.py dbshell --settings=test_settings
```

## Common Issues and Solutions

### Issue: Database Connection Error

```bash
# Solution: Check database is running
docker-compose ps
docker-compose up -d db

# Or start PostgreSQL locally
sudo systemctl start postgresql
```

### Issue: Migration Errors

```bash
# Solution: Reset migrations
python manage.py migrate --fake blog zero
python manage.py migrate blog

# Or recreate database
python manage.py flush
python manage.py migrate
```

### Issue: Cache Errors

```bash
# Solution: Create cache tables
python manage.py createcachetable cache_table
python manage.py createcachetable api_cache_table
python manage.py createcachetable session_cache_table
python manage.py createcachetable template_cache_table

# Clear cache
python manage.py shell
>>> from django.core.cache import cache
>>> cache.clear()
```

### Issue: Import Errors

```bash
# Solution: Reinstall dependencies
cd backend
pip install -r requirements.txt --force-reinstall

# Or use virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

## Test Coverage

### Generating Coverage Reports

```bash
# Install coverage
pip install coverage

# Run tests with coverage
cd backend
coverage run --source='blog' manage.py test --settings=test_settings

# Generate report
coverage report

# Generate HTML report
coverage html
open htmlcov/index.html  # On macOS
xdg-open htmlcov/index.html  # On Linux
```

### Coverage Goals

- **Overall Coverage**: > 80%
- **Critical Paths**: > 95%
- **Models**: > 90%
- **Views**: > 85%
- **Utilities**: > 90%

## Best Practices

1. **Run tests before committing**
   ```bash
   python manage.py test --settings=test_settings
   ```

2. **Run integration tests before deploying**
   ```bash
   python manage.py test blog.tests.test_integration_comprehensive --settings=test_settings
   ```

3. **Verify deployment readiness**
   ```bash
   python verify_deployment.py
   ```

4. **Check for security issues**
   ```bash
   python manage.py check --deploy
   ```

5. **Keep test data isolated**
   - Use test database
   - Clean up after tests
   - Use transactions

6. **Write meaningful test names**
   - Describe what is being tested
   - Include expected behavior
   - Make failures easy to understand

## Resources

- Django Testing Documentation: https://docs.djangoproject.com/en/stable/topics/testing/
- Hypothesis Documentation: https://hypothesis.readthedocs.io/
- Coverage.py Documentation: https://coverage.readthedocs.io/
- PostgreSQL Testing: https://www.postgresql.org/docs/current/regress.html

---

**Last Updated**: December 2024
