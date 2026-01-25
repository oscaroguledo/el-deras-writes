#!/bin/bash

# El_Dera's Writes - Complete Setup Script
# This script sets up the entire application from scratch

set -e  # Exit on any error

echo "🚀 El_Dera's Writes - Complete Setup"
echo "===================================="
echo "Modern Blog Platform with UUID v7 and Docker"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
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

print_header() {
    echo -e "${PURPLE}🔧 $1${NC}"
    echo "----------------------------------------"
}

# Check prerequisites
print_header "Checking Prerequisites"

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed. Please install Docker first."
    echo "Visit: https://docs.docker.com/get-docker/"
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    print_error "Docker Compose is not installed. Please install Docker Compose first."
    echo "Visit: https://docs.docker.com/compose/install/"
    exit 1
fi

# Setup environment
print_header "Setting Up Environment"

if [ ! -f ".env" ]; then
    print_info "Creating .env file from template..."
    if [ -f "config/.env.example" ]; then
        cp config/.env.example .env
        print_status "Created .env file"
        
        # Generate secure keys
        print_info "Generating secure keys..."
        SECRET_KEY=$(python3 -c "import secrets; print(secrets.token_urlsafe(50))")
        JWT_SECRET_KEY=$(python3 -c "import secrets; print(secrets.token_urlsafe(50))")
        DB_PASSWORD=$(python3 -c "import secrets; print(secrets.token_urlsafe(16))")
        
        # Update .env file with generated keys
        sed -i.bak "s/your-super-secret-key-here-make-it-long-and-random-at-least-50-characters/$SECRET_KEY/g" .env
        sed -i.bak "s/your-jwt-secret-key-different-from-django-secret-key/$JWT_SECRET_KEY/g" .env
        sed -i.bak "s/your_secure_password/$DB_PASSWORD/g" .env
        rm .env.bak
        
        print_status "Generated secure keys and updated .env file"
    else
        print_error "config/.env.example not found"
        exit 1
    fi
else
    print_status ".env file already exists"
fi

# Docker setup
print_header "Setting Up Docker Environment"

print_info "Stopping any existing containers..."
docker-compose -f config/docker-compose.yml down 2>/dev/null || true

print_info "Building and starting Docker containers..."
docker-compose -f config/docker-compose.yml up -d --build

print_info "Waiting for services to be ready..."
sleep 15

# Check container status
if docker-compose -f config/docker-compose.yml ps | grep -q "Up"; then
    print_status "Docker containers are running"
else
    print_error "Some containers failed to start"
    docker-compose -f config/docker-compose.yml logs
    exit 1
fi

# Database setup
print_header "Setting Up Database"

print_info "Running database migrations..."
if docker-compose -f config/docker-compose.yml exec -T backend python manage.py migrate; then
    print_status "Database migrations completed successfully"
else
    print_error "Database migrations failed"
    exit 1
fi

# Test the application
print_header "Testing Application"

print_info "Running API tests..."
docker-compose -f config/docker-compose.yml exec -T backend python test_apis.py

# Create superuser
print_header "User Setup"

echo ""
print_info "Would you like to create a superuser account now? (y/n)"
read -r create_superuser
if [[ $create_superuser =~ ^[Yy]$ ]]; then
    print_info "Creating superuser account..."
    docker-compose -f config/docker-compose.yml exec backend python manage.py createsuperuser
    print_status "Superuser created successfully"
fi

# Load sample data
echo ""
print_info "Would you like to load sample data? (y/n)"
read -r load_sample
if [[ $load_sample =~ ^[Yy]$ ]]; then
    if [ -f "backend/seed.py" ]; then
        print_info "Loading sample data..."
        docker-compose -f config/docker-compose.yml exec -T backend python seed.py
        print_status "Sample data loaded successfully"
    else
        print_warning "Sample data script not found, skipping..."
    fi
fi

# Git setup removed - not needed

# Final verification
print_header "Final Verification"

print_info "Verifying services..."

# Check backend
if curl -s http://localhost:8000/api/health/ > /dev/null; then
    print_status "Backend API is responding"
else
    print_warning "Backend API may not be ready yet"
fi

# Check frontend
if curl -s http://localhost:3000 > /dev/null; then
    print_status "Frontend is responding"
else
    print_warning "Frontend may not be ready yet"
fi

# Success message
echo ""
echo "🎉 Setup Complete!"
echo "=================="
echo ""
print_status "Your El_Dera's Writes blog is ready!"
echo ""
echo "📍 Access Points:"
echo "  🌐 Frontend:     http://localhost:3000"
echo "  🔧 Backend API:  http://localhost:8000/api/"
echo "  👨‍💼 Admin Panel:  http://localhost:8000/admin/"
echo "  ❤️  Health Check: http://localhost:8000/api/health/"
echo ""
echo "🛠️  Management Commands:"
echo "  📊 View logs:    docker-compose -f config/docker-compose.yml logs"
echo "  🔄 Restart:      docker-compose -f config/docker-compose.yml restart"
echo "  🛑 Stop:         docker-compose -f config/docker-compose.yml down"
echo "  🐚 Backend shell: docker-compose -f config/docker-compose.yml exec backend bash"
echo "  🐚 Frontend shell: docker-compose -f config/docker-compose.yml exec frontend sh"
echo ""
echo "📚 Key Features:"
echo "  ✨ UUID v7 primary keys for better performance"
echo "  🐘 PostgreSQL with optimized schema"
echo "  🔐 JWT authentication with refresh tokens"
echo "  📝 Admin dashboard for content management"
echo "  💬 Comment system with moderation"
echo "  🏷️  Categories and tags"
echo "  🚀 Docker containerization"
echo "  📱 Responsive React frontend"
echo ""
echo "📖 Documentation:"
echo "  📄 README.md - Complete setup and usage guide"
echo "  🔧 API endpoints documented in README"
echo "  🧪 Test with: docker-compose -f config/docker-compose.yml exec backend python test_apis.py"
echo ""
print_status "Happy blogging! 🎉"

# Show next steps
echo ""
print_info "Next Steps:"
echo "  1. Visit http://localhost:8000/admin/ to start creating content"
echo "  2. Visit http://localhost:3000 to see your blog"
echo "  3. Customize the frontend in the frontend/src directory"
echo "  4. Add your content and configure settings"
echo "  5. Deploy to production when ready"
echo ""
print_info "Need help? Check the README.md file for detailed documentation!"