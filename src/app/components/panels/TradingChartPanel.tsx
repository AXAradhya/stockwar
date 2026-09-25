import React from 'react';
import TradingViewWidget from '../ui/TradingViewWidget';
import { usePanelCustomizeStore } from '../../stores/panelCustomizeStore';

export function TradingChartPanel({ panelId }: { panelId: string }) {
  const { getCustomization } = usePanelCustomizeStore();
  const local = getCustomization(panelId || '');
  const symbol = (local as any).chartSymbol || 'SPX';

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ flex: 1, minHeight: 220 }}>
        <TradingViewWidget symbol={symbol} />
      </div>
    </div>
  );
}

export default TradingChartPanel;
