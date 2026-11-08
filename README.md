# mycms.chat

**Your AI-Powered Digital Presence — Self-Hosted, Federated, Agentic**

mycms.chat is an open-source, self-hostable CMS that transforms your online presence into an intelligent digital assistant. Built with agentic AI at its core, it represents you 24/7, engaging visitors, generating content, and connecting with other digital agents across the web.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## 🌟 Vision: The Agentic Web

In the future, everyone will have a **digital twin** — an AI agent that represents them online, knows their expertise, and can interact on their behalf. mycms.chat is building that future today.

### What Makes This Different?

| Traditional CMS | mycms.chat |
|-----------------|------------|
| Static content | Living, breathing digital presence |
| Manual updates | AI-assisted content generation |
| Isolated websites | Federated network of agents |
| Read-only visitors | Interactive conversations |
| One-way communication | Agent-to-agent collaboration |

### The Network Effect

When multiple people deploy mycms.chat instances:
- **Agents can discover each other** via standardized Agent Cards
- **Visitors get referrals** ("Let me connect you with an expert on that topic")
- **Content propagates** across the network
- **Collective intelligence** emerges from individual agents

---

## 🚀 Roadmap: From Personal CMS to Digital Agent Network

### Phase 1: Personal Digital Assistant ✅ (Current)
- [x] AI chat widget on landing page
- [x] Contextual knowledge from site content
- [x] Configurable AI persona (system prompt)
- [x] Tool integration via n8n (email, search, etc.)
- [x] Block-based page builder
- [x] Blog with Markdown support
- [x] Project portfolio
- [x] Newsletter system

### Phase 2: Content AI Pipeline 🚧 (Next)
- [ ] **Multi-channel content generation**
  - Generate LinkedIn posts from blog content
  - Create Twitter/X threads
  - Draft newsletter editions
  - Auto-summarize for different audiences
- [ ] **Scheduled publishing**
  - Queue content for optimal times
  - Cross-platform coordination
- [ ] **Tone & style adaptation**
  - Match owner's voice
  - Adapt for each platform

### Phase 3: Agent Identity & Discovery 📋 (Planned)
- [x] **MCP server** (`/mcp.json`)
  - Profile, knowledge base and projects as MCP tools
  - Agents can maintain the knowledge base with an API key
- [ ] **Agent Registry**
  - Optional public directory
  - Searchable by expertise
- [ ] **Verification**
  - Link to social profiles
  - Domain ownership proof

### Phase 4: Federation & Collaboration 🔮 (Future)
- [ ] **Referral network**
  - "I don't know, but X does"
  - Credit and attribution
- [ ] **Shared knowledge graphs**
  - Opt-in knowledge sharing
  - Privacy-preserving queries

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     MYCMS.CHAT INSTANCE                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐   ┌─────────────┐   ┌─────────────┐           │
│  │   Resume    │   │    Blog     │   │  Projects   │           │
│  │   /CV       │   │   Posts     │   │  Portfolio  │           │
│  └──────┬──────┘   └──────┬──────┘   └──────┬──────┘           │
│         │                 │                 │                   │
│         └────────────┬────┴────────────────┘                   │
│                      ▼                                          │
│              ┌───────────────┐                                  │
│              │  Site Context │  ◄─── Knowledge Base             │
│              └───────┬───────┘                                  │
│                      ▼                                          │
│              ┌───────────────┐      ┌───────────────┐          │
│              │  AI Agent     │◄────►│    Tools      │          │
│              │  (Magnet)     │      │  (n8n/MCP)    │          │
│              └───────┬───────┘      └───────────────┘          │
│                      │                                          │
│         ┌────────────┼────────────┐                            │
│         ▼            ▼            ▼                            │
│  ┌──────────┐ ┌──────────┐ ┌──────────────┐                   │
│  │  Chat    │ │ Content  │ │   MCP        │                   │
│  │  Widget  │ │ Generator│ │   Server     │                   │
│  └──────────┘ └──────────┘ └──────────────┘                   │
│                                    │                            │
└────────────────────────────────────┼────────────────────────────┘
                                     │
                                     ▼
                    ┌────────────────────────────────┐
                    │    FEDERATED AGENT NETWORK     │
                    │                                │
                    │  ┌──────┐  ┌──────┐  ┌──────┐ │
                    │  │Agent │◄►│Agent │◄►│Agent │ │
                    │  │  A   │  │  B   │  │  C   │ │
                    │  └──────┘  └──────┘  └──────┘ │
                    └────────────────────────────────┘
```

### Data-Model-View Pattern

```
src/
├── data/          # Pure Supabase API calls
├── models/        # React Query hooks + business logic
├── components/    # UI components (View layer)
├── types/         # TypeScript definitions
└── hooks/         # Custom React hooks
```

---

## ✨ Features

### Core CMS
- 🎨 **Block-based page builder** — Compose pages with reusable, configurable blocks
- 📝 **Blog with Markdown** — Write and publish with rich formatting
- 🎯 **Project portfolio** — Showcase your work beautifully
- 📊 **Analytics tracking** — Understand your audience (internal + GA4)
- 🌓 **Dark/light mode** — Automatic theme switching
- 📱 **Fully responsive** — Perfect on all devices

### AI-Native Features
- 🤖 **Conversational AI assistant** — Represents you to visitors
- 🧠 **Contextual knowledge** — Learns from your content
- ✨ **Text enhancement** — AI-powered content improvement
- 📰 **Newsletter automation** — AI-assisted communications
- 🔧 **Tool integration** — Connect to external services via n8n

### Self-Hosting Ready
- 🐳 **Docker support** — One command deployment
- ⚡ **EasyPanel integration** — VCS-based auto-deployment
- 🔐 **Secrets management** — Secure API key storage
- 🌐 **Multiple hosting options** — Vercel, Netlify, Render, VPS

---

## 🛠️ Tech Stack

### Frontend
- **React 18** + **TypeScript** — Modern, type-safe UI
- **Vite** — Lightning-fast builds
- **TanStack Query** — Smart data fetching
- **shadcn/ui** + **Tailwind CSS** — Beautiful, customizable design
- **React Router** — Client-side routing

### Backend
- **Supabase** — Database, Auth, Storage, Realtime
- **Edge Functions** — Serverless AI processing
- **PostgreSQL** — Reliable data storage

### AI Options
| Provider | Self-Hosted | Cloud | Notes |
|----------|-------------|-------|-------|
| **Lovable AI** | ❌ | ✅ | Zero-config, recommended for Lovable Cloud |
| **OpenAI** | ❌ | ✅ | GPT-4, GPT-5 via API |
| **OpenRouter** | ❌ | ✅ | Multi-model gateway |
| **n8n + Ollama** | ✅ | ❌ | Fully local AI processing |
| **Ollama Direct** | ✅ | ❌ | Run LLMs locally (planned) |

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** 18+ or **Bun** 1.0+
- **Git**
- **Supabase** account (or self-hosted)

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/mycms-chat.git
cd mycms-chat

# Install dependencies
npm install

# Run interactive setup
./setup.sh

# Start development server
npm run dev
```

Visit `http://localhost:5173`

---

## 📦 Deployment Options

### 1. Railway (Recommended for Cloud Deployment)

Railway provides the best balance of ease-of-use and features:

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

**Why Railway?**
- Automatic HTTPS
- Built-in CI/CD
- Preview deployments
- Can host frontend + database
- GitHub integration
- Real-time logs and metrics

**Recommended Setup:**
- Frontend on Railway
- Supabase Cloud for database/backend

### 2. Docker (Recommended for Self-Hosting)

```bash
# Build and run
docker build -t mycms-chat:latest .
docker run -d \
  --name mycms-chat \
  -p 80:80 \
  -e VITE_SUPABASE_URL=$VITE_SUPABASE_URL \
  -e VITE_SUPABASE_PUBLISHABLE_KEY=$VITE_SUPABASE_PUBLISHABLE_KEY \
  mycms-chat:latest
```

### EasyPanel (VCS Integration)

1. Create application from Git repository
2. Add environment variables
3. Deploy — auto-updates on every push

### Cloud Platforms

- **Vercel**: `vercel --prod`
- **Netlify**: `netlify deploy --prod`
- **Render**: Connect GitHub, auto-detect Vite

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed instructions.

---

## 🔧 AI Configuration

### Option 1: n8n Webhooks (Flexible, Self-Hostable)

Connect to an n8n workflow for full control over AI processing:

1. Deploy n8n (self-hosted or cloud)
2. Create a webhook workflow with AI processing
3. Configure webhook URL in Admin → AI Settings

**Advantages:**
- Run Ollama locally for 100% offline AI
- Complex multi-step workflows
- Integration with 500+ services

### Option 2: Direct AI Providers

Configure API keys in Supabase secrets:

```bash
supabase secrets set OPENAI_API_KEY=sk-...
supabase secrets set GEMINI_API_KEY=...
```

### Option 3: Lovable AI (Cloud Only)

If using Lovable Cloud, AI is pre-configured with no additional setup.

---

## 🤖 Agent Access: MCP

External agents (Hermes, Claude, ChatGPT, …) work with the CMS through one interface: the **MCP server** (`supabase/functions/mcp-server`, manifest at `/mcp.json`).

- **Open without a key:** profile, knowledge base (public documents), projects, job-fit analysis.
- **With an API key** (Admin → Agency → MCP Server): write to the knowledge base (`kb_upsert`, `kb_append`) and run the site's agent skills.

There is no separate agent-to-agent (A2A) protocol: anything an agent needs is exposed as MCP tools.

---

## 🔒 Security

- **Row Level Security (RLS)** — Database-level access control
- **Edge Functions** — API keys never exposed to client
- **Supabase Secrets** — Encrypted storage for sensitive data
- **CORS headers** — Controlled API access

---

## 📚 Documentation

- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — Detailed architecture guide
- [`DEPLOYMENT.md`](DEPLOYMENT.md) — Comprehensive deployment instructions
- API Documentation — Coming soon
- Agent Card Specification — Coming soon

---

## 🎯 Inspiration & Related Projects

This project draws inspiration from:

- **[claude_life_assistant](https://github.com/lout33/claude_life_assistant)** — Symbiotic AI agent with persistent memory
- **[MCP](https://modelcontextprotocol.io/)** — Anthropic's Model Context Protocol
- **[IndieWeb](https://indieweb.org/)** — Decentralized personal web movement

---

## 🤝 Contributing

We welcome contributions! Whether you're fixing bugs, adding features, or improving documentation:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Priority Areas

- 🔥 Content AI pipeline (multi-channel generation)
- 🔥 Agent Card implementation
- 🔥 Local AI (Ollama) integration
- 📝 Documentation improvements
- 🎨 New block types

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

**TL;DR:** You can use this project for anything, including commercial purposes. Just keep the license notice.

---

## 🙏 Acknowledgments

- Built with [shadcn/ui](https://ui.shadcn.com/)
- Powered by [Supabase](https://supabase.com)
- Icons by [Lucide](https://lucide.dev)

---

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/mycms-chat/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/mycms-chat/discussions)
- **Website**: [mycms.chat](https://mycms.chat)

---

**Made with ❤️ for the Agentic Web**

*Your digital presence should work for you — even while you sleep.*
