import { useState } from 'react';
import { CENTRAL_BANK_DATA } from '../../services/apiServices';

const BIAS_COLORS: Record<string, string> = {
  DOVISH: '#00ff88',
  HAWKISH: '#ff3355',
  NEUTRAL: '#ffaa00',
};

const FLAG_MAP: Record<string, string> = {
  US: '🇺🇸', EU: '🇪🇺', JP: '🇯🇵', UK: '🇬🇧', CN: '🇨🇳', IN: '🇮🇳',
};

function getDaysUntil(dateStr: string): number {
  try {
    const target = new Date(dateStr);
    const now = new Date();
    return Math.max(0, Math.ceil((target.getTime() - now.getTime()) / 86400000));
  } catch {
    return 0;
  }
}

export function CentralBankWatchPanel() {
  const banks = CENTRAL_BANK_DATA;
  const [selected, setSelected] = useState<string | null>(null);
  const [tab, setTab] = useState<'BANKS' | 'MATRIX'>('BANKS');


  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', fontFamily: 'JetBrains Mono, monospace' }}>
      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid #1a1a2e' }}>
        {(['BANKS', 'MATRIX'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: '4px 12px', border: 'none', borderRight: '1px solid #1a1a2e',
              background: tab === t ? '#1a1a2e' : 'transparent',
              color: tab === t ? '#00ccff' : '#555',
              cursor: 'pointer', fontSize: 8, fontFamily: 'JetBrains Mono', letterSpacing: 1,
            }}
          >{t}</button>
        ))}
        <div style={{ marginLeft: 'auto', padding: '0 8px', display: 'flex', alignItems: 'center' }}>
          <span style={{ fontSize: 7, color: '#444' }}>G6 CENTRAL BANKS</span>
        </div>
      </div>

      {tab === 'BANKS' ? (
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {banks.map(bank => {
            const biasColor = BIAS_COLORS[bank.bias] || '#666680';
            const isSelected = selected === bank.bank;
            const days = getDaysUntil(bank.nextMeeting);
            return (
              <div key={bank.bank}>
                <div
                  onClick={() => setSelected(isSelected ? null : bank.bank)}
                  style={{
                    padding: '6px 8px', borderBottom: '1px solid #0f0f18',
                    cursor: 'pointer',
                    background: isSelected ? '#12121e' : 'transparent',
                    borderLeft: `2px solid ${biasColor}44`,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                    <span style={{ fontSize: 14 }}>{FLAG_MAP[bank.country] || '🏦'}</span>
                    <span style={{ fontSize: 10, color: '#e8e8e8', flex: 1 }}>{bank.bank}</span>
                    <span style={{
                      fontSize: 9, color: biasColor,
                      border: `1px solid ${biasColor}44`, padding: '1px 5px',
                    }}>{bank.bias}</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 4 }}>
                    <div>
                      <div style={{ fontSize: 7, color: '#444' }}>RATE</div>
                      <div style={{ fontSize: 11, color: '#e8e8e8' }}>{bank.rate}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 7, color: '#444' }}>NEXT MTG</div>
                      <div style={{ fontSize: 9, color: days <= 7 ? '#ffaa00' : '#e8e8e8' }}>
                        T-{days}d
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 7, color: '#444' }}>GOVERNOR</div>
                      <div style={{ fontSize: 8, color: '#666680', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {bank.governor.split(' ').slice(-1)[0]}
                      </div>
                    </div>
                  </div>
                </div>
                {isSelected && (
                  <div style={{ padding: '6px 8px 6px 18px', background: 'rgba(0,204,255,0.03)', borderBottom: '1px solid #1a1a2e' }}>
                    <div style={{ fontSize: 7, color: '#444', marginBottom: 3 }}>LAST ACTION</div>
                    <div style={{ fontSize: 8, color: '#ccc', marginBottom: 4 }}>{bank.lastAction}</div>
                    <div style={{ fontSize: 7, color: '#444', marginBottom: 3 }}>ANALYST NOTE</div>
                    <div style={{ fontSize: 8, color: biasColor }}>{bank.note}</div>
                    <div style={{ marginTop: 4, fontSize: 7, color: '#444' }}>NEXT MEETING: {bank.nextMeeting}</div>
                    {/* Bias bar */}
                    <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 7, color: '#ff3355' }}>HAWK</span>
                      <div style={{ flex: 1, height: 4, background: '#1a1a2e', position: 'relative' }}>
                        <div style={{
                          position: 'absolute',
                          left: `${((bank.biasScore + 5) / 10) * 100}%`,
                          transform: 'translateX(-50%)',
                          width: 8, height: 8, background: biasColor,
                          top: -2,
                        }} />
                        <div style={{ position: 'absolute', left: '50%', top: 0, width: 1, height: '100%', background: '#333' }} />
                      </div>
                      <span style={{ fontSize: 7, color: '#00ff88' }}>DOVE</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        /* Matrix view */
        <div style={{ flex: 1, overflowY: 'auto', padding: 8 }}>
          <div style={{ fontSize: 8, color: '#444', marginBottom: 8, letterSpacing: 1 }}>GLOBAL POLICY DIVERGENCE MATRIX</div>
          {banks.map(b => (
            <div key={b.bank} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <span style={{ fontSize: 10, width: 16 }}>{FLAG_MAP[b.country]}</span>
              <span style={{ fontSize: 8, color: '#666680', width: 28 }}>{b.country}</span>
              <span style={{ fontSize: 9, color: '#e8e8e8', width: 56 }}>{b.rate}</span>
              <div style={{ flex: 1, height: 8, background: '#0f0f1a', position: 'relative' }}>
                {/* Scale: -5 (ultra-dove) to +5 (ultra-hawk) */}
                <div style={{
                  position: 'absolute',
                  left: `${((b.biasScore + 5) / 10) * 100}%`,
                  transform: 'translateX(-50%)',
                  width: 3, height: '100%',
                  background: BIAS_COLORS[b.bias] || '#666',
                }} />
                <div style={{ position: 'absolute', left: '50%', top: 0, width: 1, height: '100%', background: '#1a1a2e' }} />
              </div>
              <span style={{ fontSize: 7, color: BIAS_COLORS[b.bias], width: 50, textAlign: 'right' }}>{b.bias}</span>
            </div>
          ))}
          <div style={{ marginTop: 8, display: 'flex', justifyContent: 'space-between', fontSize: 7, color: '#444' }}>
            <span>◀ HAWKISH (rate hikes)</span>
            <span>NEUTRAL</span>
            <span>DOVISH (rate cuts) ▶</span>
          </div>
        </div>
      )}

      <div style={{ borderTop: '1px solid #1a1a2e', padding: '3px 8px', display: 'flex', gap: 8, fontSize: 7, color: '#333' }}>
        <span>SRC: CENTRAL BANK STATEMENTS</span>
        <span style={{ marginLeft: 'auto', color: '#00ff88' }}>● LIVE</span>
      </div>
    </div>
  );
}
