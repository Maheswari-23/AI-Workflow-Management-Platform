# 🚀 Orchestr Production Deployment Guide

Complete guide to deploy Orchestr AI Workflow Platform to production.

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Configuration](#environment-configuration)
3. [Deployment Options](#deployment-options)
   - [Option 1: Vercel + Railway (Recommended)](#option-1-vercel--railway-recommended)
   - [Option 2: Docker Deployment](#option-2-docker-deployment)
   - [Option 3: VPS/Cloud Server](#option-3-vpscloud-server)
4. [Database Setup](#database-setup)
5. [Security Checklist](#security-checklist)
6. [Monitoring & Maintenance](#monitoring--maintenance)

---

## Prerequisites

Before deploying, ensure you have:

- Node.js 18+ installed
- Git repository access
- Domain name (optional but recommended)
- LLM API keys (OpenAI, Anthropic, Google, or Groq)
- SSL certificate (automatic with most platforms)

---

## Environment Configuration

### Production Environment Variables

Create a `.env.production` file:

```env
# Environment
NODE_ENV=production

# Backend Configuration
PORT=5000
BACKEND_URL=https://your-backend-domain.com

# Frontend Configuration
NEXT_PUBLIC_API_URL=https://your-backend-domain.com

# Database
SQLITE_DB_PATH=./data/workflow.db

# LLM Provider APIs (Add your keys)
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_API_KEY=...
GROQ_API_KEY=gsk_...

# Security
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
CORS_ORIGIN=https://your-frontend-domain.com

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

---

## Deployment Options

### Option 1: Vercel + Railway (Recommended)

**Best for:** Quick deployment, automatic scaling, zero DevOps

#### Step 1: Deploy Backend to Railway

1. Go to [Railway.app](https://railway.app)
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your repository
4. Configure:
   - **Root Directory:** `backend`
   - **Start Command:** `npm start`
   - **Port:** 5000

5. Add environment variables from `.env.production`
6. Deploy and copy the backend URL (e.g., `https://orchestr-backend.railway.app`)

#### Step 2: Deploy Frontend to Vercel

1. Go to [Vercel.com](https://vercel.com)
2. Click "New Project" → Import your repository
3. Configure:
   - **Framework Preset:** Next.js
   - **Root Directory:** `frontend`
   - **Build Command:** `npm run build`
   - **Output Directory:** `.next`

4. Add environment variables:
   ```
   BACKEND_URL=https://orchestr-backend.railway.app
   NEXT_PUBLIC_API_URL=https://orchestr-backend.railway.app
   ```

5. Deploy and get your frontend URL (e.g., `https://orchestr.vercel.app`)

#### Step 3: Update CORS

Go back to Railway and update:
```
CORS_ORIGIN=https://orchestr.vercel.app
```

**Cost:** Free tier available, ~$5-20/month for production

---

### Option 2: Docker Deployment

**Best for:** Self-hosting, full control, any cloud provider

#### Step 1: Build Docker Images

```bash
# Build backend
docker build -t orchestr-backend -f Dockerfile.backend .

# Build frontend
docker build -t orchestr-frontend -f Dockerfile.frontend .
```

#### Step 2: Deploy with Docker Compose

Use the provided `docker-compose.prod.yml`:

```bash
docker-compose -f docker-compose.prod.yml up -d
```

#### Step 3: Configure Reverse Proxy (Nginx)

See `nginx.conf` for configuration.

**Platforms:** AWS ECS, Google Cloud Run, DigitalOcean, Azure Container Instances

**Cost:** ~$10-50/month depending on provider

---

### Option 3: VPS/Cloud Server

**Best for:** Maximum control, custom requirements

#### Step 1: Server Setup

```bash
# SSH into your server
ssh user@your-server-ip

# Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 for process management
sudo npm install -g pm2

# Clone repository
git clone https://github.com/yourusername/orchestr.git
cd orchestr
```

#### Step 2: Install Dependencies

```bash
npm run install:all
```

#### Step 3: Build Applications

```bash
npm run build
```

#### Step 4: Configure PM2

Use the provided `ecosystem.config.js`:

```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

#### Step 5: Setup Nginx

```bash
sudo apt install nginx
sudo cp nginx.conf /etc/nginx/sites-available/orchestr
sudo ln -s /etc/nginx/sites-available/orchestr /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### Step 6: SSL Certificate (Let's Encrypt)

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

**Platforms:** DigitalOcean Droplets, AWS EC2, Linode, Vultr

**Cost:** ~$5-20/month

---

## Database Setup

### SQLite (Default - Recommended for Small/Medium Scale)

SQLite is included and requires no additional setup. Data is stored in `./data/workflow.db`.

**Backup Strategy:**
```bash
# Automated daily backups
0 2 * * * cp /path/to/data/workflow.db /path/to/backups/workflow-$(date +\%Y\%m\%d).db
```

### PostgreSQL (Optional - For Large Scale)

If you need PostgreSQL:

1. Update `backend/src/database/db.js` to use `pg` instead of `sqlite3`
2. Add to `.env.production`:
   ```
   DATABASE_URL=postgresql://user:password@host:5432/orchestr
   ```

---

## Security Checklist

Before going live, ensure:

- [ ] All API keys are in environment variables (not hardcoded)
- [ ] `.env` files are in `.gitignore`
- [ ] CORS is configured with your frontend domain only
- [ ] Rate limiting is enabled (already configured)
- [ ] Helmet.js security headers are active (already configured)
- [ ] HTTPS/SSL is enabled
- [ ] JWT_SECRET is strong and unique
- [ ] Database backups are automated
- [ ] Monitoring is set up
- [ ] Error logging is configured

---

## Monitoring & Maintenance

### Health Checks

Monitor these endpoints:
- Backend: `https://your-backend.com/api/health`
- Frontend: `https://your-frontend.com`

### Logging

**Backend logs:**
```bash
# PM2
pm2 logs orchestr-backend

# Docker
docker logs orchestr-backend

# Railway/Vercel
Check platform dashboard
```

### Performance Monitoring

Recommended tools:
- **Uptime:** UptimeRobot, Pingdom
- **APM:** New Relic, Datadog
- **Errors:** Sentry

### Backup Strategy

```bash
# Daily database backup script
#!/bin/bash
DATE=$(date +%Y%m%d)
cp /path/to/data/workflow.db /backups/workflow-$DATE.db
find /backups -name "workflow-*.db" -mtime +30 -delete
```

---

## Scaling Considerations

### When to Scale

- **Horizontal:** Multiple backend instances behind load balancer
- **Vertical:** Increase server resources (CPU/RAM)
- **Database:** Move to PostgreSQL with read replicas

### Load Balancing

For high traffic, use:
- AWS Application Load Balancer
- Nginx load balancing
- Cloudflare

---

## Troubleshooting

### Common Issues

**1. CORS Errors**
- Ensure `CORS_ORIGIN` matches your frontend URL exactly
- Include protocol (https://)

**2. Database Connection**
- Check file permissions on `workflow.db`
- Ensure directory exists: `mkdir -p data`

**3. API Keys Not Working**
- Verify environment variables are loaded
- Check for typos in variable names

**4. Build Failures**
- Clear cache: `rm -rf .next node_modules`
- Reinstall: `npm install`

---

## Support & Resources

- **Documentation:** See `/docs` folder
- **Issues:** GitHub Issues
- **Community:** Discord/Slack (if available)

---

## Quick Start Commands

```bash
# Local development
npm run dev

# Production build
npm run build

# Start production
npm start

# Deploy with Docker
docker-compose -f docker-compose.prod.yml up -d

# Deploy with PM2
pm2 start ecosystem.config.js
```

---

**Last Updated:** March 31, 2026
**Version:** 1.0.0
**Status:** Production Ready ✅
