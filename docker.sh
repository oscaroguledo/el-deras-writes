#!/bin/bash

set -e

# Function to build Docker images
build_images() {
  echo "Building Docker images..."
  docker compose build
  echo "Docker images built successfully."
}

# Function to run database migrations
migrate_db() {
  echo "Running database migrations..."
  docker compose run --rm backend python manage.py migrate
  echo "Database migrations completed."
}

# Function to seed data (requires seed.py to be present)
seed_data() {
  echo "Seeding database with dummy data..."
  docker compose run --rm backend python seed.py
  echo "Database seeded successfully."
}

# Function to start Docker Compose services
start_services() {
  echo "Starting Docker Compose services..."
  docker compose up -d
  echo "Docker Compose services started."
}

# Main deployment function
deploy() {
  build_images
  start_services
  migrate_db
  # seed_data # Uncomment this line if you want to seed data during deployment
  echo "Deployment completed successfully."
}

# Handle script arguments
case "$1" in
  build)
    build_images
    ;;
  migrate)
    migrate_db
    ;;
  seed)
    seed_data
    ;;
  start)
    start_services
    ;;
  deploy)
    deploy
    ;;
  *)
    echo "Usage: $0 {build|migrate|seed|start|deploy}"
    exit 1
    ;;
esac