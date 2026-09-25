import { useConfigStore } from '../stores/configStore';
import { logToTerminal } from '../stores/logStore';
import { useTickerConfigStore } from '../stores/tickerConfigStore';
import { projectId, publicAnonKey } from '../../../utils/supabase/info';
import { fmtNum, roundTo } from '../utils/numberFormat';

const FRED_BASE = 'https://api.stlouisfed.org/fred';
const PROXY_BASE = import.meta.env.VITE_API_PROXY_URL || '';
// When true, allow trying public CORS proxies (allorigins/codetabs/etc.).
// Only enable public proxies for local development when explicitly allowed.
const ALLOW_PUBLIC_PROXIES = import.meta.env.DEV && import.meta.env.VITE_ALLOW_PUBLIC_PROXIES === '1';
// Persist warning set on the global object to survive HMR reloads
const _global: any = (globalThis as any) || {};
if (!_global.__stockwar_loggedWarnings) _global.__stockwar_loggedWarnings = new Set<string>();
const loggedWarnings: Set<string> = _global.__stockwar_loggedWarnings;

// Normalize shapes returned by `fetchDirectAllOrigins` so callers can access parsed JSON
function normalizeProxyResponse(raw: any): any {
  if (!raw) return null;
  // If the helper already returned a parsed `response` object, prefer it
  if (raw.response) return raw.response;
  // If `contents` is a JSON string, parse it
  if (typeof raw.contents === 'string') {
    try {
      return JSON.parse(raw.contents);
    } catch (e) {
      return raw.contents;
    }
  }
  return raw;
}

// Build a proxy URL that is resilient to whether `VITE_API_PROXY_URL` already includes
// the mounted function prefix (e.g. "/make-server-287eb62b") or not.
function joinProxyPath(path: string) {
  const prefixRaw = import.meta.env.VITE_API_PROXY_PREFIX || 'make-server-287eb62b';
  const prefix = prefixRaw.replace(/^\/+|\/+$/g, '');
  if (!PROXY_BASE) return `/${prefix}${path.startsWith('/') ? path : '/' + path}`;
  const base = PROXY_BASE.replace(/\/+$/,'');
  if (base.includes(`/${prefix}`)) return `${base}${path.startsWith('/') ? path : '/' + path}`;
  return `${base}/${prefix}${path.startsWith('/') ? path : '/' + path}`;
}


function getKey(k: keyof ReturnType<typeof useConfigStore.getState>['apiKeys']) {
  const val = useConfigStore.getState().apiKeys[k];
  if (!val) return '';
  // Treat obvious placeholder or redacted values as "no key" to avoid
  // repeated 401 requests and noisy console logs during local dev.
  const placeholderRe = /SAVED_|REDACTED|<|YOUR_|PLACEHOLDER|EXAMPLE|XXXX|xxxx|fillme/i;
  if (placeholderRe.test(val)) return '';
  return val;
}

async function timeoutFetch(input: RequestInfo, init: RequestInit = {}, ms = 15000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), ms);
  try {
    const res = await fetch(input, { ...init, signal: controller.signal });
    return res;
  } finally {
    clearTimeout(id);
  }
}

async function fetchDirectJSON<T = any>(url: string, opts?: RequestInit): Promise<T> {
  const res = await timeoutFetch(url, opts);
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${url}`);
  return res.json();
}

async function fetchJSON<T = any>(url: string, opts: RequestInit = {}, retries = 2): Promise<T> {
  let finalUrl = url;
  let usedProxy = false;
  let proxyFor: keyof ReturnType<typeof useConfigStore.getState>['apiKeys'] | null = null;

  if (url.startsWith('https://finnhub.io/api/v1/')) {
    const key = getKey('finnhub');
    if (key) {
      finalUrl = url.includes('?') ? `${url}&token=${encodeURIComponent(key)}` : `${url}?token=${encodeURIComponent(key)}`;
    } else if (PROXY_BASE) {
      finalUrl = joinProxyPath(`/api/finnhub/${url.replace('https://finnhub.io/api/v1/', '')}`);
      usedProxy = true;
      proxyFor = 'finnhub';
    }
  } else if (url.startsWith('https://newsapi.org/v2/')) {
    const key = getKey('newsApi');
    if (key) {
      finalUrl = url.includes('?') ? `${url}&apiKey=${encodeURIComponent(key)}` : `${url}?apiKey=${encodeURIComponent(key)}`;
    } else if (PROXY_BASE) {
      finalUrl = joinProxyPath(`/api/news/${url.replace('https://newsapi.org/v2/', '')}`);
      usedProxy = true;
      proxyFor = 'newsApi';
    }
  } else if (url.startsWith('https://api.stlouisfed.org/fred/')) {
    const key = getKey('fred');
    if (key) {
      finalUrl = url.includes('?') ? `${url}&api_key=${encodeURIComponent(key)}` : `${url}?api_key=${encodeURIComponent(key)}`;
    } else if (PROXY_BASE) {
      finalUrl = joinProxyPath(`/api/fred/${url.replace('https://api.stlouisfed.org/fred/', '')}`);
      usedProxy = true;
      proxyFor = 'fred';
    }
  }

  // If an endpoint requires an API key and neither a key nor a proxy is configured,
  // fail early with a clear message to avoid repeated 401 attempts.
  if (url.startsWith('https://finnhub.io/api/v1/') && !getKey('finnhub') && !PROXY_BASE) {
    if (!loggedWarnings.has('finnhub')) {
      logToTerminal('ERROR', 'API:fetchJSON', 'Missing Finnhub API key in Settings');
      loggedWarnings.add('finnhub');
    }
    throw new Error('Missing Finnhub API key. Add it in Settings or configure an API proxy.');
  }
  if (url.startsWith('https://newsapi.org/v2/') && !getKey('newsApi') && !PROXY_BASE) {
    if (!loggedWarnings.has('newsapi')) {
      logToTerminal('ERROR', 'API:fetchJSON', 'Missing NewsAPI key in Settings');
      loggedWarnings.add('newsapi');
    }
    throw new Error('Missing NewsAPI key. Add it in Settings or configure an API proxy.');
  }
  if (url.startsWith('https://api.stlouisfed.org/fred/') && !getKey('fred') && !PROXY_BASE) {
    if (!loggedWarnings.has('fred')) {
      logToTerminal('ERROR', 'API:fetchJSON', 'Missing FRED API key or proxy; requests will be blocked by CORS');
      loggedWarnings.add('fred');
    }
    throw new Error('Missing FRED API key or proxy. Add FRED key in Settings or configure an API proxy.');
  }

  let attempt = 0;
  while (attempt <= retries) {
    try {
      const headers = new Headers((opts.headers as HeadersInit) || {});
      if (!headers.has('Accept')) headers.set('Accept', 'application/json');
      if (usedProxy && proxyFor) {
        const k = getKey(proxyFor);
        if (k) headers.set('X-API-Key', k);
      }
      const res = await timeoutFetch(finalUrl, { ...opts, headers });
      if (!res.ok) {
        const ct = res.headers.get('content-type') || '';
        const txt = ct.includes('application/json') ? JSON.stringify(await res.json()) : await res.text().catch(() => '');
        const err = new Error(`${usedProxy ? '[Proxy] ' : ''}HTTP ${res.status}: ${txt}`);
        if (res.status >= 500 && attempt < retries) {
          attempt++;
          await new Promise(r => setTimeout(r, 400 * attempt));
          continue;
        }
        throw err;
      }
      const ct = res.headers.get('content-type') || '';
      if (ct.includes('application/json')) return (await res.json()) as T;
      return (await res.text()) as unknown as T;
    } catch (err: any) {
      logToTerminal('WARN', 'API:fetchJSON', `Attempt ${attempt + 1} failed for ${url}: ${String(err)}`);
      if (attempt < retries) {
        attempt++;
        await new Promise(r => setTimeout(r, 300 * attempt));
        continue;
      }
      logToTerminal('ERROR', 'API:fetchJSON', `Giving up fetching ${url}: ${String(err)}`);
      throw err;
    }
  }
  throw new Error('fetchJSON: exhausted retries');
}

async function yahooProxy(symbol: string, retries = 2): Promise<any> {
  const yahoo = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=1d`;
  try {
    const raw = await fetchDirectAllOrigins(yahoo, retries);
    if (!raw) throw new Error('No proxy response');
    const contentsCandidate = raw.contents ?? raw.response ?? raw;
    let parsed: any = null;
    if (typeof contentsCandidate === 'string') {
      try { parsed = JSON.parse(contentsCandidate); } catch (e) { parsed = null; }
    } else {
      parsed = contentsCandidate;
    }
    const meta = parsed?.chart?.result?.[0]?.meta;
    if (meta) return meta;
  } catch (err) {
    // fallthrough to retry
  }
  if (retries > 0) return yahooProxy(symbol, retries - 1);
  throw new Error(`No Yahoo Finance data for ${symbol}`);
}

export async function fetchDirectAllOrigins(url: string, retries = 2) {
  // Prefer BYOK proxy /fetch endpoint when available to avoid flaky public proxies.
  if (PROXY_BASE) {
    try {
      const proxyUrl = joinProxyPath(`/fetch?url=${encodeURIComponent(url)}`);
      const res = await timeoutFetch(proxyUrl, {}, 10000);
      if (res.ok) {
        try {
          const j = await res.json();
          if (j && (j.contents || j.response)) return j;
          return { contents: typeof j === 'string' ? j : JSON.stringify(j), response: j };
        } catch (e) {
          try {
            const txt = await res.text();
            if (txt) return { contents: txt };
          } catch (e2) {
            // fall through to public proxies
          }
        }
      }
    } catch (e) {
      // BYOK fetch failed; fall back to public proxies
    }
  }

  // Try a list of public CORS proxies in order, then fall back to a direct fetch.
  // If public proxies are disabled, avoid hitting flaky CORS proxies (reduces noisy browser errors).
  if (!PROXY_BASE && !ALLOW_PUBLIC_PROXIES) {
    if (!loggedWarnings.has('public_proxies_disabled')) {
      logToTerminal('WARN', 'API:fetchDirectAllOrigins', 'Public CORS proxies are disabled. Configure a secure API proxy (VITE_API_PROXY_URL) to enable scraped endpoints; public proxies are only allowed for local testing.');
      loggedWarnings.add('public_proxies_disabled');
    }
    return null;
  }

  const proxies = [
    (u: string) => `https://api.allorigins.win/get?url=${encodeURIComponent(u)}`,
    (u: string) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(u)}`,
    (u: string) => `https://corsproxy.io/?${encodeURIComponent(u)}`,
    (u: string) => `https://thingproxy.freeboard.io/fetch/${encodeURIComponent(u)}`,
  ];

  // Try each public proxy and normalize the returned shape to { contents?, response? }
  for (const p of proxies) {
    try {
      const proxyUrl = p(url);
      const res = await timeoutFetch(proxyUrl, {}, 10000);
      if (!res.ok) continue;
      // Try parsing as JSON first; if that fails, fallback to text
      try {
        const j = await res.json();
        // Some proxies (allorigins) return { contents: '...' }
        if (j && (j.contents || j.response)) return j;
        // If the JSON appears to be the direct HTML payload, wrap it
        return { contents: typeof j === 'string' ? j : JSON.stringify(j), response: j };
      } catch (e) {
        try {
          const txt = await res.text();
          if (txt) return { contents: txt };
        } catch (e2) {
          // fallthrough to next proxy
        }
      }
    } catch (e) {
      // try next proxy
    }
  }

  // As a last resort, try a direct fetch (works for APIs that support CORS like CoinGecko)
  try {
    const direct = await timeoutFetch(url, {}, 10000);
    if (direct.ok) {
      const ct = direct.headers.get('content-type') || '';
      if (ct.includes('application/json')) {
        const j = await direct.json().catch(() => null);
        if (j !== null) return { contents: JSON.stringify(j), response: j };
      }
      const txt = await direct.text().catch(() => '');
      return { contents: txt };
    }
  } catch (e) {
    // fall through to retry logic
  }

  if (retries > 0) return fetchDirectAllOrigins(url, retries - 1);
  throw new Error(`CORS proxy/direct fetch failed for ${url}`);
}

// Public wrapper to obtain Yahoo Finance meta for a symbol (uses internal proxy strategy)
export async function fetchYahooMeta(symbol: string) {
  return yahooProxy(symbol);
}

// Fetch raw Yahoo chart JSON (parsed) for a symbol and range
export async function fetchYahooChart(symbol: string, range: string = '1mo') {
  const yahooUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=${range}`;
  const raw = await fetchDirectAllOrigins(yahooUrl);
  if (!raw) throw new Error('No response from Yahoo proxy');
  let parsed: any = null;
  try {
    const contentsCandidate = raw.contents ?? raw.response ?? raw;
    if (typeof contentsCandidate === 'string') parsed = JSON.parse(contentsCandidate);
    else parsed = contentsCandidate;
  } catch (e) {
    parsed = raw.response || null;
  }
  const result = parsed?.chart?.result?.[0];
  if (!result) throw new Error(`No Yahoo Finance data for ${symbol}`);
  return result;
}

// Exports
export async function fetchFinnhubQuote(symbol: string) {
  return fetchJSON(`https://finnhub.io/api/v1/quote?symbol=${symbol}`);
}

export async function fetchStockCandles(symbol: string, resolution: string, from: number, to: number) {
  return fetchJSON(`https://finnhub.io/api/v1/stock/candle?symbol=${symbol}&resolution=${resolution}&from=${from}&to=${to}`);
}

export async function fetchStockProfile(symbol: string) {
  return fetchJSON(`https://finnhub.io/api/v1/stock/profile2?symbol=${symbol}`);
}

export async function fetchCompanyNews(symbol: string, from: string, to: string) {
  return fetchJSON(`https://finnhub.io/api/v1/company-news?symbol=${symbol}&from=${from}&to=${to}`);
}

export async function fetchAnalystRatings(symbol: string) {
  return fetchJSON(`https://finnhub.io/api/v1/stock/recommendation?symbol=${symbol}`);
}

export async function fetchBasicFinancials(symbol: string) {
  return fetchJSON(`https://finnhub.io/api/v1/stock/metric?symbol=${symbol}&metric=all`);
}

export async function fetchStockEarnings(symbol: string) {
  return fetchJSON(`https://finnhub.io/api/v1/stock/earnings?symbol=${symbol}`);
}

export async function fetchFinnhubSymbolLookup(query: string) {
  return fetchJSON(`https://finnhub.io/api/v1/search?q=${encodeURIComponent(query)}`);
}

export async function fetchMarketIndices(region?: string) {
  const cfg = useTickerConfigStore.getState().config;
  const tickers = region === 'INDIA' ? cfg.indiaIndices : region === 'EUROPE' ? cfg.europeIndices : cfg.usIndices;
  const names = { ...cfg.usIndicesNames, ...cfg.indiaIndicesNames, ...cfg.europeIndicesNames };
  // Attempt to fetch each ticker, but don't fail the whole operation if some tickers fail.
  const results = await Promise.all(
    tickers.map(async (t) => {
      try {
        if (!t.startsWith('^')) {
          const d = await fetchFinnhubQuote(t);
          return { ticker: t, name: names[t] || t, price: d.c, change: d.d, changePct: d.dp, high: d.h, low: d.l };
        }
        const y = await yahooProxy(t);
        return { ticker: t, name: names[t] || t, price: y.regularMarketPrice, change: y.regularMarketChange, changePct: y.regularMarketChangePercent, high: y.regularMarketDayHigh, low: y.regularMarketDayLow };
      } catch (e: any) {
        // Only warn once per ticker to avoid spam — callers will still receive available tickers
        const key = `markets:${t}`;
        if (!loggedWarnings.has(key)) {
          logToTerminal('WARN', 'API:Markets', `Failed ${t}: ${e.message}`);
          loggedWarnings.add(key);
        }
        return null;
      }
    })
  );
  const ok = results.filter(Boolean) as any[];
  if (ok.length === 0) {
    logToTerminal('WARN', 'API:MarketIndices', 'All market indices fetch failed — check API keys in Settings');
    return [];
  }
  return ok;
}

export async function fetchTopMovers() {
  const cfg = useTickerConfigStore.getState().config;
  const raw = await fetchDirectAllOrigins(`https://query1.finance.yahoo.com/v1/finance/screener/predefined/saved?formatted=false&scrIds=most_actives&count=${cfg.topMoversCount}`);
  let parsed: any = null;
  try {
    if (!raw) throw new Error('No response');
    if (typeof raw.contents === 'string') parsed = JSON.parse(raw.contents);
    else parsed = raw.response || raw.contents || raw;
  } catch (e) {
    logToTerminal('WARN', 'API:TopMovers', `Failed to parse top movers response: ${String(e)}`);
    parsed = raw?.response || null;
  }
  const quotes = parsed?.finance?.result?.[0]?.quotes || [];
  if (!Array.isArray(quotes) || quotes.length === 0) {
    logToTerminal('WARN', 'API:TopMovers', 'Empty screener or no top movers returned');
    return [];
  }
  return quotes.map((q: any) => ({ ticker: q.symbol, name: q.shortName || q.symbol, price: q.regularMarketPrice, change: q.regularMarketChange, changePct: q.regularMarketChangePercent, volume: q.regularMarketVolume ? fmtNum(q.regularMarketVolume / 1e6, 1, '-') + 'M' : '-' }));
}

export async function fetchIndiaMarkets() {
  const cfg = useTickerConfigStore.getState().config;
  const names = cfg.indiaIndicesNames;
  const results = await Promise.allSettled(
    cfg.indiaIndices.map(async (sym) => {
      const m = await yahooProxy(sym);
      const label = sym === '^NSEI' ? 'NIFTY' : sym === '^BSESN' ? 'SENSEX' : sym === '^NSEBANK' ? 'BANKNIFTY' : sym.replace('^', '');
      return { symbol: label, name: names[sym] || sym, price: m.regularMarketPrice, change: m.regularMarketChange, changePct: m.regularMarketChangePercent };
    })
  );
  const ok = results.filter(r => r.status === 'fulfilled').map((r: any) => r.value);
  if (ok.length === 0) {
    logToTerminal('WARN', 'API:IndiaMarkets', 'India markets fetch returned no data');
    return [];
  }
  return ok;
}

export async function fetchSectorHeatmap() {
  const cfg = useTickerConfigStore.getState().config;
  const names = cfg.sectorEtfNames;
  const results = await Promise.allSettled(
    cfg.sectorEtfs.map(async (ticker) => {
      try {
        const d = await fetchFinnhubQuote(ticker);
        return { name: names[ticker] || ticker, ticker, change: d.c ? d.dp ?? 0 : 0, price: d.c || 0 };
      } catch {
        const m = await yahooProxy(ticker);
        return { name: names[ticker] || ticker, ticker, change: m.regularMarketChangePercent ?? 0, price: m.regularMarketPrice };
      }
    })
  );
  const ok = results.filter(r => r.status === 'fulfilled').map((r: any) => r.value);
  if (ok.length === 0) {
    logToTerminal('WARN', 'API:SectorHeatmap', 'Sector heatmap returned no data');
    return [];
  }
  return ok;
}

export async function fetchCryptoPrices() {
  const cfg = useTickerConfigStore.getState().config;
  let data: any;
  try {
    data = await fetchJSON(`https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${cfg.cryptoCoins.join(',')}&order=market_cap_desc`);
  } catch (e: any) {
    logToTerminal('WARN', 'API:Crypto', `CoinGecko fetch failed: ${String(e)}`);
    return [];
  }
  if (!Array.isArray(data)) {
    logToTerminal('WARN', 'API:Crypto', 'CoinGecko returned invalid data');
    return [];
  }
  return data.map((c: any) => ({ symbol: c.symbol.toUpperCase(), name: c.name, price: c.current_price, change: c.price_change_24h, changePct: c.price_change_percentage_24h, volume: c.total_volume ? fmtNum(c.total_volume / 1e9, 1, '-') + 'B' : '-', marketCap: c.market_cap ? fmtNum(c.market_cap / 1e9, 1, '-') + 'B' : '-' }));
}

export async function fetchLiveNews(region?: string) {
  const country = region === 'INDIA' ? 'in' : region === 'EUROPE' ? 'gb' : 'us';
  // If NewsAPI key and proxy are both missing, return an empty feed instead of throwing
  if (!getKey('newsApi') && !PROXY_BASE) {
    if (!loggedWarnings.has('newsapi_ui')) {
      logToTerminal('WARN', 'API:fetchLiveNews', 'NewsAPI key not set; returning empty news feed');
      loggedWarnings.add('newsapi_ui');
    }
    return [];
  }

  try {
    const data = await fetchJSON(`https://newsapi.org/v2/top-headlines?category=business&language=en&country=${country}&pageSize=20`);
    const raw = (data.articles || []) as any[];
    const now = new Date();
    const cutoff24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Map articles with computed published date and derived severity (by rank)
    const mapped = raw.map((a: any, i: number) => {
      const published = a.publishedAt ? new Date(a.publishedAt) : null;
      const severity = i < 2 ? 'critical' : i < 5 ? 'high' : i < 9 ? 'medium' : 'low';
      return { raw: a, published, severity, idx: i };
    }).filter((x) => x.published !== null);

    // Keep items published in the last 24 hours OR critical items from the current month
    const filtered = mapped.filter(item => {
      if (!item.published) return false;
      if (item.published >= cutoff24h) return true;
      if (item.published.getMonth() === now.getMonth() && item.published.getFullYear() === now.getFullYear() && item.severity === 'critical') return true;
      return false;
    });

    // Sort newest-first and limit result size
    filtered.sort((a, b) => (b.published!.getTime() - a.published!.getTime()));
    return filtered.slice(0, 15).map((it, idx) => {
      const a = it.raw;
      const published = it.published!;
      return {
        id: `n${published.getTime()}-${idx}`,
        title: a.title || 'No title',
        time: published.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
        severity: it.severity,
        source: a.source?.name || 'Unknown',
        url: a.url,
        tickers: [] as string[],
      };
    });
  } catch (e: any) {
    logToTerminal('WARN', 'API:fetchLiveNews', `News fetch failed: ${String(e)}`);
    return [];
  }
}

export async function fetchFearGreed() {
  try {
    const d = await fetchJSON('https://api.alternative.me/fng/?limit=1');
    const val = parseInt(d?.data?.[0]?.value ?? '');
    if (isNaN(val)) {
      logToTerminal('WARN', 'API:FNG', 'Fear & Greed API returned invalid data');
      return { value: null, sentiment: 'Unknown' };
    }
    return { value: val, sentiment: d?.data?.[0]?.value_classification ?? 'Unknown' };
  } catch (e: any) {
    logToTerminal('WARN', 'API:FNG', `FNG fetch failed: ${String(e)}`);
    return { value: null, sentiment: 'Unknown' };
  }
}

export async function fetchForexRates(region?: string) {
  let data: any;
  try {
    data = await fetchJSON('https://open.er-api.com/v6/latest/USD');
  } catch (e: any) {
    logToTerminal('WARN', 'API:Forex', `Exchange rate fetch failed: ${String(e)}`);
    data = null;
  }
  const r = data?.rates || { EUR: 1, GBP: 1, JPY: 1, CHF: 1, AUD: 1, CAD: 1, INR: 1 };
  const all = [
    { pair: 'EUR/USD', price: fmtNum(1 / (r.EUR || 1), 4) },
    { pair: 'GBP/USD', price: fmtNum(1 / (r.GBP || 1), 4) },
    { pair: 'USD/JPY', price: fmtNum(r.JPY || 1, 2) },
    { pair: 'USD/CHF', price: fmtNum(r.CHF || 1, 4) },
    { pair: 'AUD/USD', price: fmtNum(1 / (r.AUD || 1), 4) },
    { pair: 'USD/CAD', price: fmtNum(r.CAD || 1, 4) },
    { pair: 'USD/INR', price: fmtNum(r.INR || 1, 2) },
  ];
  if (region === 'INDIA') return [all[6], all[0], all[1], all[2]];
  if (region === 'EUROPE') return [all[0], all[1], all[2], all[3]];
  return all;
}

async function fetchFredSeries(seriesId: string): Promise<number | null> {
  const data = await fetchJSON(`${FRED_BASE}/series/observations?series_id=${seriesId}&file_type=json&sort_order=desc&limit=1`);
  const obs = data?.observations?.[0];
  return obs?.value && obs.value !== '.' ? parseFloat(obs.value) : null;
}

export async function fetchYieldCurve() {
  const series = [
    { maturity: '1M', id: 'DGS1MO' },
    { maturity: '3M', id: 'DGS3MO' },
    { maturity: '6M', id: 'DGS6MO' },
    { maturity: '1Y', id: 'DGS1' },
    { maturity: '2Y', id: 'DGS2' },
    { maturity: '5Y', id: 'DGS5' },
    { maturity: '10Y', id: 'DGS10' },
    { maturity: '20Y', id: 'DGS20' },
    { maturity: '30Y', id: 'DGS30' },
  ];
  const results = await Promise.allSettled(series.map(s => fetchFredSeries(s.id)));
  const out = series.map((s, i) => ({ maturity: s.maturity, yield: results[i].status === 'fulfilled' ? (results[i] as any).value : null })).filter(s => s.yield !== null);
  if (out.length === 0) {
    logToTerminal('WARN', 'API:YieldCurve', 'Yield curve data unavailable');
    return [];
  }
  return out;
}

export async function fetchMacroIndicators() {
  const inds = [
    { name: 'US CPI (YoY)', id: 'CPIAUCSL', fmt: (v: number) => fmtNum(v, 1, 'N/A') + '%' },
    { name: 'Core PCE', id: 'PCEPILFE', fmt: (v: number) => fmtNum(v, 1, 'N/A') + '%' },
    { name: 'Unemployment', id: 'UNRATE', fmt: (v: number) => fmtNum(v, 1, 'N/A') + '%' },
    { name: 'GDP Growth', id: 'A191RL1Q225SBEA', fmt: (v: number) => fmtNum(v, 1, 'N/A') + '%' },
    { name: 'Fed Funds Rate', id: 'FEDFUNDS', fmt: (v: number) => fmtNum(v, 2, 'N/A') + '%' },
  ];
  const results = await Promise.allSettled(inds.map(i => fetchFredSeries(i.id)));
  return inds.map((ind, i) => ({ name: ind.name, value: results[i].status === 'fulfilled' && (results[i] as any).value !== null ? ind.fmt((results[i] as any).value) : 'N/A', trend: 'FLAT', source: 'FRED' }));
}

export async function fetchGlobalBonds() {
  const bonds = [
    { country: 'USA', code: 'US', flag: '🇺🇸', ids: { y2: 'DGS2', y10: 'DGS10', y30: 'DGS30' } },
    { country: 'Germany', code: 'DE', flag: '🇩🇪', ids: { y10: 'IRLTLT01DEM156N' } },
    { country: 'United Kingdom', code: 'GB', flag: '🇬🇧', ids: { y10: 'IRLTLT01GBM156N' } },
    { country: 'Japan', code: 'JP', flag: '🇯🇵', ids: { y10: 'IRLTLT01JPM156N' } },
    { country: 'Italy', code: 'IT', flag: '🇮🇹', ids: { y10: 'IRLTLT01ITM156N' } },
    { country: 'France', code: 'FR', flag: '🇫🇷', ids: { y10: 'IRLTLT01FRM156N' } },
    { country: 'Canada', code: 'CA', flag: '🇨🇦', ids: { y10: 'IRLTLT01CAM156N' } },
    { country: 'Australia', code: 'AU', flag: '🇦🇺', ids: { y10: 'IRLTLT01AUM156N' } },
  ];
  const results = await Promise.allSettled(bonds.map(async (bond) => {
    const [y2R, y10R, y30R] = await Promise.allSettled([
      bond.ids.y2 ? fetchFredSeries(bond.ids.y2) : Promise.resolve(null),
      bond.ids.y10 ? fetchFredSeries(bond.ids.y10) : Promise.resolve(null),
      bond.ids.y30 ? fetchFredSeries(bond.ids.y30) : Promise.resolve(null),
    ]);
    return { country: bond.country, code: bond.code, flagEmoji: bond.flag, y2: y2R.status === 'fulfilled' ? (y2R as any).value : null, y10: y10R.status === 'fulfilled' ? (y10R as any).value : null, y30: y30R.status === 'fulfilled' ? (y30R as any).value : null };
  }));
  const out = results.filter(r => r.status === 'fulfilled').map((r: any) => r.value).filter((b: any) => b.y2 || b.y10 || b.y30);
  if (out.length === 0) {
    logToTerminal('WARN', 'API:GlobalBonds', 'Global bonds unavailable');
    return [];
  }
  return out;
}

export async function fetchEnergyPrices() {
  const eiaKey = getKey('eia');
  if (eiaKey) {
    try {
      const wtiUrl = `https://api.eia.gov/v2/petroleum/pri/spt/data/?api_key=${eiaKey}&frequency=weekly&data[0]=value&facets[series][]=RWTC&sort[0][column]=period&sort[0][direction]=desc&length=1`;
      const bUrl = `https://api.eia.gov/v2/petroleum/pri/spt/data/?api_key=${eiaKey}&frequency=weekly&data[0]=value&facets[series][]=RBRTE&sort[0][column]=period&sort[0][direction]=desc&length=1`;
      const [w, b] = await Promise.allSettled([fetchDirectAllOrigins(wtiUrl), fetchDirectAllOrigins(bUrl)]);
      const wtiP = w.status === 'fulfilled' ? parseFloat(w.value?.response?.data?.[0]?.value || '0') : 0;
      const brentP = b.status === 'fulfilled' ? parseFloat(b.value?.response?.data?.[0]?.value || '0') : 0;
      if (wtiP > 0) return [ { name: 'WTI Crude', symbol: 'CL=F', price: wtiP, change: 0, changePct: 0, unit: '/bbl' }, { name: 'Brent Crude', symbol: 'BZ=F', price: brentP || wtiP + 3, change: 0, changePct: 0, unit: '/bbl' } ];
    } catch (e: any) {
      logToTerminal('WARN', 'API:EIA', `EIA direct call failed: ${e.message}`);
    }
  }
  const [wti, ng] = await Promise.allSettled([yahooProxy('CL=F'), yahooProxy('NG=F')]);
  const result: any[] = [];
  if (wti.status === 'fulfilled') result.push({ name: 'WTI Crude', symbol: 'CL=F', price: wti.value.regularMarketPrice, change: wti.value.regularMarketChange, changePct: wti.value.regularMarketChangePercent, unit: '/bbl' });
  if (ng.status === 'fulfilled') result.push({ name: 'Nat Gas', symbol: 'NG=F', price: ng.value.regularMarketPrice, change: ng.value.regularMarketChange, changePct: ng.value.regularMarketChangePercent, unit: '/MMBtu' });
  if (result.length === 0) {
    logToTerminal('WARN', 'API:Energy', 'Energy prices unavailable');
    return [];
  }
  return result;
}

export async function fetchGoldSilver() {
  const [xau, xag] = await Promise.allSettled([fetchFinnhubQuote('OANDA:XAU_USD'), fetchFinnhubQuote('OANDA:XAG_USD')]);
  const result: any[] = [];
  if (xau.status === 'fulfilled' && (xau as any).value && (xau as any).value.c) result.push({ symbol: 'XAU/USD', name: 'Gold', price: (xau as any).value.c, change: (xau as any).value.d, changePct: (xau as any).value.dp });
  if (xag.status === 'fulfilled' && (xag as any).value && (xag as any).value.c) result.push({ symbol: 'XAG/USD', name: 'Silver', price: (xag as any).value.c, change: (xag as any).value.d, changePct: (xag as any).value.dp });
  if (result.length > 0) return result;
  const [gold, silver] = await Promise.allSettled([yahooProxy('GC=F'), yahooProxy('SI=F')]);
  const fallbackResult: any[] = [];
  if (gold.status === 'fulfilled') fallbackResult.push({ symbol: 'XAU/USD', name: 'Gold', price: gold.value.regularMarketPrice, change: gold.value.regularMarketChange, changePct: gold.value.regularMarketChangePercent });
  if (silver.status === 'fulfilled') fallbackResult.push({ symbol: 'XAG/USD', name: 'Silver', price: silver.value.regularMarketPrice, change: silver.value.regularMarketChange, changePct: silver.value.regularMarketChangePercent });
  if (fallbackResult.length === 0) {
    logToTerminal('WARN', 'API:Metals', 'Gold/Silver fetch failed');
    return [];
  }
  return fallbackResult;
}

export async function fetchEarningsCalendar() {
  const from = new Date().toISOString().slice(0, 10);
  const to = new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10);
  const data = await fetchJSON(`https://finnhub.io/api/v1/calendar/earnings?from=${from}&to=${to}`);
  return ((data.earningsCalendar || []) as any[]).slice(0, 10).map((e: any) => ({ symbol: e.symbol, name: e.symbol, date: e.date, epsEst: e.epsEstimate ?? '-', revEst: e.revenueEstimate ? fmtNum(e.revenueEstimate / 1e9, 1, '-') + 'B' : '-', status: 'CONFIRMED' }));
}

export async function fetchEconomicCalendar(region?: string) {
  const from = new Date().toISOString().slice(0, 10);
  const to = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
  const data = await fetchJSON(`https://finnhub.io/api/v1/calendar/economic?from=${from}&to=${to}`);
  let events = ((data.economicCalendar || []) as any[]).map((e: any) => ({ time: e.time || '-', event: e.event, country: e.country, impact: e.impact === 3 ? 'CRITICAL' : e.impact === 2 ? 'HIGH' : 'MEDIUM', forecast: e.estimate ?? '-', previous: e.prev ?? '-' }));
  if (region && region !== 'GLOBAL') {
    const map: Record<string, string[]> = { AMERICAS: ['US', 'CA'], INDIA: ['IN'], EUROPE: ['GB', 'DE', 'FR', 'EU', 'IT'] };
    const allowed = map[region] || [];
    if (allowed.length) events = events.filter((e: any) => allowed.includes(e.country));
  }
  return events.slice(0, 12);
}

export async function fetchIPOPipeline(from: string, to: string) {
  const data = await fetchJSON(`https://finnhub.io/api/v1/calendar/ipo?from=${from}&to=${to}`);
  return data.ipoCalendar || [];
}

export async function fetchDXYCurrency() {
  const data = await fetchDirectAllOrigins('https://open.er-api.com/v6/latest/USD');
  const parsed = normalizeProxyResponse(data) || {};
  if (!parsed?.rates) {
    logToTerminal('WARN', 'API:DXY', 'Currency rates missing; using fallback defaults');
  }
  const r = parsed?.rates || { EUR: 1, JPY: 1, GBP: 1, CAD: 1, SEK: 1, CHF: 1, INR: 1, AUD: 1 };
  return {
    dxy: 'Composite',
    basket: [
      { currency: 'EUR', rate: fmtNum(1 / (r.EUR || 1), 4), weight: 57.6 },
      { currency: 'JPY', rate: fmtNum(r.JPY || 1, 2), weight: 13.6 },
      { currency: 'GBP', rate: fmtNum(1 / (r.GBP || 1), 4), weight: 11.9 },
      { currency: 'CAD', rate: fmtNum(r.CAD || 1, 4), weight: 9.1 },
      { currency: 'SEK', rate: fmtNum(r.SEK || 1, 4), weight: 4.2 },
      { currency: 'CHF', rate: fmtNum(r.CHF || 1, 4), weight: 3.6 },
      { currency: 'INR', rate: fmtNum(r.INR || 1, 2), weight: 0 },
      { currency: 'AUD', rate: fmtNum(1 / (r.AUD || 1), 4), weight: 0 },
    ],
  };
}

export async function fetchMacroRegimeIndicators() {
  const [recProb, y10, y2, claims, confidence, spreads] = await Promise.allSettled([
    fetchFredSeries('RECPROUSM156N'),
    fetchFredSeries('DGS10'),
    fetchFredSeries('DGS2'),
    fetchFredSeries('ICSA'),
    fetchFredSeries('UMCSENT'),
    fetchFredSeries('BAMLC0A0CM'),
  ]);
  return {
    recessionProbability: recProb.status === 'fulfilled' ? recProb.value : null,
    yield10Y: y10.status === 'fulfilled' ? y10.value : null,
    yield2Y: y2.status === 'fulfilled' ? y2.value : null,
    joblessClaims: claims.status === 'fulfilled' ? claims.value : null,
    consumerSentiment: confidence.status === 'fulfilled' ? confidence.value : null,
    creditSpreads: spreads.status === 'fulfilled' ? spreads.value : null,
  };
}

export async function fetchRecessionHistory(limit: number = 60) {
  const data = await fetchJSON(`${FRED_BASE}/series/observations?series_id=RECPROUSM156N&file_type=json&sort_order=desc&limit=${limit}`);
  return (data?.observations || [])
    .filter((o: any) => o.value !== '.')
    .map((o: any) => ({ date: o.date, value: parseFloat(o.value) }))
    .reverse();
}

export async function fetchGithubTrending() {
  const raw = await fetchDirectAllOrigins('https://github.com/trending?since=daily');
  if (!raw) {
    logToTerminal('WARN', 'API:GitHubTrending', 'No response from CORS proxy for GitHub trending');
    return [];
  }
  const html = typeof raw.contents === 'string' ? raw.contents : (typeof raw.response === 'string' ? raw.response : null);
  if (!html) {
    logToTerminal('WARN', 'API:GitHubTrending', 'GitHub trending response did not contain HTML');
    return [];
  }
  try {
    if (typeof DOMParser === 'undefined') {
      logToTerminal('WARN', 'API:GitHubTrending', 'DOMParser not available in this environment; skipping GitHub trending');
      return [];
    }
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const articles = doc.querySelectorAll('article.Box-row');
    const results: any[] = [];
    articles.forEach((el, i) => {
      if (i >= 10) return;
      const repo = el.querySelector('h2 a')?.getAttribute('href')?.slice(1) || '';
      const lang = el.querySelector('[itemprop="programmingLanguage"]')?.textContent?.trim() || 'Unknown';
      const stars = parseInt(el.querySelector('a[href*="stargazers"]')?.textContent?.replace(/,/g, '').trim() || '0');
      const trend = el.querySelector('.float-sm-right')?.textContent?.trim() || '-';
      if (repo) results.push({ repo, language: lang, stars, trend });
    });
    if (results.length === 0) {
      logToTerminal('WARN', 'API:GitHubTrending', 'GitHub trending scrape returned no results');
      return [];
    }
    return results;
  } catch (e: any) {
    logToTerminal('WARN', 'API:GitHubTrending', `Failed to parse GitHub trending HTML: ${String(e)}`);
    return [];
  }
}

export async function fetchServiceStatus() {
  const pages = [
    { service: 'GitHub', url: 'https://www.githubstatus.com/api/v2/status.json' },
    { service: 'Cloudflare', url: 'https://www.cloudflarestatus.com/api/v2/status.json' },
    { service: 'Stripe', url: 'https://status.stripe.com/api/v2/status.json' },
  ];
  const results = await Promise.allSettled(pages.map(async (s) => {
    try {
      const d = await fetchDirectAllOrigins(s.url);
      const parsed = normalizeProxyResponse(d) || {};
      const indicator = (parsed?.status?.indicator ?? parsed?.status) || null;
      return { service: s.service, status: indicator === 'none' ? 'OPERATIONAL' : 'DEGRADED', uptime: '-' };
    } catch {
      return { service: s.service, status: 'UNKNOWN', uptime: '-' };
    }
  }));
  return results.map((r: any) => r.value ?? { service: '-', status: 'UNKNOWN', uptime: '-' });
}

// Post chat messages to the AI backend (Supabase function or BYOK proxy).
export async function postAIChat(params: { messages: Array<{ role: string; content: string }>; model?: string; systemPrompt?: string; apiKey?: string; panelContext?: string; }, timeoutMs = 30000) {
  const { messages, model, systemPrompt, apiKey: clientApiKey } = params;
  // Resolve candidate key: prefer client-supplied, then configured OpenRouter keys
  const cfg = useConfigStore.getState();
  const openRouterKey = clientApiKey || (cfg.openRouterKeys && cfg.openRouterKeys.length ? cfg.openRouterKeys[0].value : undefined) || undefined;

  const proxyPrefix = (import.meta.env.VITE_API_PROXY_PREFIX || 'make-server-287eb62b').replace(/^\/+|\/+$/g, '');
  const directAiUrl = `https://${projectId}.supabase.co/functions/v1/${proxyPrefix}/ai/chat`;
  const url = PROXY_BASE ? joinProxyPath('/ai/chat') : directAiUrl;

  const headers = new Headers({ 'Content-Type': 'application/json', Accept: 'application/json' });
  if (PROXY_BASE && openRouterKey) {
    headers.set('X-API-Key', openRouterKey);
  } else if (!PROXY_BASE) {
    headers.set('Authorization', `Bearer ${publicAnonKey}`);
  }

  const body = { messages, model, systemPrompt, apiKey: openRouterKey };

  const res = await timeoutFetch(url, { method: 'POST', headers, body: JSON.stringify(body) }, timeoutMs);
  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    throw new Error(`AI chat HTTP ${res.status}: ${txt}`);
  }
  const data = await res.json().catch(() => null);
  if (!data) throw new Error('AI chat: invalid JSON response');
  if (data.error) throw new Error(String(data.error));
  return data;
}

// Direct OpenRouter call using a client-provided key. Used as a fallback
export async function postOpenRouterDirect(params: { messages: Array<{ role: string; content: string }>; model?: string; systemPrompt?: string; apiKey: string; }, timeoutMs = 30000) {
  const { messages, model = 'meta-llama/llama-3.3-8b-instruct:free', systemPrompt, apiKey } = params;
  if (!apiKey) throw new Error('No OpenRouter API key provided');
  const systemMsg = systemPrompt ? { role: 'system', content: systemPrompt } : null;
  const outMessages = systemMsg ? [systemMsg, ...messages.map(m => ({ role: m.role, content: m.content }))] : messages.map(m => ({ role: m.role, content: m.content }));

  const headers = new Headers({ 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` });
  try {
    const res = await timeoutFetch('https://openrouter.ai/api/v1/chat/completions', { method: 'POST', headers, body: JSON.stringify({ model, messages: outMessages, max_tokens: 1200, temperature: 0.7 }) }, timeoutMs);
    if (!res.ok) {
      const txt = await res.text().catch(() => '');
      throw new Error(`OpenRouter API error: ${res.status} — ${txt}`);
    }
    const data = await res.json().catch(() => null);
    if (!data) throw new Error('No content returned from OpenRouter API');
    const content = data.choices?.[0]?.message?.content || data.choices?.[0]?.text;
    if (!content) throw new Error('No content returned from OpenRouter API');
    return { content, model: data.model, usage: data.usage };
  } catch (e: any) {
    logToTerminal('WARN', 'API:OpenRouter', `OpenRouter direct call failed: ${String(e)}`);
    throw e;
  }
}

export const WORLD_CLOCK_DATA = [
  { name: 'New York', exchange: 'NYSE/NASDAQ', flag: '🇺🇸', tz: 'America/New_York', open: '09:30', close: '16:00', color: '#00ccff' },
  { name: 'London', exchange: 'LSE', flag: '🇬🇧', tz: 'Europe/London', open: '08:00', close: '16:30', color: '#a78bfa' },
  { name: 'Frankfurt', exchange: 'FSX', flag: '🇩🇪', tz: 'Europe/Berlin', open: '09:00', close: '17:30', color: '#a78bfa' },
  { name: 'Tokyo', exchange: 'TSE', flag: '🇯🇵', tz: 'Asia/Tokyo', open: '09:00', close: '15:00', color: '#ffaa00' },
  { name: 'Hong Kong', exchange: 'HKEX', flag: '🇭🇰', tz: 'Asia/Hong_Kong', open: '09:30', close: '16:00', color: '#ffaa00' },
  { name: 'Mumbai', exchange: 'NSE/BSE', flag: '🇮🇳', tz: 'Asia/Kolkata', open: '09:15', close: '15:30', color: '#FF9933' },
  { name: 'Sydney', exchange: 'ASX', flag: '🇦🇺', tz: 'Australia/Sydney', open: '10:00', close: '16:00', color: '#00ff88' },
];

// Central bank rates — manually verified, should be reviewed monthly
export const CENTRAL_BANK_DATA = [
  { bank: 'Federal Reserve', country: 'US', rate: '4.25-4.50%', bias: 'NEUTRAL', biasScore: 0, governor: 'Jerome Powell', nextMeeting: 'Jun 18, 2025', lastAction: 'Hold — Dec 2024', note: 'On hold — monitoring inflation trajectory.' },
  { bank: 'ECB', country: 'EU', rate: '2.40%', bias: 'DOVISH', biasScore: 3, governor: 'Christine Lagarde', nextMeeting: 'Jun 5, 2025', lastAction: 'Cut 25bp — Apr 2025', note: 'Rate cut cycle underway.' },
  { bank: 'Bank of Japan', country: 'JP', rate: '0.50%', bias: 'HAWKISH', biasScore: -3, governor: 'Kazuo Ueda', nextMeeting: 'Jun 17, 2025', lastAction: 'Hike 15bp — Jan 2025', note: 'Gradual normalisation.' },
  { bank: 'Bank of England', country: 'UK', rate: '4.25%', bias: 'NEUTRAL', biasScore: 1, governor: 'Andrew Bailey', nextMeeting: 'Jun 19, 2025', lastAction: 'Hold — May 2025', note: 'Cautious on pace of cuts.' },
  { bank: 'RBI', country: 'IN', rate: '6.00%', bias: 'NEUTRAL', biasScore: 2, governor: 'Shaktikanta Das', nextMeeting: 'Jun 6, 2025', lastAction: 'Cut 25bp — Apr 2025', note: 'Easing cycle started Apr 2025.' },
];
