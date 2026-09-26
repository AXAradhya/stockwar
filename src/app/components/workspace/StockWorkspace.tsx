import React, { useEffect } from 'react';
import GridLayout from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';

import { StockChartPanel } from './StockChartPanel';
import { CompanySummaryPanel } from './CompanySummaryPanel';
import { StockEarningsPanel } from './StockEarningsPanel';
import { StockNewsPanel } from './StockNewsPanel';
import { AnalystRatingsPanel } from './AnalystRatingsPanel';
import { StockStatsPanel } from './StockStatsPanel';

interface StockWorkspaceProps {
  workspace: {
    id: string;
    type: 'stock' | 'sector';
    symbol: string;
    title: string;
  };
}

export function StockWorkspace({ workspace }: StockWorkspaceProps) {
  const { symbol } = workspace;

  const layout = [
    { i: 'chart', x: 0, y: 0, w: 8, h: 4 },
    { i: 'summary', x: 8, y: 0, w: 4, h: 2 },
    { i: 'stats', x: 8, y: 2, w: 4, h: 2 },
    { i: 'news', x: 0, y: 4, w: 4, h: 4 },
    { i: 'earnings', x: 4, y: 4, w: 4, h: 4 },
    { i: 'ratings', x: 8, y: 4, w: 4, h: 4 }
  ];

  return (
    <div style={{ padding: '16px', background: '#06060d', minHeight: '100%', overflowY: 'auto' }}>
      <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ color: '#00ccff', margin: 0, fontFamily: 'JetBrains Mono', fontSize: '18px' }}>{symbol} INTELLIGENCE WORKSPACE</h2>
          <div style={{ color: '#888', fontSize: '12px', marginTop: '4px' }}>Deep-dive analysis for {symbol}</div>
        </div>
      </div>
      
      <GridLayout
        className="layout"
        layout={layout}
        cols={12}
        rowHeight={100}
        width={1200}
        isDraggable={false}
        isResizable={false}
        margin={[16, 16]}
      >
        <div key="chart">
          <StockChartPanel symbol={symbol} />
        </div>
        <div key="summary">
          <CompanySummaryPanel symbol={symbol} />
        </div>
        <div key="stats">
          <StockStatsPanel symbol={symbol} />
        </div>
        <div key="news">
          <StockNewsPanel symbol={symbol} />
        </div>
        <div key="earnings">
          <StockEarningsPanel symbol={symbol} />
        </div>
        <div key="ratings">
          <AnalystRatingsPanel symbol={symbol} />
        </div>
      </GridLayout>
    </div>
  );
}
