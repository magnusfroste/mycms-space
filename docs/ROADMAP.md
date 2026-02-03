# mycms.chat Roadmap

## Vision: The Agentic Web

Transform personal websites from static content into living digital agents that represent, communicate, and collaborate.

---

## Phase 1: Personal Digital Assistant ✅

**Status: Complete**

The foundation is in place — a personal CMS with AI-native features.

### Delivered

- [x] AI chat widget with contextual knowledge
- [x] Configurable AI persona via system prompt
- [x] Site context extraction from all content
- [x] n8n webhook integration for external tools
- [x] Block-based page builder with 15+ block types
- [x] Blog with Markdown, categories, and SEO
- [x] Project portfolio with image galleries
- [x] Newsletter subscription and management
- [x] Admin panel for content management
- [x] Dark/light theme support
- [x] Google Analytics integration
- [x] Self-hosting with Docker and EasyPanel

### Architecture

```
┌─────────────────────────────────────────┐
│  VISITOR                                │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│  CHAT WIDGET                            │
│  - Initial placeholder                  │
│  - Quick actions                        │
│  - Navigate to full chat                │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│  AI AGENT (Magnet)                      │
│  - System prompt (persona)              │
│  - Site context (all content)           │
│  - Session memory                       │
└────────────────┬────────────────────────┘
                 │
        ┌────────┴────────┐
        ▼                 ▼
┌──────────────┐  ┌──────────────┐
│ n8n Webhook  │  │ Edge Function│
│ (self-host)  │  │ (Lovable AI) │
└──────────────┘  └──────────────┘
```

---

## Phase 2: Content AI Pipeline 🚧

**Status: In Development**

Enable AI to generate content for multiple channels based on the owner's voice and knowledge.

### Goals

1. **Multi-channel content generation**
   - LinkedIn posts
   - Twitter/X threads
   - Newsletter drafts
   - Blog article outlines

2. **Voice matching**
   - Learn from existing content
   - Consistent tone across platforms
   - Adapt style per channel

3. **Publishing workflow**
   - Draft → Review → Schedule → Publish
   - Cross-platform coordination
   - Analytics tracking

### Technical Plan

```typescript
// New Edge Function: content-generator
interface ContentRequest {
  source: 'blog' | 'project' | 'custom';
  sourceId?: string;
  targetChannels: ('linkedin' | 'twitter' | 'newsletter')[];
  tone?: 'professional' | 'casual' | 'inspirational';
}

interface ContentResponse {
  drafts: {
    channel: string;
    content: string;
    metadata: {
      hashtags?: string[];
      scheduledFor?: string;
    };
  }[];
}
```

### New Database Tables

```sql
-- content_drafts: Store generated content
CREATE TABLE content_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_type TEXT NOT NULL,
  source_id UUID,
  channel TEXT NOT NULL,
  content TEXT NOT NULL,
  status TEXT DEFAULT 'draft', -- draft, scheduled, published
  scheduled_for TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- content_analytics: Track performance
CREATE TABLE content_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  draft_id UUID REFERENCES content_drafts(id),
  views INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  engagement JSONB DEFAULT '{}',
  recorded_at TIMESTAMPTZ DEFAULT now()
);
```

### UI Components

- [ ] Content Studio page in admin
- [ ] Source content selector
- [ ] Channel preview cards
- [ ] Scheduling calendar
- [ ] Performance dashboard

---

## Phase 3: Agent Identity & Discovery 📋

**Status: Planned**

Make agents discoverable and verifiable on the web.

### Agent Card Specification

Every mycms.chat instance publishes `/.well-known/agent.json`:

```json
{
  "@context": "https://a2a-protocol.org/context",
  "type": "AgentCard",
  "version": "1.0.0",
  "id": "urn:uuid:550e8400-e29b-41d4-a716-446655440000",
  
  "identity": {
    "name": "Magnus Froste's Digital Agent",
    "tagline": "Agentic AI & Business Innovation Expert",
    "avatar": "https://mycms.chat/avatar.jpg"
  },
  
  "owner": {
    "type": "Person",
    "name": "Magnus Froste",
    "website": "https://mycms.chat",
    "verifiedProfiles": [
      {
        "platform": "linkedin",
        "url": "https://linkedin.com/in/magnusfroste",
        "verified": true
      }
    ]
  },
  
  "capabilities": {
    "skills": [
      "agentic-ai",
      "business-innovation",
      "keynote-speaking",
      "ai-strategy"
    ],
    "languages": ["en", "sv"],
    "tools": ["calendar-booking", "email", "web-search"]
  },
  
  "endpoints": {
    "chat": {
      "url": "https://mycms.chat/api/a2a/chat",
      "methods": ["POST"],
      "authentication": "public"
    },
    "discover": {
      "url": "https://mycms.chat/api/a2a/discover",
      "methods": ["GET"],
      "authentication": "public"
    }
  },
  
  "policies": {
    "humanInLoop": true,
    "maxResponseTime": "30s",
    "dataRetention": "session"
  }
}
```

### Verification Flow

```
┌─────────────────┐
│  Agent Card     │
│  Published      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐     ┌─────────────────┐
│  Domain DNS     │────►│  TXT Record     │
│  Verification   │     │  Verification   │
└────────┬────────┘     └─────────────────┘
         │
         ▼
┌─────────────────┐     ┌─────────────────┐
│  Social Profile │────►│  OAuth or       │
│  Linking        │     │  Link-in-bio    │
└────────┬────────┘     └─────────────────┘
         │
         ▼
┌─────────────────┐
│  Verified       │
│  Agent Status   │
└─────────────────┘
```

### Discovery Registry (Optional)

```typescript
// Public registry for agent discovery
interface AgentRegistryEntry {
  agentId: string;
  domain: string;
  skills: string[];
  verified: boolean;
  lastSeen: Date;
  trustScore: number;
}

// Query interface
GET /registry/search?skills=ai-strategy&verified=true
```

---

## Phase 4: Federation & Collaboration 🔮

**Status: Future**

Enable agents to communicate and collaborate using A2A protocol.

### A2A Message Flow

```
┌──────────────────────────────────────────────────────────────┐
│                      VISITOR QUERY                            │
│  "Can you help me with AI strategy for my startup?"          │
└────────────────────────────┬─────────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────────┐
│                      LOCAL AGENT                              │
│  1. Check local knowledge                                     │
│  2. Identify capability gap                                   │
│  3. Query network for experts                                 │
└────────────────────────────┬─────────────────────────────────┘
                             │
              ┌──────────────┼──────────────┐
              ▼              ▼              ▼
       ┌──────────┐   ┌──────────┐   ┌──────────┐
       │ Agent A  │   │ Agent B  │   │ Agent C  │
       │ Startup  │   │ AI Tech  │   │ VC/Invest│
       │ Expert   │   │ Expert   │   │ Expert   │
       └────┬─────┘   └────┬─────┘   └────┬─────┘
            │              │              │
            └──────────────┼──────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────────┐
│                   AGGREGATED RESPONSE                         │
│  "Here's what I know, plus insights from my network:          │
│   - [Local knowledge]                                         │
│   - Agent A says: [startup perspective]                       │
│   - Agent B recommends: [technical approach]"                 │
└──────────────────────────────────────────────────────────────┘
```

### Protocol Implementation

```typescript
// A2A Request/Response
interface A2ARequest {
  jsonrpc: "2.0";
  method: "chat" | "discover" | "delegate";
  params: {
    query: string;
    context?: Record<string, unknown>;
    requester: {
      agentId: string;
      domain: string;
    };
  };
  id: string;
}

interface A2AResponse {
  jsonrpc: "2.0";
  result: {
    response: string;
    confidence: number;
    sources?: string[];
    delegations?: A2ADelegation[];
  };
  id: string;
}
```

### Trust & Reputation

```
┌─────────────────────────────────────────┐
│           TRUST FRAMEWORK               │
├─────────────────────────────────────────┤
│                                         │
│  Verification Level:                    │
│  ├── Unverified (domain only)          │
│  ├── Domain Verified (DNS TXT)         │
│  ├── Social Verified (linked profiles) │
│  └── Community Verified (vouched)      │
│                                         │
│  Reputation Signals:                    │
│  ├── Response quality ratings          │
│  ├── Referral success rate             │
│  ├── Network endorsements              │
│  └── Activity consistency              │
│                                         │
└─────────────────────────────────────────┘
```

---

## Technical Dependencies

### Phase 2 Requirements
- [x] Edge Functions (deployed)
- [x] Supabase database
- [ ] Scheduled job support (cron)
- [ ] External API integrations (LinkedIn, Twitter)

### Phase 3 Requirements
- [ ] Well-known route handler
- [ ] DNS verification logic
- [ ] OAuth for social verification
- [ ] Agent Card generator UI

### Phase 4 Requirements
- [ ] A2A protocol SDK (JavaScript)
- [ ] WebSocket for real-time federation
- [ ] Trust score calculation
- [ ] Rate limiting for external requests

---

## Timeline (Estimated)

| Phase | Target | Status |
|-------|--------|--------|
| Phase 1 | Q4 2025 | ✅ Complete |
| Phase 2 | Q1 2026 | 🚧 In Progress |
| Phase 3 | Q2 2026 | 📋 Planned |
| Phase 4 | Q3-Q4 2026 | 🔮 Future |

---

## Contributing

We welcome contributions to any phase! Priority areas:

1. **Content AI Pipeline** — Help build the multi-channel generator
2. **Agent Card Spec** — Review and refine the specification
3. **Local AI Support** — Ollama integration for self-hosting
4. **Documentation** — Improve guides and examples

See [CONTRIBUTING.md](../CONTRIBUTING.md) for guidelines.

---

*Last updated: February 2026*
