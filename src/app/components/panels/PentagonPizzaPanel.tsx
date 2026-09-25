import React from 'react';
import { Pizza } from 'lucide-react';

export function PentagonPizzaPanel() {
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', fontFamily: 'JetBrains Mono, monospace' }}>
      <div style={{ padding: '8px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid #1a1a2e' }}>
        <Pizza size={20} color="#ffaa00" />
        <div>
          <div style={{ fontSize: 9, color: '#e8e8e8' }}>PENTAGON DELIVERY ORDERS</div>
          <div style={{ fontSize: 11, color: '#aaa' }}>DATA NOT CONFIGURED</div>
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, textAlign: 'center', color: '#888' }}>
        <div>
          <div style={{ fontSize: 12, color: '#fff', marginBottom: 6 }}>No live data source configured</div>
          <div style={{ fontSize: 11, color: '#aaa' }}>
            This panel previously displayed mock or entertainment data. Configure a real data feed or enable a server-side proxy to populate it.
          </div>
        </div>
      </div>
    </div>
  );
}