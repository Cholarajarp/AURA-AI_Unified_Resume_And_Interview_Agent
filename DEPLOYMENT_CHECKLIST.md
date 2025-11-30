# 📋 Deployment Checklist

## Pre-Deployment

- [ ] You have a Google Gemini API key (get from: https://ai.google.dev/pricing)
- [ ] You have a Render account (create at: https://render.com)
- [ ] Your code is pushed to GitHub
- [ ] All changes are committed: `git status` shows clean working tree

## Local Testing (Optional but Recommended)

- [ ] Docker is installed and running
- [ ] Run: `docker-compose up --build`
- [ ] Visit: `http://localhost:8000`
- [ ] Test upload, analyze, and interview features
- [ ] All working? ✅ Ready to deploy

## Render Deployment

### Step 1: Prepare GitHub
```bash
git add .
git commit -m "Ready for Render deployment"
git push origin main
```
- [ ] Changes pushed to GitHub

### Step 2: Create Render Service
- [ ] Log in to render.com with GitHub
- [ ] Click "New +" → "Web Service"
- [ ] Select your AURA repository
- [ ] Set Name: `aura-agent` (or preferred name)
- [ ] Environment: Docker
- [ ] Region: Pick closest to you
- [ ] Plan: Free (testing) or Paid (production)

### Step 3: Set Environment Variables
Click "Add Environment Variable" for each:

| Variable | Value |
|----------|-------|
| `GOOGLE_API_KEY` | your_actual_api_key |
| `LLM_MODEL` | `gemini-2.5-flash` |
| `ENVIRONMENT` | `production` |

- [ ] All variables added

### Step 4: Deploy
- [ ] Click "Create Web Service"
- [ ] Wait for build to complete (3-5 minutes)
- [ ] Watch logs for any errors
- [ ] Once it says "Your service is live", it's deployed! ✅

## Post-Deployment

- [ ] Visit your app URL: `https://aura-agent.onrender.com` (your actual URL)
- [ ] Frontend loads without errors
- [ ] Can upload a PDF resume
- [ ] Can enter job description
- [ ] Can analyze resume
- [ ] Can start interview
- [ ] Interview flow works end-to-end

## Troubleshooting

### If deployment fails, check:
1. **Build logs** in Render dashboard - look for errors
2. **GOOGLE_API_KEY is set** - most common issue
3. **Dockerfile syntax** - must be valid
4. **GitHub repo is public** or Render has access

### If frontend doesn't load:
- Check browser console for errors
- Check Render logs for 404 errors
- Verify frontend built successfully (see "dist" folder)

### If API calls fail:
- Check Render logs for Python errors
- Verify GOOGLE_API_KEY is set correctly
- Check browser network tab for failed requests

### If still stuck:
1. Check `DEPLOYMENT.md` for detailed info
2. Visit Render documentation: https://render.com/docs
3. Check FastAPI docs: https://fastapi.tiangolo.com/

## Monitoring

After deployment:
- [ ] Monitor Render dashboard logs
- [ ] Set up notifications for crashes
- [ ] Test regularly (cold starts on free tier)
- [ ] Monitor usage/costs

## Performance Tips

- **Free Tier**: Services spin down after 15 minutes of inactivity
- **Paid Tier**: Always on, better performance
- **First Request**: Might be slow due to cold start
- **Consider**: Upgrading to Pro for production use

---

**You're all set! 🚀**

Your AURA Agent is ready to be deployed to Render with both frontend and backend served from a single URL.
