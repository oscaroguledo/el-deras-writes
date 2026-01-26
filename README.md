# El Dera's Writes - Modern Blog Platform

[![Netlify Status](https://api.netlify.com/api/v1/badges/da951703-7aad-4942-9d57-f187f2132311/deploy-status)](https://app.netlify.com/projects/superlative-kitsune-f19d67/deploys)

A production-ready blog application built with Django REST API backend and React frontend, optimized for PostgreSQL with UUID v7 primary keys and designed for scalable deployment.

## 🚀 Features

- **Modern Architecture**: Django REST API + React TypeScript frontend
- **UUID v7 Primary Keys**: Time-ordered UUIDs for better database performance
- **PostgreSQL Optimized**: Custom table names, strategic indexes, and query optimization
- **JWT Authentication**: Secure token-based authentication with refresh tokens
- **Admin Dashboard**: Comprehensive admin interface for content management
- **Comment System**: Moderated comment system with approval workflow
- **Content Management**: Categories, tags, featured articles, and SEO-friendly slugs
- **Performance Optimized**: Database indexes, caching, and lazy loading
- **Docker Ready**: Complete Docker setup for development and production
- **Production Ready**: Logging, monitoring, and health checks

## 📁 Project Structure

```
el-deras-writes/
├── config/                     # Configuration files
│   ├── .env.example           # Environment variables template
│   └── docker-compose.yml     # Docker setup
├── backend/                   # Django REST API
│   ├── blog/
│   │   ├── models/            # Database models (organized)
│   │   ├── serializers/       # API serializers (organized)
│   │   ├── views/             # API views (organized)
│   │   ├── permissions/       # Custom permissions
│   │   ├── urls/              # URL routing (organized)
│   │   ├── utils/             # Utility functions (UUID v7, etc.)
│   │   ├── migrations/        # Simplified PostgreSQL migrations
│   │   └── tests/             # Comprehensive test suite
│   ├── blog_project/          # Django project settings
│   ├── requirements.txt       # Python dependencies
│   ├── Dockerfile            # Backend Docker configuration
│   └── manage.py
├── frontend/                  # React TypeScript application
│   ├── src/
│   │   ├── components/        # Reusable components
│   │   ├── pages/             # Page components
│   │   ├── hooks/             # Custom React hooks
│   │   ├── types/             # TypeScript type definitions
│   │   └── utils/             # Utility functions
│   ├── package.json
│   ├── Dockerfile            # Frontend Docker configuration
│   └── vite.config.ts
└── README.md
```

## 🛠 Prerequisites

- **Docker & Docker Compose** (recommended)
- **Python 3.8+** (for local development)
- **Node.js 18+** (for local development)
- **PostgreSQL 12+** (for local development)
- **Git**

## 🚀 Quick Start with Docker (Recommended)

### 1. Clone and Setup

```bash
git clone https://github.com/yourusername/el-deras-writes.git
cd el-deras-writes
```

### 2. Environment Configuration

```bash
cp config/.env.example .env
```

Edit `.env` with your settings:

```env
# Database Configuration
DATABASE_URL=postgresql://bloguser:your_secure_password@db:5432/elderasblog
POSTGRES_DB=elderasblog
POSTGRES_USER=bloguser
POSTGRES_PASSWORD=your_secure_password

# Django Configuration
SECRET_KEY=your-super-secret-key-here-make-it-long-and-random-at-least-50-characters
DEBUG=1
ALLOWED_HOSTS=localhost,127.0.0.1,backend,yourdomain.com

# CORS Configuration
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173,https://yourdomain.com

# JWT Configuration
JWT_SECRET_KEY=your-jwt-secret-key-different-from-django-secret-key
```

### 3. Start with Docker

```bash
# Build and start all services
docker-compose -f config/docker-compose.yml up -d --build

# Check if services are running
docker-compose -f config/docker-compose.yml ps
```

### 4. Initialize Database

```bash
# Run migrations with UUID v7 support
docker-compose -f config/docker-compose.yml exec backend python manage.py migrate

# Create superuser
docker-compose -f config/docker-compose.yml exec backend python manage.py createsuperuser

# Load sample data (optional)
docker-compose -f config/docker-compose.yml exec backend python seed.py
```

### 5. Access the Application

- **Backend API**: http://localhost:8000/api/
- **Admin Panel**: http://localhost:8000/admin/
- **Frontend**: http://localhost:3000
- **API Documentation**: http://localhost:8000/api/health/

### 6. Test APIs

```bash
# Test health endpoint
curl http://localhost:8000/api/health/

# Test articles endpoint
curl http://localhost:8000/api/articles/

# Test authentication
curl -X POST http://localhost:8000/api/token/ \
  -H "Content-Type: application/json" \
  -d '{"email": "your-email@example.com", "password": "your-password"}'
```

## 🔧 Manual Setup (Alternative)

### Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set up PostgreSQL database
createdb elderasblog
createuser bloguser --pwprompt

# Configure environment
cp ../config/.env.example ../.env
# Edit .env with your database settings

# Run migrations
python manage.py migrate
python manage.py createsuperuser

# Start development server
python manage.py runserver
```

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

## 📊 Database Schema with UUID v7

### UUID v7 Benefits
- **Time-ordered**: Better database performance with sequential inserts
- **Indexable**: Improved query performance compared to UUID v4
- **Unique**: Globally unique identifiers across distributed systems
- **Sortable**: Natural chronological ordering

### Core Models
- **CustomUser** (`users` table): Enhanced user model with UUID v7 primary keys
- **Article** (`articles` table): Blog posts with SEO-friendly slugs and status management
- **Comment** (`comments` table): Moderated comment system with approval workflow
- **Category** (`categories` table): Hierarchical content organization
- **Tag** (`tags` table): Flexible content tagging system

### Utility Models
- **ContactInfo** (`contact_info` table): Site contact information with JSON social links
- **VisitorCount** (`visitor_counts` table): Site analytics and visitor tracking
- **Feedback** (`feedback` table): User feedback collection system
- **Visit** (`visits` table): Daily visit tracking

### Database Optimizations
- UUID v7 primary keys for better performance
- Strategic database indexes for query optimization
- Custom table names for cleaner database structure
- Proper foreign key relationships with cascade handling
- JSON fields for flexible data storage

## 🔗 API Endpoints

### Public API
```
GET    /api/articles/                    # List published articles
GET    /api/articles/{id}/               # Get article details
GET    /api/articles/{id}/comments/      # Get article comments
POST   /api/articles/{id}/comments/      # Add comment (auth required)
GET    /api/categories/                  # List categories
GET    /api/tags/                        # List tags
GET    /api/contact/                     # Get contact info
POST   /api/feedback/                    # Submit feedback
GET    /api/visitor-count/               # Get visitor count
GET    /api/health/                      # Health check
```

### Authentication API
```
POST   /api/token/                       # Get JWT token
POST   /api/token/refresh/               # Refresh JWT token
POST   /api/create-superuser/            # Create superuser (dev only)
```

### Admin API (Authentication Required)
```
GET    /admin-api/articles/              # List all articles
POST   /admin-api/articles/              # Create article
PUT    /admin-api/articles/{id}/         # Update article
DELETE /admin-api/articles/{id}/         # Delete article
GET    /admin-api/comments/              # List all comments
PUT    /admin-api/comments/{id}/approve/ # Approve comment
GET    /admin-api/users/                 # List users
GET    /admin-api/feedback/              # List feedback
```

## 🧪 Testing

### Docker Testing

```bash
# Run backend tests in Docker
docker-compose -f config/docker-compose.yml exec backend python manage.py test

# Run specific test modules
docker-compose -f config/docker-compose.yml exec backend python manage.py test blog.tests.test_api_response_consistency

# Run with coverage
docker-compose -f config/docker-compose.yml exec backend coverage run --source='.' manage.py test
docker-compose -f config/docker-compose.yml exec backend coverage report
```

### Local Testing

```bash
# Backend tests
cd backend
source venv/bin/activate
python manage.py test

# Frontend tests
cd frontend
npm test
```

### API Testing Script

```bash
# Run the built-in API test script
docker-compose -f config/docker-compose.yml exec backend python test_apis.py
```

## 🚀 Production Deployment

### Netlify Frontend Deployment

The frontend can be easily deployed to Netlify with automatic builds from GitHub:

1. **Connect Repository**: Link your GitHub repository to Netlify
2. **Build Settings**: 
   - Base directory: `frontend`
   - Build command: `npm run build`
   - Publish directory: `frontend/dist`
3. **Environment Variables**: Set `VITE_API_URL` to your backend URL
4. **Deploy**: Automatic deployment on every push to main branch

📖 **Detailed Guide**: See [NETLIFY_DEPLOYMENT.md](./NETLIFY_DEPLOYMENT.md) for complete instructions.

### Backend Deployment Options

- **Railway**: Easy PostgreSQL + Django deployment
- **Render**: Free tier with PostgreSQL
- **Heroku**: Classic platform-as-a-service
- **DigitalOcean App Platform**: Scalable container deployment
- **AWS/GCP/Azure**: Full cloud infrastructure

### Environment Setup

```env
# Production environment variables
DEBUG=0
SECRET_KEY=your-production-secret-key-very-long-and-secure
DATABASE_URL=postgresql://user:password@host:port/database
ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com
CORS_ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

### Docker Production Deployment

```bash
# Build production images
docker-compose -f config/docker-compose.yml build --no-cache

# Start production services
docker-compose -f config/docker-compose.yml up -d

# Run production migrations
docker-compose -f config/docker-compose.yml exec backend python manage.py migrate

# Collect static files
docker-compose -f config/docker-compose.yml exec backend python manage.py collectstatic --noinput

# Create superuser
docker-compose -f config/docker-compose.yml exec backend python manage.py createsuperuser
```

### Health Monitoring

```bash
# Check service health
curl http://localhost:8000/api/health/

# View logs
docker-compose -f config/docker-compose.yml logs backend
docker-compose -f config/docker-compose.yml logs frontend
docker-compose -f config/docker-compose.yml logs db
```

## 🔧 Development

### Code Organization
- **Models**: Entity-based organization with UUID v7 support
- **Views**: Feature-based organization with proper error handling
- **Serializers**: Entity-based organization with validation
- **URLs**: Purpose-based organization (api, auth, admin)
- **Utils**: Shared utilities including UUID v7 implementation

### Adding New Features

```bash
# Backend changes
docker-compose -f config/docker-compose.yml exec backend python manage.py makemigrations
docker-compose -f config/docker-compose.yml exec backend python manage.py migrate

# Frontend changes
docker-compose -f config/docker-compose.yml exec frontend npm run build
```

### Database Migrations

```bash
# Create new migration
docker-compose -f config/docker-compose.yml exec backend python manage.py makemigrations

# Apply migrations
docker-compose -f config/docker-compose.yml exec backend python manage.py migrate

# Reset migrations (development only)
docker-compose -f config/docker-compose.yml exec backend python manage.py migrate blog zero
docker-compose -f config/docker-compose.yml exec backend rm blog/migrations/0*.py
docker-compose -f config/docker-compose.yml exec backend python manage.py makemigrations blog
docker-compose -f config/docker-compose.yml exec backend python manage.py migrate
```

## 🔍 Monitoring & Logging

### Application Logs
- **Location**: `backend/logs/django.log`
- **Levels**: DEBUG, INFO, WARNING, ERROR, CRITICAL
- **Docker**: `docker-compose -f config/docker-compose.yml logs backend`

### Health Checks
- **Endpoint**: `GET /api/health/`
- **Database**: Connection and query performance
- **Cache**: Cache system status
- **Memory**: Application memory usage

### Performance Monitoring
- **Database queries**: Logged when > 1 second
- **Cache hits**: Tracked and logged
- **Memory usage**: Monitored and reported

## 🐛 Troubleshooting

### Common Issues

**Database Connection Error:**
```bash
# Check if PostgreSQL container is running
docker-compose -f config/docker-compose.yml ps

# Check database logs
docker-compose -f config/docker-compose.yml logs db

# Reset database (development only)
docker-compose -f config/docker-compose.yml down -v
docker-compose -f config/docker-compose.yml up -d
```

**Migration Issues:**
```bash
# Check migration status
docker-compose -f config/docker-compose.yml exec backend python manage.py showmigrations

# Reset migrations (development only)
docker-compose -f config/docker-compose.yml exec backend python manage.py migrate blog zero
docker-compose -f config/docker-compose.yml exec backend rm blog/migrations/0*.py
docker-compose -f config/docker-compose.yml exec backend python manage.py makemigrations blog
docker-compose -f config/docker-compose.yml exec backend python manage.py migrate
```

**Frontend Build Issues:**
```bash
# Clear node modules and reinstall
docker-compose -f config/docker-compose.yml exec frontend rm -rf node_modules package-lock.json
docker-compose -f config/docker-compose.yml exec frontend npm install
```

**Permission Issues:**
```bash
# Fix file permissions
sudo chown -R $USER:$USER .
```

## 📚 API Documentation

### Authentication
All admin endpoints require JWT authentication:
```javascript
// Include in request headers
Authorization: Bearer <your-jwt-token>
```

### Response Format
```json
{
  "success": true,
  "data": {...},
  "message": "Success message",
  "errors": null
}
```

### Error Handling
```json
{
  "success": false,
  "data": null,
  "message": "Error message",
  "errors": {
    "field": ["Error details"]
  }
}
```

## 🎯 Performance Optimization

- **Database**: UUID v7 for better insert performance, strategic indexes
- **Caching**: Multi-level caching strategy (database, API, template)
- **Frontend**: Lazy loading, code splitting, and image optimization
- **API**: Pagination, filtering, and response compression
- **Docker**: Multi-stage builds and optimized images

## 📈 Roadmap

- [ ] **Email Notifications**: Comment notifications and newsletters
- [ ] **Social Authentication**: Google, GitHub, Twitter login
- [ ] **Advanced Search**: Full-text search with PostgreSQL
- [ ] **Content Scheduling**: Publish articles at specific times
- [ ] **Multi-language Support**: Internationalization (i18n)
- [ ] **API Rate Limiting**: Advanced rate limiting and throttling
- [ ] **Real-time Features**: WebSocket support for live comments
- [ ] **SEO Optimization**: Meta tags, sitemaps, and structured data
- [ ] **Analytics Dashboard**: Advanced analytics and reporting
- [ ] **Content Versioning**: Article version history and rollback

## 🤝 Contributing

1. **Fork the repository**
2. **Create feature branch:**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Make changes and test:**
   ```bash
   docker-compose -f config/docker-compose.yml exec backend python manage.py test
   docker-compose -f config/docker-compose.yml exec frontend npm test
   ```
4. **Commit changes:**
   ```bash
   git commit -m 'Add amazing feature'
   ```
5. **Push to branch:**
   ```bash
   git push origin feature/amazing-feature
   ```
6. **Create Pull Request**

## 📞 Support

- **Documentation**: Check this README and inline code comments
- **Issues**: [GitHub Issues](https://github.com/yourusername/el-deras-writes/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/el-deras-writes/discussions)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

**Built with ❤️ for modern, scalable blogging with UUID v7 and Docker**