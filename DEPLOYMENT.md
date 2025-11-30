# AURA Agent - Render Deployment Guide

This project is configured for unified deployment on Render with both backend and frontend served from a single URL.

## Architecture

- **Frontend**: React + Vite application built into static files
- **Backend**: FastAPI application serving both API endpoints and frontend static files
- **Single Docker Image**: Combines both in one container

## Local Testing with Docker

### Prerequisites
- Docker installed
- GOOGLE_API_KEY environment variable set

### Build and Run Locally

```bash
# Build the Docker image
docker build -t aura-agent:latest .

# Run the container
docker run --rm -p 8000:8000 -e GOOGLE_API_KEY=your_api_key aura-agent:latest
```

Then visit `http://localhost:8000` in your browser.

### Using Docker Compose (Development)

```bash
# Set your API key
export GOOGLE_API_KEY=your_api_key

# Build and run
docker-compose up --build
```

## Deployment to Render

### Step 1: Push to GitHub
```bash
git add .
git commit -m "Prepare for Render deployment"
git push origin main
```

### Step 2: Connect to Render

1. Go to [render.com](https://render.com)
2. Sign in with GitHub
3. Click "New +" → "Web Service"
4. Select your repository
5. Use these settings:
   - **Name**: `aura-agent` (or your preferred name)
   - **Environment**: Docker
   - **Build Command**: (leave empty - uses Dockerfile)
   - **Start Command**: (leave empty - uses Dockerfile)
   - **Plan**: Free or Paid (recommended for reliability)

### Step 3: Set Environment Variables

In the Render dashboard, add these environment variables:

- `GOOGLE_API_KEY`: Your Google Gemini API key
- `LLM_MODEL`: `gemini-2.5-flash` (or your preferred model)
- `ENVIRONMENT`: `production`

### Step 4: Deploy

Click "Create Web Service" and Render will automatically build and deploy your application.

## Accessing Your Deployment

Once deployed, your application will be available at:
```
https://aura-agent.onrender.com
```

(The exact URL depends on your service name and Render's current URL scheme)

## How It Works

1. **Build Stage**: The Dockerfile first builds the React frontend into static files
2. **Backend Stage**: Then it builds the backend with the static files included
3. **Serving**: The backend (FastAPI) serves:
   - Frontend at `/` and all other static routes
   - API endpoints at `/upload`, `/analyze`, `/start_interview`, etc.

## Key Changes Made

### Backend (main.py)
- Added `StaticFiles` import from FastAPI
- Mounted the built frontend at the root path
- Updated CORS to allow same-origin requests

### Dockerfile
- Multi-stage build: builds frontend first, then backend
- Copies built frontend into backend's static directory

### docker-compose.yml
- Simplified to single service instead of separate backend/frontend
- Uses unified Dockerfile

### render.yaml
- Configured for Docker deployment on Render
- Includes environment variable settings

## Troubleshooting

### Frontend not loading
- Check that frontend build completed in Docker logs
- Verify `frontend/dist` directory exists in Docker image

### API calls failing
- Ensure GOOGLE_API_KEY is set
- Check browser console for CORS errors
- Verify backend is running (should see it in logs)

### Build taking too long
- Render free tier builds can be slow
- Consider upgrading to a paid plan

## Production Considerations

1. **Cold Starts**: Free tier services spin down after 15 minutes of inactivity
2. **Database**: Currently using in-memory sessions (lost on restart)
3. **File Storage**: Using local `/data` directory (lost on restart)
4. **Performance**: Consider caching, CDN, etc. for production scale

For production deployments, consider:
- Using a persistent database (PostgreSQL, MongoDB)
- Adding a file storage service (AWS S3, Cloudinary)
- Using a paid Render plan for better performance
- Adding error tracking (Sentry)
- Adding analytics

## Support

For issues with:
- **Render**: Check [Render docs](https://render.com/docs)
- **FastAPI**: Check [FastAPI docs](https://fastapi.tiangolo.com/)
- **Docker**: Check [Docker docs](https://docs.docker.com/)
