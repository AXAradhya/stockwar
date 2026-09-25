import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import * as kv from "./kv_store.tsx";

const app = new Hono();

// Configurable route prefix so deployments can choose the mounted path
const ROUTE_PREFIX = Deno.env.get('API_PROXY_PREFIX') || 'make-server-287eb62b';
const ROUTE_BASE = ROUTE_PREFIX.startsWith('/') ? ROUTE_PREFIX : `/${ROUTE_PREFIX}`;
// Optional CORS restriction (comma-separated list or single origin). Defaults to '*'.
const CORS_ALLOWED = Deno.env.get('API_ALLOW_ORIGINS') || '*';

app.use('*', logger(console.log));

// Optional lightweight in-memory rate limiter for development/testing.
// Enable by setting `API_RATE_LIMIT_ENABLED=1` and configure max/window via env.
const RATE_LIMIT_ENABLED = Deno.env.get('API_RATE_LIMIT_ENABLED') === '1';
const RATE_LIMIT_MAX = parseInt(Deno.env.get('API_RATE_LIMIT_MAX') || '120', 10);
const RATE_LIMIT_WINDOW_MS = (parseInt(Deno.env.get('API_RATE_LIMIT_WINDOW_S') || '60', 10)) * 1000;
const _rateMap: Map<string, { count: number; expiry: number }> = new Map();
if (RATE_LIMIT_ENABLED) {
  app.use('*', async (c, next) => {
    try {
      const forwarded = c.req.header('x-forwarded-for') || '';
      const ip = forwarded.split(',')[0].trim() || 'unknown';
      const now = Date.now();
      const entry = _rateMap.get(ip) || { count: 0, expiry: now + RATE_LIMIT_WINDOW_MS };
      if (now > entry.expiry) {
        entry.count = 0;
        entry.expiry = now + RATE_LIMIT_WINDOW_MS;
      }
      entry.count += 1;
      _rateMap.set(ip, entry);
      if (entry.count > RATE_LIMIT_MAX) {
        return c.json({ error: 'Rate limit exceeded' }, 429);
      }
    } catch (e) {
      console.warn('Rate limiter error', e);
    }
    return next();
  });
}

// Generic fetch proxy for BYOK deployments. This allows the frontend to request
// arbitrary third-party URLs via the deployed function rather than public CORS proxies.
// To restrict which hosts can be fetched, set `API_FETCH_ALLOWED` to a comma-separated
// list of allowed hostnames (e.g. "query1.finance.yahoo.com,api.coingecko.com"). If empty, all hosts are allowed.
app.get(`${ROUTE_BASE}/fetch`, async (c) => {
  try {
    const urlObj = new URL(c.req.url);
    const target = urlObj.searchParams.get('url');
    if (!target) return c.json({ error: 'Missing url query parameter', code: 'MISSING_PARAM' }, 400);

    let parsed;
    try { parsed = new URL(target); } catch (e) {
      return c.json({ error: 'Invalid URL', code: 'INVALID_URL' }, 400);
    }

    const allowedRaw = Deno.env.get('API_FETCH_ALLOWED') || '';
    if (allowedRaw) {
      const allowed = allowedRaw.split(',').map(s => s.trim()).filter(Boolean);
      const ok = allowed.some(a => {
        if (a.startsWith('*.')) return parsed.hostname.endsWith(a.replace('*.', ''));
        return parsed.hostname === a || parsed.hostname.endsWith(`.${a}`);
      });
      if (!ok) return c.json({ error: 'Host not allowed by proxy', code: 'HOST_NOT_ALLOWED' }, 403);
    }

    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), 10000);
    const res = await fetch(target, { signal: controller.signal });
    clearTimeout(id);

    if (!res.ok) {
      const txt = await res.text().catch(() => '');
      return c.json({ error: 'Upstream fetch failed', status: res.status, details: txt }, 502);
    }

    const ct = res.headers.get('content-type') || '';
    if (ct.includes('application/json')) {
      const j = await res.json().catch(() => null);
      return c.json({ contents: JSON.stringify(j), response: j });
    }
    const txt = await res.text().catch(() => '');
    return c.json({ contents: txt });
  } catch (err) {
    console.error('Fetch proxy error:', err);
    return c.json({ error: `Fetch proxy error: ${String(err)}` }, 500);
  }
});

app.use(
  "/*",
  cors({
    origin: CORS_ALLOWED,
    allowHeaders: ["Content-Type", "Authorization", "X-API-Key"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

function resolveApiKey(c: any, envName: string) {
  const h = c.req.header('X-API-Key') || c.req.header('X-Api-Key') || c.req.header('x-api-key');
  const auth = c.req.header('Authorization') || c.req.header('authorization');
  const bearer = auth && auth.startsWith('Bearer ') ? auth.replace(/^Bearer\s+/, '') : null;
  return h || bearer || Deno.env.get(envName) || null;
}

// Health check endpoint
app.get(`${ROUTE_BASE}/health`, (c) => {
  return c.json({ status: "ok" });
});

// ─── Finnhub Proxy ─────────────────────────────────────────────────────────────
app.get(`${ROUTE_BASE}/api/finnhub/*`, async (c) => {
  const urlObj = new URL(c.req.url);
  const prefix = `${ROUTE_BASE}/api/finnhub/`;
  const path = urlObj.pathname.replace(prefix, "");
  const search = urlObj.search;
  
  // BYOK logic: Check header first, then fallback to Deno environment variable
  const apiKey = resolveApiKey(c, 'FINNHUB_API_KEY');
  if (!apiKey) {
    return c.json({ error: 'Finnhub API key not configured on server or client.', code: 'NO_API_KEY' }, 503);
  }

  // Construct target URL
  const targetUrl = `https://finnhub.io/api/v1/${path}${search}${search ? '&' : '?'}token=${apiKey}`;

  try {
    const response = await fetch(targetUrl);
    if (!response.ok) {
      const errText = await response.text();
      console.error(`Finnhub error ${response.status}: ${errText}`);
      return c.json({ error: `Finnhub API error: ${response.status}`, details: errText }, response.status as any);
    }
    const data = await response.json();
    return c.json(data);
  } catch (err) {
    console.error("Finnhub proxy error:", err);
    return c.json({ error: 'Failed to fetch from Finnhub', code: 'FETCH_FAILED', details: String(err) }, 500);
  }
});

// ─── NewsAPI Proxy ─────────────────────────────────────────────────────────────
app.get(`${ROUTE_BASE}/api/news/*`, async (c) => {
  const urlObj = new URL(c.req.url);
  const prefix = `${ROUTE_BASE}/api/news/`;
  const path = urlObj.pathname.replace(prefix, "");
  const search = urlObj.search;
  
  const apiKey = resolveApiKey(c, 'NEWSAPI_KEY');
  if (!apiKey) {
    return c.json({ error: 'NewsAPI key not configured on server or client.', code: 'NO_API_KEY' }, 503);
  }

  const targetUrl = `https://newsapi.org/v2/${path}${search}`;

  try {
    const response = await fetch(targetUrl, {
      headers: { "X-Api-Key": apiKey }
    });
    if (!response.ok) {
      const errText = await response.text();
      console.error(`NewsAPI error ${response.status}: ${errText}`);
      return c.json({ error: `NewsAPI error: ${response.status}`, details: errText }, response.status as any);
    }
    const data = await response.json();
    return c.json(data);
  } catch (err) {
    console.error("NewsAPI proxy error:", err);
    return c.json({ error: 'Failed to fetch from NewsAPI', code: 'FETCH_FAILED', details: String(err) }, 500);
  }
});

// ─── FRED Proxy ────────────────────────────────────────────────────────────────
app.get(`${ROUTE_BASE}/api/fred/*`, async (c) => {
  const urlObj = new URL(c.req.url);
  const prefix = `${ROUTE_BASE}/api/fred/`;
  const path = urlObj.pathname.replace(prefix, "");
  const search = urlObj.search;
  
  const apiKey = resolveApiKey(c, 'FRED_API_KEY');
  if (!apiKey) {
    return c.json({ error: 'FRED API key not configured on server or client.', code: 'NO_API_KEY' }, 503);
  }

  const targetUrl = `https://api.stlouisfed.org/fred/${path}${search}${search ? '&' : '?'}api_key=${apiKey}&file_type=json`;

  try {
    const response = await fetch(targetUrl);
    if (!response.ok) {
      const errText = await response.text();
      console.error(`FRED error ${response.status}: ${errText}`);
      return c.json({ error: `FRED API error: ${response.status}`, details: errText }, response.status as any);
    }
    const data = await response.json();
    return c.json(data);
  } catch (err) {
    console.error("FRED proxy error:", err);
    return c.json({ error: 'Failed to fetch from FRED', code: 'FETCH_FAILED', details: String(err) }, 500);
  }
});

// ─── OpenRouter AI Chat Proxy ──────────────────────────────────────────────────
app.post(`${ROUTE_BASE}/ai/chat`, async (c) => {
  try {
    const body = await c.req.json();
    const { messages, model = "meta-llama/llama-3.3-8b-instruct:free", panelContext, systemPrompt, apiKey: clientApiKey } = body;

    if (!messages || !Array.isArray(messages)) {
      return c.json({ error: 'Invalid request body: messages array required', code: 'INVALID_BODY' }, 400);
    }

    // Allow frontend-provided key to override the server env key
    const apiKey = clientApiKey || resolveApiKey(c, 'OPENROUTER_API_KEY');
    if (!apiKey) {
      return c.json({ error: 'OpenRouter API key not configured. Please add your key in ⚙ Settings → AI & Intelligence → OpenRouter API Key.', code: 'NO_API_KEY' }, 503);
    }

    // Build system message with terminal context
    const systemMessage = systemPrompt || `You are STOCKWAR ANALYST — an elite AI embedded in a professional military war room-style trading intelligence terminal. You have access to real-time market data, geopolitical intelligence feeds, options flow, armed conflict trackers, and macro data.

Your role is to provide sharp, precise, actionable analysis like a seasoned Wall Street quant + geopolitical analyst hybrid. Be concise, direct, and formatted for a terminal (use bullet points, bold key terms with **, avoid fluff). Focus on market implications, risk assessment, and actionable intelligence.

Current terminal state:
- S&P 500: 5,487 +0.34% | NASDAQ: 19,342 -0.22% | VIX: 16.4
- BTC: $64,822 +1.96% | Gold: $2,344 +0.53%
- WTI Oil: $84.44 +3.25%
- 5 active conflict zones — Yemen, Ukraine, Gaza, Sudan, Myanmar
- Fed Funds: 5.25-5.50% | CPI: 2.8% YoY
- USD/INR: 83.42 | Nifty50: ~22,400
${panelContext ? `\nActive Panel Context:\n${panelContext}` : ''}`;

    const openRouterMessages = [
      { role: "system", content: systemMessage },
      ...messages.map((m: { role: string; content: string }) => ({
        role: m.role,
        content: m.content,
      })),
    ];

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://stockwar-terminal.app",
        "X-Title": "StockWar Terminal",
      },
      body: JSON.stringify({
        model,
        messages: openRouterMessages,
        max_tokens: 1200,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.log(`OpenRouter API error ${response.status}: ${errText}`);
      return c.json({ error: `OpenRouter API error: ${response.status}`, details: errText }, response.status as number);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      return c.json({ error: 'No content returned from OpenRouter API', code: 'NO_CONTENT' }, 500);
    }

    return c.json({
      content,
      model: data.model,
      usage: data.usage,
    });
  } catch (err) {
    console.log("AI chat route error:", err);
    return c.json({ error: `AI chat error: ${err}` }, 500);
  }
});

// ─── Alert Rules KV Store ─────────────────────────────────────────────────────
app.get(`${ROUTE_BASE}/alerts`, async (c) => {
  try {
    const rules = await kv.getByPrefix("alert_rule_");
    return c.json({ rules });
  } catch (err) {
    return c.json({ error: `Failed to fetch alert rules: ${err}` }, 500);
  }
});

app.post(`${ROUTE_BASE}/alerts`, async (c) => {
  try {
    const rule = await c.req.json();
    if (!rule || !rule.id) return c.json({ error: 'Invalid alert rule payload', code: 'INVALID_BODY' }, 400);
    await kv.set(`alert_rule_${rule.id}`, rule);
    return c.json({ success: true, rule });
  } catch (err) {
    return c.json({ error: `Failed to save alert rule: ${err}` }, 500);
  }
});

app.delete(`${ROUTE_BASE}/alerts/:id`, async (c) => {
  try {
    const id = c.req.param("id");
    await kv.del(`alert_rule_${id}`);
    return c.json({ success: true });
  } catch (err) {
    return c.json({ error: `Failed to delete alert rule: ${err}` }, 500);
  }
});

Deno.serve(app.fetch);