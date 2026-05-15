#!/bin/bash

# EduGame Docker Deployment Script
# This script builds and starts the application using Docker Compose.

set -e

echo "Starting Docker deployment process..."

# Ensure we are in the project root
if [ ! -f "docker-compose.yml" ]; then
    echo "Error: 'docker-compose.yml' not found. Please run this script from the project root."
    exit 1
fi

# Check for .env file, create from example if missing
if [ ! -f ".env" ]; then
    echo "Warning: .env file not found. Creating from .env.example..."
    cp .env.example .env
    echo "IMPORTANT: Please edit the .env file with your production settings."
fi

# Build and start the containers
echo "Stopping existing containers..."
docker-compose down

echo "Building and starting containers in detached mode..."
docker-compose up --build -d

echo "---------------------------------------------------"
echo "Deployment successful!"
echo "Backend is running on: http://localhost:8000"
echo "Frontend is running on: http://localhost:8080"
echo "---------------------------------------------------"
echo "NOTE: Remember to configure your host's Nginx/Apache"
echo "to reverse proxy edugame.korkusuz.gen.tr to port 8080."
echo "---------------------------------------------------"
