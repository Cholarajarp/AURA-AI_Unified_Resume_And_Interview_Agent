#!/bin/bash

# Build script for Docker deployment
# This builds a unified Docker image with both frontend and backend

set -e

echo "Building AURA Agent - Unified Docker Image"
echo "=========================================="

# Build the Docker image
docker build -t aura-agent:latest .

echo ""
echo "Build complete!"
echo ""
echo "To run locally:"
echo "  docker run --rm -p 8000:8000 -e GOOGLE_API_KEY=your_key aura-agent:latest"
echo ""
echo "To deploy to Render:"
echo "  1. Push to GitHub"
echo "  2. Connect your repo to Render"
echo "  3. Create new Web Service"
echo "  4. Set GOOGLE_API_KEY environment variable"
echo "  5. Deploy!"
