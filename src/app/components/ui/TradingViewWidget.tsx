import React, { useEffect, useRef } from 'react';

// Deterministic counter for unique widget IDs — replaces Math.random()
let widgetCounter = 0;

function normalizeSymbol(sym: string) {

  if (!sym) return 'NASDAQ:SPX';
  if (sym.includes(':')) return sym;
  const s = sym.toUpperCase();
  if (s.endsWith('.NS') || s.endsWith('.NSK') || s.endsWith('.NSX')) return `NSE:${s.replace(/\.NS.*$/, '').replace('.NS','')}`;
  if (s.endsWith('.BO') || s.endsWith('.BOE') || s.endsWith('.BSE')) return `BSE:${s.replace(/\.BO.*$/, '').replace('.BO','')}`;
  // default: try NASDAQ
  return `NASDAQ:${s}`;
}

export function TradingViewWidget({ symbol, height = '100%' }: { symbol: string; height?: string | number }) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const id = `tv-${symbol}-${++widgetCounter}-${Date.now()}`;
    const normalized = normalizeSymbol(symbol || 'SPX');

    const container = containerRef.current;
    if (!container) return;
    container.id = id;

    const init = () => {
      try {
        // @ts-ignore
        if ((window as any).TradingView && (window as any).TradingView.widget) {
          // @ts-ignore
          new (window as any).TradingView.widget({
            autosize: true,
            symbol: normalized,
            interval: 'D',
            timezone: 'Etc/UTC',
            theme: 'dark',
            style: '1',
            locale: 'en',
            toolbar_bg: '#0d0d18',
            enable_publishing: false,
            hide_side_toolbar: false,
            allow_symbol_change: true,
            details: true,
            container_id: id,
          });
        }
      } catch (e) {
        // swallow — fallback UI will handle absence
        console.warn('TradingView init failed', e);
      }
    };

    if (!(window as any).TradingView) {
      const s = document.createElement('script');
      s.src = 'https://s3.tradingview.com/tv.js';
      s.async = true;
      s.onload = () => init();
      document.head.appendChild(s);
    } else {
      init();
    }

    return () => {
      const el = document.getElementById(id);
      if (el) el.innerHTML = '';
    };
  }, [symbol]);

  return <div ref={containerRef} style={{ width: '100%', height }} />;
}

export default TradingViewWidget;
