import React, { useEffect, useState } from 'react';
import { useTickerConfigStore } from '../../stores/tickerConfigStore';
import { useWorkspaceStore } from '../../stores/workspaceStore';
import { fmtNum, fmtPct } from '../../utils/numberFormat';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { fetchYahooMeta } from '../../services/apiServices';

// Simple in-memory cache for quote data to avoid excessive API calls
const quoteCache: Record<string, { price: number; changePct: number; timestamp: number }> = {};

export function SectorConstituentsPanel({ sectorEtf }: { sectorEtf: string }) {
  const { config } = useTickerConfigStore();
  const { openWorkspace } = useWorkspaceStore();
  const constituents = config.sectorConstituents[sectorEtf] || [];
  const [quotes, setQuotes] = useState<Record<string, { price: number; changePct: number }>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const loadQuotes = async () => {
      if (constituents.length === 0) {
        setLoading(false);
        return;
      }

      // Check cache first
      const now = Date.now();
      const newQuotes: Record<string, { price: number; changePct: number }> = {};
      const toFetch: string[] = [];

      constituents.forEach(ticker => {
        const cached = quoteCache[ticker];
        if (cached && now - cached.timestamp < 60000) {
          newQuotes[ticker] = { price: cached.price, changePct: cached.changePct };
        } else {
          toFetch.push(ticker);
        }
      });

      if (toFetch.length > 0) {
        // Fetch via central Yahoo helper which uses proxy strategy
        try {
          const promises = toFetch.map(async (ticker) => {
            try {
              const meta = await fetchYahooMeta(ticker);
              return { ticker, meta };
            } catch {
              return null;
            }
          });

          const results = await Promise.all(promises);
          results.forEach((r) => {
            if (!r || !r.meta) return;
            const { ticker, meta } = r;
            const price = meta?.regularMarketPrice || meta?.price || 0;
            const changePct = meta?.regularMarketChangePercent || meta?.changePercent || 0;

            newQuotes[ticker] = { price, changePct };
            quoteCache[ticker] = { price, changePct, timestamp: now };
          });
        } catch {
          // Ignore errors, show what we have
        }
      }

      if (mounted) {
        setQuotes(newQuotes);
        setLoading(false);
      }
    };

    loadQuotes();
    const interval = setInterval(loadQuotes, 60000); // refresh every minute
    return () => { mounted = false; clearInterval(interval); };
  }, [sectorEtf, constituents]);

  if (loading && constituents.length === 0) {
    return <div style={{ padding: 16, color: '#444', fontSize: 9, fontFamily: 'JetBrains Mono' }}>Loading constituents...</div>;
  }

  if (constituents.length === 0) {
    return <div style={{ padding: 16, color: '#666', fontSize: 9, fontFamily: 'JetBrains Mono' }}>No constituents configured for this sector.</div>;
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '6px 10px', borderBottom: '1px solid #1a1a2e', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 8, color: '#444', letterSpacing: 1 }}>TOP {constituents.length} CONSTITUENTS</span>
        <span style={{ fontSize: 7, color: '#333' }}>Click to open workspace</span>
      </div>
      
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {constituents.map(ticker => {
          const q = quotes[ticker];
          const up = (q?.changePct ?? 0) >= 0;
          const color = up ? '#00ff88' : '#ff3355';
          
          return (
            <div
              key={ticker}
              onClick={() => openWorkspace('stock', ticker, ticker)}
              style={{
                display: 'grid',
                gridTemplateColumns: '60px 1fr 72px 58px',
                alignItems: 'center',
                padding: '5px 10px',
                borderBottom: '1px solid #0f0f18',
                cursor: 'pointer',
                gap: 6,
              }}
            >
              <span style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: '#00ccff' }}>{ticker}</span>
              <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 8, color: '#555', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {config.usIndicesNames[ticker] || ticker}
              </span>
              <span style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: '#e8e8e8', textAlign: 'right' }}>
                {q ? `$${fmtNum(q.price, 2)}` : '—'}
              </span>
              <span style={{ fontFamily: 'JetBrains Mono', fontSize: 9, color: q ? color : '#444', textAlign: 'right', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 2 }}>
                {q ? (
                  <>
                    {up ? <TrendingUp size={8} color={color} /> : <TrendingDown size={8} color={color} />}
                    {fmtPct(q.changePct)}
                  </>
                ) : '—'}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
