# El Dera's Writes - Modern Blog Platform

[![Netlify Status](https://api.netlify.com/api/v1/badges/da951703-7aad-4942-9d57-f187f2132311/deploy-status)](https://app.netlify.com/projects/superlative-kitsune-f19d67/deploys)

A production-ready blog application built with Django REST API backend and React frontend, optimized for PostgreSQL with UUID v7 primary keys. Currently deployed with frontend on Netlify and backend on Render.

## 🚀 Features

- **Modern Architecture**: Django REST API + React TypeScript frontend
- **UUID v7 Primary Keys**: Time-ordered UUIDs for better database performance
- **PostgreSQL Optimized**: Custom table names, strategic indexes, and query optimization
- **JWT Authentication**: Secure token-based authentication with refresh tokens
- **Admin Dashboard**: Comprehensive admin interface for content management
- **Comment System**: Moderated comment system with approval workflow
- **Content Management**: Categories, tags, featured articles, and SEO-friendly slugs
- **Performance Optimized**: Database indexes, caching, and lazy loading
- **Production Ready**: Logging, monitoring, and health checks

## 📁 Project Structure

```
el-deras-writes/
├── backend/                   # Django REST API
│   ├── blog/
│   │   ├── models/            # Database models (organized)
│   │   ├── serializers/       # API serializers (organized)
│   │   ├── views/             # API views (organized)
│   │   ├── permissions/       # Custom permissions
│   │   ├── urls/              # URL routing (organized)
│   │   ├── utils/             # Utility functions (UUID v7, etc.)
│   │   ├── migrations/        # PostgreSQL migrations
│   │   └── tests/             # Comprehensive test suite
│   ├── blog_project/          # Django project settings
│   ├── requirements.txt       # Python dependencies
│   ├── build.sh              # Render deployment script
│   └── manage.py
├── frontend/                  # React TypeScript application
│   ├── src/
│   │   ├── components/        # Reusable components
│   │   ├── pages/             # Page components
│   │   ├── hooks/             # Custom React hooks
│   │   ├── types/             # TypeScript type definitions
│   │   └── utils/             # Utility functions
│   ├── package.json
│   ├── netlify.toml          # Netlify deployment config
│   └── vite.config.ts
├── render.yaml               # Render deployment config
└── README.md
```

## 🛠 Prerequisites

- **Python 3.8+**
- **Node.js 18+**
- **PostgreSQL 12+** (or use managed database like Neon)
- **Git**

## 🚀 Quick Start

### 1. Clone and Setup

```bash
git clone https://github.com/yourusername/el-deras-writes.git
cd el-deras-writes
```

### 2. Environment Configuration

Create a `.env` file in the root directory:

```env
# Database Configuration (use your PostgreSQL database URL)
DATABASE_URL=postgresql://username:password@host:port/database

# Django Configuration
SECRET_KEY=your-super-secret-key-here-make-it-long-and-random-at-least-50-characters
DEBUG=1
ALLOWED_HOSTS=localhost,127.0.0.1,yourdomain.com

# CORS Configuration
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173,https://yourdomain.com

# JWT Configuration
JWT_SECRET_KEY=your-jwt-secret-key-different-from-django-secret-key
```

### 3. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Load sample data (optional)
python seed.py

# Start development server
python manage.py runserver
```

### 4. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Create environment file
cp .env.example .env
# Edit .env with your backend URL

# Start development server
npm run dev
```

### 5. Access the Application

- **Backend API**: http://localhost:8000/
- **Admin Panel**: http://localhost:8000/admin/
- **Frontend**: http://localhost:3000 (or http://localhost:5173 with Vite)
- **API Health Check**: http://localhost:8000/health/

### 6. Test APIs

```bash
# Test health endpoint
curl http://localhost:8000/health/

# Test articles endpoint
curl http://localhost:8000/articles/

# Test authentication
curl -X POST http://localhost:8000/token/ \
  -H "Content-Type: application/json" \
  -d '{"email": "your-email@example.com", "password": "your-password"}'
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
GET    /articles/                    # List published articles
GET    /articles/{id}/               # Get article details
GET    /articles/{id}/comments/      # Get article comments
POST   /articles/{id}/comments/      # Add comment (auth required)
GET    /categories/                  # List categories
GET    /tags/                        # List tags
GET    /contact/                     # Get contact info
POST   /feedback/                    # Submit feedback
GET    /visitor-count/               # Get visitor count
GET    /health/                      # Health check
```

### Authentication API
```
POST   /token/                       # Get JWT token
POST   /token/refresh/               # Refresh JWT token
POST   /create-superuser/            # Create superuser (dev only)
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

### Backend Testing

```bash
cd backend
source venv/bin/activate

# Run all tests
python manage.py test

# Run specific test modules
python manage.py test blog.tests.test_api_response_consistency

# Run with coverage
pip install coverage
coverage run --source='.' manage.py test
coverage report
```

### Frontend Testing

```bash
cd frontend
npm test
```

### API Testing Script

```bash
# Run the built-in API test script
cd backend
python test_apis.py
```

## 🚀 Production Deployment

### Current Deployment

- **Frontend**: Deployed on Netlify at [https://elderawrites.netlify.app](https://elderawrites.netlify.app)
- **Backend**: Deployed on Render at [https://el-deras-writes-backend.onrender.com](https://el-deras-writes-backend.onrender.com)
- **Database**: Neon PostgreSQL (managed database)

### Netlify Frontend Deployment

The frontend is deployed to Netlify with automatic builds from GitHub:

1. **Connect Repository**: Link your GitHub repository to Netlify
2. **Build Settings**: 
   - Base directory: `frontend`
   - Build command: `npm run build`
   - Publish directory: `frontend/dist`
3. **Environment Variables**: Set `VITE_API_URL` to your backend URL
4. **Deploy**: Automatic deployment on every push to main branch

📖 **Detailed Guide**: See [NETLIFY_DEPLOYMENT.md](./NETLIFY_DEPLOYMENT.md) for complete instructions.

### Render Backend Deployment

The backend is deployed to Render using the `render.yaml` configuration:

1. **Connect Repository**: Link your GitHub repository to Render
2. **Environment Variables**: Configure database URL and other settings
3. **Build Script**: Uses `backend/build.sh` for deployment
4. **Deploy**: Automatic deployment on every push to main branch

📖 **Detailed Guide**: See [RENDER_DEPLOYMENT.md](./RENDER_DEPLOYMENT.md) for complete instructions.

### Other Deployment Options

- **Railway**: Easy PostgreSQL + Django deployment
- **Heroku**: Classic platform-as-a-service
- **DigitalOcean App Platform**: Scalable container deployment
- **AWS/GCP/Azure**: Full cloud infrastructure

### Production Environment Variables

```env
# Production environment variables
DEBUG=0
SECRET_KEY=your-production-secret-key-very-long-and-secure
DATABASE_URL=postgresql://user:password@host:port/database
ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com
CORS_ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
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
cd backend
source venv/bin/activate

# Create and apply migrations
python manage.py makemigrations
python manage.py migrate

# Frontend changes
cd frontend
npm run build
```

### Database Migrations

```bash
cd backend
source venv/bin/activate

# Create new migration
python manage.py makemigrations

# Apply migrations
python manage.py migrate

# Reset migrations (development only)
python manage.py migrate blog zero
rm blog/migrations/0*.py
python manage.py makemigrations blog
python manage.py migrate
```

## 🔍 Monitoring & Logging

### Application Logs
- **Location**: `backend/logs/django.log`
- **Levels**: DEBUG, INFO, WARNING, ERROR, CRITICAL
- **Local Development**: Check console output and log files

### Health Checks
- **Endpoint**: `GET /health/`
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
# Check if PostgreSQL is running
# For local PostgreSQL:
sudo service postgresql status

# Check database connection in Django
cd backend
python manage.py dbshell
```

**Migration Issues:**
```bash
cd backend
source venv/bin/activate

# Check migration status
python manage.py showmigrations

# Reset migrations (development only)
python manage.py migrate blog zero
rm blog/migrations/0*.py
python manage.py makemigrations blog
python manage.py migrate
```

**Frontend Build Issues:**
```bash
cd frontend

# Clear node modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear build cache
rm -rf dist
npm run build
```

**Permission Issues:**
```bash
# Fix file permissions
sudo chown -R $USER:$USER .
```

**Environment Variables:**
```bash
# Check if .env file exists and has correct values
cat .env

# Verify environment variables are loaded
cd backend
python manage.py shell
>>> import os
>>> print(os.environ.get('DATABASE_URL'))
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
- **Keep-alive**: Frontend pings backend every 10 minutes to prevent sleeping on free hosting

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
   cd backend
   python manage.py test
   cd ../frontend
   npm test
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

**Built with ❤️ for modern, scalable blogging with UUID v7 and cloud deployment**