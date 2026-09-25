Deploying the BYOK proxy (Supabase Functions)

Overview
--------
This repository contains a Supabase Edge Function at `supabase/functions/server` which implements a BYOK (bring-your-own-key) proxy for Finnhub, NewsAPI, FRED, and OpenRouter AI. The function code is ready but must be deployed and configured with project secrets.

Prerequisites
-------------
- Supabase CLI installed and logged in (`npm install -g supabase` or follow https://supabase.com/docs/guides/cli)
- Have your Supabase project ref or project URL available
- API keys to protect in secrets: `FINNHUB_API_KEY`, `NEWSAPI_KEY`, `FRED_API_KEY`, `OPENROUTER_API_KEY` (optional)

Deploy function (recommended)
-----------------------------
1. Login to supabase CLI (if needed):

```bash
supabase login
```

2. From the repo root, deploy the function folder:

```bash
cd supabase/functions/server
# deploy the function (adjust name if you prefer a different function name)
supabase functions deploy server --project-ref <PROJECT_REF>
```

3. Set project secrets (these are available to Edge Functions via `Deno.env.get`):

```bash
supabase secrets set FINNHUB_API_KEY="your_finnhub_key" NEWSAPI_KEY="your_newsapi_key" FRED_API_KEY="your_fred_key" OPENROUTER_API_KEY="your_openrouter_key" --project-ref <PROJECT_REF>
```

4. Note the publicly-routable function base URL. You can use either:
- `https://<PROJECT>.supabase.co/functions/v1/server` OR
- `https://<PROJECT>.functions.supabase.co/server`

The function handlers in the code are mounted under a configurable prefix (default: `/make-server-287eb62b`). You can control the prefix used by the function with the `API_PROXY_PREFIX` environment variable when deploying the function. When wiring the frontend, you may set either:

- `VITE_API_PROXY_URL` to include the full mounted path (e.g. `https://<PROJECT>.supabase.co/functions/v1/make-server-287eb62b`), OR
- set `VITE_API_PROXY_URL` to the function base (e.g. `https://<PROJECT>.supabase.co/functions/v1`) and set `VITE_API_PROXY_PREFIX=make-server-287eb62b`.

Examples:

```
VITE_API_PROXY_URL=https://<PROJECT>.supabase.co/functions/v1/make-server-287eb62b
```
or
```
VITE_API_PROXY_URL=https://<PROJECT>.supabase.co/functions/v1
VITE_API_PROXY_PREFIX=make-server-287eb62b
```

To restrict CORS on the function, set `API_ALLOW_ORIGINS` when deploying (defaults to `*` for development). For example:

```
supabase secrets set API_ALLOW_ORIGINS="https://app.example.com"
```

Quick smoke tests
-----------------
Health check (GET):

```bash
curl "${VITE_API_PROXY_URL}/make-server-287eb62b/health"
```

Finnhub proxy example (GET):

```bash
curl "${VITE_API_PROXY_URL}/make-server-287eb62b/api/finnhub/quote?symbol=AAPL"
```

AI chat example (POST):

```bash
curl -X POST "${VITE_API_PROXY_URL}/make-server-287eb62b/ai/chat" \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"Ping"}]}'
```

Generic fetch proxy example (GET):

```bash
curl "${VITE_API_PROXY_URL}/make-server-287eb62b/fetch?url=https://query1.finance.yahoo.com/v8/finance/chart/AAPL?interval=1d&range=5d"
```

Control which hosts are allowed through the generic fetch proxy by setting `API_FETCH_ALLOWED` as a comma-separated list of hostnames. Example:

```
supabase secrets set API_FETCH_ALLOWED="query1.finance.yahoo.com,api.coingecko.com"
```

Notes
-----
- If secrets are not set, endpoints intentionally return JSON with `code: "NO_API_KEY"` so the frontend can surface a clear `⚠ NO KEY` badge rather than failing silently.
- After deployment, rebuild the frontend with the correct `VITE_API_PROXY_URL` value and run `npm run build` or `npm run dev`.

Troubleshooting
---------------
- If you see a 404, confirm the function name and path and whether the function URL is `.../functions/v1/<name>` or the newer `functions` subdomain. Adjust `VITE_API_PROXY_URL` accordingly.
- Use the Supabase dashboard to inspect function logs for runtime errors.
