# 🚀 Quick Start: Deploy Orchestr to Production

Get Orchestr running in production in under 15 minutes!

---

## Choose Your Deployment Method

### 🌟 Option 1: Vercel + Railway (Easiest - Recommended)

**Time:** 10 minutes | **Cost:** Free tier available | **Difficulty:** ⭐

#### Step 1: Deploy Backend to Railway (5 min)

1. **Sign up:** Go to [railway.app](https://railway.app) and sign in with GitHub
2. **New Project:** Click "New Project" → "Deploy from GitHub repo"
3. **Select Repo:** Choose your Orchestr repository
4. **Configure:**
   - Click "Add variables" and paste these:
   ```
   NODE_ENV=production
   PORT=5000
   JWT_SECRET=your-random-32-char-secret-here
   GROQ_API_KEY=your-groq-api-key
   CORS_ORIGIN=https://your-app.vercel.app
   ```
5. **Settings:**
   - Root Directory: `backend`
   - Start Command: `npm start`
6. **Deploy:** Click "Deploy" and wait 2-3 minutes
7. **Copy URL:** Copy your backend URL (e.g., `orchestr-backend.up.railway.app`)

#### Step 2: Deploy Frontend to Vercel (5 min)

1. **Sign up:** Go to [vercel.com](https://vercel.com) and sign in with GitHub
2. **Import:** Click "New Project" → Import your repository
3. **Configure:**
   - Framework: Next.js (auto-detected)
   - Root Directory: `frontend`
   - Build Command: `npm run build`
4. **Environment Variables:** Add these:
   ```
   BACKEND_URL=https://your-backend.railway.app
   NEXT_PUBLIC_API_URL=https://your-backend.railway.app
   ```
5. **Deploy:** Click "Deploy" and wait 2-3 minutes
6. **Done!** Your app is live at `https://your-app.vercel.app`

#### Step 3: Update CORS (1 min)

1. Go back to Railway
2. Update `CORS_ORIGIN` to your Vercel URL
3. Redeploy backend

**✅ You're live!** Visit your Vercel URL to use Orchestr.

---

### 🐳 Option 2: Docker (Any Cloud Provider)

**Time:** 15 minutes | **Cost:** ~$10-20/month | **Difficulty:** ⭐⭐

#### Prerequisites
- Docker and Docker Compose installed
- A server (DigitalOcean, AWS, Google Cloud, etc.)

#### Step 1: Clone and Configure

```bash
# SSH into your server
ssh user@your-server-ip

# Clone repository
git clone https://github.com/yourusername/orchestr.git
cd orchestr

# Create production environment file
cp .env.production.example .env.production
nano .env.production  # Edit with your values
```

#### Step 2: Build and Deploy

```bash
# Build Docker images
npm run docker:build

# Start containers
npm run docker:up

# Check logs
npm run docker:logs
```

#### Step 3: Setup Domain (Optional)

```bash
# Install Nginx
sudo apt install nginx certbot python3-certbot-nginx

# Copy Nginx config
sudo cp nginx.conf /etc/nginx/sites-available/orchestr
sudo ln -s /etc/nginx/sites-available/orchestr /etc/nginx/sites-enabled/

# Get SSL certificate
sudo certbot --nginx -d your-domain.com

# Restart Nginx
sudo systemctl restart nginx
```

**✅ Done!** Visit `https://your-domain.com`

---

### 🖥️ Option 3: VPS with PM2

**Time:** 20 minutes | **Cost:** ~$5-10/month | **Difficulty:** ⭐⭐⭐

#### Step 1: Server Setup

```bash
# SSH into server
ssh user@your-server-ip

# Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2
sudo npm install -g pm2

# Clone repository
git clone https://github.com/yourusername/orchestr.git
cd orchestr
```

#### Step 2: Install and Build

```bash
# Install dependencies
npm run install:all

# Create production env
cp .env.production.example .env.production
nano .env.production  # Edit with your values

# Build applications
npm run build
```

#### Step 3: Start with PM2

```bash
# Start applications
npm run pm2:start

# Save PM2 config
pm2 save

# Setup auto-restart on reboot
pm2 startup

# Check status
pm2 status
```

#### Step 4: Setup Nginx + SSL

```bash
# Install Nginx
sudo apt install nginx

# Copy config
sudo cp nginx.conf /etc/nginx/sites-available/orchestr
sudo ln -s /etc/nginx/sites-available/orchestr /etc/nginx/sites-enabled/

# Update domain in config
sudo nano /etc/nginx/sites-available/orchestr

# Test and restart
sudo nginx -t
sudo systemctl restart nginx

# Get SSL certificate
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

**✅ Done!** Visit `https://your-domain.com`

---

## 🔑 Getting API Keys

You'll need at least one LLM provider API key:

### Groq (Recommended - Free Tier)
1. Go to [console.groq.com](https://console.groq.com)
2. Sign up and create an API key
3. Copy key starting with `gsk_...`

### OpenAI
1. Go to [platform.openai.com](https://platform.openai.com)
2. Create account and add payment method
3. Generate API key starting with `sk-...`

### Anthropic (Claude)
1. Go to [console.anthropic.com](https://console.anthropic.com)
2. Sign up and add payment
3. Create key starting with `sk-ant-...`

---

## ✅ Pre-Deployment Checklist

Run this before deploying:

```bash
npm run deploy:check
```

This checks:
- ✓ Node.js version
- ✓ Environment variables
- ✓ Dependencies installed
- ✓ No hardcoded secrets
- ✓ Security headers enabled
- ✓ CORS configured

---

## 🔧 Common Issues

### CORS Errors
**Problem:** Frontend can't connect to backend

**Solution:**
```bash
# In backend .env.production
CORS_ORIGIN=https://your-exact-frontend-url.com
# No trailing slash!
```

### Database Not Found
**Problem:** `SQLITE_OPEN_READONLY` error

**Solution:**
```bash
# Create data directory
mkdir -p data
chmod 755 data
```

### Port Already in Use
**Problem:** `EADDRINUSE: address already in use`

**Solution:**
```bash
# Find and kill process
sudo lsof -i :5000
sudo kill -9 <PID>
```

---

## 📊 Monitoring Your Deployment

### Health Checks

```bash
# Backend health
curl https://your-backend.com/api/health

# Should return:
# {"status":"OK","message":"AI Workflow Platform API is running"}
```

### View Logs

**Railway:** Dashboard → Deployments → View Logs

**Vercel:** Dashboard → Deployments → Function Logs

**Docker:**
```bash
npm run docker:logs
```

**PM2:**
```bash
npm run pm2:logs
```

---

## 🎯 Next Steps

After deployment:

1. **Test the app:** Create a test workflow
2. **Setup monitoring:** Add UptimeRobot or Pingdom
3. **Configure backups:** See `DEPLOYMENT.md` for backup scripts
4. **Add custom domain:** Configure in Vercel/Railway settings
5. **Enable analytics:** Add Google Analytics (optional)

---

## 💰 Cost Estimates

| Option | Monthly Cost | Best For |
|--------|-------------|----------|
| Vercel + Railway | $0-20 | Small teams, testing |
| Docker (DigitalOcean) | $10-20 | Medium usage |
| VPS (Linode/Vultr) | $5-15 | Full control |
| AWS/GCP | $20-100+ | Enterprise scale |

---

## 🆘 Need Help?

- **Documentation:** See `DEPLOYMENT.md` for detailed guide
- **Issues:** Check GitHub Issues
- **Security:** See `DEPLOYMENT.md` security checklist

---

**Ready to deploy?** Pick an option above and follow the steps!

**Last Updated:** March 31, 2026
