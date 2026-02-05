# Deployment Guide for mycms.space

This guide covers all deployment options for mycms.space, from local development to production hosting.

---

## � Quick Start (Interactive Setup)

**New to mycms.space?** Use our interactive setup script:

```bash
# Run the interactive setup
./setup.sh
```

The script will guide you through:

1. **Supabase Setup** - Choose Cloud (recommended) or self-hosted
2. **Environment Configuration** - Automatic credential setup
3. **Application Build** - Optimized production build
4. **Docker Image** - Containerized for deployment
5. **EasyPanel Deployment** - VCS or manual deployment
6. **Verification** - Ensure everything is working

### Why Interactive Setup?

- **Beginner-friendly** - Step-by-step guidance
- **VCS Integration** - EasyPanel reads from your Git repo automatically
- **Auto-updates** - Latest version on every git push
- **Environment Variables** - Configured in EasyPanel UI
- **Supabase CLI** - Elegant database setup with `npx supabase db push`

---

## � Table of Contents

1. [Quick Start](#quick-start)
2. [Supabase Setup](#supabase-setup)
3. [Deployment Options](#deployment-options)
   - [Docker](#docker)
   - [Docker Compose](#docker-compose)
   - [EasyPanel](#easypanel)
   - [Vercel](#vercel)
   - [Netlify](#netlify)
   - [Render](#render)
4. [Environment Variables](#environment-variables)
5. [Troubleshooting](#troubleshooting)

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ or Bun 1.0+
- Docker (for Docker/EasyPanel deployments)
- Supabase account (free tier recommended)

### One-Command Setup

```bash
# Clone and setup
git clone https://github.com/yourusername/mycms-space.git
cd mycms-space

# Run deployment script
./deploy.sh

# Follow the interactive menu
```

The deployment script will guide you through:
1. Setting up Supabase
2. Configuring environment variables
3. Building the application
4. Deploying to your chosen platform

---

## 🗄️ Supabase Setup

### Option 1: Supabase Cloud (Recommended)

**Why Supabase Cloud?**
- Generous free tier (500MB database, 1GB bandwidth)
- No maintenance required
- Automatic backups
- Edge functions included
- Global CDN

**Setup Steps:**

1. **Create Account**
   ```bash
   # Visit https://supabase.com
   # Sign up for free account
   ```

2. **Create Project**
   ```bash
   # In Supabase dashboard:
   # 1. Click "New Project"
   # 2. Choose region (closest to you)
   # 3. Set database password (save it!)
   # 4. Wait for project to initialize (~2 minutes)
   ```

3. **Get Credentials**
   ```bash
   # In project settings:
   # 1. Go to Settings → API
   # 2. Copy Project URL
   # 3. Copy anon/public key
   ```

4. **Apply Migrations**
   ```bash
   # Install Supabase CLI
   npm install -g supabase

   # Link to your project
   npx supabase link --project-ref your-project-ref

   # Apply migrations
   npx supabase db push

   # Deploy edge functions
   npx supabase functions deploy
   ```

5. **Set Environment Variables**
   ```bash
   # Create .env file
   VITE_SUPABASE_URL=your-project-url
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```

### Option 2: Self-Hosted Supabase with Docker

**Why Self-Hosted?**
- Full control over data
- No limits
- Can run offline
- Custom configurations

**Setup Steps:**

```bash
# Using Docker Compose
docker-compose up -d supabase

# Access Supabase Studio
# http://localhost:54321

# Default credentials:
# Email: admin@example.com
# Password: admin123
```

**Important:** Self-hosted Supabase requires more maintenance. For most users, Supabase Cloud is recommended.

---

## 🐳 Docker

### Local Development

```bash
# Build and run
docker build -t mycms-space:latest .
docker run -d \
  --name mycms-space \
  -p 80:80 \
  -e VITE_SUPABASE_URL=$VITE_SUPABASE_URL \
  -e VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY \
  mycms-space:latest

# Access at http://localhost
```

### Production Deployment

```bash
# Build optimized image
docker build -t mycms-space:latest .

# Run with proper configuration
docker run -d \
  --name mycms-space \
  --restart unless-stopped \
  -p 80:80 \
  -p 443:443 \
  -e VITE_SUPABASE_URL=$VITE_SUPABASE_URL \
  -e VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY \
  -v /path/to/certs:/etc/nginx/certs \
  mycms-space:latest
```

### Docker Commands

```bash
# View logs
docker logs -f mycms-space

# Stop container
docker stop mycms-space

# Start container
docker start mycms-space

# Remove container
docker rm -f mycms-space

# Rebuild
docker build -t mycms-space:latest . && \
  docker rm -f mycms-space && \
  docker run -d --name mycms-space -p 80:80 \
  -e VITE_SUPABASE_URL=$VITE_SUPABASE_URL \
  -e VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY \
  mycms-space:latest
```

---

## 🐙 Docker Compose

### Quick Start

```bash
# Setup environment
cp .env.example .env
# Edit .env with your credentials

# Start all services
docker-compose up -d

# Access at http://localhost:3000
```

### Services

- **frontend** - mycms.space application (port 3000)
- **supabase** - Supabase local (ports 54321-54328)
- **nginx** - Reverse proxy (ports 80, 443)

### Commands

```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# View logs
docker-compose logs -f

# Rebuild
docker-compose up -d --build

# Scale frontend
docker-compose up -d --scale frontend=3
```

---

## 🎨 EasyPanel

### What is EasyPanel?

EasyPanel is a modern server management panel with Docker support. It provides:
- Beautiful web UI
- One-click deployments
- SSL certificates (Let's Encrypt)
- Domain management
- Resource monitoring
- **VCS Integration** - Auto-deploy from Git repository

### Recommended Workflow: VCS (Version Control System)

**Why VCS?**
- Always uses the latest version from your Git repository
- Auto-deploys on every push
- No manual Docker image management
- Easy rollback with git
- Perfect for continuous deployment

#### Step-by-Step VCS Setup

1. **Install EasyPanel**
   ```bash
   # Visit https://easypanel.io
   # Follow installation guide for your server
   ```

2. **Create Application from Git Repository**
   ```
   In EasyPanel:
   1. Click "Applications" → "Create"
   2. Choose "Git Repository"
   3. Enter your repository URL:
      https://github.com/yourusername/mycms-space.git
   4. Choose branch: main
   5. Click "Create"
   ```

3. **Configure Environment Variables**
   ```
   In EasyPanel application settings:
   1. Go to "Environment Variables"
   2. Add the following variables:
   
   VITE_SUPABASE_URL = https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY = your-anon-key
   ```

4. **Deploy**
   ```
   1. Click "Deploy"
   2. Wait for deployment to complete
   3. Click "Open" to access your site
   ```

5. **Configure Domain (Optional)**
   ```
   1. Go to "Domains" in application settings
   2. Add your domain (e.g., mycms.space)
   3. Enable SSL (automatic via Let's Encrypt)
   4. Save
   ```

#### Auto-Updates

After initial setup:
- Push to your Git repository
- EasyPanel automatically detects the update
- Rebuilds and redeploys
- Zero downtime (rolling updates)

### Alternative: Manual Docker Image

If you prefer manual control:

1. **Build and Push Image**
   ```bash
   docker build -t mycms-space:latest .
   docker tag mycms-space:latest your-registry/mycms-space:latest
   docker push your-registry/mycms-space:latest
   ```

2. **Create Application in EasyPanel**
   ```
   1. Click "Applications" → "Create"
   2. Choose "Docker Image"
   3. Enter image name: your-registry/mycms-space:latest
   4. Click "Create"
   ```

3. **Configure Environment Variables** (same as VCS)

4. **Deploy and Configure Domain** (same as VCS)

### EasyPanel Configuration

The `easypanel.json` file is pre-configured for mycms.space:

```json
{
  "version": "3",
  "services": [
    {
      "id": "mycms-frontend",
      "name": "mycms.space Frontend",
      "image": "mycms-space:latest",
      "ports": [{"containerPort": 80, "protocol": "tcp", "hostPort": 80}],
      "env": [
        {"key": "VITE_SUPABASE_URL", "value": "${VITE_SUPABASE_URL}"},
        {"key": "VITE_SUPABASE_ANON_KEY", "value": "${VITE_SUPABASE_ANON_KEY}"}
      ],
      "restart": "always",
      "healthCheck": {
        "test": ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost/"],
        "interval": 30,
        "timeout": 3,
        "retries": 3
      }
    }
  ]
}
```

---

## 🌐 Vercel

### Deployment

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
vercel --prod
```

### Environment Variables

In Vercel dashboard:
1. Go to Settings → Environment Variables
2. Add:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

### Build Settings

Vercel automatically detects the build settings:
- **Build Command:** `npm run build`
- **Output Directory:** `dist`

---

## 🚂 Railway

### Overview

Railway is a modern cloud platform that can host both your frontend and backend services. It's particularly good for:
- Full-stack deployments (frontend + database)
- Automatic scaling
- Built-in monitoring
- Easy environment variable management

### Option 1: Frontend on Railway + Supabase Cloud (Recommended)

**Why this setup?**
- Railway handles frontend deployment
- Supabase Cloud provides managed database, auth, and edge functions
- Best of both worlds: Easy frontend, robust backend

#### Deployment Steps

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Initialize project
railway init

# Set environment variables
railway variables set VITE_SUPABASE_URL=https://your-project.supabase.co
railway variables set VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key

# Deploy
railway up
```

#### Railway Configuration

Railway automatically detects the build settings:
- **Build Command:** `npm run build`
- **Output Directory:** `dist`
- **Port:** 80 (auto-detected)

#### Environment Variables

In Railway dashboard:
1. Go to Settings → Variables
2. Add:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`

### Option 2: Full Stack on Railway (Frontend + Self-Hosted Supabase)

**Note:** This requires more setup and maintenance. Supabase Cloud is recommended for most users.

Railway can host a self-hosted Supabase instance, but it's more complex:
- Requires manual Supabase setup
- Multiple services to manage (Studio, API, Auth, Realtime)
- More maintenance overhead
- No automatic backups like Supabase Cloud

**If you want full control**, Railway can host:
- Frontend (React/Vite)
- PostgreSQL database
- Supabase services (self-hosted)

See [Railway Supabase Template](https://railway.com/deploy/supabase) for details.

### Railway vs Supabase Cloud

| Feature | Railway + Supabase Cloud | Railway Full Stack |
|---------|-------------------------|-------------------|
| **Setup** | Easy (5 min) | Complex (30+ min) |
| **Maintenance** | Minimal | High |
| **Backups** | Automatic | Manual |
| **Edge Functions** | Included | Manual setup |
| **Studio UI** | Included | Manual setup |
| **Cost** | Free tier available | Higher cost |
| **Recommended** | ✅ Yes | ❌ For advanced users |

### Railway Features

**Pricing:**
- **Free Tier:** $5/month credit
- **Pro Tier:** $20/month
- **Team Tier:** Custom pricing

**Advantages:**
- Automatic HTTPS
- Built-in CI/CD
- Preview deployments
- Collaborative team features
- GitHub integration

**Disadvantages:**
- Free tier has limited resources
- Can be more expensive than EasyPanel for long-term
- Less control than self-hosting

### Deployment Workflow

```bash
# 1. Connect GitHub repository
railway init

# 2. Configure environment
railway variables set VITE_SUPABASE_URL=...
railway variables set VITE_SUPABASE_PUBLISHABLE_KEY=...

# 3. Deploy
railway up

# 4. Access your site
railway open
```

### Monitoring

Railway provides:
- Real-time logs
- Metrics (CPU, memory, network)
- Error tracking
- Deployment history

---

## 🌊 Netlify

### Deployment

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login
netlify login

# Deploy
netlify deploy --prod --dir=dist
```

### Configuration

Create `netlify.toml`:

```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[context.production.environment]
  VITE_SUPABASE_URL = "your-url"
  VITE_SUPABASE_ANON_KEY = "your-key"
```

---

## 🎬 Render

### Manual Setup

1. **Create Account**
   - Visit https://dashboard.render.com
   - Sign up

2. **Create Web Service**
   - Click "New" → "Web Service"
   - Connect your GitHub repository
   - Set build command: `npm run build`
   - Set publish directory: `dist`

3. **Environment Variables**
   - Add `VITE_SUPABASE_URL`
   - Add `VITE_SUPABASE_ANON_KEY`

4. **Deploy**
   - Click "Create Web Service"
   - Render will auto-deploy on push

---

### Environment Variables

#### User Secrets (Supabase Secrets)

**Important:** All API keys and secrets should be stored in Supabase secrets, not in environment variables. Users can add these securely via:

```bash
# Via Supabase CLI
supabase secrets set OPENAI_API_KEY=your-key
supabase secrets set FIRECRAWL_API_KEY=your-key
supabase secrets set RESEND_API_KEY=your-key

# Or via Supabase Dashboard
# Project Settings → Edge Functions → Secrets
```

**Available for Edge Functions:**
- `OPENAI_API_KEY` - AI chat capabilities
- `GEMINI_API_KEY` - Alternative AI provider
- `FIRECRAWL_API_KEY` - Web scraping
- `RESEND_API_KEY` - Email delivery
- `N8N_API_KEY` - Workflow automation

**Automatically Available:**
- `SUPABASE_URL` - Your project URL
- `SUPABASE_ANON_KEY` - Public key
- `SUPABASE_SERVICE_ROLE_KEY` - Admin access

### Build-Time Variables (Required)

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### Optional

```env
# AI Integration (for enhanced features)
VITE_OPENROUTER_API_KEY=your-key-here

# Future Integrations
VITE_N8N_WEBHOOK_URL=your-n8n-webhook-url
VITE_AIRTABLE_API_KEY=your-airtable-key
VITE_AIRTABLE_BASE_ID=your-base-id
```

### Getting Supabase Credentials

1. Go to https://supabase.com/dashboard
2. Select your project
3. Go to Settings → API
4. Copy:
   - Project URL
   - anon/public key

---

## 🛠️ Troubleshooting

### Docker Issues

**Problem: Container won't start**
```bash
# Check logs
docker logs mycms-space

# Check if port is in use
lsof -i :80

# Stop conflicting services
sudo systemctl stop nginx
```

**Problem: Environment variables not working**
```bash
# Verify .env file exists
cat .env

# Test variables
echo $VITE_SUPABASE_URL

# Rebuild with fresh env
docker-compose down
docker-compose up -d --build
```

### Supabase Issues

**Problem: Connection refused**
```bash
# Check if Supabase is running
docker ps | grep supabase

# Restart Supabase
docker-compose restart supabase

# Check logs
docker-compose logs supabase
```

**Problem: Migrations not applied**
```bash
# Check migration status
npx supabase db list

# Apply migrations
npx supabase db push

# Reset if needed
npx supabase db reset
```

### Build Issues

**Problem: Build fails**
```bash
# Clear cache
rm -rf node_modules .vite
npm install

# Check Node version
node --version  # Should be 18+

# Try with Bun (alternative)
bun install
bun run build
```

### Deployment Issues

**Problem: Vercel deployment fails**
```bash
# Check build logs in Vercel dashboard
# Ensure all dependencies are in package.json
# Verify environment variables

# Local test
npm run build
npm run preview
```

**Problem: Netlify redirects not working**
```bash
# Verify netlify.toml exists
# Check _redirects file in public/
# Test locally with netlify dev
netlify dev
```

---

## 📚 Additional Resources

- [Docker Documentation](https://docs.docker.com)
- [EasyPanel Documentation](https://easypanel.io/docs)
- [Vercel Documentation](https://vercel.com/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [mycms.space Architecture](./ARCHITECTURE.md)

---

## 💡 Tips

### Development vs Production

**Development:**
```bash
npm run dev
# Hot reload, fast refresh
```

**Production:**
```bash
npm run build
# Optimized, minified, cached
```

### Performance Optimization

- Use Supabase Cloud (free tier is generous)
- Enable CDN in your hosting platform
- Optimize images before upload
- Use lazy loading for blocks
- Enable gzip compression (included in nginx.conf)

### Security Best Practices

- Never commit `.env` file
- Use environment variables for secrets
- Enable HTTPS in production
- Set up firewall rules
- Regular updates of dependencies
- Use Row Level Security (RLS) in Supabase

### AI Configuration (Self-Hosting)

When self-hosting outside of Lovable Cloud, there are two separate AI configurations:

#### 1. Visitor Chat (n8n / Direct Providers)

For the visitor-facing chat widget:
- **n8n** - Full agentic capabilities with tool calls (Telegram, email, search, etc.)
- **OpenAI/Gemini/Lovable AI** - Direct API calls without tool calls

Configure in Admin → AI Chat → Integration.

#### 2. Admin AI Tools (Direct Providers Only)

For admin tools (Prompt Enhancer, Text Actions, Page Builder Chat):
- Does NOT support n8n (no tool calls needed)
- Configure separately in Admin → AI Chat → Admin AI Tools

| Provider | Secret Required | Notes |
|----------|-----------------|-------|
| OpenAI | `OPENAI_API_KEY` | Add to Supabase secrets |
| Gemini | `GEMINI_API_KEY` | Add to Supabase secrets |
| Lovable AI | Auto-configured | Only in Lovable Cloud |

**Setup steps:**

1. Go to Admin → AI Chat → Admin AI Tools
2. Select your AI provider (Lovable AI, OpenAI, or Gemini)
3. For OpenAI/Gemini: Add the API key as a Supabase secret:
   ```bash
   npx supabase secrets set OPENAI_API_KEY=sk-your-key
   # or
   npx supabase secrets set GEMINI_API_KEY=your-key
   ```

**Why separate configurations?**
- Visitor chat with n8n uses complex tool calls for external integrations
- Admin tools only need simple text-in/text-out operations
- This allows flexible configuration for different use cases

---

**Need Help?**
- Check [ARCHITECTURE.md](./ARCHITECTURE.md) for technical details
- Open an issue on GitHub
- Join our community discussions

**Happy Deploying!** 🚀
