# StockWar Terminal — Comprehensive Project Plan

## Executive Summary

StockWar Terminal is a professional-grade, real-time stock trading intelligence platform styled as a military war room terminal. The application aggregates financial markets, geopolitical intelligence, macroeconomic signals, technology trends, and breaking news into a unified, keyboard-driven interface designed specifically for stock traders who need to react to market-moving events instantly.

This document is the complete, authoritative planning reference. No code is written until this plan is approved in full.

---

## Table of Contents

1. Project Identity & Goals
2. Core Philosophy & Design Principles
3. Feature Scope Definition
4. Technology Stack Decision
5. Application Architecture
6. Data Architecture
7. UI/UX System Design
8. Panel System Design
9. AI Integration Architecture
10. Backend Service Architecture
11. Data Sources & APIs
12. Authentication & Subscription Model
13. State Management Strategy
14. Performance Strategy
15. Security Architecture
16. Project Directory Structure
17. Development Phases & Milestones
18. Risk Register & Mitigation
19. Technical Debt Prevention Rules
20. Definition of Done

---

## 1. Project Identity & Goals

### 1.1 What This Application Is

StockWar Terminal is a **stock market intelligence war room** — a real-time dashboard built for active traders, macro investors, and financial analysts who need to correlate global events with market movements. It is not a brokerage. It is not a social platform. It is an intelligence aggregation and analysis terminal.

The primary user need is this: **Something is happening in the world. How does it affect my positions?** The terminal must answer that question instantly.

### 1.2 Primary User Persona

- **Active retail traders** managing their own portfolios
- **Macro investors** who track global events for investment thesis
- **Quantitative traders** who need data feeds and signal correlation
- **Financial analysts** who monitor multiple asset classes simultaneously
- **Day traders** who need real-time news that moves stock prices

### 1.3 Core Value Propositions

1. **Speed** — Market-moving news surfaces before it reaches mainstream outlets
2. **Correlation** — Geopolitical events are automatically linked to affected tickers
3. **Depth** — 124 specialized panels covering everything from satellite imagery to yield curves
4. **Intelligence** — AI synthesizes signals across all data sources into actionable insights
5. **Terminal Aesthetic** — Feels like professional Bloomberg/Reuters tooling, not a consumer app

### 1.4 What This Is NOT

- It is not a stock screener as its primary function
- It is not a social trading platform
- It is not a portfolio tracker (though positions can be input for correlation)
- It is not a news aggregator with financial features bolted on

### 1.5 Lessons Learned From Previous Failures

Based on the architecture analysis provided, the three previous failures stemmed from:

| Failure Pattern | Root Cause | This Plan's Solution |
|----------------|-----------|---------------------|
| God Object state | AppContext holding everything | Zustand slice-based stores with clear domain ownership |
| Monolithic relay service | Single process for everything | Separated microservices from day one |
| CSS monolith | Single 424KB file | CSS Modules with component scoping from the start |
| Late UI changes | UI designed during coding | Full UI system designed in planning phase |
| No file size limits | Files grew to 800KB | Enforced 200-line module limit policy |
| Missing planning | Architecture decided mid-build | This document |

---

## 2. Core Philosophy & Design Principles

### 2.1 Terminal-First Design

Every UI decision must pass the **Terminal Test**: Would a Bloomberg Terminal user feel comfortable with this interaction? The interface prioritizes information density, keyboard control, and professional aesthetics over consumer-friendly softness.

### 2.2 The Five Laws of This Application

**Law 1: Data Freshness is Sacred**
Every data point must display its age. Users must never wonder if information is stale. No panel renders without a timestamp.

**Law 2: Panels Are First-Class Citizens**
The panel system is the application. Everything else — navigation, AI, settings — exists to support panels.

**Law 3: Keyboard Drives, Mouse Assists**
Every core action must be keyboard-accessible. Mouse is for pointing at panels, not for navigating menus.

**Law 4: AI Enhances, Never Replaces**
AI provides synthesis and suggestions. The raw data always remains visible. Users must be able to verify every AI claim.

**Law 5: Failure is Graceful**
When a data source fails, the panel shows a degraded state — not an error page. The application never crashes because one API is down.

### 2.3 File Size Enforcement

To prevent the god-file problem from the previous build:

| File Type | Maximum Lines | Action if Exceeded |
|-----------|-------------|-------------------|
| React Component | 300 lines | Split into sub-components |
| Service/Hook | 200 lines | Extract domain logic |
| Store slice | 150 lines | Split by responsibility |
| Config file | 500 lines | Split by domain |
| Utility file | 100 lines | One utility per file |

This is enforced via ESLint rule `max-lines` from day one.

### 2.4 Module Boundary Enforcement

```
types/ → (nothing imports from nothing)
config/ → types/ only
services/ → types/, config/
stores/ → types/, config/, services/
hooks/ → stores/, services/, types/
components/ → hooks/, types/, config/
panels/ → components/, hooks/, stores/
pages/ → panels/, components/, hooks/
```

No circular imports. ESLint import/order and eslint-plugin-boundaries enforce this at commit time.

---

## 3. Feature Scope Definition

### 3.1 Core Features (Must Have at Launch)

**Panel System**
- Draggable, resizable grid panels
- Right-click context menu per panel
- Panel persistence to user profile
- Panel pinning, minimizing, maximizing
- Panel notification system
- Full panel catalog matching the provided list of 124 panels

**Monitor Window System**
- Switchable monitoring contexts: Finance / Tech / World / Commodities / Trending
- Regional filter: Global / Americas / Europe / Asia / Africa / Oceania / Middle East / India
- Monitor contexts change which panels are active and how data is prioritized

**Trading Intelligence Core**
- Real-time stock quotes with delta highlighting
- Ticker correlation engine — given a news event, which tickers are affected?
- Breaking news banner with ticker tagging
- Earnings calendar with impact prediction
- Economic calendar with expected market impact ratings
- Sector heatmap with drill-down

**AI Intelligence**
- Natural language chat with full context of all open panels
- Auto-generated daily market brief
- Signal correlation — "These 3 events may be related"
- Ticker impact analysis — "This event historically affects XYZ sector by N%"
- AI-powered panel summaries accessible via keyboard shortcut

**Data Architecture**
- Bootstrap hydration on load
- Smart polling with viewport detection
- Circuit breakers per data domain
- Redis caching layer with staleness tracking

**Authentication**
- Free tier with limited panels
- Pro tier with full access
- API key management for power users

### 3.2 Secondary Features (Phase 2)

- Backtesting engine for macro event correlation
- Custom alert rules with multi-channel delivery
- Widget embedding system
- Desktop app via Tauri
- Mobile companion app (read-only)
- MCP server for AI assistant integration

### 3.3 Explicitly Out of Scope

- Order execution / brokerage integration
- Portfolio P&L tracking
- Social features / following other users
- Historical backtesting at launch
- Mobile-first design (terminal is desktop-first by design)

---

## 4. Technology Stack Decision

### 4.1 Frontend Framework

**Decision: React 19 with TypeScript**

**Rationale:**

The previous application used zero frameworks and vanilla DOM manipulation. While this achieved performance goals, it created the god-object state problem and made the codebase extremely difficult to maintain and test. The 86-class panel system with manual `setContent(html)` calls is the direct cause of the large file sizes and tight coupling.

React with proper component architecture solves this while maintaining sufficient performance for a dashboard. React 19's concurrent features handle the large number of simultaneously updating panels gracefully.

**What we do NOT use:**
- No Next.js — this is a client-side terminal, SSR is not needed
- No server components — all data comes via API
- Vite as the bundler

### 4.2 State Management

**Decision: Zustand with domain slices**

Zustand provides lightweight, non-boilerplate state management with clear store boundaries. Each data domain gets its own store slice. No single god object.

Store domains:
- `marketStore` — quotes, tickers, positions
- `panelStore` — panel layout, visibility, pinned state
- `intelligenceStore` — geopolitical data, conflict events
- `newsStore` — breaking news, feed items
- `aiStore` — AI chat history, AI-generated insights
- `uiStore` — theme, sidebar state, active monitor context
- `userStore` — auth, preferences, tier
- `alertStore` — alert rules, notification queue
- `techStore` — tech/AI sector data
- `commodityStore` — commodity prices, supply chain
- `cryptoStore` — crypto prices, DeFi data

### 4.3 Styling

**Decision: CSS Modules + CSS Custom Properties**

- Each component has its own `.module.css` file
- Global custom properties (CSS variables) for theming
- Terminal theme defined as a token system
- No CSS-in-JS (performance concern for real-time dashboard)
- Tailwind considered and rejected — terminal aesthetic requires precise control

### 4.4 Backend / API

**Decision: Next.js API Routes deployed to Vercel Edge Functions**

Wait — this contradicts the frontend decision. Clarification:

- **Frontend SPA**: React + Vite, deployed as static to Vercel
- **API Layer**: Separate Next.js project OR Hono.js on Cloudflare Workers
- **Final Decision: Hono.js on Cloudflare Workers**

Hono is lighter than Next.js for pure API use, runs on Cloudflare Workers for global edge distribution, and avoids the dual-framework confusion.

### 4.5 Data Relay Service

**Decision: Node.js service on Railway**

Same architecture as the previous project but with proper microservice separation:
- `relay-market.js` — market data WebSocket relay
- `relay-news.js` — news feed aggregation
- `relay-maritime.js` — AIS vessel tracking
- `relay-aviation.js` — flight tracking
- `relay-social.js` — social velocity, Telegram OSINT

Each relay is its own process. One crash does not affect others.

### 4.6 Cache Layer

**Decision: Upstash Redis**

Serverless Redis compatible with Cloudflare Workers and Vercel Edge. Same as previous project — this was a good decision and we keep it.

### 4.7 Database

**Decision: Supabase (PostgreSQL)**

The previous project used Convex for user data. We switch to Supabase for:
- More familiar SQL query patterns
- Better row-level security for multi-tenant data
- Real-time subscriptions via Supabase Realtime for live panel data
- Built-in auth that integrates cleanly

### 4.8 Authentication

**Decision: Clerk**

Same as previous project. Clerk handles JWT issuance, session management, and integrates with Supabase RLS via JWT claims.

### 4.9 Complete Stack Summary

| Layer | Technology | Hosting |
|-------|-----------|---------|
| Frontend SPA | React 19 + TypeScript + Vite | Vercel (static) |
| API Layer | Hono.js | Cloudflare Workers |
| Data Relay | Node.js (multi-process) | Railway |
| Cache | Upstash Redis | Upstash Cloud |
| Database | Supabase PostgreSQL | Supabase Cloud |
| Auth | Clerk | Clerk Cloud |
| AI/LLM | OpenRouter (multi-model) | Cloudflare AI Worker |
| Real-time | Supabase Realtime + SSE | Supabase Cloud |
| Desktop | Tauri 2.x | GitHub Releases |
| Monitoring | Sentry | Sentry Cloud |
| Analytics | Posthog | Posthog Cloud |
| CI/CD | GitHub Actions | GitHub |

---

## 5. Application Architecture

### 5.1 System Topology

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          Browser / Desktop Client                           │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    React SPA (Vite Build)                            │   │
│  │                                                                      │   │
│  │  ┌──────────┐  ┌──────────────────────────────────────────────────┐ │   │
│  │  │  Left    │  │              Panel Grid (Main Canvas)             │ │   │
│  │  │ Sidebar  │  │  ┌─────────┐  ┌─────────┐  ┌─────────────────┐  │ │   │
│  │  │  Panel   │  │  │ Panel 1 │  │ Panel 2 │  │    Panel 3      │  │ │   │
│  │  │  Library │  │  │         │  │         │  │                 │  │ │   │
│  │  │          │  │  └─────────┘  └─────────┘  └─────────────────┘  │ │   │
│  │  │  Monitor │  │  ┌─────────────────────┐  ┌─────────────────┐   │ │   │
│  │  │  Context │  │  │      Panel 4        │  │    Panel 5      │   │ │   │
│  │  │  Switcher│  │  │                     │  │                 │   │ │   │
│  │  │          │  │  └─────────────────────┘  └─────────────────┘   │ │   │
│  │  │  Region  │  └──────────────────────────────────────────────────┘ │   │
│  │  │  Filter  │                                                        │   │
│  │  └──────────┘  ┌──────────────────────────────────────────────────┐ │   │
│  │                │        Bottom Taskbar (Compact Height)            │ │   │
│  │                │  [Active Panels] [Notifications] [Clock] [AI]     │ │   │
│  │                └──────────────────────────────────────────────────┘ │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌──────────────────────┐  ┌─────────────────┐  ┌───────────────────────┐ │
│  │   Zustand Stores     │  │   Web Workers   │  │   IndexedDB (Local)   │ │
│  │  (Domain Slices)     │  │  (ML / Analysis)│  │  (Panel State/Cache)  │ │
│  └──────────────────────┘  └─────────────────┘  └───────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
                              │ HTTPS / SSE
        ┌─────────────────────┼──────────────────────┐
        │                     │                      │
┌───────▼──────┐    ┌─────────▼──────────┐    ┌─────▼────────────┐
│  Cloudflare  │    │     Railway        │    │    Supabase      │
│   Workers    │    │   Relay Services   │    │  (DB + Realtime) │
│  (Hono API)  │    │  ┌─────────────┐  │    └─────────────────┘
│              │    │  │relay-market │  │
│ /api/market  │    │  │relay-news   │  │    ┌─────────────────┐
│ /api/intel   │    │  │relay-flight │  │    │  Upstash Redis  │
│ /api/ai      │    │  │relay-ship   │  │    │   (Cache Layer) │
│ /api/...     │    │  │relay-social │  │    └─────────────────┘
└──────┬───────┘    │  └─────────────┘  │
       │            └─────────┬──────────┘
       └──────────────────────┘
                    │
       ┌────────────┼───────────────┐
       │            │               │
┌──────▼───┐  ┌─────▼─────┐  ┌────▼──────┐
│ Finnhub  │  │  ACLED    │  │  NewsAPI  │
│ Polygon  │  │  GDELT    │  │  Reuters  │
│ Yahoo    │  │  FRED     │  │  RSS Feeds│
│ Crypto   │  │  ...      │  │  ...      │
└──────────┘  └───────────┘  └───────────┘
         30+ External Data Sources
```

### 5.2 Frontend Application Architecture

```
src/
├── App.tsx                    (Root component, <200 lines)
├── main.tsx                   (Entry point only)
│
├── types/                     (Zero imports — pure TypeScript)
│   ├── market.types.ts
│   ├── panel.types.ts
│   ├── intelligence.types.ts
│   ├── news.types.ts
│   ├── ai.types.ts
│   ├── user.types.ts
│   └── index.ts
│
├── config/                    (Imports types/ only)
│   ├── panels.config.ts       (Panel catalog — all 124 definitions)
│   ├── data-sources.config.ts (API endpoint mapping)
│   ├── monitor-contexts.config.ts (Monitor/Region matrix)
│   ├── keyboard-shortcuts.config.ts
│   ├── refresh-intervals.config.ts
│   └── theme.config.ts
│
├── services/                  (Business logic — imports types/, config/)
│   ├── market/
│   ├── intelligence/
│   ├── news/
│   ├── ai/
│   ├── crypto/
│   ├── commodities/
│   ├── tech/
│   └── shared/
│
├── stores/                    (Zustand slices)
│   ├── market.store.ts
│   ├── panel.store.ts
│   ├── intelligence.store.ts
│   ├── news.store.ts
│   ├── ai.store.ts
│   ├── ui.store.ts
│   ├── user.store.ts
│   ├── alert.store.ts
│   ├── tech.store.ts
│   ├── commodity.store.ts
│   └── crypto.store.ts
│
├── hooks/                     (Custom React hooks)
│   ├── usePanel.ts
│   ├── useMarketData.ts
│   ├── useKeyboardShortcuts.ts
│   ├── usePanelRefresh.ts
│   ├── useBreakingNews.ts
│   ├── useAI.ts
│   └── useRegionFilter.ts
│
├── components/                (Shared UI primitives)
│   ├── ui/                    (Base components: Button, Badge, etc.)
│   ├── charts/                (Sparkline, YieldCurve, Heatmap)
│   ├── feed/                  (NewsFeedItem, TickerTag, etc.)
│   └── terminal/              (TerminalText, BlinkCursor, StatusDot)
│
├── panels/                    (124 panel implementations)
│   ├── _base/                 (BasePanelWrapper, PanelHeader, PanelContextMenu)
│   ├── markets/
│   ├── intelligence/
│   ├── technology/
│   ├── commodities/
│   ├── crypto/
│   ├── startups/
│   ├── climate/
│   ├── news/
│   └── system/
│
├── layout/                    (Application shell)
│   ├── TerminalShell.tsx      (Root layout)
│   ├── LeftSidebar.tsx
│   ├── PanelGrid.tsx
│   ├── PanelGridCell.tsx
│   ├── BottomTaskbar.tsx
│   ├── BreakingNewsBanner.tsx
│   └── MonitorContextBar.tsx
│
├── modals/                    (Overlay UI)
│   ├── AIChat.modal.tsx
│   ├── PanelSearch.modal.tsx
│   ├── AlertConfig.modal.tsx
│   ├── TickerCorrelation.modal.tsx
│   └── Settings.modal.tsx
│
├── workers/                   (Web Workers)
│   ├── ml.worker.ts
│   ├── analysis.worker.ts
│   └── vector-db.worker.ts
│
├── utils/                     (One utility per file, max 100 lines)
│   ├── circuit-breaker.ts
│   ├── debounce.ts
│   ├── format-number.ts
│   ├── format-time.ts
│   ├── ticker-extractor.ts
│   └── ...
│
└── styles/                    (Global tokens only — no component styles here)
    ├── tokens.css             (CSS custom properties)
    ├── reset.css
    └── global.css
```

### 5.3 Request Lifecycle

**Initial Load (Bootstrap)**
```
1. App mounts
2. Check auth state (Clerk)
3. Fetch /api/bootstrap → Redis batch read → all fast-tier data
4. Hydrate Zustand stores
5. Render visible panels with hydrated data
6. Start smart poll loops per domain
7. Connect SSE stream for breaking news
8. Initialize Web Workers
```

**Panel Data Refresh**
```
1. RefreshScheduler ticks (per panel's configured interval)
2. Check: is panel in viewport?
   - No → skip, mark as pending refresh
3. Check: is circuit breaker open for this domain?
   - Yes → return cached stale data, show staleness indicator
4. Fetch /api/{domain}/{endpoint}
5. Update Zustand store slice
6. Panel re-renders via React subscription
7. Update timestamp display
```

---

## 6. Data Architecture

### 6.1 Cache Strategy

```
Layer 1: Browser Memory (Zustand stores)
  - All actively displayed panel data
  - TTL: session lifetime
  - Size: ~50MB limit self-enforced

Layer 2: IndexedDB (via idb-keyval)
  - Panel layout/config persistence
  - User preferences
  - Recent AI chat history
  - Stale data for graceful degradation
  - TTL: 7 days

Layer 3: Upstash Redis (server-side)
  - Seed data from relay services
  - Rate limit counters
  - Bootstrap batch responses
  - TTL: per data domain (5min to 24hr)
```

### 6.2 Data Freshness Classification

Every data type is classified into one of four freshness tiers:

| Tier | Name | Max Age | Examples | Refresh Interval |
|------|------|---------|---------|-----------------|
| T1 | Real-Time | 0–30s | Stock quotes, breaking news, sirens | 15s |
| T2 | Near-Real-Time | 30s–5min | Market sentiment, active conflicts | 60s |
| T3 | Periodic | 5min–1hr | Economic data, fund flows, forecasts | 5min |
| T4 | Static | 1hr–24hr | Geographic data, earnings calendars, historical | 1hr |

### 6.3 Circuit Breaker Design

Each data domain has an independent circuit breaker with three states:

```
CLOSED (normal) → after 5 consecutive failures → OPEN (blocking)
OPEN (blocking) → after 60s cooldown → HALF-OPEN (testing)
HALF-OPEN → success → CLOSED | failure → OPEN
```

When a circuit is open:
- Panel shows last known good data with staleness indicator
- Panel header shows amber warning dot
- Taskbar notification appears
- AI is aware and disclaims "data may be stale for: [domain]"

### 6.4 Bootstrap Payload Structure

The `/api/bootstrap` endpoint returns a structured payload:

```
BootstrapPayload {
  fast: {                          // <3s timeout, non-blocking to render
    marketQuotes: {...}
    fearGreed: {...}
    breakingNews: [...] 
    yieldCurve: {...}
    sectorHeatmap: {...}
  }
  slow: {                          // <8s timeout, background hydration
    geopoliticalEvents: [...]
    conflictMap: {...}
    supplyChain: {...}
    cryptoPrices: {...}
    commodityPrices: {...}
  }
  meta: {
    timestamp: ISO8601
    userTier: "free" | "pro"
    availablePanels: string[]
    activeCircuitBreakers: string[]
  }
}
```

### 6.5 Seed Service Architecture

Relay services push data to Redis on schedules:

```
relay-market.js (Railway)
├── Seeds: stock quotes, futures, forex, options flow
├── Schedule: 15s (market hours), 5min (after-hours)
├── Sources: Polygon.io, Finnhub, Yahoo Finance
└── Redis keys: market:quotes:*, market:forex:*, market:options:*

relay-news.js (Railway)
├── Seeds: RSS feeds, economic news, breaking news detection
├── Schedule: 30s continuous
├── Sources: 100+ RSS feeds, NewsAPI, GDELT
└── Redis keys: news:breaking:*, news:feed:*, news:economic:*

relay-intelligence.js (Railway)
├── Seeds: conflict events, geopolitical updates, sanctions
├── Schedule: 2min
├── Sources: ACLED, GDELT, UCDP, OREF
└── Redis keys: intel:conflict:*, intel:sanctions:*, intel:sirens:*

relay-aviation.js (Railway)
├── Seeds: military flight tracking, airline intelligence
├── Schedule: 60s
├── Sources: ADS-B Exchange, OpenSky, FlightAware
└── Redis keys: aviation:military:*, aviation:commercial:*

relay-maritime.js (Railway)
├── Seeds: vessel positions, port congestion
├── Schedule: 60s
├── Sources: AIS stream, Marine Traffic
└── Redis keys: maritime:vessels:*, maritime:ports:*

relay-social.js (Railway)
├── Seeds: social velocity, Telegram OSINT
├── Schedule: 2min
├── Sources: Telegram, Reddit API, X API
└── Redis keys: social:velocity:*, social:telegram:*
```

---

## 7. UI/UX System Design

### 7.1 Visual Language

**Terminal Aesthetic Requirements**

The application must feel like a professional trading terminal. Not a dark-mode consumer web app. A real terminal. Specific requirements:

- **Monospace font for data**: JetBrains Mono for all numerical data and code-like content
- **Sans-serif for labels**: Inter for UI chrome and labels
- **Color palette**: Dark backgrounds (#0a0a0f primary), with signal colors:
  - Green: `#00ff88` (price up, positive signals)
  - Red: `#ff3355` (price down, negative signals, alerts)
  - Amber: `#ffaa00` (warnings, caution, stale data)
  - Cyan: `#00ccff` (links, interactive elements, AI)
  - White: `#e8e8e8` (primary text)
  - Dim: `#666680` (secondary text, timestamps)
  - Panel border: `#1a1a2e`
  - Panel header: `#0f0f1a`
- **No rounded corners on panels** — squared-off terminal aesthetic
- **Pixel-perfect 1px borders** — not shadows
- **Subtle scan-line texture** on panel backgrounds (CSS only, performance-safe)
- **Blinking cursor** on active AI input
- **Status dots** — pulsing green/red/amber for data connection states

### 7.2 Application Shell Layout

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  [STOCKWAR] [monitor type tabs] [region selector]          [clock] [AI] [⚙] │
│  ──────────────────────────── TOP BAR (32px) ─────────────────────────────  │
├───────────┬─────────────────────────────────────────────────────────────────┤
│           │                                                                  │
│  LEFT     │                    PANEL GRID                                   │
│  SIDEBAR  │                                                                  │
│  (220px   │   ┌──────────────────┐  ┌──────────────────┐                   │
│  default, │   │   PANEL          │  │   PANEL          │                   │
│  collaps- │   │                  │  │                  │                   │
│  ible to  │   │                  │  │                  │                   │
│  48px)    │   └──────────────────┘  └──────────────────┘                   │
│           │                                                                  │
│  [Panel   │   ┌──────────────────────────────┐  ┌──────────┐               │
│  Library] │   │         PANEL                │  │  PANEL   │               │
│           │   │                              │  │          │               │
│  [Active  │   └──────────────────────────────┘  └──────────┘               │
│  Monitors]│                                                                  │
│           │                                                                  │
│  [Saved   │                                                                  │
│  Layouts] │                                                                  │
│           │                                                                  │
│  [AI      │                                                                  │
│  Quick    │                                                                  │
│  Actions] │                                                                  │
│           │                                                                  │
├───────────┴─────────────────────────────────────────────────────────────────┤
│  BOTTOM TASKBAR (28px)                                                       │
│  [Panel1●] [Panel2○] [Panel3●] ... │ ALERTS: [AAPL↑] [OREF●] │ [STATUS] [?] │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 7.3 Top Bar Specification

Height: 32px exactly

```
Left section:
  - Application logo / wordmark "▶ STOCKWAR"
  - Monitor Type Tabs (pill-style, no radius): FINANCE | TECH | WORLD | COMMODITIES | TRENDING

Center section:
  - Region Selector (dropdown): GLOBAL | AMERICAS | EUROPE | ASIA | AFRICA | OCEANIA | MIDDLE EAST | INDIA

Right section:
  - Market status indicator: [NYSE ● OPEN] [NASDAQ ● OPEN] [LSE ○ CLOSED]
  - World clock (shows 3 user-selected markets)
  - AI Assistant button [⬡ AI]
  - Settings [⚙]
  - User menu [◉ USER]
```

### 7.4 Left Sidebar Specification

Width: 220px default, collapses to 48px (icon-only mode)

**Sections:**

```
▶ PANEL LIBRARY
  [Search panels...]
  ─ MARKETS
    □ Daily Market Brief
    □ Sector Heatmap
    □ Yield Curve
    ■ Fear & Greed         ← ■ = currently active
    ...
  ─ INTELLIGENCE
    □ Armed Conflict Events
    □ Geopolitical Hubs
    ...
  ─ TECHNOLOGY
    □ AI Insights
    □ Semiconductors
    ...

▶ MONITOR PRESETS
  [Finance War Room]    ← saved layout
  [Tech Watch]
  [Macro Monday]
  [+ Save Current]

▶ QUICK ACTIONS
  [▶ Analyze Selection]
  [▶ Correlate Tickers]
  [▶ Generate Brief]
  [▶ Alert on Event]
```

### 7.5 Panel Grid Specification

**Grid System:**
- Based on a 12-column, variable-row grid
- Panels snap to grid cells
- Minimum panel size: 2 columns × 3 rows
- Default panel size: 4 columns × 4 rows
- Maximum panel size: 12 columns × any rows
- Drag handles visible on hover only
- Resize handles on all four edges and corners

**Grid Controls:**
- `Ctrl+G` — toggle grid overlay (shows column lines)
- `Ctrl+L` — lock layout (prevents accidental moves)
- `Ctrl+Z` — undo last panel move/resize
- `Ctrl+Shift+R` — reset to default layout for current monitor context

**Scroll Behavior:**
- The panel grid scrolls vertically
- Pinned panels stay fixed at top of grid
- Taskbar always visible (position: fixed)

### 7.6 Panel Anatomy

Every panel has a standardized structure:

```
┌─[PANEL HEADER]──────────────────────────────────[● ○ ×]─┐
│ PANEL TITLE                    [STATUS●] [AGO: 2s] [⋮]  │
├─────────────────────────────────────────────────────────┤
│                                                          │
│              PANEL CONTENT AREA                          │
│                                                          │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

**Header elements (left to right):**
1. Panel icon (8×8px colored square identifying data domain)
2. Panel title (uppercase, monospace)
3. Status dot (green = fresh, amber = stale, red = error)
4. Time ago ("2s", "1m", "5m", "STALE")
5. Panel menu button (⋮) → triggers context menu
6. Window controls: minimize (○), maximize (□), close (×)

**Panel States:**
- `loading` — skeleton shimmer animation
- `fresh` — normal render with green status dot
- `stale` — data older than threshold, amber dot, dim overlay on timestamps
- `error` — red dot, last known good data shown with error banner at top
- `empty` — no data available, show helpful message
- `premium-locked` — panel visible but blurred, upgrade prompt

### 7.7 Panel Right-Click Context Menu

Right-clicking anywhere on a panel opens a terminal-styled context menu:

```
┌──────────────────────────────┐
│ ▶ PANEL: FEAR & GREED INDEX  │
├──────────────────────────────┤
│  📌 Pin Panel                │
│  ⤢  Maximize                 │
│  ⊟  Minimize                 │
├──────────────────────────────┤
│  🔔 Configure Alerts     ›   │
│     └ On threshold breach    │
│     └ On spike detected      │
│     └ On data change         │
├──────────────────────────────┤
│  ↔  Resize Panel         ›   │
│     └ Small (2×3)            │
│     └ Medium (4×4)           │
│     └ Large (6×6)            │
│     └ Full Width (12×4)      │
├──────────────────────────────┤
│  🤖 AI: Analyze This Panel   │
│  🔗 Correlate to Tickers     │
│  📊 Show Historical          │
├──────────────────────────────┤
│  📋 Copy Data as CSV         │
│  📸 Screenshot Panel         │
│  🔗 Share Panel Link         │
├──────────────────────────────┤
│  ⚙  Panel Settings       ›   │
│     └ Refresh Interval       │
│     └ Data Source            │
│     └ Display Options        │
├──────────────────────────────┤
│  ✕  Remove Panel             │
└──────────────────────────────┘
```

**Context menu technical requirements:**
- Appears within 80ms of right-click
- Keyboard navigable (arrow keys, enter, escape)
- Closes on any click outside or Escape
- Never clips outside viewport (auto-repositions)
- Cascading submenus on hover/arrow-right
- Terminal styling: 1px borders, dark background, no shadow-box

### 7.8 Bottom Taskbar Specification

Height: 28px exactly. Always visible. Never scrollable.

```
┌────────────────────────────────────────────────────────────────────────────┐
│ [▶FG●] [▶MKT●] [▶INTEL○] [▶CRYPTO●] [▶NEWS●] │ ⚡ ALERT: AAPL +3.2% | 18:42:33 UTC │ [●] [?] │
└────────────────────────────────────────────────────────────────────────────┘
```

**Left section — Active Panel Tabs:**
- Each open panel shows as a compact tab: `[▶SHORTCODE●]`
- `▶` = active/focused panel
- `●` = green (fresh data) / `○` = stale data / `●`(red) = error
- Click tab to scroll panel into view and focus it
- Right-click tab → quick actions (close, pin, mute notifications)
- Tab scroll (mouse wheel on taskbar) if too many panels

**Center section — Alert Stream:**
- Scrolling marquee of recent alerts and notifications
- Each alert: `⚡ [SOURCE]: [MESSAGE] | [TIME]`
- Click alert → opens relevant panel focused on alert item
- Color-coded: red = danger/down, green = opportunity/up, amber = warning

**Right section — Status Indicators:**
- System connection status dot
- Keyboard shortcut reference `[?]`

### 7.9 Monitor Context System

The monitor context controls which panels are suggested/default and how data is filtered:

| Context | Primary Focus | Default Panel Set |
|---------|-------------|-----------------|
| FINANCE | Stock markets, economic data | Market panels, economic calendar, yield curve |
| TECH | AI, semiconductors, startups | AI insights, GitHub trending, semiconductors |
| WORLD | Geopolitics, conflicts, diplomacy | Armed conflicts, intel feed, country instability |
| COMMODITIES | Energy, metals, agriculture | Energy complex, gold/silver, commodity news |
| TRENDING | Social velocity, viral news | Social velocity, trending, breakthroughs |

**Region Filter** narrows data within panels to the selected region. For example:
- Region: ASIA + Context: WORLD → Shows conflicts/intelligence filtered to Asia
- Region: MIDDLE EAST + Context: COMMODITIES → Shows oil/gas focus, Gulf economies

This is implemented as a global filter state that panels read from. Panels that cannot be filtered by region display regardless (e.g., Fear & Greed is always global).

### 7.10 Keyboard Shortcut System

| Shortcut | Action |
|---------|--------|
| `Ctrl+K` | Open panel search / command palette |
| `Ctrl+Shift+A` | Open AI chat |
| `Ctrl+B` | Toggle left sidebar |
| `Ctrl+1-9` | Focus panel 1-9 in taskbar |
| `Ctrl+W` | Close focused panel |
| `Ctrl+P` | Pin/unpin focused panel |
| `Ctrl+M` | Maximize/restore focused panel |
| `Ctrl+F` | Find in focused panel |
| `Ctrl+D` | Duplicate focused panel |
| `Ctrl+Z` | Undo last layout change |
| `Ctrl+L` | Lock/unlock layout |
| `Ctrl+Shift+B` | Generate AI brief from all panels |
| `Ctrl+Shift+T` | Quick ticker lookup |
| `Ctrl+Shift+N` | Create new alert |
| `F1` | Help overlay |
| `F5` | Force refresh all panels |
| `F11` | Fullscreen mode |
| `Escape` | Close modal / deselect |
| `G` then `F` | Go to Finance context |
| `G` then `T` | Go to Tech context |
| `G` then `W` | Go to World context |

---

## 8. Panel System Design

### 8.1 Panel Base Component Architecture

The panel system is the most critical component of the application. Every panel must conform to a strict contract.

**PanelWrapper Contract:**

```
PanelWrapper receives:
  - panelId: string
  - config: PanelConfig
  - position: GridPosition
  - size: GridSize
  - isPinned: boolean
  - monitorContext: MonitorContext
  - regionFilter: Region

PanelWrapper provides to children:
  - data: T (typed panel data from store)
  - isLoading: boolean
  - isStale: boolean
  - error: Error | null
  - lastUpdated: Date | null
  - refresh: () => void
  - onContextMenu: PanelContextMenuState
```

**PanelHeader Contract:**
- Always renders regardless of panel content state
- Shows panel title, icon, status dot, timestamp, and menu button
- Drag handle area is the header (cursor: grab)
- Double-click header to maximize panel

**Panel Content States:**
The panel wrapper handles all state rendering — the panel content component only renders when data is available. This prevents 124 panels from each implementing their own loading/error states.

### 8.2 Panel Category Structure

**Markets, Economics & Finance Panels** (Trading Core)

| Panel Name | Data Source | Refresh | Tier |
|-----------|-------------|---------|------|
| Daily Market Brief | AI synthesis + markets | 1hr | PRO |
| Sector Heatmap | Polygon.io | 1min | Free |
| Yield Curve | FRED | 15min | Free |
| Fear & Greed | CNN/calculated | 15min | Free |
| Markets (overview) | Polygon/Finnhub | 15s | Free |
| Markets News | NewsAPI + RSS | 30s | Free |
| Economic Calendar | Investing.com | 1hr | Free |
| Earnings Calendar | Polygon.io | 1hr | Free |
| Macro Indicators | FRED + World Bank | 15min | Free |
| Central Bank Watch | Reuters + FRED | 5min | Free |
| Forex & Currencies | Polygon.io | 15s | Free |
| Fixed Income | FRED + Polygon | 5min | Free |
| Derivatives & Options | Polygon options | 30s | PRO |
| COT Positioning | CFTC | 1hr | Free |
| Hedge Funds & PE | SEC 13F data | 1hr | PRO |
| Financial Stress | FRED STLFSI | 1hr | Free |
| Financial Regulation | RSS + GDELT | 5min | Free |
| Trade Policy | GDELT + RSS | 5min | Free |
| Consumer Prices | BLS + FRED | 1hr | Free |
| Global Debt Clock | IMF + calculated | 5min | Free |
| Grocery Index | Scraped data | 1hr | Free |
| Real Big Mac Index | EIU data | 24hr | Free |
| Macro Stress | Calculated | 15min | PRO |
| Market Analysis | AI synthesis | 30min | PRO |
| WM Analyst | AI analysis | 1hr | PRO |
| Stock Analysis | AI + market data | 5min | PRO |
| Backtesting | Calculated | On-demand | PRO |
| GCC Business News | RSS | 5min | Free |
| Gulf Economies | IMF + local | 1hr | Free |
| Fintech & Trading Tech | RSS + Crunchbase | 15min | Free |
| Economic News | RSS + NewsAPI | 2min | Free |
| Financial (general) | RSS | 2min | Free |

**Global Intelligence & Geopolitics Panels**

| Panel Name | Data Source | Refresh | Tier |
|-----------|-------------|---------|------|
| Armed Conflict Events | ACLED + UCDP | 2min | Free |
| Global Situation | AI synthesis | 15min | PRO |
| Strategic Risk Overview | Calculated | 15min | PRO |
| Live Intelligence | GDELT + ACLED | 60s | Free |
| Intel Feed | Multiple OSINT | 2min | Free |
| Escalation Monitor | AI + ACLED | 5min | PRO |
| Geopolitical Hubs | GDELT + geo | 5min | Free |
| Country Instability | Calculated index | 15min | Free |
| Sanctions Pressure | OFAC + EU | 15min | Free |
| Economic Warfare | Multiple | 15min | PRO |
| Force Posture | OSINT + AIS | 5min | PRO |
| Cross-Source Signals | AI synthesis | 5min | PRO |
| Deduct Situation | AI analysis | 15min | PRO |
| Security Advisories | Gov sources | 15min | Free |
| Regulation & Policy | GDELT + RSS | 5min | Free |
| Telegram Intel | Telegram OSINT | 2min | PRO |
| Think Tanks | RSS + scraped | 1hr | Free |
| Government | RSS | 15min | Free |
| Israel Sirens | OREF API | 15s | Free |
| United States | Gov RSS | 5min | Free |
| Latin America | Regional RSS | 15min | Free |
| Europe | Regional RSS | 15min | Free |
| Asia-Pacific | Regional RSS | 15min | Free |
| Africa | Regional RSS | 15min | Free |
| Middle East | Regional RSS | 15min | Free |
| Airline Intelligence | OSINT + ADSB | 2min | Free |

**AI & Technology Panels**

| Panel Name | Data Source | Refresh | Tier |
|-----------|-------------|---------|------|
| AI Insights | RSS + papers | 15min | Free |
| AI Forecasts | AI synthesis | 1hr | PRO |
| AI Market Implications | AI synthesis | 1hr | PRO |
| AI Policy & Regulation | RSS + GDELT | 15min | Free |
| AI Regulation Dashboard | Multiple | 1hr | Free |
| AI Strategic Posture | AI analysis | 1hr | PRO |
| AI/ML | Papers + RSS | 15min | Free |
| Technology | RSS + GDELT | 5min | Free |
| Semiconductors & Hardware | RSS + market | 5min | Free |
| Cybersecurity | NVD + RSS | 5min | Free |
| Cloud & Infrastructure | RSS + status | 5min | Free |
| Service Status | Statuspage APIs | 30s | Free |
| Internet Disruptions | IODA + NetBlocks | 2min | Free |
| Developer Community | GitHub + RSS | 15min | Free |
| Github Trending | GitHub API | 1hr | Free |
| Hot Tech Hubs | Crunchbase + geo | 1hr | Free |
| Tech Events | Eventbrite + RSS | 1hr | Free |
| Tech Readiness Index | Calculated | 1hr | Free |
| R&D Signal | Papers + patents | 1hr | Free |

**Commodities, Energy & Supply Chain Panels**

| Panel Name | Data Source | Refresh | Tier |
|-----------|-------------|---------|------|
| Energy Complex | EIA + Polygon | 5min | Free |
| Energy & Resources | EIA + RSS | 5min | Free |
| Gold & Silver | Polygon.io | 30s | Free |
| Base Metals | LME + Polygon | 5min | Free |
| Critical Minerals | Multiple | 1hr | Free |
| Metals & Materials | Polygon + RSS | 5min | Free |
| Commodities News | RSS | 2min | Free |
| Commodity News | RSS | 2min | Free |
| COT Positioning | CFTC | 1hr | Free |
| FAO Food Price Index | FAO API | 24hr | Free |
| Fuel Prices | GasBuddy + EIA | 1hr | Free |
| Supply Chain | Multiple | 15min | Free |
| Hormuz Trade Tracker | AIS + OSINT | 5min | Free |
| Mining Companies | Market + RSS | 5min | Free |
| Mining News | RSS | 15min | Free |

**Cryptocurrency Panels**

| Panel Name | Data Source | Refresh | Tier |
|-----------|-------------|---------|------|
| Crypto | CoinGecko | 30s | Free |
| Crypto News | RSS + CoinGecko | 2min | Free |
| Crypto Sectors | CoinGecko | 5min | Free |
| BTC ETF Tracker | Polygon + SEC | 5min | Free |
| BTC Regime | Calculated | 15min | Free |
| Fear & Greed | Calculated | 15min | Free |
| AI Tokens | CoinGecko | 30s | Free |
| Alt Tokens | CoinGecko | 30s | Free |
| DeFi Tokens | CoinGecko | 2min | Free |
| Stablecoins | CoinGecko | 5min | Free |

**Startups & Venture Capital Panels**

| Panel Name | Data Source | Refresh | Tier |
|-----------|-------------|---------|------|
| Funding & VC | Crunchbase + RSS | 1hr | Free |
| IPO & SPAC | Polygon + RSS | 1hr | Free |
| Startups & VC | Multiple | 1hr | Free |
| Unicorn Tracker | CB Insights + RSS | 1hr | Free |
| VC Insights & Essays | RSS | 1hr | Free |
| GCC Investments | Regional sources | 1hr | Free |
| Global Startup News | RSS | 15min | Free |
| Accelerators & Demo Days | RSS + scraped | 1hr | Free |
| Product Hunt | Product Hunt API | 1hr | Free |

**Climate, Environment & Disasters Panels**

| Panel Name | Data Source | Refresh | Tier |
|-----------|-------------|---------|------|
| Climate Anomalies | NOAA + NASA | 1hr | Free |
| Climate News | RSS | 15min | Free |
| Disaster Cascade | Multiple | 5min | Free |
| Disease Outbreaks | WHO + ProMED | 15min | Free |
| Fires | NASA FIRMS | 5min | Free |
| Infrastructure Cascade | OSINT | 15min | Free |
| Population Exposure | UN + NASA | 1hr | Free |
| Radiation Watch | IAEA + RADNET | 15min | Free |
| Renewable Energy | EIA + IRENA | 1hr | Free |
| Thermal Escalation | NASA + NOAA | 15min | Free |
| Conservation Wins | RSS | 1hr | Free |

**News, Feeds & Trackers Panels**

| Panel Name | Data Source | Refresh | Tier |
|-----------|-------------|---------|------|
| Live News | RSS + NewsAPI | 30s | Free |
| World News | RSS | 30s | Free |
| Economic News | RSS | 2min | Free |
| 5 Good Things | Curated RSS | 1hr | Free |
| Good News Feed | Curated RSS | 1hr | Free |
| Breakthroughs | RSS + Nature | 1hr | Free |
| Human Progress | OurWorldInData | 24hr | Free |
| Global Giving | GiveWell + RSS | 1hr | Free |
| Layoffs Tracker | Layoffs.fyi API | 1hr | Free |
| Live Counters | Multiple APIs | 5min | Free |
| Live Webcams | Various | 30s | Free |
| Windy Live Webcam | Windy API | 60s | Free |
| My Monitors | User-configured | User-set | Free |
| Predictions | Manifold + Metaculus | 15min | Free |
| Social Velocity | Twitter/X + Reddit | 2min | Free |
| Today's Hero | Curated | 24hr | Free |
| UNHCR Displacement | UNHCR API | 24hr | Free |
| World Clock | Calculated | 1s | Free |

NOTE : Also add Pentagon Pizza Tracker in a panel and alert notifications.
### 8.3 Panel Configuration Schema

Every panel in the catalog has this configuration object:

```typescript
interface PanelConfig {
  id: string;                        // Unique snake_case ID
  label: string;                     // Display name
  shortCode: string;                 // 3-6 char code for taskbar
  icon: string;                      // Icon identifier
  category: PanelCategory;          // One of 9 categories
  tier: 'free' | 'pro';             // Access tier
  refreshInterval: number;           // Milliseconds
  refreshTier: 'T1' | 'T2' | 'T3' | 'T4';
  supportsRegionFilter: boolean;     // Can be filtered by region
  supportedRegions: Region[];        // Which regions apply
  defaultSize: GridSize;             // cols × rows
  minSize: GridSize;
  maxSize: GridSize;
  dataSource: string;                // Which API endpoint
  circuitBreakerDomain: string;      // Shared domain for CB
  description: string;               // Panel help text
  tags: string[];                    // For search
  isDefault: boolean;                // Shown by default on first load
  defaultContexts: MonitorContext[]; // Which monitor contexts include this
  canAlert: boolean;                 // Supports alert configuration
  alertableFields: string[];         // Which fields can trigger alerts
  isPremiumPreview: boolean;         // Show blurred preview to free users
  component: React.ComponentType<PanelContentProps<any>>;
}
```

---

## 9. AI Integration Architecture

### 9.1 AI Assistant Design Philosophy

The AI in StockWar Terminal is a **market intelligence analyst**, not a chatbot. It:
- Always has full context of all currently open panels
- Speaks in financial analyst language, not casual conversation
- Every claim is backed by visible data
- Never hallucinates — if it doesn't know, it says so explicitly
- Can be prompted quickly via keyboard (`Ctrl+Shift+A`)

### 9.2 AI Features

**Feature 1: Panel Analyst**
Right-click any panel → "AI: Analyze This Panel" → Returns a 3-5 sentence analyst take on the current data, with specific numbers cited.

**Feature 2: AI Chat Overlay**
Full chat interface (modal or sidebar) where the user can ask anything. The AI receives a context packet containing:
- Current monitor context and region
- All visible panel data summaries (last 200 chars of each)
- Active alerts
- Any user-specified portfolio positions
- Current market status (open/closed, major indices)

**Feature 3: Cross-Panel Correlation**
Runs continuously in the background. When it detects that 2+ panels are showing related signals, it surfaces a "Cross-Source Signal" with:
- What the correlation is
- Which panels are involved
- Potential ticker implications
- Confidence score

**Feature 4: Ticker Impact Analysis**
Given any event (from any panel), the AI scores likely ticker impact:
- Which sectors are directly affected
- Which specific tickers (S&P 500 component lookup)
- Historical precedent from similar events
- Suggested watch time window ("impact likely in 30min–2hr")

**Feature 5: Morning Brief Generation**
On market open, AI generates a structured daily brief:
- Overnight key events
- Pre-market movers with reason
- Today's economic calendar highlights
- 3 things to watch today
- Risk factors

**Feature 6: Alert Intelligence**
When user configures an alert, AI helps compose it: "I see you're watching OREF sirens. Would you also like alerts on: Israel ETF price movement, Oil futures spike, Defense sector heatmap?"

### 9.3 AI Technical Architecture

**LLM Provider: OpenRouter**
- Allows model switching without code changes
- Default model: `anthropic/claude-3.5-haiku` (fast, cost-effective)
- PRO tier: `anthropic/claude-opus-4` or `openai/gpt-4o`
- Fallback: `meta-llama/llama-3.1-8b-instruct` (free tier)

**AI API Route: `/api/ai/chat`**
Runs on Cloudflare AI Worker. Receives:
```
{
  messages: ChatMessage[]
  context: {
    panelData: Record<panelId, string>  // truncated summaries
    marketStatus: MarketStatus
    activeAlerts: Alert[]
    userPositions?: Position[]          // optional, user-configured
    monitorContext: MonitorContext
    region: Region
  }
  mode: 'chat' | 'analyze' | 'correlate' | 'brief' | 'impact'
}
```

**AI Context Management:**
- Panel data summaries are generated by each panel's `getSummaryText()` method
- Total context is capped at 8,000 tokens
- Priority: breaking news > active alerts > T1 panels > T2 panels
- Context is rebuilt on every AI request (no caching — data changes constantly)

**AI Web Worker:**
- Runs ONNX MiniLM for local embedding of news headlines
- Used for semantic deduplication of news across feeds
- Used for local cross-source correlation detection
- Never sends data off-device for this function

### 9.4 AI UI Components

**AI Quick Bar** (bottom of left sidebar):
```
┌────────────────────────────┐
│ ⬡ ASK THE ANALYST         │
│ [What's moving oil today?] │
│                    [→ Send]│
└────────────────────────────┘
```

**AI Chat Modal** (`Ctrl+Shift+A`):
- Terminal-styled dark modal, 70% viewport width
- Left: conversation history
- Right: current context summary (which panels are feeding the AI)
- Top: model selector and context toggle
- AI responses formatted as structured analyst reports when possible

**Inline AI Results:**
When AI analyzes a panel, the result appears as a special row at the top of the panel content, styled distinctly (cyan border, ⬡ icon). Dismissible. Timestamped.

---

## 10. Backend Service Architecture

### 10.1 Cloudflare Workers API Layer

**Organization: Domain-based routing**

```
/api/bootstrap           → Bulk hydration endpoint
/api/health              → System health check
/api/market/*            → All market data
/api/intelligence/*      → Geopolitical data
/api/news/*              → News and feeds
/api/tech/*              → Technology data
/api/commodities/*       → Commodity data
/api/crypto/*            → Cryptocurrency data
/api/climate/*           → Climate and disaster data
/api/startups/*          → VC/startup data
/api/ai/*                → AI endpoints
/api/user/*              → User data (auth required)
/api/alerts/*            → Alert configuration (auth required)
```

**Request Pipeline (every request):**
```
1. CORS origin validation
2. Bot/scraper detection
3. Auth header extraction (optional for public routes)
4. Rate limit check (Upstash sliding window)
5. API key validation (for non-browser clients)
6. Tier entitlement check (for PRO routes)
7. Route handler execution
8. Cache read (Redis) → upstream fallback
9. ETag generation
10. Response with cache headers
```

### 10.2 Hono.js Router Structure

Each domain is a separate Hono app mounted as a sub-router:

```
api/
├── index.ts             (Main Hono app, mounts sub-routers)
├── middleware/
│   ├── cors.ts
│   ├── auth.ts
│   ├── rate-limit.ts
│   ├── bot-filter.ts
│   └── error-handler.ts
├── routes/
│   ├── bootstrap.ts
│   ├── health.ts
│   ├── market/
│   │   ├── quotes.ts
│   │   ├── forex.ts
│   │   ├── options.ts
│   │   ├── sectors.ts
│   │   └── ...
│   ├── intelligence/
│   ├── news/
│   ├── tech/
│   ├── commodities/
│   ├── crypto/
│   ├── climate/
│   ├── startups/
│   ├── ai/
│   ├── user/
│   └── alerts/
└── shared/
    ├── redis.ts         (cachedFetchJson with stampede protection)
    ├── cache-keys.ts    (all Redis key templates)
    ├── llm.ts           (LLM provider abstraction)
    ├── rate-limit.ts
    └── entitlement.ts
```

### 10.3 Redis Cache Key Naming Convention

```
{domain}:{entity}:{identifier}:{optional-region}

Examples:
market:quotes:AAPL
market:quotes:SPY
market:sector-heatmap:global
market:yield-curve:US
intel:conflict-events:global
intel:conflict-events:middle-east
news:breaking:global
news:feed:finance
crypto:prices:BTC
crypto:fear-greed:global
climate:fires:global
climate:fires:asia
seed-meta:market:quotes         ← freshness tracking
```

**Atomic publish pattern:**
```
1. Acquire Redis lock: lock:{key}
2. Write data: SET {key} {value} EX {ttl}
3. Write freshness: SET seed-meta:{key} {timestamp} EX {ttl*2}
4. Release lock
```

### 10.4 Supabase Database Schema

**Tables:**

```sql
users
  id (Clerk user ID)
  email
  tier: enum('free', 'pro')
  created_at
  stripe_customer_id

user_preferences
  user_id (FK)
  panel_layout: jsonb          -- grid positions and sizes
  saved_layouts: jsonb[]       -- named saved layouts
  monitor_context: text
  region_filter: text
  theme: text
  keyboard_shortcuts: jsonb
  ai_context_enabled: boolean
  user_positions: jsonb        -- optional ticker positions for AI context
  updated_at

alert_rules
  id
  user_id (FK)
  panel_id: text
  rule_name: text
  condition: jsonb             -- {field, operator, value, timeWindow}
  channels: text[]             -- ['email', 'telegram', 'slack', 'webhook']
  quiet_hours: jsonb           -- {start, end, timezone}
  is_active: boolean
  created_at

notification_channels
  id
  user_id (FK)
  channel_type: enum('email', 'telegram', 'slack', 'discord', 'webhook')
  config: jsonb                -- channel-specific config
  is_verified: boolean
  created_at

notification_log
  id
  user_id (FK)
  alert_rule_id (FK)
  message: text
  sent_at
  channel: text
  status: enum('sent', 'failed', 'throttled')

subscriptions
  id
  user_id (FK)
  stripe_subscription_id
  status: enum('active', 'cancelled', 'past_due', 'trialing')
  tier: enum('pro')
  current_period_end
  created_at

api_keys
  id
  user_id (FK)
  key_hash: text               -- bcrypt hash of the key
  name: text                   -- user-given name
  last_used_at
  created_at
  is_active: boolean
```

---

## 11. Data Sources & APIs

### 11.1 Financial Market Data

| Source | Data Provided | API Type | Cost |
|--------|-------------|---------|------|
| Polygon.io | US stocks, options, forex, crypto | REST + WebSocket | Paid |
| Finnhub | Global stocks, fundamentals, news | REST + WebSocket | Freemium |
| Yahoo Finance (unofficial) | Quotes, historical | REST (scrape) | Free |
| Alpha Vantage | Forex, crypto, technicals | REST | Freemium |
| FRED (Federal Reserve) | Economic indicators, yield curve | REST | Free |
| CFTC | COT positioning data | REST (gov) | Free |
| SEC EDGAR | 13F filings, SPAC/IPO | REST (gov) | Free |
| BLS | CPI, employment data | REST (gov) | Free |
| CoinGecko | Crypto prices, DeFi | REST | Freemium |

### 11.2 Intelligence & Geopolitical Data

| Source | Data Provided | API Type | Cost |
|--------|-------------|---------|------|
| ACLED | Armed conflict events | REST (account) | Free for research |
| UCDP | Uppsala conflict data | REST | Free |
| GDELT | Global media events | BigQuery + REST | Free |
| OREF | Israel rocket alerts | WebSocket | Free |
| OFAC | US sanctions list | REST (gov) | Free |
| UN Comtrade | Trade flow data | REST | Free |

### 11.3 Aviation & Maritime

| Source | Data Provided | API Type | Cost |
|--------|-------------|---------|------|
| ADS-B Exchange | Military aircraft | WebSocket | Free tier |
| OpenSky Network | All aircraft positions | REST + WebSocket | Free |
| FlightAware | Commercial aviation | REST | Paid |
| MarineTraffic | Vessel positions (AIS) | WebSocket | Paid |
| VesselFinder | Alternative AIS | REST | Freemium |

### 11.4 News & Feeds

| Source | Data Provided | API Type | Cost |
|--------|-------------|---------|------|
| NewsAPI | Aggregated news | REST | Freemium |
| Reuters | Financial news | RSS | Free |
| Associated Press | Breaking news | RSS | Free |
| 100+ RSS feeds | Domain-specific news | RSS | Free |
| Product Hunt | Startup launches | API | Free |
| GitHub | Trending repos | API | Free (limited) |
| Manifold Markets | Prediction markets | REST | Free |
| Metaculus | Prediction markets | REST | Free |

### 11.5 Climate & Environment

| Source | Data Provided | API Type | Cost |
|--------|-------------|---------|------|
| NASA FIRMS | Active fire detection | REST | Free |
| NOAA | Weather, climate | REST | Free |
| IODA | Internet disruptions | REST | Free |
| NetBlocks | Internet shutdowns | Twitter/RSS | Free |
| WHO | Disease outbreaks | RSS | Free |
| FAO | Food price index | REST | Free |
| EIA | Energy production/prices | REST | Free |

### 11.6 Technology & Startups

| Source | Data Provided | API Type | Cost |
|--------|-------------|---------|------|
| Crunchbase | Startup funding | REST | Paid |
| Product Hunt | Product launches | REST | Free |
| GitHub | Dev activity, trending | REST | Free |
| arXiv | AI research papers | REST | Free |
| Layoffs.fyi | Tech layoffs | Scraped | Free |
| StatusPage | Service outages | REST | Free |

---

## 12. Authentication & Subscription Model

### 12.1 Tier Definitions

**Free Tier:**
- Access to all panels marked as "Free" in catalog (approximately 80 panels)
- 5-minute minimum refresh interval for T1 data
- Limited to 6 panels in layout simultaneously
- 1 saved layout
- Basic AI (3 queries per day)
- No custom alerts

**Pro Tier ($29/month or $290/year):**
- All 124 panels including PRO-locked panels
- Real-time data (T1 panels at 15-30s refresh)
- Unlimited panels in layout
- Unlimited saved layouts
- Full AI assistant (unlimited queries)
- Custom alert rules (up to 20 active)
- All notification channels
- API key for programmatic access
- Desktop app
- Priority data (faster Redis freshness)

### 12.2 Auth Flow

```
1. User visits app → Clerk detects no session
2. Sign-in modal appears (Clerk hosted UI)
3. After auth: JWT issued by Clerk
4. Frontend: JWT stored in memory (Clerk SDK)
5. API requests: JWT in Authorization header
6. Cloudflare Worker: validates JWT via Clerk JWKS
7. Worker queries Supabase: user tier
8. Entitlement applied to response
```

### 12.3 API Key System

Pro users can generate API keys for:
- Desktop app authentication
- Third-party tool integration
- MCP server access for AI assistants

Keys are hashed (bcrypt) in database. Rate limit per key: 1,000 requests/hour.

---

## 13. State Management Strategy

### 13.1 Store Architecture

**Rule: One concern, one store. No cross-store reads in components.**

Components read from one store at a time. If a component needs data from two stores, that's a signal to lift state or create a derived selector.

**Store Slice Template:**
```
{domain}Store contains:
  data: {domain data type}
  isLoading: boolean
  lastUpdated: Date | null
  error: string | null
  circuitBreakerState: 'closed' | 'open' | 'half-open'

  actions:
    setData(data)
    setLoading(bool)
    setError(err)
    setCircuitBreakerState(state)
    reset()
```

**Panel Store (special case):**
```
panelStore contains:
  layout: PanelLayout[]          (positions in grid)
  openPanels: PanelId[]          (which panels are open)
  pinnedPanels: PanelId[]        (which panels are pinned)
  maximizedPanel: PanelId | null
  minimizedPanels: PanelId[]
  panelNotifications: Record<PanelId, Notification[]>
  layoutLocked: boolean
  activeLayout: string           (name of current saved layout)

  actions:
    openPanel(id, position?)
    closePanel(id)
    pinPanel(id)
    unpinPanel(id)
    movePanel(id, newPosition)
    resizePanel(id, newSize)
    maximizePanel(id)
    restorePanel(id)
    saveLayout(name)
    loadLayout(name)
    lockLayout()
    unlockLayout()
    addPanelNotification(panelId, notification)
    clearPanelNotifications(panelId)
```

**UI Store:**
```
uiStore contains:
  sidebarOpen: boolean
  sidebarWidth: number
  activeMonitorContext: MonitorContext
  activeRegion: Region
  theme: 'terminal-dark' | 'terminal-light' | 'terminal-green'
  commandPaletteOpen: boolean
  aiChatOpen: boolean
  contextMenuState: ContextMenuState | null
  gridLinesVisible: boolean
  taskbarNotificationQueue: TaskbarNotification[]

  actions:
    toggleSidebar()
    setMonitorContext(context)
    setRegion(region)
    setTheme(theme)
    openCommandPalette()
    closeCommandPalette()
    openAIChat()
    closeAIChat()
    showContextMenu(state)
    hideContextMenu()
    pushTaskbarNotification(notification)
    dismissTaskbarNotification(id)
```

### 13.2 Data Flow Rules

```
External API
    ↓
usePanelRefresh hook (polling + circuit breaker)
    ↓
Domain service function (fetch + transform)
    ↓
Zustand store.setData()
    ↓
React re-render (subscribed components only)
    ↓
Panel content renders new data
```

**No component ever fetches data directly.** All data fetching goes through hooks. Hooks call services. Services update stores. Components read stores.

### 13.3 Persistence Strategy

| Data | Persistence | Key |
|------|------------|-----|
| Panel layout | Supabase (synced) + IndexedDB (local) | `user_preferences.panel_layout` |
| Saved layouts | Supabase + IndexedDB | `user_preferences.saved_layouts` |
| Theme | IndexedDB | `ui_theme` |
| Monitor context | Session storage | `monitor_context` |
| AI chat history | IndexedDB (last 50 messages) | `ai_chat_history` |
| Stale panel data | IndexedDB (for offline grace) | `panel_cache_{id}` |
| User positions | Supabase | `user_preferences.user_positions` |
| Alert rules | Supabase | `alert_rules` table |

---

## 14. Performance Strategy

### 14.1 Initial Load Performance Budget

| Metric | Target | Measurement |
|--------|--------|------------|
| First Contentful Paint | < 1.5s | Lighthouse |
| Time to Interactive | < 3.0s | Lighthouse |
| Layout render complete | < 2.5s | Custom metric |
| All panels hydrated | < 6.0s | Custom metric |
| LCP | < 2.0s | Core Web Vitals |

### 14.2 Runtime Performance Requirements

| Metric | Target |
|--------|--------|
| Panel update latency | < 150ms (data → visible change) |
| Context menu open | < 80ms |
| AI chat first token | < 2s |
| Layout drag response | < 16ms (60fps) |
| Keyboard shortcut response | < 50ms |
| Search results appear | < 200ms |

### 14.3 Code Splitting Strategy

```
Chunk 1: App shell (layout, sidebar, taskbar) — loads immediately
Chunk 2: Panel base system — loads after shell
Chunk 3-11: Panel categories — loaded on demand when first panel in category opens
Chunk 12: AI chat system — loaded on first AI open
Chunk 13: Chart library — loaded on first chart panel
Chunk 14: Map system — loaded on first map-based panel
Chunk 15: Settings modal — loaded on settings open
```

### 14.4 Panel Rendering Optimization

- **React.memo** on all panel content components — panels only re-render when their specific store slice changes
- **Viewport detection** — panels not in viewport suspend their polling loop
- **Virtual scrolling** in panels with long lists (news feeds, event lists)
- **Canvas-based** sparklines and micro-charts (not SVG) for high-frequency updates
- **Debounced layout writes** — grid position changes written to state at 250ms debounce
- **Deferred panel initialization** — panels below the fold initialize with 500ms stagger delay

### 14.5 Memory Management

- Maximum of 50 news items per news panel (circular buffer)
- Maximum of 100 events per event feed panel
- AI chat history limited to 50 messages in memory, rest in IndexedDB
- Stale panel data evicted from IndexedDB after 7 days
- Web Worker memory limit self-enforced at 100MB

---

## 15. Security Architecture

### 15.1 Client-Side Security

- **No secrets in frontend code** — all API credentials are server-side only
- **CSP headers** defined in Cloudflare Worker response, not meta tags
- **Input sanitization** — all user input sanitized before rendering in panels
- **XSS prevention** — no `innerHTML` with user data; React's JSX escaping enforced by ESLint rule

### 15.2 API Security

- **CORS origin allowlist** — only known domains accepted
- **JWT validation** on every authenticated request
- **Rate limiting** per IP and per user:
  - Free tier: 100 requests/min
  - Pro tier: 500 requests/min
  - API key: 1,000 requests/hour
- **Bot detection** — known scraper user agents blocked on API routes
- **Request validation** — all query parameters validated and typed (Zod schemas)

### 15.3 Credential Storage

- Desktop app: system keychain via Tauri keyring plugin
- Web app: credentials never stored client-side; only JWTs (short-lived, stored in memory)
- API keys: hashed in Supabase, never returned after creation (show-once flow)

### 15.4 Data Security

- Supabase Row Level Security (RLS) on all user tables
- User can only read/write their own data (enforced at database level, not just API)
- Notification channel configs encrypted at rest in Supabase

---

## 16. Project Directory Structure

### 16.1 Repository Structure

```
stockwar-terminal/
│
├── .github/
│   ├── workflows/
│   │   ├── test.yml              # Run unit + E2E tests
│   │   ├── lint.yml              # ESLint + TypeScript check
│   │   ├── deploy-frontend.yml   # Deploy Vite build to Vercel
│   │   ├── deploy-api.yml        # Deploy Hono to Cloudflare Workers
│   │   ├── deploy-relay.yml      # Deploy relay services to Railway
│   │   └── build-desktop.yml     # Build Tauri desktop app
│   └── ISSUE_TEMPLATE/
│
├── apps/
│   ├── frontend/                 # React SPA (Vite)
│   │   ├── src/                  # (as detailed in Section 5.2)
│   │   ├── public/
│   │   ├── index.html
│   │   ├── vite.config.ts
│   │   ├── tsconfig.json
│   │   └── package.json
│   │
│   ├── api/                      # Hono.js Cloudflare Workers
│   │   ├── src/
│   │   │   ├── index.ts          # Main router
│   │   │   ├── middleware/
│   │   │   ├── routes/
│   │   │   └── shared/
│   │   ├── wrangler.toml         # Cloudflare config
│   │   ├── tsconfig.json
│   │   └── package.json
│   │
│   ├── relay/                    # Railway relay services
│   │   ├── src/
│   │   │   ├── relay-market.ts
│   │   │   ├── relay-news.ts
│   │   │   ├── relay-intelligence.ts
│   │   │   ├── relay-aviation.ts
│   │   │   ├── relay-maritime.ts
│   │   │   └── relay-social.ts
│   │   ├── shared/
│   │   │   ├── redis.ts
│   │   │   ├── atomic-publish.ts
│   │   │   └── circuit-breaker.ts
│   │   ├── nixpacks.toml
│   │   └── package.json
│   │
│   └── desktop/                  # Tauri desktop wrapper
│       ├── src-tauri/
│       └── package.json
│
├── packages/                     # Shared packages (monorepo)
│   ├── types/                    # Shared TypeScript types
│   │   ├── src/
│   │   └── package.json
│   ├── config/                   # Shared configuration data
│   │   ├── src/
│   │   │   ├── panels.ts         # Panel catalog (shared between FE + API)
│   │   │   ├── cache-keys.ts     # Redis key registry
│   │   │   └── data-sources.ts   # Source configurations
│   │   └── package.json
│   └── utils/                    # Shared utilities
│       ├── src/
│       └── package.json
│
├── supabase/                     # Supabase configuration
│   ├── migrations/               # SQL migration files
│   ├── functions/                # Edge functions (if needed)
│   └── seed.sql
│
├── docs/                         # Project documentation
│   ├── architecture.md           # This document
│   ├── data-sources.md
│   ├── panel-catalog.md
│   ├── api-reference.md
│   └── deployment.md
│
├── scripts/                      # Development utilities
│   ├── seed-dev-redis.ts         # Seed local Redis for development
│   ├── generate-panel-stubs.ts   # Generate panel component stubs
│   └── check-api-health.ts       # Verify all API endpoints
│
├── docker-compose.yml            # Local development stack
├── turbo.json                    # Turborepo configuration
├── pnpm-workspace.yaml           # pnpm monorepo config
├── package.json                  # Root package.json
├── .env.example                  # Environment variable reference
├── .gitignore
├── .eslintrc.json                # Global ESLint config
├── biome.json                    # Biome formatter config
└── README.md
```

### 16.2 Frontend Source Structure (Detail)

```
apps/frontend/src/
│
├── types/                         (max 500 lines per file)
│   ├── market.types.ts
│   ├── panel.types.ts
│   ├── intelligence.types.ts
│   ├── news.types.ts
│   ├── ai.types.ts
│   ├── user.types.ts
│   ├── alert.types.ts
│   ├── ui.types.ts
│   └── index.ts                   (re-exports only)
│
├── config/                        (static data only, no logic)
│   ├── panels/
│   │   ├── markets.panels.ts      (market panel definitions)
│   │   ├── intelligence.panels.ts
│   │   ├── technology.panels.ts
│   │   ├── commodities.panels.ts
│   │   ├── crypto.panels.ts
│   │   ├── startups.panels.ts
│   │   ├── climate.panels.ts
│   │   ├── news.panels.ts
│   │   └── system.panels.ts
│   ├── panels.config.ts           (assembles all panels, exports catalog)
│   ├── monitor-contexts.config.ts (context → default panels mapping)
│   ├── regions.config.ts          (region definitions)
│   ├── keyboard-shortcuts.config.ts
│   ├── refresh-intervals.config.ts
│   ├── api-endpoints.config.ts    (maps panel → API endpoint)
│   └── theme.config.ts
│
├── services/                      (pure functions, no React)
│   ├── market/
│   │   ├── quotes.service.ts      (fetch + transform quotes)
│   │   ├── sectors.service.ts
│   │   ├── forex.service.ts
│   │   ├── yield-curve.service.ts
│   │   └── options.service.ts
│   ├── intelligence/
│   │   ├── conflict.service.ts
│   │   ├── sanctions.service.ts
│   │   └── geopolitical.service.ts
│   ├── news/
│   │   ├── feed.service.ts
│   │   ├── breaking-news.service.ts
│   │   └── ticker-extractor.service.ts
│   ├── ai/
│   │   ├── chat.service.ts
│   │   ├── context-builder.service.ts
│   │   └── correlation.service.ts
│   └── shared/
│       ├── cache.service.ts       (IndexedDB read/write)
│       ├── sse.service.ts         (SSE connection management)
│       └── bootstrap.service.ts   (initial data load)
│
├── stores/                        (Zustand slices)
│   ├── market.store.ts
│   ├── panel.store.ts
│   ├── intelligence.store.ts
│   ├── news.store.ts
│   ├── ai.store.ts
│   ├── ui.store.ts
│   ├── user.store.ts
│   ├── alert.store.ts
│   ├── tech.store.ts
│   ├── commodity.store.ts
│   ├── crypto.store.ts
│   └── climate.store.ts
│
├── hooks/
│   ├── usePanel.ts                (panel state + actions)
│   ├── usePanelData.ts            (data + loading state for a panel)
│   ├── usePanelRefresh.ts         (polling loop with circuit breaker)
│   ├── useKeyboardShortcuts.ts    (global keyboard bindings)
│   ├── useContextMenu.ts          (right-click context menu)
│   ├── useMonitorContext.ts       (active context + region)
│   ├── useBreakingNews.ts         (SSE breaking news stream)
│   ├── useAI.ts                   (AI chat and analysis)
│   ├── useLayout.ts               (grid layout management)
│   ├── useMarketStatus.ts         (market open/closed status)
│   └── useRegionFilter.ts         (region filter application)
│
├── components/
│   ├── ui/
│   │   ├── Button/
│   │   │   ├── Button.tsx
│   │   │   └── Button.module.css
│   │   ├── Badge/
│   │   ├── Dropdown/
│   │   ├── Tooltip/
│   │   ├── Modal/
│   │   ├── Input/
│   │   └── Tabs/
│   ├── charts/
│   │   ├── Sparkline/
│   │   ├── Heatmap/
│   │   ├── YieldCurveChart/
│   │   ├── CandlestickChart/
│   │   ├── BarChart/
│   │   └── PieChart/
│   ├── feed/
│   │   ├── NewsFeedItem/
│   │   ├── TickerTag/
│   │   ├── EventCard/
│   │   └── AlertCard/
│   └── terminal/
│       ├── TerminalText/          (monospace, blinking cursor, etc.)
│       ├── StatusDot/
│       ├── DataRow/
│       └── TimestampLabel/
│
├── panels/
│   ├── _base/
│   │   ├── PanelWrapper/
│   │   │   ├── PanelWrapper.tsx
│   │   │   └── PanelWrapper.module.css
│   │   ├── PanelHeader/
│   │   │   ├── PanelHeader.tsx
│   │   │   └── PanelHeader.module.css
│   │   ├── PanelContextMenu/
│   │   │   ├── PanelContextMenu.tsx
│   │   │   └── PanelContextMenu.module.css
│   │   ├── PanelLoadingSkeleton/
│   │   ├── PanelError/
│   │   ├── PanelStale/
│   │   └── PanelPremiumLock/
│   ├── markets/
│   │   ├── MarketPanel/
│   │   ├── SectorHeatmapPanel/
│   │   ├── YieldCurvePanel/
│   │   ├── FearGreedPanel/
│   │   ├── FearGreedPanel/
│   │   ├── DailyMarketBriefPanel/
│   │   ├── EarningsCalendarPanel/
│   │   ├── EconomicCalendarPanel/
│   │   ├── ForexPanel/
│   │   ├── FixedIncomePanel/
│   │   ├── DerivativesPanel/
│   │   ├── COTPanel/
│   │   ├── HedgeFundsPanel/
│   │   ├── FinancialStressPanel/
│   │   ├── MacroIndicatorsPanel/
│   │   ├── CentralBankWatchPanel/
│   │   ├── ConsumerPricesPanel/
│   │   ├── GlobalDebtClockPanel/
│   │   ├── GroceryIndexPanel/
│   │   ├── BigMacPanel/
│   │   ├── MacroStressPanel/
│   │   ├── MarketAnalysisPanel/
│   │   ├── StockAnalysisPanel/
│   │   ├── BacktestingPanel/
│   │   ├── TradePolicyPanel/
│   │   ├── GulfEconomiesPanel/
│   │   ├── GCCBusinessPanel/
│   │   ├── FinancialRegulationPanel/
│   │   └── FintechPanel/
│   ├── intelligence/              (26 panels)
│   ├── technology/                (19 panels)
│   ├── commodities/               (15 panels)
│   ├── crypto/                    (10 panels)
│   ├── startups/                  (9 panels)
│   ├── climate/                   (11 panels)
│   └── news/                      (18 panels)
│
├── layout/
│   ├── TerminalShell/
│   │   ├── TerminalShell.tsx
│   │   └── TerminalShell.module.css
│   ├── TopBar/
│   │   ├── TopBar.tsx
│   │   ├── MonitorTypeTabs.tsx
│   │   ├── RegionSelector.tsx
│   │   ├── MarketStatusBar.tsx
│   │   ├── WorldClock.tsx
│   │   └── TopBar.module.css
│   ├── LeftSidebar/
│   │   ├── LeftSidebar.tsx
│   │   ├── PanelLibrary.tsx
│   │   ├── PanelLibrarySearch.tsx
│   │   ├── MonitorPresets.tsx
│   │   ├── AIQuickBar.tsx
│   │   └── LeftSidebar.module.css
│   ├── PanelGrid/
│   │   ├── PanelGrid.tsx
│   │   ├── PanelGridCell.tsx
│   │   ├── GridDropZone.tsx
│   │   └── PanelGrid.module.css
│   ├── BottomTaskbar/
│   │   ├── BottomTaskbar.tsx
│   │   ├── TaskbarPanelTab.tsx
│   │   ├── TaskbarAlertStream.tsx
│   │   ├── TaskbarStatus.tsx
│   │   └── BottomTaskbar.module.css
│   └── BreakingNewsBanner/
│       ├── BreakingNewsBanner.tsx
│       └── BreakingNewsBanner.module.css
│
├── modals/
│   ├── AIChat/
│   │   ├── AIChatModal.tsx
│   │   ├── ChatMessage.tsx
│   │   ├── ContextPanel.tsx
│   │   └── AIChatModal.module.css
│   ├── PanelSearch/
│   │   ├── PanelSearchModal.tsx  (command palette)
│   │   └── PanelSearchModal.module.css
│   ├── AlertConfig/
│   ├── TickerCorrelation/
│   ├── Settings/
│   └── PanelSettings/
│
├── workers/
│   ├── ml.worker.ts
│   ├── analysis.worker.ts
│   └── vector-db.worker.ts
│
├── utils/
│   ├── circuit-breaker.ts
│   ├── debounce.ts
│   ├── throttle.ts
│   ├── format-number.ts
│   ├── format-currency.ts
│   ├── format-time.ts
│   ├── format-time-ago.ts
│   ├── ticker-extractor.ts
│   ├── region-filter.ts
│   ├── local-storage.ts
│   ├── indexed-db.ts
│   └── sse-client.ts
│
├── styles/
│   ├── tokens.css               (all CSS custom properties)
│   ├── reset.css
│   └── global.css               (body, typography, scrollbar, selection)
│
├── App.tsx
└── main.tsx
```

---

## 17. Development Phases & Milestones

### Phase 0: Foundation (Week 1–2)
**Goal: The application shell renders and all infrastructure is connected**

Deliverables:
- [ ] Monorepo setup (pnpm workspaces + Turborepo)
- [ ] Shared `types` and `config` packages created and published locally
- [ ] Vite project scaffold with TypeScript strict mode
- [ ] CSS token system defined (all colors, spacing, typography)
- [ ] Top bar renders (static, not connected)
- [ ] Left sidebar renders (static, panel library with mock data)
- [ ] Panel grid renders (empty, drag/drop working via dnd-kit)
- [ ] Bottom taskbar renders (static)
- [ ] Hono API project scaffold on Cloudflare Workers
- [ ] Redis connection verified (Upstash)
- [ ] Supabase project created, schema migrated
- [ ] Clerk auth connected to frontend
- [ ] Relay services scaffold (one per domain, not yet seeding)
- [ ] CI/CD pipelines created (not all deployed, but pipelines defined)
- [ ] ESLint rules enforced: max-lines, import boundaries, no-circular

**Exit Criteria:** `pnpm dev` shows the terminal shell, user can sign in, panels can be dragged but show empty states.

---

### Phase 1: Core Panel System (Week 3–5)
**Goal: The panel system is fully functional with 20 priority panels working**

Deliverables:
- [ ] `PanelWrapper` component complete with all states (loading, fresh, stale, error, premium-lock)
- [ ] `PanelHeader` with status dot, timestamp, menu button
- [ ] `PanelContextMenu` fully functional (all menu items, keyboard navigable)
- [ ] Panel store implemented with all actions
- [ ] Panel layout persistence (IndexedDB)
- [ ] Panel pinning, minimize, maximize working
- [ ] Bootstrap API endpoint returning fast-tier data
- [ ] Smart poll loop with circuit breaker implemented
- [ ] Viewport detection for panel refresh pausing
- [ ] 20 priority panels fully working:
  - Market overview panel
  - Sector heatmap panel
  - Fear & Greed panel
  - Yield curve panel
  - Breaking news panel
  - Economic calendar
  - Live news feed
  - Crypto overview
  - Armed conflict events
  - Country instability
  - AI insights
  - Semiconductor panel
  - Energy complex
  - Gold & Silver
  - Supply chain
  - Forex panel
  - Economic news
  - Social velocity
  - Internet disruptions
  - World clock

**Exit Criteria:** A user can open these 20 panels, arrange them, and see live data updating. Right-click context menu works on all panels.

---

### Phase 2: Monitor Context System (Week 6–7)
**Goal: Monitor context and region filtering fully functional**

Deliverables:
- [ ] Monitor context tabs (Finance, Tech, World, Commodities, Trending) implemented
- [ ] Each context loads its default panel set
- [ ] Region filter selector (Global, Americas, Europe, Asia, Africa, Oceania, Middle East, India)
- [ ] Panels that support region filtering respond to filter change
- [ ] Saved layout system (create, load, delete)
- [ ] Panel library search working
- [ ] Remaining 104 panels implemented (all 124 total)

**Note on 104 remaining panels:** Many panels share similar rendering patterns. The strategy is to implement 10 "template" panels that are then configured rather than reimplemented. For example, all regional news panels (Europe, Asia, Latin America, etc.) share one `RegionalNewsPanel` component with different config.

**Exit Criteria:** User can switch between monitor contexts and regions, see appropriate panels, and panels filter their data accordingly.

---

### Phase 3: AI Integration (Week 8–9)
**Goal: AI assistant fully integrated into the terminal**

Deliverables:
- [ ] AI chat modal (`Ctrl+Shift+A`) working
- [ ] AI chat sends full panel context to LLM
- [ ] Panel analyzer (right-click → "AI: Analyze This Panel") working
- [ ] Ticker impact analysis modal working
- [ ] Cross-source signal detection (Web Worker + AI)
- [ ] AI quick bar in left sidebar working
- [ ] Morning brief generation working
- [ ] AI suggestions appear in breaking news banner

**Exit Criteria:** User can ask the AI about any panel data and get relevant, cited analysis. AI correctly identifies which panels are feeding its context.

---

### Phase 4: Alert System (Week 10–11)
**Goal: Comprehensive alert system working**

Deliverables:
- [ ] Alert configuration UI (modal, triggered from panel context menu)
- [ ] Alert rule storage in Supabase
- [ ] Alert evaluation engine (server-side, checks conditions against live data)
- [ ] Email notification delivery
- [ ] Telegram notification delivery
- [ ] Slack notification delivery
- [ ] Taskbar alert stream showing live notifications
- [ ] Breaking news banner alerts
- [ ] Alert history view

**Exit Criteria:** User can create an alert like "notify me when Fear & Greed drops below 25" and receive it via their chosen channel.

---

### Phase 5: Polish & Performance (Week 12–13)
**Goal: Production-ready performance and UX**

Deliverables:
- [ ] Performance profiling all panels (React DevTools Profiler)
- [ ] Code splitting implemented per Section 14.3
- [ ] All performance budgets met (Section 14.1)
- [ ] Mobile view — read-only fallback with message "Open on desktop for full experience"
- [ ] Keyboard shortcuts fully implemented (all from Section 7.10)
- [ ] Onboarding flow for new users (which panels to add first)
- [ ] Empty state designs for all panels
- [ ] Error boundary on every panel (no single panel crashes the app)
- [ ] E2E tests for critical flows: layout persistence, panel data loading, AI chat
- [ ] Accessibility: keyboard navigation through all interactive elements
- [ ] WCAG 2.1 AA compliance for color contrast (even in terminal theme)

**Exit Criteria:** Lighthouse scores ≥ 85 across all metrics. All performance budgets met. Zero crashes in 1-hour stress test.

---

### Phase 6: Desktop App & Launch Prep (Week 14–15)
**Goal: Desktop app ready, all pre-launch checks complete**

Deliverables:
- [ ] Tauri desktop app wrapping frontend
- [ ] System keychain for credential storage (desktop)
- [ ] Auto-update system
- [ ] Windows, macOS, Linux builds passing
- [ ] Pro tier payment flow (Stripe integration)
- [ ] API key generation UI
- [ ] Public documentation site
- [ ] Terms of service, privacy policy
- [ ] Security review (CSP, RLS, JWT validation)

**Exit Criteria:** Desktop app passes smoke tests on all platforms. Payment flow works end-to-end. Ready for closed beta.

---

## 18. Risk Register & Mitigation

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|-----------|
| API rate limits hit on free tiers | High | Medium | Redis cache as buffer; seed data every 5min not per-request; tier-aware refresh intervals |
| Third-party API goes down (single source) | High | Low | Circuit breakers + stale data display; graceful degradation per panel; multi-source fallback for critical data |
| WebSocket relay crashes | Medium | High | Separate relay processes per domain; health checks; Railway auto-restart; fallback to polling |
| Panel state corruption after layout change | Medium | Medium | Immutable state updates only; undo system; IndexedDB backup of last known good layout |
| Redis costs spike | Medium | Medium | Monitor Upstash usage daily; set spending alert; implement local cache-aside before Redis |
| Scope creep (adding panels mid-development) | High | High | Panel catalog is LOCKED at Phase 0 completion. New panels require new planning cycle |
| AI costs spike | Medium | Medium | Token counting on every request; per-user daily limit; streaming responses to manage perceived latency; model tier by user tier |
| CSS specificity battles between panels | Medium | Low | CSS Modules from day one; no global styles except tokens; ESLint enforces no style imports outside module pattern |
| God object re-emergence | Medium | High | ESLint rule enforces store slice boundaries; code review checklist includes "does this add to a god object?" |
| Monorepo build complexity | Low | Medium | Turborepo handles this well; clear build order defined; each app has independent build validation |
| ACLED/GDELT access issues | Low | Medium | Apply for research access early (Phase 0); have fallback sources identified |
| Supabase RLS misconfiguration | Low | High | All RLS policies reviewed in security audit (Phase 5); automated tests for RLS boundary conditions |

---

## 19. Technical Debt Prevention Rules

These rules are enforced by tooling, not trust.

### 19.1 ESLint Rules (Enforced at Commit via Husky)

```json
{
  "max-lines": ["error", 300],
  "max-lines-per-function": ["error", 50],
  "import/no-circular": "error",
  "import/no-restricted-paths": [enforce boundary rules],
  "no-restricted-imports": [prevent direct store access in services],
  "@typescript-eslint/no-any": "error",
  "@typescript-eslint/explicit-function-return-type": "warn",
  "react-hooks/exhaustive-deps": "error",
  "no-console": "warn"
}
```

### 19.2 Code Review Checklist

Every PR must confirm:
- [ ] No file exceeds line limit
- [ ] No new imports that violate layer boundaries
- [ ] No direct API calls in components (must go through hooks → services)
- [ ] Every new data type is defined in `types/` first
- [ ] New panels follow `PanelWrapper` contract
- [ ] Circuit breaker is configured for any new data domain
- [ ] Loading, error, and stale states handled by PanelWrapper (not panel component)
- [ ] CSS is in a `.module.css` file (no inline styles except dynamic values)
- [ ] No secrets in frontend code
- [ ] Panel has a `getSummaryText()` method for AI context

### 19.3 Architecture Decision Records

Any deviation from this architecture plan requires an Architecture Decision Record (ADR) document:
- What decision was made
- Why the original plan was insufficient
- What alternatives were considered
- What the consequences are

ADRs are stored in `docs/adr/` and must be approved by lead developer before implementation.

### 19.4 Banned Patterns

The following patterns are explicitly banned with comments in code to make detection easy:

```
// BANNED: Direct DOM manipulation outside of Canvas/WebGL contexts
document.getElementById(...)
element.innerHTML = ...

// BANNED: God object accumulation
AppContext.everything = ...

// BANNED: Data fetching in components
fetch('/api/...') inside a React component body

// BANNED: CSS without modules
<div style={{...}} for static styles

// BANNED: Monolithic relay
One process handling multiple relay domains

// BANNED: any type
function process(data: any)

// BANNED: Global CSS class targeting
.panel-content h2 { ... } in global CSS
```

---

## 20. Definition of Done

### Panel Level
A panel is considered "done" when:
1. It renders correctly in all 5 states: loading, fresh, stale, error, premium-lock
2. It updates when its store slice changes
3. Right-click context menu works and all relevant menu items function
4. It responds correctly to monitor context changes
5. It responds correctly to region filter changes (if applicable)
6. It has a `getSummaryText()` method returning ≤200 chars of current data summary for AI context
7. It has a `getAlertableFields()` method if `canAlert: true`
8. Its CSS is fully in a `.module.css` file
9. Its component file is under 300 lines
10. It passes TypeScript strict mode with no `any` types
11. It has at least one unit test covering data transformation

### Feature Level
A feature is done when:
1. All acceptance criteria from the milestone are met
2. E2E test covers the happy path
3. Error cases are handled (no unhandled promise rejections)
4. Performance budget is not regressed
5. No new ESLint errors
6. PR review approved

### Application Level
The application is ready for launch when:
1. All 124 panels are implemented and tested
2. All 6 development phases are complete
3. All performance budgets are met
4. Security audit is passed
5. Desktop app builds on all three platforms
6. Payment flow is tested end-to-end
7. Zero P0/P1 bugs open

---

## Appendix A: Environment Variables Reference

```
# Application
VITE_APP_URL=
VITE_VARIANT=finance|tech|world|commodity|trending

# Cloudflare Workers (API)
CLOUDFLARE_ACCOUNT_ID=
CLOUDFLARE_API_TOKEN=

# Upstash Redis
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# Supabase
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Clerk Auth
VITE_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=

# AI / LLM
OPENROUTER_API_KEY=

# Market Data
POLYGON_API_KEY=
FINNHUB_API_KEY=
ALPHA_VANTAGE_API_KEY=

# Economic Data
FRED_API_KEY=

# News
NEWSAPI_KEY=

# Intelligence
ACLED_EMAIL=
ACLED_KEY=
GDELT_PROJECT_ID=

# Aviation
OPENSKY_USERNAME=
OPENSKY_PASSWORD=
ADSB_EXCHANGE_API_KEY=

# Crypto
COINGECKO_API_KEY=

# Climate
NASA_EARTHDATA_TOKEN=

# Startups
CRUNCHBASE_API_KEY=

# Notifications
SENDGRID_API_KEY=
TELEGRAM_BOT_TOKEN=
SLACK_BOT_TOKEN=

# Payments
STRIPE_PUBLISHABLE_KEY=
VITE_STRIPE_PUBLISHABLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

# Monitoring
SENTRY_DSN=
VITE_SENTRY_DSN=
POSTHOG_API_KEY=
VITE_POSTHOG_KEY=
```

---

## Appendix B: Panel Catalog Count Verification

| Category | Count |
|---------|-------|
| Markets, Economics & Finance | 31 |
| Global Intelligence & Geopolitics | 26 |
| Artificial Intelligence & Technology | 19 |
| Commodities, Energy & Supply Chain | 15 |
| Cryptocurrency & Digital Assets | 10 |
| Startups & Venture Capital | 9 |
| Climate, Environment & Disasters | 11 |
| News, Feeds & Trackers | 18 |
| System / Miscellaneous | 1 |
| **Total** | **140** |

Note: This count is slightly higher than the previous project's 124 due to including all sub-panels from the provided list. Some panels may be merged during Phase 2 if their data sources overlap significantly. Final count will be confirmed at Phase 0 completion when the panel catalog configuration file is locked.

---

## Appendix C: Key Differences From Previous Project

| Aspect | Previous Project | This Project |
|--------|----------------|-------------|
| Framework | Vanilla DOM (no framework) | React 19 |
| State | God object (AppContext) | Zustand domain slices |
| Styling | Single 424KB CSS file | CSS Modules per component |
| API layer | Vercel Edge Functions | Cloudflare Workers (Hono) |
| Database | Convex | Supabase PostgreSQL |
| Relay | Single monolithic process | 5 independent processes |
| File size limits | None enforced | ESLint max-lines enforced |
| Import boundaries | Convention only | ESLint plugin-boundaries enforced |
| Panel architecture | Class extends Panel | React components + PanelWrapper |
| Repository | Monolith | Monorepo (pnpm workspaces) |
| Planning | Discovered during build | Complete before first line of code |

---

*This document is the single source of truth for the StockWar Terminal project. Any implementation decision not covered here must be resolved by updating this document first, then implementing. The document is versioned in git alongside the code.*
