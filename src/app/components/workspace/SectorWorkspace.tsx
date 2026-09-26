import React from 'react';
import GridLayout from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';

import { StockChartPanel } from './StockChartPanel';
import { CompanySummaryPanel } from './CompanySummaryPanel';
import { StockNewsPanel } from './StockNewsPanel';
import { SectorConstituentsPanel } from './SectorConstituentsPanel';

interface SectorWorkspaceProps {
  workspace: {
    id: string;
    type: 'stock' | 'sector';
    symbol: string;
    title: string;
  };
}

export function SectorWorkspace({ workspace }: SectorWorkspaceProps) {
  const { symbol, title } = workspace;

  // Workaround typing mismatch with react-grid-layout props in TS types
  const GridLayoutAny: any = GridLayout;

  const layout = [
    { i: 'chart', x: 0, y: 0, w: 8, h: 4 },
    { i: 'summary', x: 8, y: 0, w: 4, h: 2 },
    { i: 'constituents', x: 8, y: 2, w: 4, h: 4 },
    { i: 'news', x: 0, y: 4, w: 8, h: 4 },
  ];

  return (
    <div style={{ padding: '16px', background: '#06060d', minHeight: '100%', overflowY: 'auto' }}>
      <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ color: '#00ccff', margin: 0, fontFamily: 'JetBrains Mono', fontSize: '18px' }}>{title} INTELLIGENCE WORKSPACE</h2>
          <div style={{ color: '#888', fontSize: '12px', marginTop: '4px' }}>Sector ETF: {symbol} · Top constituents and news</div>
        </div>
      </div>
      
      <GridLayoutAny
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
        <div key="constituents">
          <div style={{ background: '#0a0a12', border: '1px solid #1a1a2e', height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '8px 12px', borderBottom: '1px solid #1a1a2e', background: '#0d0d18' }}>
              <h3 style={{ margin: 0, color: '#00ccff', fontSize: '10px', display: 'flex', alignItems: 'center', gap: 6 }}>
                SECTOR CONSTITUENTS
              </h3>
            </div>
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <SectorConstituentsPanel sectorEtf={symbol} />
            </div>
          </div>
        </div>
        <div key="news">
          <StockNewsPanel symbol={symbol} />
        </div>
      </GridLayoutAny>
    </div>
  );
}
