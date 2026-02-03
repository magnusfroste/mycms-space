# mycms.space

**An AI-native personal CMS for your digital presence**

mycms.space is a self-hosted, AI-powered content management system designed to give everyone a beautiful, professional digital presence. Built with agentic AI capabilities at its core, it enables you to manage your portfolio, blog, and online identity with intelligent assistance.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## 🌟 Vision

Everyone deserves to present themselves beautifully online. mycms.space combines modern web technologies with AI-native features to create a personal CMS where:

- **AI agents** help you manage and enhance your content
- **Self-hosting** gives you full control of your digital presence
- **Beautiful design** ensures everyone looks professional
- **Block-based architecture** makes customization simple and flexible

---

## ✨ Features

### Core Capabilities
- 🎨 **Block-based page builder** - Compose pages with reusable, configurable blocks
- 🤖 **AI-powered chat assistant** - Get help managing your content
- 📝 **Blog with Markdown support** - Write and publish with ease
- 🎯 **Project portfolio** - Showcase your work beautifully
- 📊 **Analytics tracking** - Understand your audience
- 🌓 **Dark/light mode** - Automatic theme switching
- 📱 **Fully responsive** - Perfect on all devices

### AI-Native Features
- **Page Builder Chat** - AI assistant for content creation
- **Text Enhancement** - AI-powered content improvement
- **Smart scraping** - Extract content from URLs with Firecrawl
- **Newsletter automation** - AI-assisted communications

### Technical Highlights
- **Data-Model-View architecture** - Clean separation of concerns
- **JSONB block storage** - Flexible, version-controlled content
- **Real-time updates** - Supabase realtime subscriptions
- **Type-safe** - Full TypeScript coverage
- **Modern UI** - Built with shadcn/ui and Tailwind CSS

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ or **Bun** 1.0+
- **Supabase** account (free tier works)
- **Git**

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/mycms-space.git
   cd mycms-space
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   bun install
   ```

3. **Set up Supabase**
   
   Create a new Supabase project at [supabase.com](https://supabase.com)
   
   Run the migrations:
   ```bash
   npx supabase link --project-ref your-project-ref
   npx supabase db push
   ```

4. **Configure environment variables**
   
   Create a `.env` file:
   ```env
   VITE_SUPABASE_URL=your-supabase-url
   VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```

5. **Start the development server**
   ```bash
   npm run dev
   # or
   bun dev
   ```

   Visit `http://localhost:5173`

---

## 🏗️ Architecture

mycms.space follows a **Data-Model-View (DMV)** architecture pattern:

```
┌─────────────────────────────────────────┐
│  VIEW LAYER (src/components/)           │
│  Pure UI components, no business logic  │
└─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────┐
│  MODEL LAYER (src/models/)              │
│  React Query hooks, business logic      │
└─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────┐
│  DATA LAYER (src/data/)                 │
│  Pure API calls to Supabase             │
└─────────────────────────────────────────┘
```

### Block-Based Content

All page content is stored as JSONB in the `page_blocks` table, providing:
- **Flexibility** - Add new block types without migrations
- **Version control** - Automatic history tracking
- **AI-friendly** - Simple JSON structure for AI agents
- **Performance** - Single table for all content

See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for detailed documentation.

---

## 📦 Tech Stack

### Frontend
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **TanStack Query** - Data fetching and caching
- **React Router** - Navigation
- **shadcn/ui** - Component library
- **Tailwind CSS** - Styling
- **Lucide React** - Icons

### Backend
- **Supabase** - Backend as a service
  - PostgreSQL database
  - Authentication
  - Storage
  - Edge Functions (Deno)
  - Realtime subscriptions

### AI Integration
- Edge Functions for AI capabilities
- OpenAI API integration
- Firecrawl for web scraping

---

## 🛠️ Self-Hosting & Deployment

mycms.space supports multiple deployment options, from local development to production hosting.

### Quick Start (Interactive Setup)

**New to mycms.space?** Use our interactive setup script:

```bash
# Clone and setup
git clone https://github.com/yourusername/mycms-space.git
cd mycms-space

# Run interactive setup
./setup.sh
```

The script guides you through:
1. **Supabase Setup** - Choose Cloud (recommended) or self-hosted
2. **Environment Configuration** - Automatic credential setup
3. **Application Build** - Optimized production build
4. **Docker Image** - Containerized for deployment
5. **EasyPanel Deployment** - VCS integration with auto-updates
6. **Verification** - Ensure everything is working

### Why Interactive Setup?

- **Beginner-friendly** - Step-by-step guidance
- **VCS Integration** - EasyPanel reads from your Git repo automatically
- **Auto-updates** - Latest version on every git push
- **Environment Variables** - Configured in EasyPanel UI
- **Supabase CLI** - Elegant database setup with `npx supabase db push`

### Deployment Options

#### 1. Docker (Recommended for Self-Hosting)

**Best for:** Full control, offline capability, custom servers

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

**Features:**
- Multi-stage build for optimal image size
- Nginx with gzip compression
- Health checks
- Production-ready configuration

#### 2. Docker Compose (Local Development)

**Best for:** Local development with all services

```bash
# Start all services (frontend + Supabase)
docker-compose up -d

# Access at http://localhost:3000
# Supabase Studio at http://localhost:54321
```

**Services:**
- Frontend (mycms.space)
- Supabase (optional local instance)
- Nginx (reverse proxy)

#### 3. EasyPanel (Modern Server Management)

**Best for:** Beautiful UI, one-click deployments, SSL automation, VCS integration

**Recommended Workflow: VCS (Version Control System)**

EasyPanel reads directly from your Git repository and auto-deploys on every push:

```
In EasyPanel:
1. Click "Applications" → "Create"
2. Choose "Git Repository"
3. Enter repository: https://github.com/yourusername/mycms-space.git
4. Choose branch: main
5. Click "Create"
6. Add environment variables:
   - VITE_SUPABASE_URL
   - VITE_SUPABASE_ANON_KEY
7. Click "Deploy"
```

**Auto-Updates:**
- Push to Git → EasyPanel detects → Auto-rebuilds → Zero downtime

**Alternative: Manual Docker Image**
```bash
easypanel install easypanel.json
```

**Features:**
- Web-based management
- Automatic SSL (Let's Encrypt)
- Domain management
- Resource monitoring
- VCS integration (recommended)

#### 4. Vercel (Cloud Hosting)

**Best for:** Zero-config deployment, global CDN

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod
```

**Setup:**
- Automatic build detection
- Global CDN
- Preview deployments
- Environment variables in dashboard

#### 5. Netlify (Cloud Hosting)

**Best for:** Continuous deployment, form handling

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Deploy
netlify deploy --prod --dir=dist
```

#### 6. Render (Cloud Hosting)

**Best for:** Docker support, free tier

**Manual Setup:**
1. Create account at https://dashboard.render.com
2. Connect GitHub repository
3. Set build command: `npm run build`
4. Set publish directory: `dist`
5. Add environment variables
6. Deploy

### Supabase Setup

#### Option 1: Supabase Cloud (Recommended)

**Why Supabase Cloud?**
- Generous free tier (500MB database, 1GB bandwidth)
- No maintenance required
- Automatic backups
- Edge functions included
- Global CDN

**Elegant CLI Setup:**

```bash
# 1. Create account at https://supabase.com
# 2. Create new project
# 3. Install Supabase CLI
npm install -g supabase

# 4. Link to project (one command!)
npx supabase link --project-ref your-project-ref

# 5. Apply migrations (one command!)
npx supabase db push

# 6. Deploy edge functions (one command!)
npx supabase functions deploy

# 7. Copy credentials to .env
# VITE_SUPABASE_URL=your-project-url
# VITE_SUPABASE_ANON_KEY=your-anon-key
```

**That's it!** Your Supabase backend is ready with:
- Database schema
- Row Level Security (RLS)
- Edge functions deployed
- All tables configured

#### Option 2: Self-Hosted Supabase (Docker)

**Why Self-Hosted?**
- Full control over data
- No limits
- Can run offline

```bash
# Using Docker Compose
docker-compose up -d supabase

# Access Supabase Studio at http://localhost:54321
```

**Note:** Self-hosted requires more maintenance. Supabase Cloud is recommended for most users.

### Environment Variables

Create `.env` file:

```env
# Required
VITE_SUPABASE_URL=your-project-url
VITE_SUPABASE_ANON_KEY=your-anon-key

# Optional (AI features)
VITE_OPENROUTER_API_KEY=your-key-here

# Future integrations
VITE_N8N_WEBHOOK_URL=your-webhook-url
VITE_AIRTABLE_API_KEY=your-airtable-key
VITE_AIRTABLE_BASE_ID=your-base-id
```

### Detailed Deployment Guide

For comprehensive deployment instructions, troubleshooting, and best practices, see [`DEPLOYMENT.md`](DEPLOYMENT.md).

### Deployment Checklist

Before deploying to production:

- [ ] Environment variables configured
- [ ] Supabase migrations applied
- [ ] Edge functions deployed
- [ ] Database RLS policies enabled
- [ ] SSL certificate active
- [ ] Analytics tracking tested
- [ ] Email sending verified
- [ ] AI integrations working
- [ ] Performance optimized
- [ ] Backup strategy in place

### Secrets Management

**All secrets should be stored in Supabase secrets:**

```bash
# Add secrets via CLI
supabase secrets set OPENAI_API_KEY=your-key
supabase secrets set FIRECRAWL_API_KEY=your-key
supabase secrets set RESEND_API_KEY=your-key

# Or via Supabase Dashboard
# Project → Edge Functions → Secrets
```

**Available Secrets:**
- `OPENAI_API_KEY` - AI chat
- `GEMINI_API_KEY` - Alternative AI
- `FIRECRAWL_API_KEY` - Web scraping
- `RESEND_API_KEY` - Email delivery
- `N8N_API_KEY` - Workflow automation

**Never commit secrets to Git!**

---

## 🎨 Customization

### Creating New Blocks

1. Define the block config type in `src/types/blockConfigs.ts`
2. Create the block component in `src/components/blocks/`
3. Register it in the BlockRenderer
4. Add it to the admin interface

### Styling

- Customize colors in `tailwind.config.ts`
- Modify global styles in `src/index.css`
- Use CSS variables for theming

---

## � Integrations

mycms.space is designed to integrate with external services for enhanced functionality.

### Planned Integrations

**n8n Automation** (Coming Soon)
- Contact form submissions → Telegram/WhatsApp/Email
- AI chat visitor requests → Multi-channel notifications
- Automated appointment booking
- Workflow automation for content management

**Airtable** (Coming Soon)
- Sync data to/from Airtable bases
- Use Airtable as external data source
- Manage contacts and form submissions
- Alternative data storage option

### Current Integrations

- **Supabase** - Primary database and backend
- **OpenAI/OpenRouter** - AI capabilities
- **Firecrawl** - Web content extraction
- **Google Analytics** - Visitor tracking

---

## �� Documentation

- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) - Detailed architecture guide
- API documentation - Coming soon
- Block development guide - Coming soon

---

## 🤝 Contributing

Contributions are welcome! This project is built on the principle that everyone should be able to present themselves beautifully online.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

**TL;DR:** You can use this project for anything, including commercial purposes. Just keep the license notice.

---

## 🙏 Acknowledgments

- Built with [shadcn/ui](https://ui.shadcn.com/)
- Powered by [Supabase](https://supabase.com)
- Icons by [Lucide](https://lucide.dev)

---

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/mycms-space/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/mycms-space/discussions)
- **Website**: [mycms.space](https://mycms.space)

---

**Made with ❤️ for everyone who wants a beautiful digital presence**
