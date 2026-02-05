# mycms.space - Product Requirements Document (PRD)

**Version:** 1.0  
**Last Updated:** 2025-02-03  
**Status:** Active Development

---

## 📋 Product Vision & Mission

### Vision
**Everyone deserves to present themselves beautifully online.**

mycms.space is an AI-native personal CMS that empowers individuals to create and manage their digital presence with intelligent assistance. We're building the future of personal websites where AI agents help you create, manage, and enhance your content.

### Mission
- **Democratize beautiful web presence** - Make professional websites accessible to everyone
- **AI-first approach** - Integrate agentic AI capabilities at the core
- **Self-hosting freedom** - Give users full control of their data and infrastructure
- **Developer-friendly** - Clean architecture that's easy to understand and extend

---

## 🎯 Product Overview

mycms.space is a self-hosted, block-based CMS with AI-native features. It combines:

- **Block-based page builder** - Compose pages with 20+ reusable blocks
- **AI chat assistant** - Intelligent agent that knows your content
- **Blog platform** - Full-featured blog with Markdown support
- **Project portfolio** - Showcase your work beautifully
- **Multi-provider AI** - n8n, OpenAI, Gemini, Lovable AI support
- **Analytics** - Track visitors and engagement
- **Newsletter** - Email campaigns via Resend
- **Dynamic pages** - Create unlimited custom pages

---

## ✨ Current Features

### 1. Content Management

#### Block-Based Page Builder
**Status:** ✅ Implemented

The core of mycms.space is a flexible block system where all content is stored as JSONB in PostgreSQL.

**Available Blocks (20+):**
- `HeroBlock` - Hero sections with animations
- `AboutSplitBlock` - About sections with image/text split
- `ProjectShowcaseBlock` - Project portfolio display
- `BlogBlock` - Blog post listings
- `ExpertiseGridBlock` - Services/expertise grid
- `FeaturedCarouselBlock` - Featured content carousel
- `TestimonialCarouselBlock` - Customer testimonials
- `StatsCounterBlock` - Animated statistics
- `ContactFormBlock` - Contact forms
- `NewsletterSubscribeBlock` - Newsletter signup
- `ChatWidgetBlock` - AI chat widget
- `CtaBannerBlock` - Call-to-action banners
- `BentoGridBlock` - Modern bento-style layouts
- `MarqueeBlock` - Scrolling content
- `ParallaxSectionBlock` - Parallax effects
- `VideoHeroBlock` - Video backgrounds
- `ImageTextBlock` - Image + text combinations
- `TextSectionBlock` - Rich text sections
- `SectionDivider` - Visual separators
- `SpacerBlock` - Spacing control

**Key Features:**
- Drag-and-drop reordering
- Real-time preview
- JSONB storage (no migrations needed for new fields)
- Version history (automatic via triggers)
- Per-block configuration
- Responsive by default

#### Dynamic Pages
**Status:** ✅ Implemented

Create unlimited custom pages with unique slugs:
- `/about` - About page
- `/services` - Services page
- `/contact` - Contact page
- Any custom slug you want

Each page can have its own set of blocks, SEO settings, and configuration.

#### Blog Platform
**Status:** ✅ Implemented

Full-featured blog with:
- Markdown editor with live preview
- Cover images with automatic optimization
- Categories and tags
- Reading time calculation
- SEO optimization
- RSS feed (planned)
- Archive page with filtering
- Individual blog post pages
- Draft/published status

### 2. AI Integration System

#### Multi-Provider AI Chat
**Status:** ✅ Implemented

Universal AI chat system supporting multiple providers:

**Supported Providers:**
1. **n8n Webhook** ⭐ (Primary)
   - Full workflow control
   - Multi-channel notifications (Telegram, WhatsApp, Email)
   - Appointment booking integration
   - Custom business logic
   - Receives full conversation history + site context
   
2. **Lovable AI**
   - Built-in, no API key needed
   - Gemini 2.5 Flash/Pro models
   - GPT-5 Mini/Full models
   
3. **OpenAI Direct**
   - GPT-4o, GPT-4o-mini, GPT-4 Turbo
   - Direct API integration
   
4. **Google Gemini Direct**
   - Gemini 1.5 Flash/Pro
   - Gemini 2.0 Flash

**AI Chat Features:**
- Conversation history (stored in browser)
- Site context injection (pages + blogs)
- Configurable system prompts
- Session management
- Quick actions
- Multi-turn conversations
- Provider switching on-the-fly

#### n8n Integration (Flagship Feature)
**Status:** ✅ Fully Implemented

The n8n integration is our most powerful feature, enabling:

**What n8n Receives:**
```json
{
  "messages": [
    { "role": "user", "content": "..." },
    { "role": "assistant", "content": "..." }
  ],
  "sessionId": "unique-session-id",
  "systemPrompt": "Your custom AI personality",
  "siteContext": {
    "pages": [...],
    "blogs": [...]
  }
}
```

**Use Cases:**
- **Contact Management** - Visitor wants to contact you → n8n sends Telegram/WhatsApp/Email
- **Appointment Booking** - AI schedules meetings via n8n workflows
- **Lead Qualification** - Intelligent routing based on conversation
- **Multi-channel Notifications** - Get notified everywhere
- **Custom Workflows** - Unlimited automation possibilities

**Example n8n Workflow:**
1. Receive webhook from chat
2. Process with AI (OpenAI/Anthropic/local LLM)
3. If visitor wants contact → Send Telegram notification
4. If booking request → Create calendar event
5. Send email confirmation
6. Log to CRM

### 3. Admin Dashboard

**Status:** ✅ Implemented

Comprehensive admin interface at `/admin`:

**Sections:**
- **Dashboard** - Analytics overview
- **Page Builder** - Visual block editor
- **Classic Builder** - Code-based page editing
- **Blog Manager** - Create/edit blog posts
- **Projects** - Portfolio management
- **Navigation** - Menu configuration
- **AI Settings** - Configure AI chat
- **Integrations** - Connect external services
- **SEO** - Meta tags and optimization
- **Analytics** - Visitor tracking
- **Newsletter** - Email campaigns
- **Messages** - Contact form submissions
- **History** - Version control

**Features:**
- Supabase authentication
- Real-time updates
- Responsive design
- Dark/light mode
- Keyboard shortcuts
- Auto-save (planned)

### 4. Analytics & Tracking

**Status:** ✅ Implemented

Built-in analytics system:
- Page view tracking
- Project demo clicks
- Chat session tracking
- Referrer tracking
- User agent detection
- Google Analytics integration
- Custom event tracking

### 5. Newsletter System

**Status:** ✅ Implemented

Email marketing via Resend:
- Subscriber management
- Campaign creation
- Template system
- Send tracking
- Unsubscribe handling

### 6. Utility Integrations

#### Firecrawl
**Status:** ✅ Connected via Lovable Connector

Web scraping and content extraction:
- Scrape any URL
- Web search with content extraction
- Site mapping
- Recursive crawling

#### Resend
**Status:** ✅ Implemented

Email delivery:
- Newsletter campaigns
- Transactional emails
- Domain verification
- Delivery tracking

---

## 🎯 User Personas

### Primary: Individual Professionals
- Freelancers, consultants, small business owners
- Need a professional online presence
- Want AI assistance but maintain control
- Value self-hosting and data ownership

### Secondary: Developers
- Want to customize and extend
- Appreciate clean architecture
- Need deployment flexibility
- Value open source

---

## 📊 Success Metrics

### User Engagement
- Daily active users (DAU)
- Pages created per user
- Blog posts published
- Chat sessions initiated

### Technical
- Page load time < 2s
- 99.9% uptime
- < 100ms API response time
- 99% test coverage

### Business
- User satisfaction (NPS)
- Feature adoption rate
- Community contributions
- GitHub stars

---

## 🚀 Future Roadmap

See [ROADMAP.md](./ROADMAP.md) for detailed roadmap.

---

## 📞 Support & Community

### Getting Help
- Read this documentation
- Check existing issues on GitHub
- Ask in discussions
- Contact maintainers

### Reporting Bugs
1. Check if already reported
2. Create detailed issue with:
   - Steps to reproduce
   - Expected vs actual behavior
   - Environment details
   - Screenshots/logs if applicable

---

*Last updated: February 2026*
