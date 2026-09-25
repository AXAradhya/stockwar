import React, { useEffect, useState } from 'react';
import { fetchCompanyNews } from '../../services/apiServices';
import { useConfigStore } from '../../stores/configStore';
import { Newspaper, ExternalLink } from 'lucide-react';

export function StockNewsPanel({ symbol }: { symbol: string }) {
  const [news, setNews] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { apiKeys } = useConfigStore();

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        if (!apiKeys.finnhub) {
          if (active) {
            setError('Finnhub API key required for company news');
            setLoading(false);
          }
          return;
        }
        // Fetch news for the last 24 hours (Finnhub uses date-only params)
        const to = new Date().toISOString().split('T')[0];
        const d = new Date();
        d.setDate(d.getDate() - 1);
        const from = d.toISOString().split('T')[0];

        const data = await fetchCompanyNews(symbol, from, to);
        if (active) setNews(data || []);
      } catch (err: any) {
        if (active) setError(err.message);
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => { active = false; };
  }, [symbol, apiKeys.finnhub]);

  return (
    <div style={{ background: '#0a0a12', border: '1px solid #1a1a2e', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '8px 12px', borderBottom: '1px solid #1a1a2e', background: '#0d0d18', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0, color: '#00ccff', fontSize: '10px', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Newspaper size={12} />
          {symbol} NEWS & PRESS
        </h3>
      </div>
      
      <div style={{ flex: 1, padding: '8px', overflowY: 'auto' }}>
        {loading ? (
          <div style={{ color: '#00ccff', fontSize: '10px', padding: 4 }}>Loading news...</div>
        ) : error ? (
          <div style={{ color: '#ff3355', fontSize: '10px', background: 'rgba(255,51,85,0.1)', padding: '8px', border: '1px solid #ff335533' }}>
            {error}
          </div>
        ) : news.length === 0 ? (
          <div style={{ color: '#666', fontSize: '10px', padding: 4 }}>No recent news found for {symbol}.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {news.slice(0, 20).map((n, i) => (
              <div key={i} style={{ padding: '8px', background: '#11111a', border: '1px solid #1a1a2e' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                  <div style={{ fontSize: 9, color: '#00ff88' }}>{n.source}</div>
                  <div style={{ fontSize: 8, color: '#666' }}>{new Date(n.datetime * 1000).toLocaleString()}</div>
                </div>
                <div style={{ fontSize: 11, color: '#e8e8e8', fontWeight: 600, marginBottom: 4, lineHeight: 1.3 }}>
                  <a href={n.url} target="_blank" rel="noreferrer" style={{ color: 'inherit', textDecoration: 'none', display: 'flex', gap: 4, alignItems: 'flex-start' }}>
                    {n.headline}
                    <ExternalLink size={10} color="#444" style={{ flexShrink: 0, marginTop: 2 }} />
                  </a>
                </div>
                {n.summary && (
                  <div style={{ fontSize: 9, color: '#888', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {n.summary}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
