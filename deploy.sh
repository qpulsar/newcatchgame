#!/bin/bash

# EduGame Deployment Script
# This script builds the frontend and copies it to the production directory.

set -e

echo "Starting frontend build process..."

# Navigate to frontend directory
cd apps/web-game

# Install dependencies if necessary
# npm install

# Build the project
npm run build

echo "Build successful. Copying files to production directory..."

# Target directory
TARGET_DIR="/home/korkusuz/domains/edugame.korkusuz.gen.tr/public_html"

# Ensure the target directory exists
mkdir -p "$TARGET_DIR"

# Copy the contents of the dist folder to the target directory
cp -r dist/* "$TARGET_DIR"

echo "Deployment completed successfully! Frontend is now in $TARGET_DIR"
