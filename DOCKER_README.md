# Docker Setup for El-Deras Blog

This project uses Docker Compose to run the full stack application with PostgreSQL database.

## Prerequisites

- Docker
- Docker Compose

## Development Setup

1. **Clone the repository and navigate to the project directory**

2. **Build and start the services:**
   ```bash
   docker-compose up --build
   ```

3. **The application will be available at:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - PostgreSQL: localhost:5432

4. **To run in detached mode:**
   ```bash
   docker-compose up -d --build
   ```

5. **To stop the services:**
   ```bash
   docker-compose down
   ```

## Production Setup

1. **Copy environment file:**
   ```bash
   cp .env.example .env
   ```

2. **Edit `.env` file with production values:**
   - Set secure `POSTGRES_PASSWORD`
   - Set secure `SECRET_KEY`
   - Set `DEBUG=0`
   - Update `ALLOWED_HOSTS` with your domain
   - Update `VITE_API_URL` with your backend URL

3. **Run production setup:**
   ```bash
   docker-compose -f docker-compose.prod.yml up --build -d
   ```

## Useful Commands

### Database Management
```bash
# Run migrations
docker-compose exec backend python manage.py migrate

# Create superuser
docker-compose exec backend python manage.py createsuperuser

# Access PostgreSQL shell
docker-compose exec db psql -U postgres -d elderasblog
```

### Development
```bash
# View logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Restart a service
docker-compose restart backend

# Rebuild a specific service
docker-compose up --build backend
```

### Cleanup
```bash
# Remove containers and networks
docker-compose down

# Remove containers, networks, and volumes
docker-compose down -v

# Remove everything including images
docker-compose down -v --rmi all
```

## Services

- **db**: PostgreSQL 15 database
- **backend**: Django REST API server
- **frontend**: React/Vite development server (dev) or Nginx (prod)
- **nginx**: Reverse proxy (production only)

## Volumes

- `postgres_data`: Persistent PostgreSQL data
- `static_volume`: Django static files (production)
- `media_volume`: User uploaded media files (production)
- `frontend_build`: Built frontend assets (production)