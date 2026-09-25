import React, { useState, useRef, useEffect } from 'react';
import { X, Save, Eye, EyeOff, Download, Trash2, AlertTriangle, AlertCircle, Info, XCircle } from 'lucide-react';
import { useUiStore, applyTheme } from '../../stores/uiStore';
import { useAlertStore } from '../../stores/alertStore';
import { useAuthStore } from '../../stores/authStore';
import { useConfigStore } from '../../stores/configStore';
import { useTickerConfigStore } from '../../stores/tickerConfigStore';
import { useLogStore, type LogLevel } from '../../stores/logStore';
import type { UserTier } from '../../stores/authStore';
import { toast } from 'sonner';

type TabId = 'DISPLAY' | 'DATA_FEEDS' | 'API_KEYS' | 'AI_MODELS' | 'ALERTS' | 'TICKERS' | 'LOGS';

const TABS: { id: TabId; label: string }[] = [
  { id: 'DISPLAY', label: 'DISPLAY' },
  { id: 'DATA_FEEDS', label: 'DATA & FEEDS' },
  { id: 'API_KEYS', label: 'API KEYS' },
  { id: 'AI_MODELS', label: 'AI MODELS' },
  { id: 'ALERTS', label: 'ALERTS' },
  { id: 'TICKERS', label: 'TICKERS' },
  { id: 'LOGS', label: 'LOGS' }
];

const LEVEL_ICONS: Record<LogLevel, React.ReactNode> = {
  INFO: <Info size={10} color="#00ccff" />,
  WARN: <AlertTriangle size={10} color="#ffaa00" />,
  ERROR: <AlertCircle size={10} color="#ff3355" />,
  CRITICAL: <XCircle size={10} color="#ff3355" />,
};

const LEVEL_COLORS: Record<LogLevel, string> = {
  INFO: '#00ccff',
  WARN: '#ffaa00',
  ERROR: '#ff3355',
  CRITICAL: '#ff3355',
};

function LogsTab() {
  const { logs, clearLogs, exportLogs } = useLogStore();
  const [filterLevel, setFilterLevel] = useState<LogLevel | 'ALL'>('ALL');
  const [filterSource, setFilterSource] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  const filtered = logs.filter(l => {
    if (filterLevel !== 'ALL' && l.level !== filterLevel) return false;
    if (filterSource && !l.source.toLowerCase().includes(filterSource.toLowerCase())) return false;
    return true;
  });

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [logs.length]);

  const handleExport = () => {
    const text = exportLogs();
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `stockwar_logs_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Logs exported');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', maxHeight: 520 }}>
      <div style={{ padding: '12px', borderBottom: '1px solid #1a1a2e', display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <select
          value={filterLevel}
          onChange={e => setFilterLevel(e.target.value as LogLevel | 'ALL')}
          style={{ background: '#0d0d18', border: '1px solid #1a1a2e', color: '#e8e8e8', fontFamily: 'JetBrains Mono', fontSize: 9, padding: '4px 8px', cursor: 'pointer' }}
        >
          <option value="ALL">ALL LEVELS</option>
          <option value="INFO">INFO</option>
          <option value="WARN">WARN</option>
          <option value="ERROR">ERROR</option>
          <option value="CRITICAL">CRITICAL</option>
        </select>

        <input
          type="text"
          value={filterSource}
          onChange={e => setFilterSource(e.target.value)}
          placeholder="Filter source..."
          style={{ flex: 1, minWidth: 120, background: '#0d0d18', border: '1px solid #1a1a2e', color: '#e8e8e8', fontFamily: 'JetBrains Mono', fontSize: 9, padding: '4px 8px', outline: 'none' }}
        />

        <button
          onClick={handleExport}
          style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#1a1a2e', border: '1px solid #333', color: '#00ccff', padding: '4px 10px', fontSize: 9, cursor: 'pointer', fontFamily: 'JetBrains Mono' }}
        >
          <Download size={10} /> EXPORT
        </button>

        <button
          onClick={() => {
            if (confirm('Clear all logs?')) {
              clearLogs();
              toast.success('Logs cleared');
            }
          }}
          style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#ff335522', border: '1px solid #ff335544', color: '#ff3355', padding: '4px 10px', fontSize: 9, cursor: 'pointer', fontFamily: 'JetBrains Mono' }}
        >
          <Trash2 size={10} /> CLEAR
        </button>
      </div>

      <div style={{ padding: '8px 12px', borderBottom: '1px solid #0f0f18', display: 'flex', gap: 16, fontSize: 9, color: '#666' }}>
        <span>TOTAL: <span style={{ color: '#e8e8e8' }}>{logs.length}</span></span>
        <span>INFO: <span style={{ color: '#00ccff' }}>{logs.filter(l => l.level === 'INFO').length}</span></span>
        <span>WARN: <span style={{ color: '#ffaa00' }}>{logs.filter(l => l.level === 'WARN').length}</span></span>
        <span>ERRORS: <span style={{ color: '#ff3355' }}>{logs.filter(l => l.level === 'ERROR' || l.level === 'CRITICAL').length}</span></span>
      </div>

      <div
        ref={scrollRef}
        style={{ flex: 1, overflowY: 'auto', padding: '8px 0', fontFamily: 'JetBrains Mono, monospace', fontSize: 9 }}
      >
        {filtered.length === 0 ? (
          <div style={{ padding: '24px', textAlign: 'center', color: '#333', fontSize: 10 }}>
            {logs.length === 0 ? 'No logs yet. Logs appear when panels report errors or warnings.' : 'No logs match the current filter.'}
          </div>
        ) : (
          filtered.map(log => (
            <div
              key={log.id}
              style={{
                padding: '6px 12px',
                borderBottom: '1px solid #0a0a12',
                display: 'flex',
                gap: 8,
                alignItems: 'flex-start',
              }}
            >
              <div style={{ marginTop: 1, flexShrink: 0 }}>{LEVEL_ICONS[log.level]}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 2 }}>
                  <span style={{ color: LEVEL_COLORS[log.level], fontWeight: 'bold', minWidth: 55 }}>{log.level}</span>
                  <span style={{ color: '#555', fontSize: 8 }}>{log.timestamp.toLocaleTimeString()}</span>
                  <span style={{ color: '#444', fontSize: 8 }}>{log.source}</span>
                </div>
                <div style={{ color: '#aaa', lineHeight: 1.4, wordBreak: 'break-word' }}>{log.message}</div>
                {log.details && (
                  <div style={{ color: '#333', fontSize: 8, marginTop: 2, lineHeight: 1.3, wordBreak: 'break-word' }}>
                    {log.details}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export function SettingsModal({ onClose }: { onClose: () => void }) {
  const [activeTab, setActiveTab] = useState<TabId>('DISPLAY');
  const { settings, updateSettings } = useUiStore();
  const { audioEnabled, setAudioEnabled } = useAlertStore();
  const [showApiKey, setShowApiKey] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState(settings.openrouterApiKey || '');
  const [saved, setSaved] = useState(false);
  const { user, setTier } = useAuthStore();
  const { 
    apiKeys, 
    setApiKey, 
    openRouterKeys, 
    addOpenRouterKey, 
    removeOpenRouterKey, 
    taskRouting, 
    setTaskRouting,
    geminiKey,
    setGeminiKey,
    geminiEnabled,
    setGeminiEnabled
  } = useConfigStore();
  const { config: tickerConfig, setConfig: setTickerConfig, resetToDefaults: resetTickers } = useTickerConfigStore();

  const toggleBool = (key: keyof typeof settings) => {
    updateSettings({ [key]: !settings[key] });
  };

  const handleSave = () => {
    updateSettings({ openrouterApiKey: apiKeyInput });
    setApiKey('finnhub', apiKeys.finnhub);
    setApiKey('newsApi', apiKeys.newsApi);
    setSaved(true);
    toast.success('✓ Settings saved & applied', { duration: 2000 });
    setTimeout(() => setSaved(false), 2000);
  };

  const ToggleRow = ({ label, value, onToggle, desc }: { label: string; value: boolean; onToggle: () => void; desc?: string }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', borderBottom: '1px solid #0a0a12' }}>
      <div>
        <div style={{ fontSize: 10, color: '#888' }}>{label}</div>
        {desc && <div style={{ fontSize: 8, color: '#444', marginTop: 2 }}>{desc}</div>}
      </div>
      <div
        onClick={onToggle}
        style={{ width: 32, height: 16, background: value ? '#00ff8822' : '#1a1a2e', border: `1px solid ${value ? '#00ff88' : '#333'}`, position: 'relative', cursor: 'pointer', flexShrink: 0, transition: 'all 0.2s' }}
      >
        <div style={{ position: 'absolute', top: 2, left: value ? 'calc(100% - 13px)' : '2px', width: 11, height: 11, background: value ? '#00ff88' : '#333', transition: 'left 0.2s' }} />
      </div>
    </div>
  );

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 10000, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={onClose}>
      <div style={{ background: '#0a0a12', border: '1px solid #1a1a2e', padding: 0, width: 800, height: 600, fontFamily: 'JetBrains Mono, monospace', display: 'flex', flexDirection: 'column' }} onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div style={{ padding: '9px 12px', background: '#0d0d18', borderBottom: '1px solid #1a1a2e', fontSize: 10, color: '#00ccff', letterSpacing: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <span>⚙ TERMINAL SETTINGS</span>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{ fontSize: 8, color: '#333' }}>v2.7.0 — PHASE 5</span>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#555', display: 'flex', alignItems: 'center' }}><X size={12} /></button>
          </div>
        </div>

        {/* Tabs and Content Container */}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          
          {/* Tabs Sidebar */}
          <div style={{ width: 180, background: '#080810', borderRight: '1px solid #1a1a2e', display: 'flex', flexDirection: 'column' }}>
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: '12px 16px', textAlign: 'left', background: activeTab === tab.id ? '#1a1a2e' : 'transparent',
                  border: 'none', borderLeft: `2px solid ${activeTab === tab.id ? '#00ccff' : 'transparent'}`,
                  color: activeTab === tab.id ? '#00ccff' : '#666', cursor: 'pointer', fontFamily: 'JetBrains Mono', fontSize: 10, letterSpacing: 1
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div style={{ flex: 1, overflowY: 'auto', background: '#0a0a12' }}>
            {activeTab === 'DISPLAY' && (
              <div>
                <ToggleRow label="Scan-line Effect" value={!!settings.scanlines} onToggle={() => toggleBool('scanlines')} desc="CRT-style scan lines overlay on panel backgrounds" />
                <ToggleRow label="Compact Mode" value={!!settings.compactMode} onToggle={() => {
                  toggleBool('compactMode');
                  document.body.classList.toggle('compact-mode', !settings.compactMode);
                }} desc="Reduce padding and font sizes across all panels" />
                <ToggleRow label="Show Timestamps" value={!!settings.showTimestamps} onToggle={() => toggleBool('showTimestamps')} desc="Show last-updated time on panel headers" />
                <ToggleRow label="Panel Animations" value={!!settings.panelAnimations} onToggle={() => toggleBool('panelAnimations')} desc="Enable panel transition animations" />
                <ToggleRow label="Show Panel Borders" value={!!settings.showPanelBorders} onToggle={() => {
                  toggleBool('showPanelBorders');
                  document.body.classList.toggle('no-panel-borders', settings.showPanelBorders);
                }} desc="Panel border lines visibility" />

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', borderBottom: '1px solid #0a0a12' }}>
                  <div>
                    <div style={{ fontSize: 10, color: '#888' }}>Color Theme</div>
                    <div style={{ fontSize: 8, color: '#444', marginTop: 2 }}>Changes accent colors and backgrounds</div>
                  </div>
                  <select
                    value={settings.theme}
                    onChange={e => {
                      const theme = e.target.value as typeof settings.theme;
                      updateSettings({ theme });
                      applyTheme(theme);
                      toast.success(`Theme: ${theme}`, { duration: 1500 });
                    }}
                    style={{ background: '#0d0d18', border: '1px solid #1a1a2e', color: '#00ccff', fontFamily: 'JetBrains Mono', fontSize: 9, padding: '3px 8px', cursor: 'pointer' }}
                  >
                    <option value="terminal-dark">Terminal Dark (Default)</option>
                    <option value="terminal-green">Terminal Green (Phosphor)</option>
                    <option value="terminal-blue">Terminal Blue (Navy)</option>
                    <option value="terminal-amber">Terminal Amber (Retro)</option>
                  </select>
                </div>
              </div>
            )}

            {activeTab === 'DATA_FEEDS' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', borderBottom: '1px solid #0a0a12' }}>
                  <div>
                    <div style={{ fontSize: 10, color: '#888' }}>Data Refresh Tier</div>
                    <div style={{ fontSize: 8, color: '#444', marginTop: 2 }}>T1=15s · T2=60s · T3=5min</div>
                  </div>
                  <select
                    value={settings.refreshTier}
                    onChange={e => {
                      updateSettings({ refreshTier: e.target.value as typeof settings.refreshTier });
                      toast.info(`Refresh tier set to ${e.target.value}`, { duration: 1500 });
                    }}
                    style={{ background: '#0d0d18', border: '1px solid #1a1a2e', color: '#00ccff', fontFamily: 'JetBrains Mono', fontSize: 9, padding: '3px 8px', cursor: 'pointer' }}
                  >
                    <option value="T1">T1 — Real-Time (15s)</option>
                    <option value="T2">T2 — Near-RT (60s)</option>
                    <option value="T3">T3 — Periodic (5m)</option>
                  </select>
                </div>
              </div>
            )}

            {activeTab === 'API_KEYS' && (
              <div>
                <div style={{ padding: '12px', background: 'rgba(0,204,255,0.05)', borderBottom: '1px solid #1a1a2e', fontSize: 9, color: '#00ccff', lineHeight: 1.4 }}>
                  <strong>SECURE SERVER PROXY ACTIVE</strong><br/>
                  The terminal routes all requests through the secure Supabase proxy using server-side keys by default. 
                  <br/><br/>
                  You can optionally provide your own keys below (BYOK) to override the server keys and use your own quotas.
                </div>
                <div style={{ padding: '12px', borderBottom: '1px solid #0a0a12' }}>
                  <div style={{ fontSize: 10, color: '#888', marginBottom: 4 }}>Finnhub API Key</div>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <input
                      type="password"
                      value={apiKeys.finnhub}
                      onChange={e => setApiKey('finnhub', e.target.value)}
                      placeholder="Finnhub key..."
                      style={{ flex: 1, background: '#0d0d18', border: `1px solid ${apiKeys.finnhub ? '#00ff8844' : '#1a1a2e'}`, color: '#e8e8e8', fontFamily: 'JetBrains Mono', fontSize: 9, padding: '5px 8px', outline: 'none' }}
                    />
                  </div>
                </div>
                <div style={{ padding: '12px', borderBottom: '1px solid #0a0a12' }}>
                  <div style={{ fontSize: 10, color: '#888', marginBottom: 4 }}>NewsAPI Key</div>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <input
                      type="password"
                      value={apiKeys.newsApi}
                      onChange={e => setApiKey('newsApi', e.target.value)}
                      placeholder="NewsAPI key..."
                      style={{ flex: 1, background: '#0d0d18', border: `1px solid ${apiKeys.newsApi ? '#00ff8844' : '#1a1a2e'}`, color: '#e8e8e8', fontFamily: 'JetBrains Mono', fontSize: 9, padding: '5px 8px', outline: 'none' }}
                    />
                  </div>
                </div>
                <div style={{ padding: '12px', borderBottom: '1px solid #0a0a12' }}>
                  <div style={{ fontSize: 10, color: '#888', marginBottom: 4 }}>FRED API Key</div>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <input
                      type="password"
                      value={apiKeys.fred}
                      onChange={e => setApiKey('fred', e.target.value)}
                      placeholder="FRED API key..."
                      style={{ flex: 1, background: '#0d0d18', border: `1px solid ${apiKeys.fred ? '#00ff8844' : '#1a1a2e'}`, color: '#e8e8e8', fontFamily: 'JetBrains Mono', fontSize: 9, padding: '5px 8px', outline: 'none' }}
                    />
                  </div>
                </div>
                <div style={{ padding: '12px', borderBottom: '1px solid #0a0a12' }}>
                  <div style={{ fontSize: 10, color: '#888', marginBottom: 4 }}>EIA API Key</div>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <input
                      type="password"
                      value={apiKeys.eia}
                      onChange={e => setApiKey('eia', e.target.value)}
                      placeholder="EIA API key..."
                      style={{ flex: 1, background: '#0d0d18', border: `1px solid ${apiKeys.eia ? '#00ff8844' : '#1a1a2e'}`, color: '#e8e8e8', fontFamily: 'JetBrains Mono', fontSize: 9, padding: '5px 8px', outline: 'none' }}
                    />
                  </div>
                </div>
                <div style={{ padding: '12px', display: 'flex', gap: 8, alignItems: 'center' }}>
                  <button
                    onClick={() => {
                      if (!user) { toast.error('Login to save API keys to your account'); return; }
                      try {
                        // save current apiKeys to user account
                        (useAuthStore.getState()).saveApiKeys(apiKeys as any);
                        toast.success('API keys saved to account');
                      } catch (e) {
                        toast.error('Failed to save keys to account');
                      }
                    }}
                    style={{ background: 'rgba(0,255,136,0.08)', border: '1px solid #00ff8833', color: '#00ff88', padding: '6px 12px', cursor: 'pointer' }}
                  >
                    Save Keys To Account
                  </button>
                  <div style={{ fontSize: 9, color: '#666' }}>Saves keys to your local user account for future logins (localStorage).</div>
                </div>
              </div>
            )}

            {activeTab === 'AI_MODELS' && (
              <div>
                <div style={{ padding: '12px', borderBottom: '1px solid #0a0a12' }}>
                  <div style={{ fontSize: 10, color: '#888', marginBottom: 4 }}>OpenRouter API Keys</div>
                  <div style={{ fontSize: 8, color: '#444', marginBottom: 8 }}>
                    Multiple keys can be added for redundancy and task-based routing.
                  </div>
                  
                  {openRouterKeys.map(k => (
                    <div key={k.id} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: k.status === 'active' ? '#00ff88' : '#ff3355' }} />
                      <div style={{ flex: 1, background: '#0d0d18', border: '1px solid #1a1a2e', padding: '4px 8px', fontSize: 9, color: '#e8e8e8', display: 'flex', justifyContent: 'space-between' }}>
                        <span>{k.label}</span>
                        <span style={{ color: '#444' }}>{k.value.slice(0, 8)}...</span>
                      </div>
                      <button onClick={() => removeOpenRouterKey(k.id)} style={{ background: 'none', border: 'none', color: '#ff3355', cursor: 'pointer' }}><X size={12} /></button>
                    </div>
                  ))}

                  <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 8 }}>
                    <div style={{ flex: 1, position: 'relative' }}>
                      <input
                        type={showApiKey ? 'text' : 'password'}
                        value={apiKeyInput}
                        onChange={e => setApiKeyInput(e.target.value)}
                        placeholder="sk-or-v1-..."
                        style={{ width: '100%', background: '#0d0d18', border: `1px solid ${apiKeyInput ? '#00ff8844' : '#1a1a2e'}`, color: '#e8e8e8', fontFamily: 'JetBrains Mono', fontSize: 9, padding: '5px 30px 5px 8px', outline: 'none', boxSizing: 'border-box' }}
                      />
                      <button
                        onClick={() => setShowApiKey(v => !v)}
                        style={{ position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#444', display: 'flex', alignItems: 'center' }}
                      >
                        {showApiKey ? <EyeOff size={10} /> : <Eye size={10} />}
                      </button>
                    </div>
                    <button
                      onClick={() => {
                        if (apiKeyInput) {
                          addOpenRouterKey(`Key ${openRouterKeys.length + 1}`, apiKeyInput);
                          setApiKeyInput('');
                          toast.success('OpenRouter key added');
                        }
                      }}
                      style={{ padding: '5px 12px', background: 'rgba(0,255,136,0.1)', border: '1px solid #00ff8833', color: '#00ff88', cursor: 'pointer', fontFamily: 'JetBrains Mono', fontSize: 9, display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}
                    >
                      + ADD KEY
                    </button>
                  </div>
                </div>

                <div style={{ padding: '12px', borderBottom: '1px solid #0a0a12' }}>
                  <div style={{ fontSize: 10, color: '#888', marginBottom: 8 }}>Task Routing</div>
                  {(['background', 'realtime', 'analysis', 'fallback'] as const).map(task => (
                    <div key={task} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <div style={{ fontSize: 9, color: '#e8e8e8', textTransform: 'capitalize' }}>{task} Tasks</div>
                      <select
                        value={taskRouting[task] || ''}
                        onChange={e => setTaskRouting({ [task]: e.target.value })}
                        style={{ background: '#0d0d18', border: '1px solid #1a1a2e', color: '#00ccff', fontFamily: 'JetBrains Mono', fontSize: 9, padding: '3px 8px', width: 140 }}
                      >
                        <option value="">Auto (Any Active)</option>
                        {openRouterKeys.map(k => (
                          <option key={k.id} value={k.id}>{k.label}</option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>

                <div style={{ padding: '12px', borderBottom: '1px solid #0a0a12' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <div style={{ fontSize: 10, color: '#888' }}>Gemini API Key (Fallback / Deep)</div>
                    <ToggleRow label="" value={geminiEnabled} onToggle={() => setGeminiEnabled(!geminiEnabled)} />
                  </div>
                  <input
                    type="password"
                    value={geminiKey}
                    onChange={e => setGeminiKey(e.target.value)}
                    placeholder="AIzaSy..."
                    style={{ width: '100%', background: '#0d0d18', border: `1px solid ${geminiKey ? '#00ff8844' : '#1a1a2e'}`, color: '#e8e8e8', fontFamily: 'JetBrains Mono', fontSize: 9, padding: '5px 8px', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', borderBottom: '1px solid #0a0a12' }}>
                  <div>
                    <div style={{ fontSize: 10, color: '#888' }}>Default AI Model</div>
                  </div>
                  <select
                    value={settings.aiModel}
                    onChange={e => updateSettings({ aiModel: e.target.value })}
                    style={{ background: '#0d0d18', border: '1px solid #1a1a2e', color: '#00ccff', fontFamily: 'JetBrains Mono', fontSize: 9, padding: '3px 8px', cursor: 'pointer' }}
                  >
                    <option value="meta-llama/llama-3.3-8b-instruct:free">Llama 3.3 8B (Free)</option>
                    <option value="deepseek/deepseek-r1-distill-llama-70b:free">DeepSeek R1 70B (Free)</option>
                    <option value="deepseek/deepseek-r1:free">DeepSeek R1 (Free)</option>
                  </select>
                </div>
                <ToggleRow
                  label="Auto-Generate Daily Brief"
                  value={settings.autoGenerateBrief}
                  onToggle={() => toggleBool('autoGenerateBrief')}
                  desc="Generate AI market brief on terminal startup"
                />
              </div>
            )}

            {activeTab === 'ALERTS' && (
              <div>
                <ToggleRow
                  label="Audio Alerts"
                  value={audioEnabled}
                  onToggle={() => {
                    setAudioEnabled(!audioEnabled);
                  }}
                  desc="Beep sound when critical alerts trigger"
                />
              </div>
            )}

            {activeTab === 'TICKERS' && (
              <div style={{ padding: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div>
                    <div style={{ fontSize: 10, color: '#00ccff', fontWeight: 'bold' }}>TICKER CONFIGURATIONS</div>
                    <div style={{ fontSize: 8, color: '#888', marginTop: 2 }}>Edit the ticker symbols used across panels. Use comma-separated values.</div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <label style={{ background: '#1a1a2e', border: '1px solid #333', color: '#00ff88', padding: '4px 8px', fontSize: 9, cursor: 'pointer', fontFamily: 'JetBrains Mono' }}>
                      Import JSON
                      <input type="file" accept=".json" style={{ display: 'none' }} onChange={e => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const reader = new FileReader();
                        reader.onload = (ev) => {
                          try {
                            const parsed = JSON.parse(ev.target?.result as string);
                            setTickerConfig(parsed);
                            toast.success('Tickers imported successfully');
                          } catch (err) {
                            toast.error('Invalid JSON file');
                          }
                        };
                        reader.readAsText(file);
                      }} />
                    </label>
                    <button onClick={() => {
                      const data = JSON.stringify(tickerConfig, null, 2);
                      const blob = new Blob([data], { type: 'application/json' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `stockwar_tickers_${Date.now()}.json`;
                      a.click();
                      URL.revokeObjectURL(url);
                      toast.success('Tickers exported as JSON');
                    }} style={{ background: '#1a1a2e', border: '1px solid #333', color: '#00ccff', padding: '4px 8px', fontSize: 9, cursor: 'pointer', fontFamily: 'JetBrains Mono' }}>Export JSON</button>
                  </div>
                </div>
                
                {Object.entries({
                  usIndices: 'US Market Indices',
                  indiaIndices: 'India Market Indices',
                  europeIndices: 'Europe Market Indices',
                  sectorEtfs: 'Sector ETFs',
                  cryptoCoins: 'Crypto Coins',
                }).map(([key, label]) => (
                  <div key={key} style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 9, color: '#aaa', marginBottom: 4 }}>{label}</div>
                    <textarea
                      value={(tickerConfig as any)[key].join(', ')}
                      onChange={e => {
                        const val = e.target.value.split(',').map((s: string) => s.trim()).filter(Boolean);
                        setTickerConfig({ [key]: val } as any);
                      }}
                      style={{ width: '100%', height: 40, background: '#0d0d18', border: '1px solid #1a1a2e', color: '#e8e8e8', fontFamily: 'JetBrains Mono', fontSize: 9, padding: '4px', resize: 'vertical', boxSizing: 'border-box' }}
                    />
                  </div>
                ))}

                <button onClick={() => {
                  if(confirm('Reset all tickers to default values?')) {
                    resetTickers();
                    toast.success('Tickers reset to defaults');
                  }
                }} style={{ background: '#ff335522', border: '1px solid #ff335544', color: '#ff3355', padding: '4px 8px', fontSize: 9, cursor: 'pointer', marginTop: 8, fontFamily: 'JetBrains Mono' }}>
                  Reset To Defaults
                </button>
              </div>
            )}

            {activeTab === 'LOGS' && <LogsTab />}
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '8px 12px', borderTop: '1px solid #1a1a2e', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <span style={{ fontSize: 8, color: '#333' }}>Settings auto-save to localStorage</span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={onClose} style={{ background: '#0d0d18', border: '1px solid #1a1a2e', padding: '5px 14px', color: '#e8e8e8', cursor: 'pointer', fontFamily: 'JetBrains Mono', fontSize: 9 }}>CLOSE</button>
            <button
              onClick={handleSave}
              style={{ background: saved ? 'rgba(0,255,136,0.2)' : 'rgba(0,255,136,0.1)', border: '1px solid #00ff8833', padding: '5px 14px', color: '#00ff88', cursor: 'pointer', fontFamily: 'JetBrains Mono', fontSize: 9, transition: 'all 0.2s' }}
            >
              {saved ? '✓ SAVED' : 'SAVE SETTINGS'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
