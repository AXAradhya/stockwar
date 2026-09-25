Supabase BYOK Proxy — Setup & Environment

This folder contains a small Hono-based proxy used to forward requests to third-party APIs when a server-side API key is preferred (BYOK).

Required environment variables (set in Supabase / Deno deployment):

- FINNHUB_API_KEY — Finnhub API key for market data (optional if clients provide `X-API-Key`).
- NEWSAPI_KEY — NewsAPI key for `newsapi.org` endpoints (optional if clients provide `X-API-Key`).
- FRED_API_KEY — St. Louis Fed (FRED) API key for economics/time series requests (optional if clients provide `X-API-Key`).
- OPENROUTER_API_KEY — OpenRouter AI API key (optional; clients can also send `apiKey` in POST body).

Behavior notes:

- The proxy accepts client-supplied keys via the `X-API-Key` or `Authorization: Bearer <key>` headers.
- When no key is provided by client and no server env var is configured, endpoints return a 503 JSON response with `code: "NO_API_KEY"`.
- Errors returned from upstream providers are forwarded as structured JSON with `error` and `details` fields when possible.

Security:

- Keep production API keys in the environment (do not commit them to source).
- Limit deployment access and rotate keys regularly.

Local testing:

- You can supply a key in requests using the `X-API-Key` header. Example cURL:

```bash
curl -H "X-API-Key: $FINNHUB_API_KEY" "https://<your-proxy>/make-server-287eb62b/api/finnhub/quote?symbol=AAPL"
```

- For OpenRouter AI chat, POST JSON `{ messages: [...], apiKey: '<your-key>' }`.

If you want, I can add a small test script to validate each proxy route when deployed locally or to CI.
