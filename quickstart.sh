#!/bin/bash

# Quick start script for local development with Docker

set -e

echo "AURA Agent - Quick Start with Docker"
echo "===================================="
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "Error: Docker is not installed"
    echo "Please install Docker from https://www.docker.com/products/docker-desktop"
    exit 1
fi

echo "Checking for GOOGLE_API_KEY..."
if [ -z "$GOOGLE_API_KEY" ]; then
    echo "Warning: GOOGLE_API_KEY environment variable not set"
    echo "Set it before running docker-compose:"
    echo "  export GOOGLE_API_KEY=your_api_key"
    echo ""
    read -p "Enter GOOGLE_API_KEY (or press Enter to skip): " API_KEY
    if [ ! -z "$API_KEY" ]; then
        export GOOGLE_API_KEY=$API_KEY
    fi
fi

echo ""
echo "Building Docker image..."
docker-compose build

echo ""
echo "Starting services..."
docker-compose up

echo ""
echo "Services running at http://localhost:8000"
