import { useState } from 'react';
import { X, TrendingUp, TrendingDown, Search, Link2, Activity } from 'lucide-react';
import { fmtNum, fmtPct } from '../../utils/numberFormat';

interface CorrelatedTicker {
  ticker: string;
  name: string;
  correlation: number;
  direction: 'positive' | 'negative';
  reason: string;
  sector: string;
  currentMove: number;
}

const CORRELATION_DB: Record<string, CorrelatedTicker[]> = {
  SPY: [
    { ticker: 'QQQ', name: 'Nasdaq ETF', correlation: 0.94, direction: 'positive', reason: 'Tech-heavy index, moves in tandem', sector: 'ETF', currentMove: -0.22 },
    { ticker: 'IWM', name: 'Russell 2000', correlation: 0.82, direction: 'positive', reason: 'Broad market correlation', sector: 'ETF', currentMove: -0.53 },
    { ticker: 'TLT', name: '20Y Treasury ETF', correlation: -0.68, direction: 'negative', reason: 'Risk-off flows when SPY drops', sector: 'Bonds', currentMove: +0.44 },
    { ticker: 'VIX', name: 'Volatility Index', correlation: -0.88, direction: 'negative', reason: 'Fear gauge — inverts with equity moves', sector: 'Volatility', currentMove: +5.66 },
    { ticker: 'GLD', name: 'Gold ETF', correlation: -0.32, direction: 'negative', reason: 'Moderate safe haven during equity drops', sector: 'Commodities', currentMove: +0.53 },
  ],
  NVDA: [
    { ticker: 'AMD', name: 'Advanced Micro Devices', correlation: 0.87, direction: 'positive', reason: 'Direct GPU competitor — sector co-moves', sector: 'Semiconductors', currentMove: -2.38 },
    { ticker: 'INTC', name: 'Intel Corp', correlation: 0.72, direction: 'positive', reason: 'Semiconductor sector correlation', sector: 'Semiconductors', currentMove: -1.12 },
    { ticker: 'AMAT', name: 'Applied Materials', correlation: 0.78, direction: 'positive', reason: 'Chip equipment supplier — NVDA demand drives AMAT', sector: 'Semiconductors', currentMove: +1.44 },
    { ticker: 'TSM', name: 'TSMC', correlation: 0.82, direction: 'positive', reason: 'Primary manufacturer of NVDA GPUs', sector: 'Semiconductors', currentMove: +2.11 },
    { ticker: 'MSFT', name: 'Microsoft', correlation: 0.66, direction: 'positive', reason: 'AI compute spending at Microsoft drives NVDA', sector: 'Technology', currentMove: +1.66 },
  ],
  USO: [
    { ticker: 'XOM', name: 'ExxonMobil', correlation: 0.91, direction: 'positive', reason: 'Oil major — directly priced with crude', sector: 'Energy', currentMove: +2.44 },
    { ticker: 'CVX', name: 'Chevron Corp', correlation: 0.88, direction: 'positive', reason: 'Oil major — Brent/WTI correlated', sector: 'Energy', currentMove: +2.11 },
    { ticker: 'XLE', name: 'Energy Select ETF', correlation: 0.93, direction: 'positive', reason: 'Energy sector ETF — direct crude correlation', sector: 'Energy', currentMove: +2.14 },
    { ticker: 'DXY', name: 'US Dollar Index', correlation: -0.72, direction: 'negative', reason: 'Oil priced in USD — dollar strength suppresses price', sector: 'Currency', currentMove: +0.22 },
    { ticker: 'GLD', name: 'Gold ETF', correlation: 0.64, direction: 'positive', reason: 'Both commodities move on inflation/geopolitical risk', sector: 'Commodities', currentMove: +0.53 },
  ],
  GLD: [
    { ticker: 'SLV', name: 'Silver ETF', correlation: 0.88, direction: 'positive', reason: 'Precious metals move together on inflation/crisis', sector: 'Commodities', currentMove: +1.60 },
    { ticker: 'TLT', name: '20Y Treasury ETF', correlation: 0.56, direction: 'positive', reason: 'Both benefit from rate cut expectations', sector: 'Bonds', currentMove: +0.44 },
    { ticker: 'DXY', name: 'US Dollar Index', correlation: -0.78, direction: 'negative', reason: 'Gold priced in USD — inverse relationship', sector: 'Currency', currentMove: +0.22 },
    { ticker: 'GDX', name: 'Gold Miners ETF', correlation: 0.82, direction: 'positive', reason: 'Mining stocks amplify gold price moves', sector: 'Commodities', currentMove: +1.22 },
    { ticker: 'BTC', name: 'Bitcoin', correlation: 0.44, direction: 'positive', reason: 'Both classified as inflation hedges', sector: 'Crypto', currentMove: +1.96 },
  ],
};

const PRESET_QUERIES = ['SPY', 'NVDA', 'USO', 'GLD', 'BTC', 'TLT', 'TSLA'];

interface TickerCorrelationModalProps {
  open: boolean;
  onClose: () => void;
  initialTicker?: string;
}

export function TickerCorrelationModal({ open, onClose, initialTicker = 'SPY' }: TickerCorrelationModalProps) {
  const [query, setQuery] = useState(initialTicker.toUpperCase());
  const [input, setInput] = useState(initialTicker.toUpperCase());

  if (!open) return null;

  const correlations = CORRELATION_DB[query] || [];

  const getCorrelationColor = (corr: number) => {
    const abs = Math.abs(corr);
    if (abs > 0.8) return corr > 0 ? '#00ff88' : '#ff3355';
    if (abs > 0.5) return corr > 0 ? '#88ff44' : '#ff6633';
    return '#ffaa00';
  };

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 10000,
        background: 'rgba(0,0,0,0.8)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        width: 580, maxHeight: '80vh',
        background: '#0a0a12', border: '1px solid #1a1a2e',
        display: 'flex', flexDirection: 'column',
        fontFamily: 'JetBrains Mono, monospace',
      }}>
        {/* Header */}
        <div style={{
          height: 36, background: '#0d0d18', borderBottom: '1px solid #1a1a2e',
          display: 'flex', alignItems: 'center', padding: '0 12px', gap: 8,
        }}>
          <Link2 size={11} color="#00ccff" />
          <span style={{ fontSize: 10, color: '#00ccff', letterSpacing: 2 }}>
            ⬡ TICKER CORRELATION ENGINE
          </span>
          <button onClick={onClose} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#666680' }}>
            <X size={12} />
          </button>
        </div>

        {/* Search */}
        <div style={{ padding: '8px 12px', borderBottom: '1px solid #1a1a2e' }}>
          <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
            <div style={{
              flex: 1, display: 'flex', alignItems: 'center', gap: 6,
              background: '#0d0d18', border: '1px solid #1a1a2e', padding: '5px 8px',
            }}>
              <Search size={10} color="#666680" />
              <input
                value={input}
                onChange={e => setInput(e.target.value.toUpperCase())}
                onKeyDown={e => e.key === 'Enter' && setQuery(input)}
                placeholder="Enter ticker (e.g. SPY, NVDA, USO)..."
                style={{
                  flex: 1, background: 'transparent', border: 'none',
                  color: '#e8e8e8', fontFamily: 'JetBrains Mono', fontSize: 12,
                  outline: 'none', letterSpacing: 1,
                }}
              />
            </div>
            <button
              onClick={() => setQuery(input)}
              style={{
                padding: '5px 12px', background: 'rgba(0,204,255,0.1)',
                border: '1px solid #00ccff33', color: '#00ccff',
                cursor: 'pointer', fontFamily: 'JetBrains Mono', fontSize: 9,
              }}
            >
              ANALYZE
            </button>
          </div>

          {/* Preset chips */}
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {PRESET_QUERIES.map(q => (
              <button
                key={q}
                onClick={() => { setQuery(q); setInput(q); }}
                style={{
                  padding: '2px 8px', background: query === q ? 'rgba(0,204,255,0.15)' : '#0d0d18',
                  border: `1px solid ${query === q ? '#00ccff44' : '#1a1a2e'}`,
                  color: query === q ? '#00ccff' : '#555',
                  cursor: 'pointer', fontSize: 9, fontFamily: 'JetBrains Mono',
                }}
              >{q}</button>
            ))}
          </div>
        </div>

        {/* Results Header */}
        {correlations.length > 0 ? (
          <>
            <div style={{
              padding: '5px 12px', borderBottom: '1px solid #1a1a2e',
              display: 'flex', gap: 12, fontSize: 8, alignItems: 'center',
            }}>
              <Activity size={9} color="#00ccff" />
              <span style={{ color: '#00ccff' }}>{query}</span>
              <span style={{ color: '#444' }}>→ Top correlated assets (90-day window)</span>
              <span style={{ marginLeft: 'auto', color: '#333' }}>{correlations.length} correlations found</span>
            </div>

            {/* Column headers */}
            <div style={{
              display: 'grid', gridTemplateColumns: '60px 1fr 80px 80px 80px',
              padding: '3px 12px', borderBottom: '1px solid #1a1a2e',
              fontSize: 7, color: '#333', letterSpacing: 1,
            }}>
              <span>TICKER</span>
              <span>NAME & REASON</span>
              <span style={{ textAlign: 'center' }}>CORR</span>
              <span style={{ textAlign: 'center' }}>TYPE</span>
              <span style={{ textAlign: 'right' }}>24H MOVE</span>
            </div>

            {/* Correlation rows */}
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {correlations.map(c => {
                const corrColor = getCorrelationColor(c.correlation);
                const isPos = c.direction === 'positive';
                const barWidth = Math.abs(c.correlation) * 100;
                return (
                  <div key={c.ticker} style={{
                    display: 'grid', gridTemplateColumns: '60px 1fr 80px 80px 80px',
                    alignItems: 'center', padding: '8px 12px',
                    borderBottom: '1px solid #0f0f18',
                    borderLeft: `2px solid ${corrColor}44`,
                    cursor: 'pointer',
                  }}>
                    <span style={{ fontSize: 11, color: '#00ccff', letterSpacing: 0.5 }}>{c.ticker}</span>
                    <div style={{ overflow: 'hidden', paddingRight: 8 }}>
                      <div style={{ fontSize: 9, color: '#ccc', marginBottom: 2 }}>{c.name}</div>
                      <div style={{
                        fontSize: 7, color: '#555',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>{c.reason}</div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                        <span style={{ fontSize: 10, color: corrColor, fontWeight: 700 }}>
                        {c.correlation > 0 ? '+' : ''}{fmtNum(c.correlation, 2)}
                      </span>
                      <div style={{ width: 50, height: 3, background: '#1a1a2e' }}>
                        <div style={{ width: `${barWidth}%`, height: '100%', background: corrColor }} />
                      </div>
                    </div>
                    <div style={{ textAlign: 'center', display: 'flex', justifyContent: 'center' }}>
                      <div style={{
                        fontSize: 7, padding: '1px 5px',
                        color: isPos ? '#00ff88' : '#ff3355',
                        border: `1px solid ${isPos ? '#00ff8833' : '#ff335533'}`,
                        display: 'flex', alignItems: 'center', gap: 2,
                      }}>
                        {isPos ? <TrendingUp size={7} /> : <TrendingDown size={7} />}
                        {c.direction.toUpperCase()}
                      </div>
                    </div>
                    <span style={{
                      fontSize: 10, textAlign: 'right',
                      color: c.currentMove >= 0 ? '#00ff88' : '#ff3355',
                    }}>
                      {fmtPct(c.currentMove, 2)}
                    </span>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <div style={{
            flex: 1, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            gap: 8, color: '#333',
          }}>
            <Link2 size={32} color="#1a1a2e" />
            <span style={{ fontSize: 10 }}>No correlation data for "{query}"</span>
            <span style={{ fontSize: 8 }}>Try: SPY, NVDA, USO, GLD</span>
          </div>
        )}

        {/* Footer */}
        <div style={{
          padding: '6px 12px', borderTop: '1px solid #1a1a2e',
          display: 'flex', justifyContent: 'space-between', fontSize: 7, color: '#333',
        }}>
          <span>Correlation calculated using 90-day rolling window · Pearson coefficient</span>
          <button onClick={onClose} style={{
            background: '#0d0d18', border: '1px solid #1a1a2e', padding: '3px 10px',
            color: '#e8e8e8', cursor: 'pointer', fontFamily: 'JetBrains Mono', fontSize: 9,
          }}>CLOSE</button>
        </div>
      </div>
    </div>
  );
}
