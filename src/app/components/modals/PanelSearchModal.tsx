import { useState, useEffect, useRef } from 'react';
import { X, Search, Lock } from 'lucide-react';
import { PANEL_CATALOG } from '../../data/catalog';
import { useAuthStore } from '../../stores/authStore';

const COMMANDS = [
  { id: 'cmd_brief', label: 'Generate Market Brief', shortcut: 'Ctrl+Shift+B', icon: '📊', action: 'ai_brief' },
  { id: 'cmd_correlate', label: 'Correlate Tickers', shortcut: 'Ctrl+Shift+T', icon: '🔗', action: 'correlate' },
  { id: 'cmd_alert', label: 'Create Alert', shortcut: 'Ctrl+Shift+N', icon: '🔔', action: 'alert' },
  { id: 'cmd_refresh', label: 'Force Refresh All Panels', shortcut: 'F5', icon: '↺', action: 'refresh' },
  { id: 'cmd_lock', label: 'Lock / Unlock Layout', shortcut: 'Ctrl+L', icon: '🔒', action: 'lock' },
  { id: 'cmd_finance', label: 'Switch to Finance Context', shortcut: 'G → F', icon: '📈', action: 'ctx_finance' },
  { id: 'cmd_tech', label: 'Switch to Tech Context', shortcut: 'G → T', icon: '💻', action: 'ctx_tech' },
  { id: 'cmd_world', label: 'Switch to World Context', shortcut: 'G → W', icon: '🌐', action: 'ctx_world' },
];

interface PanelSearchModalProps {
  open: boolean;
  onClose: () => void;
  onTogglePanel: (id: string) => void;
  activePanelIds: string[];
}

export function PanelSearchModal({ open, onClose, onTogglePanel, activePanelIds }: PanelSearchModalProps) {
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuthStore();
  const userTier = user?.tier || 'FREE';
  const canAccessPro = userTier === 'PRO' || userTier === 'ENTERPRISE';

  useEffect(() => {
    if (open) {
      setQuery('');
      setSelected(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  if (!open) return null;

  const panelResults = PANEL_CATALOG.filter(p =>
    !query || p.label.toLowerCase().includes(query.toLowerCase()) || p.shortCode.toLowerCase().includes(query.toLowerCase()) || p.category.toLowerCase().includes(query.toLowerCase())
  );

  const cmdResults = COMMANDS.filter(c =>
    !query || c.label.toLowerCase().includes(query.toLowerCase())
  );

  const allResults = [
    ...cmdResults.map(c => ({ ...c, type: 'command' as const })),
    ...panelResults.map(p => ({ ...p, type: 'panel' as const })),
  ];

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelected(v => Math.min(v + 1, allResults.length - 1)); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setSelected(v => Math.max(v - 1, 0)); }
    if (e.key === 'Enter') {
      const item = allResults[selected];
      if (item?.type === 'panel') {
        onTogglePanel(item.id);
        onClose();
      } else {
        onClose();
      }
    }
    if (e.key === 'Escape') onClose();
  };

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 10000,
        background: 'rgba(0,0,0,0.75)',
        display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
        paddingTop: 100,
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        width: 560, background: '#0a0a12',
        border: '1px solid #1a1a2e',
        fontFamily: 'JetBrains Mono, monospace',
        maxHeight: '60vh', display: 'flex', flexDirection: 'column',
      }}>
        {/* Search Input */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '10px 12px', borderBottom: '1px solid #1a1a2e',
        }}>
          <Search size={12} color="#666680" />
          <input
            ref={inputRef}
            value={query}
            onChange={e => { setQuery(e.target.value); setSelected(0); }}
            onKeyDown={handleKeyDown}
            placeholder="Search panels, commands, tickers..."
            style={{
              flex: 1, background: 'transparent', border: 'none',
              color: '#e8e8e8', fontFamily: 'JetBrains Mono', fontSize: 12,
              outline: 'none',
            }}
          />
          <div style={{ display: 'flex', gap: 4 }}>
            <kbd style={{ fontSize: 8, background: '#1a1a2e', border: '1px solid #2a2a3e', padding: '2px 5px', color: '#444' }}>ESC</kbd>
          </div>
        </div>

        {/* Results */}
        <div style={{ overflowY: 'auto', flex: 1 }}>
          {!query && (
            <div style={{ padding: '4px 12px 0', fontSize: 8, color: '#333', letterSpacing: 1 }}>
              COMMANDS
            </div>
          )}
          {allResults.map((item, i) => {
            const isPanel = item.type === 'panel';
            const isActive = isPanel && activePanelIds.includes(item.id);
            const isSelected = i === selected;

            return (
              <div
                key={item.id}
                onClick={() => {
                  if (isPanel) { onTogglePanel(item.id); onClose(); }
                  else onClose();
                }}
                onMouseEnter={() => setSelected(i)}
                style={{
                  padding: '8px 12px',
                  background: isSelected ? '#1a1a2e' : 'transparent',
                  borderBottom: '1px solid #0f0f18',
                  cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 10,
                  opacity: (isPanel && (item as typeof PANEL_CATALOG[0]).tier === 'pro' && !canAccessPro) ? 0.45 : 1,
                }}
              >
                {/* Icon */}
                <div style={{
                  width: 20, height: 20,
                  background: isPanel ? '#1a1a2e' : '#0d0d18',
                  border: `1px solid ${isActive ? '#00ff88' : '#2a2a3e'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 10,
                }}>
                  {isPanel ? (isActive ? '■' : '□') : (item as typeof COMMANDS[0]).icon}
                </div>

                {/* Label */}
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, color: isSelected ? '#e8e8e8' : '#aaa' }}>
                    {item.label}
                  </div>
                  {isPanel && (
                    <div style={{ fontSize: 8, color: '#333' }}>
                      {(item as typeof PANEL_CATALOG[0]).category} · {(item as typeof PANEL_CATALOG[0]).shortCode}
                    </div>
                  )}
                </div>

                {/* Status / Shortcut */}
                {isPanel && isActive && (
                  <span style={{ fontSize: 8, color: '#00ff88', border: '1px solid #00ff8833', padding: '1px 4px' }}>
                    ACTIVE
                  </span>
                )}
                {isPanel && !isActive && (item as typeof PANEL_CATALOG[0]).tier === 'pro' && !canAccessPro && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 2, fontSize: 8, color: '#ffaa00', border: '1px solid #ffaa0033', padding: '1px 4px' }}>
                    <Lock size={7} /> PRO
                  </span>
                )}
                {isPanel && !isActive && (item as typeof PANEL_CATALOG[0]).tier === 'pro' && canAccessPro && (
                  <span style={{ fontSize: 8, color: '#ffaa00', border: '1px solid #ffaa0033', padding: '1px 4px' }}>PRO</span>
                )}
                {!isPanel && (item as typeof COMMANDS[0]).shortcut && (
                  <kbd style={{
                    fontSize: 8, background: '#1a1a2e',
                    border: '1px solid #2a2a3e', padding: '1px 5px', color: '#444',
                  }}>
                    {(item as typeof COMMANDS[0]).shortcut}
                  </kbd>
                )}
              </div>
            );
          })}

          {allResults.length === 0 && (
            <div style={{ padding: 20, textAlign: 'center', fontSize: 10, color: '#333' }}>
              No results for "{query}"
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '6px 12px', borderTop: '1px solid #1a1a2e',
          display: 'flex', gap: 12, fontSize: 8, color: '#333',
        }}>
          <span>↑↓ navigate</span>
          <span>↵ select</span>
          <span>ESC close</span>
          <div style={{ marginLeft: 'auto' }}>
            {allResults.length} results
          </div>
        </div>
      </div>
    </div>
  );
}
