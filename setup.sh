#!/bin/bash

# El Dera's Writes - Complete Setup Script
# This script sets up the entire application from scratch

set -e  # Exit on any error

echo "🚀 El Dera's Writes - Complete Setup"
echo "===================================="
echo "Modern Blog Platform with Neon Database"
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

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    print_error "Python 3 is not installed. Please install Python 3 first."
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    print_error "npm is not installed. Please install npm first."
    exit 1
fi

print_status "All prerequisites are installed"

# Setup environment
print_header "Setting Up Environment"

if [ ! -f ".env" ]; then
    print_info "Creating .env file..."
    cat > .env << 'EOF'
# Database Configuration - Using Neon PostgreSQL
DATABASE_URL=postgresql://neondb_owner:npg_kY3JEwGm6ABt@ep-snowy-shape-ah59xj71-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
POSTGRES_DB=neondb
POSTGRES_USER=neondb_owner
POSTGRES_PASSWORD=npg_kY3JEwGm6ABt

# Django Configuration
SECRET_KEY=5zKIF8PwlAyB4Q0XvIHolT1Xj4c5gtylhdzobFOtLQ2pr_PjvySA7YVexVtPGICaF1U
DEBUG=1
ALLOWED_HOSTS=localhost,127.0.0.1,yourdomain.com

# CORS Configuration (for separate frontend hosting)
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173,https://yourdomain.com

# JWT Configuration
JWT_SECRET_KEY=4773aovasrr-uZUEeum5MlmX72O8lg5R4xja9Fc15nETCQy2EGEw_3w0rastH49GjZ0

# Cache Configuration (optional)
CACHE_KEY_PREFIX=blog_cache_dev
EOF
    print_status "Created .env file with Neon database configuration"
else
    print_status ".env file already exists"
fi

# Backend setup
print_header "Setting Up Backend"

cd backend

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    print_info "Creating Python virtual environment..."
    python3 -m venv venv
    print_status "Virtual environment created"
fi

# Activate virtual environment and install dependencies
print_info "Installing Python dependencies..."
source venv/bin/activate
pip install -r requirements.txt
print_status "Python dependencies installed"

# Database setup
print_header "Setting Up Database"

print_info "Running database migrations..."
python manage.py migrate
print_status "Database migrations completed"

print_info "Loading sample data and creating admin user..."
python seed.py
print_status "Sample data loaded and admin user created"

cd ..

# Frontend setup
print_header "Setting Up Frontend"

cd frontend

print_info "Installing Node.js dependencies..."
npm install
print_status "Node.js dependencies installed"

cd ..

# Final verification
print_header "Final Verification"

print_info "Setup completed successfully!"

# Success message
echo ""
echo "🎉 Setup Complete!"
echo "=================="
echo ""
print_status "Your El Dera's Writes blog is ready!"
echo ""
echo "🔐 Admin Credentials:"
echo "  📧 Email:    admin@gmail.com"
echo "  🔑 Password: admin"
echo ""
echo "🚀 To start the application:"
echo "  📍 Backend:  cd backend && source venv/bin/activate && python manage.py runserver"
echo "  📍 Frontend: cd frontend && npm run dev"
echo ""
echo "📍 Access Points (after starting):"
echo "  🌐 Frontend:     http://localhost:3000"
echo "  🔧 Backend API:  http://localhost:8000/"
echo "  👨‍💼 Admin Panel:  http://localhost:8000/admin/"
echo "  ❤️  Health Check: http://localhost:8000/health/"
echo ""
echo "📚 Key Features:"
echo "  ✨ UUID v7 primary keys for better performance"
echo "  🐘 Neon PostgreSQL database"
echo "  🔐 JWT authentication with refresh tokens"
echo "  📝 Admin dashboard for content management"
echo "  💬 Comment system with moderation"
echo "  🏷️  Categories and tags"
echo "  📱 Responsive React frontend"
echo "  🖼️  GitHub image storage with jsDelivr CDN"
echo ""
print_status "Happy blogging! 🎉"

# Show next steps
echo ""
print_info "Next Steps:"
echo "  1. Start the backend: cd backend && source venv/bin/activate && python manage.py runserver"
echo "  2. Start the frontend: cd frontend && npm run dev"
echo "  3. Visit http://localhost:3000 to see your blog"
echo "  4. Visit http://localhost:8000/admin/ to manage content"
echo "  5. Login with admin@gmail.com / admin"
echo ""
print_info "Need help? Check the README.md file for detailed documentation!"