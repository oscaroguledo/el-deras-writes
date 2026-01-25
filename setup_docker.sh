#!/bin/bash

# El_Dera's Writes - Docker Setup Script
# This script sets up the entire application with Docker

set -e  # Exit on any error

echo "🚀 Setting up El_Dera's Writes Blog with Docker"
echo "================================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    print_error "Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

print_status "Docker and Docker Compose are installed"

# Check if .env file exists
if [ ! -f ".env" ]; then
    print_warning ".env file not found. Creating from template..."
    if [ -f "config/.env.example" ]; then
        cp config/.env.example .env
        print_status "Created .env file from template"
        print_warning "Please edit .env file with your settings before continuing"
        print_info "Press Enter to continue after editing .env file..."
        read
    else
        print_error "config/.env.example not found. Please create .env file manually."
        exit 1
    fi
else
    print_status ".env file found"
fi

# Stop any existing containers
print_info "Stopping any existing containers..."
docker-compose -f config/docker-compose.yml down 2>/dev/null || true

# Build and start containers
print_info "Building and starting Docker containers..."
docker-compose -f config/docker-compose.yml up -d --build

# Wait for database to be ready
print_info "Waiting for database to be ready..."
sleep 10

# Check if containers are running
print_info "Checking container status..."
if docker-compose -f config/docker-compose.yml ps | grep -q "Up"; then
    print_status "Containers are running"
else
    print_error "Some containers failed to start"
    docker-compose -f config/docker-compose.yml logs
    exit 1
fi

# Run migrations
print_info "Running database migrations..."
if docker-compose -f config/docker-compose.yml exec -T backend python manage.py migrate; then
    print_status "Database migrations completed"
else
    print_error "Database migrations failed"
    exit 1
fi

# Test APIs
print_info "Testing APIs..."
if docker-compose -f config/docker-compose.yml exec -T backend python test_apis.py; then
    print_status "API tests completed"
else
    print_warning "Some API tests failed (this may be normal for a fresh setup)"
fi

# Create superuser (optional)
echo ""
print_info "Do you want to create a superuser account? (y/n)"
read -r create_superuser
if [[ $create_superuser =~ ^[Yy]$ ]]; then
    print_info "Creating superuser account..."
    docker-compose -f config/docker-compose.yml exec backend python manage.py createsuperuser
fi

# Load sample data (optional)
echo ""
print_info "Do you want to load sample data? (y/n)"
read -r load_sample_data
if [[ $load_sample_data =~ ^[Yy]$ ]]; then
    if [ -f "backend/seed.py" ]; then
        print_info "Loading sample data..."
        docker-compose -f config/docker-compose.yml exec -T backend python seed.py
        print_status "Sample data loaded"
    else
        print_warning "seed.py not found, skipping sample data"
    fi
fi

echo ""
echo "🎉 Setup Complete!"
echo "=================="
print_status "Backend API: http://localhost:8000/api/"
print_status "Admin Panel: http://localhost:8000/admin/"
print_status "Frontend: http://localhost:3000"
print_status "Health Check: http://localhost:8000/api/health/"

echo ""
print_info "Useful Docker commands:"
echo "  View logs: docker-compose -f config/docker-compose.yml logs"
echo "  Stop: docker-compose -f config/docker-compose.yml down"
echo "  Restart: docker-compose -f config/docker-compose.yml restart"
echo "  Shell access: docker-compose -f config/docker-compose.yml exec backend bash"

echo ""
print_info "Next steps:"
echo "  1. Visit http://localhost:8000/admin/ to manage content"
echo "  2. Visit http://localhost:3000 to see the frontend"
echo "  3. Test APIs at http://localhost:8000/api/"

# Check if everything is working
echo ""
print_info "Testing final setup..."
if curl -s http://localhost:8000/api/health/ > /dev/null; then
    print_status "Backend is responding"
else
    print_warning "Backend may not be fully ready yet (try again in a few seconds)"
fi

if curl -s http://localhost:3000 > /dev/null; then
    print_status "Frontend is responding"
else
    print_warning "Frontend may not be fully ready yet (try again in a few seconds)"
fi

print_status "Setup script completed successfully!"