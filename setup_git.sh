#!/bin/bash

# El_Dera's Writes - Git Setup Script
# This script initializes git repository and prepares for GitHub push

set -e  # Exit on any error

echo "📚 Setting up Git repository for El_Dera's Writes"
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

# Check if git is installed
if ! command -v git &> /dev/null; then
    print_error "Git is not installed. Please install Git first."
    exit 1
fi

print_status "Git is installed"

# Initialize git repository if not already initialized
if [ ! -d ".git" ]; then
    print_info "Initializing Git repository..."
    git init
    print_status "Git repository initialized"
else
    print_status "Git repository already exists"
fi

# Create .gitignore if it doesn't exist
if [ ! -f ".gitignore" ]; then
    print_info "Creating .gitignore file..."
    cat > .gitignore << 'EOF'
# Environment variables
.env
.env.local
.env.production

# Python
__pycache__/
*.py[cod]
*$py.class
*.so
.Python
build/
develop-eggs/
dist/
downloads/
eggs/
.eggs/
lib/
lib64/
parts/
sdist/
var/
wheels/
*.egg-info/
.installed.cfg
*.egg
MANIFEST

# Django
*.log
local_settings.py
db.sqlite3
db.sqlite3-journal
media/
staticfiles/

# Virtual environments
venv/
env/
ENV/
env.bak/
venv.bak/

# IDEs
.vscode/
.idea/
*.swp
*.swo
*~

# OS
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db

# Node.js
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*
.pnpm-debug.log*

# React build
/frontend/build
/frontend/dist

# Docker
.dockerignore

# Logs
logs/
*.log

# Coverage reports
htmlcov/
.coverage
.coverage.*
coverage.xml
*.cover
.hypothesis/
.pytest_cache/

# Jupyter Notebook
.ipynb_checkpoints

# pyenv
.python-version

# Celery
celerybeat-schedule
celerybeat.pid

# SageMath parsed files
*.sage.py

# Spyder project settings
.spyderproject
.spyproject

# Rope project settings
.ropeproject

# mkdocs documentation
/site

# mypy
.mypy_cache/
.dmypy.json
dmypy.json

# Pyre type checker
.pyre/

# pytype static type analyzer
.pytype/

# Cython debug symbols
cython_debug/

# Temporary files
*.tmp
*.temp
.cache/

# Database backups
*.sql
*.dump

# SSL certificates
*.pem
*.key
*.crt

# Backup files
*.bak
*.backup
EOF
    print_status "Created .gitignore file"
else
    print_status ".gitignore file already exists"
fi

# Create LICENSE file
if [ ! -f "LICENSE" ]; then
    print_info "Creating MIT LICENSE file..."
    cat > LICENSE << 'EOF'
MIT License

Copyright (c) 2026 El_Dera's Writes

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
EOF
    print_status "Created LICENSE file"
else
    print_status "LICENSE file already exists"
fi

# Add all files to git
print_info "Adding files to git..."
git add .

# Check git status
print_info "Git status:"
git status --short

# Commit changes
if git diff --cached --quiet; then
    print_warning "No changes to commit"
else
    print_info "Committing changes..."
    git commit -m "Initial commit: El_Dera's Writes blog platform with UUID v7 and Docker support

Features:
- Django REST API backend with UUID v7 primary keys
- React TypeScript frontend
- PostgreSQL database with optimized schema
- Docker containerization
- JWT authentication
- Admin dashboard
- Comment system with moderation
- Categories and tags
- Performance optimizations
- Comprehensive testing suite"
    print_status "Changes committed"
fi

# Set up remote repository
echo ""
print_info "Do you want to set up a GitHub remote repository? (y/n)"
read -r setup_remote
if [[ $setup_remote =~ ^[Yy]$ ]]; then
    echo ""
    print_info "Please enter your GitHub repository URL (e.g., https://github.com/username/el-deras-writes.git):"
    read -r repo_url
    
    if [ -n "$repo_url" ]; then
        # Check if remote already exists
        if git remote get-url origin &> /dev/null; then
            print_warning "Remote 'origin' already exists. Updating..."
            git remote set-url origin "$repo_url"
        else
            git remote add origin "$repo_url"
        fi
        print_status "Remote repository set to: $repo_url"
        
        # Ask about pushing
        echo ""
        print_info "Do you want to push to GitHub now? (y/n)"
        read -r push_now
        if [[ $push_now =~ ^[Yy]$ ]]; then
            print_info "Pushing to GitHub..."
            if git push -u origin main 2>/dev/null || git push -u origin master 2>/dev/null; then
                print_status "Successfully pushed to GitHub!"
            else
                print_error "Failed to push to GitHub. You may need to:"
                echo "  1. Create the repository on GitHub first"
                echo "  2. Check your authentication (GitHub token/SSH key)"
                echo "  3. Try: git push -u origin main"
            fi
        fi
    else
        print_warning "No repository URL provided, skipping remote setup"
    fi
fi

echo ""
print_status "Git setup completed!"
echo ""
print_info "Useful Git commands:"
echo "  Check status: git status"
echo "  Add changes: git add ."
echo "  Commit: git commit -m 'Your message'"
echo "  Push: git push"
echo "  Pull: git pull"
echo "  View history: git log --oneline"

echo ""
print_info "Next steps:"
echo "  1. Create a repository on GitHub if you haven't already"
echo "  2. Push your code: git push -u origin main"
echo "  3. Set up GitHub Actions for CI/CD (optional)"
echo "  4. Configure branch protection rules (optional)"

# Show final git status
echo ""
print_info "Final git status:"
git status

print_status "Git repository is ready for GitHub!"