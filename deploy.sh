#!/bin/bash

# EduGame Docker Deployment Script
# This script builds and starts the application using Docker Compose.

set -e

COMPOSE_CMD="docker compose"
API_HEALTHCHECK_RETRIES=30
API_HEALTHCHECK_INTERVAL=2

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

wait_for_api() {
    echo "Waiting for API container to become ready..."

    for attempt in $(seq 1 "$API_HEALTHCHECK_RETRIES"); do
        if $COMPOSE_CMD exec -T api python -c "
from main import app
print('api-ready')
" >/dev/null 2>&1; then
            echo "API container is ready."
            return 0
        fi

        echo "API not ready yet (${attempt}/${API_HEALTHCHECK_RETRIES}). Retrying in ${API_HEALTHCHECK_INTERVAL}s..."
        sleep "$API_HEALTHCHECK_INTERVAL"
    done

    echo "ERROR: API container did not become ready in time."
    $COMPOSE_CMD logs --tail=100 api || true
    exit 1
}

run_safe_migration() {
    echo "Running safe database migration..."

    if ! $COMPOSE_CMD exec -T api python -c "
from main import ensure_legacy_schema_columns
ensure_legacy_schema_columns()
print('Safe migration completed.')
"; then
        echo "ERROR: Safe migration failed. Recent API logs:"
        $COMPOSE_CMD logs --tail=100 api || true
        exit 1
    fi
}

# Build and start the containers
echo "Stopping existing containers..."
$COMPOSE_CMD down

echo "Building and starting containers in detached mode..."
$COMPOSE_CMD up --build -d

wait_for_api
run_safe_migration

echo "---------------------------------------------------"
echo "Deployment successful!"
echo "Backend is running on: http://localhost:8000"
echo "Frontend is running on: http://localhost:8080"
echo "---------------------------------------------------"
echo "NOTE: Remember to configure your host's Nginx/Apache"
echo "to reverse proxy edugame.korkusuz.gen.tr to port 8080."
echo "---------------------------------------------------"
