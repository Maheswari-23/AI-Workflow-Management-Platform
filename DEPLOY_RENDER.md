# 🚀 Deploy Orchestr to Render

Deploy Orchestr to Render in 10 minutes with their generous free tier!

## Why Render?

- ✅ Free tier (750 hours/month per service)
- ✅ Automatic HTTPS/SSL
- ✅ Auto-deploy from GitHub
- ✅ Persistent disk storage
- ✅ Easy environment variables
- ✅ Built-in health checks

---

## Quick Deploy (10 Minutes)

### Step 1: Prepare Your Repository

1. Make sure all changes are committed and pushed to GitHub
2. Your repository should have the `render.yaml` file (already included)

### Step 2: Deploy Backend

1. Go to [render.com](https://render.com) and sign up/login with GitHub
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository
4. Configure:
   - **Name:** `orchestr-backend`
   - **Region:** Oregon (or closest to you)
   - **Branch:** `main`
   - **Root Directory:** `backend`
   - **Environment:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Plan:** Free

5. Add Environment Variables (click "Advanced"):

   ```
   NODE_ENV=production
   PORT=5000
   SQLITE_DB_PATH=/opt/render/project/src/data/workflow.db
   JWT_SECRET=your-random-32-char-secret-here
   GROQ_API_KEY=your-groq-api-key
   CORS_ORIGIN=https://orchestr-frontend.onrender.com
   ```

6. Add Persistent Disk:
   - Click "Add Disk"
   - **Name:** `orchestr-data`
   - **Mount Path:** `/opt/render/project/src/data`
   - **Size:** 1 GB (free tier)

7. Click **"Create Web Service"**
8. Wait 3-5 minutes for deployment
9. Copy your backend URL (e.g., `https://orchestr-backend.onrender.com`)

### Step 3: Deploy Frontend

1. Click **"New +"** → **"Web Service"** again
2. Select same repository
3. Configure:
   - **Name:** `orchestr-frontend`
   - **Region:** Oregon (same as backend)
   - **Branch:** `main`
   - **Root Directory:** `frontend`
   - **Environment:** `Node`
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`
   - **Plan:** Free

4. Add Environment Variables:
   ```
   NODE_ENV=production
   BACKEND_URL=https://orchestr-backend.onrender.com
   NEXT_PUBLIC_API_URL=https://orchestr-backend.onrender.com
   ```
   (Replace with your actual backend URL from Step 2)

5. Click **"Create Web Service"**
6. Wait 3-5 minutes for deployment

### Step 4: Update CORS

1. Go back to your backend service
2. Update environment variable:
   ```
   CORS_ORIGIN=https://orchestr-frontend.onrender.com
   ```
   (Replace with your actual frontend URL)
3. Save changes (service will auto-redeploy)

### Step 5: Test Your Deployment

1. Visit your frontend URL: `https://orchestr-frontend.onrender.com`
2. Create a test agent
3. Run a simple workflow
4. Check backend health: `https://orchestr-backend.onrender.com/api/health`

---

## 🔑 Getting API Keys

Add at least one LLM provider key:

**Groq (Recommended - Free Tier):**
1. Go to [console.groq.com](https://console.groq.com)
2. Sign up and create API key
3. Copy key starting with `gsk_...`
4. Add to backend environment variables

**Other Providers:**
- OpenAI: [platform.openai.com](https://platform.openai.com)
- Anthropic: [console.anthropic.com](https://console.anthropic.com)
- Google: [makersuite.google.com](https://makersuite.google.com)

---

## 📊 Render Free Tier Limits

- **750 hours/month** per service (enough for 24/7 uptime)
- **512 MB RAM** per service
- **1 GB disk** storage (free)
- **100 GB bandwidth/month**
- Services spin down after 15 min of inactivity (cold starts ~30 sec)

**Upgrade to Starter ($7/month) for:**
- No spin down
- More RAM (1 GB)
- Faster builds

---

## 🔧 Configuration Files

### Backend Environment Variables

Required:
```
NODE_ENV=production
PORT=5000
SQLITE_DB_PATH=/opt/render/project/src/data/workflow.db
JWT_SECRET=<generate-random-32-chars>
CORS_ORIGIN=https://your-frontend.onrender.com
```

Optional (at least one LLM key):
```
GROQ_API_KEY=gsk_...
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_API_KEY=...
```

### Frontend Environment Variables

```
NODE_ENV=production
BACKEND_URL=https://your-backend.onrender.com
NEXT_PUBLIC_API_URL=https://your-backend.onrender.com
```

---

## 🚨 Common Issues

### Issue 1: CORS Errors

**Problem:** Frontend can't connect to backend

**Solution:**
- Ensure `CORS_ORIGIN` in backend matches frontend URL exactly
- Include `https://` protocol
- No trailing slash

### Issue 2: Database Not Persisting

**Problem:** Data lost after redeploy

**Solution:**
- Ensure persistent disk is added to backend service
- Mount path: `/opt/render/project/src/data`
- Check `SQLITE_DB_PATH` points to mounted disk

### Issue 3: Cold Starts

**Problem:** First request takes 30+ seconds

**Solution:**
- This is normal on free tier (services spin down)
- Upgrade to Starter plan ($7/month) for always-on
- Or use a cron job to ping every 10 minutes

### Issue 4: Build Failures

**Problem:** Deployment fails during build

**Solution:**
```bash
# Check build commands are correct:
Backend: npm install
Frontend: npm install && npm run build

# Check root directories:
Backend: backend
Frontend: frontend
```

---

## 📈 Monitoring

### Health Checks

Render automatically monitors:
- Backend: `/api/health` endpoint
- Auto-restart on failures

### View Logs

1. Go to your service dashboard
2. Click "Logs" tab
3. View real-time logs

### Metrics

Dashboard shows:
- CPU usage
- Memory usage
- Request count
- Response times

---

## 🔄 Auto-Deploy from GitHub

Render automatically deploys when you push to GitHub:

1. Make changes locally
2. Commit and push:
   ```bash
   git add .
   git commit -m "Update feature"
   git push origin main
   ```
3. Render auto-deploys in 2-3 minutes

### Disable Auto-Deploy

In service settings:
- Uncheck "Auto-Deploy"
- Deploy manually from dashboard

---

## 💰 Cost Estimate

**Free Tier (Recommended for testing):**
- Backend: Free (750 hrs/month)
- Frontend: Free (750 hrs/month)
- Disk: Free (1 GB)
- **Total: $0/month**

**Starter Plan (Production):**
- Backend: $7/month (always-on)
- Frontend: $7/month (always-on)
- Disk: Free (1 GB)
- **Total: $14/month**

---

## 🎯 Next Steps

After deployment:

1. **Custom Domain** (optional):
   - Go to service settings
   - Add custom domain
   - Update DNS records

2. **Environment Secrets**:
   - Use Render's secret files for sensitive data
   - Add `.env` as secret file

3. **Monitoring**:
   - Set up UptimeRobot for external monitoring
   - Configure Render notifications

4. **Backups**:
   - Download disk snapshots regularly
   - Use Render's backup feature

---

## 📚 Resources

- [Render Documentation](https://render.com/docs)
- [Render Status](https://status.render.com)
- [Render Community](https://community.render.com)

---

## ✅ Deployment Checklist

Before going live:

- [ ] Backend deployed and healthy
- [ ] Frontend deployed and accessible
- [ ] CORS configured correctly
- [ ] At least one LLM API key added
- [ ] Persistent disk attached to backend
- [ ] Environment variables set
- [ ] Health check passing
- [ ] Test workflow runs successfully
- [ ] Custom domain configured (optional)

---

**Deployment Time:** ~10 minutes  
**Cost:** Free tier available  
**Difficulty:** ⭐ (Very Easy)

🎉 **You're ready to deploy!** Follow the steps above and you'll be live in 10 minutes.
