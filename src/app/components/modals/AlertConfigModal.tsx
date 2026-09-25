import { useState, useEffect } from 'react';
import { X, Bell, Plus, Trash2, TrendingUp, TrendingDown, Activity, Play, Pause, Volume2, VolumeX, AlertTriangle, Check } from 'lucide-react';
import { toast } from 'sonner';
import { useAlertStore } from '../../stores/alertStore';
import type { AlertRule, AlertConditionType, AlertChannel } from '../../stores/alertStore';
import { PANEL_META } from '../terminal/PanelGrid';

const TYPE_COLORS: Record<string, string> = {
  price_above: '#00ff88',
  price_below: '#ff3355',
  pct_change: '#00ccff',
  keyword: '#ffaa00',
  sentiment: '#a78bfa',
};

const TYPE_LABELS: Record<string, string> = {
  price_above: 'PRICE ABOVE',
  price_below: 'PRICE BELOW',
  pct_change: 'PCT CHANGE',
  keyword: 'KEYWORD',
  sentiment: 'SENTIMENT',
};

const CONDITION_OPTIONS: { value: AlertConditionType; label: string }[] = [
  { value: 'price_above', label: 'Price Above' },
  { value: 'price_below', label: 'Price Below' },
  { value: 'pct_change', label: '% Change Exceeds' },
  { value: 'keyword', label: 'Keyword Detected' },
  { value: 'sentiment', label: 'Sentiment Score' },
];

const CHANNEL_OPTIONS: { value: AlertChannel; label: string; icon: string }[] = [
  { value: 'in-app', label: 'In-App', icon: '🔔' },
  { value: 'audio', label: 'Audio', icon: '🔊' },
  { value: 'banner', label: 'Banner', icon: '📢' },
];

// Predefined panel options for quick alert setup
const QUICK_PANEL_OPTIONS = [
  { id: 'markets_overview', label: 'Markets Overview' },
  { id: 'crypto', label: 'Crypto Prices' },
  { id: 'forex', label: 'Forex & Currencies' },
  { id: 'energy_complex', label: 'Energy Complex' },
  { id: 'israel_sirens', label: 'Israel Sirens (OREF)' },
  { id: 'armed_conflicts', label: 'Armed Conflicts' },
  { id: 'geopolitical_hubs', label: 'Geopolitical Hubs' },
  { id: 'options_flow', label: 'Options Flow' },
  { id: 'india_markets', label: 'India Markets' },
  { id: 'gold_silver', label: 'Gold & Precious Metals' },
];

interface AlertConfigModalProps {
  open: boolean;
  onClose: () => void;
  panelTitle?: string;
}

export function AlertConfigModal({ open, onClose, panelTitle }: AlertConfigModalProps) {
  const {
    rules,
    notifications,
    unreadCount,
    audioEnabled,
    addRule,
    removeRule,
    toggleRule,
    pushNotification,
    markAllRead,
    dismissNotification,
    setAudioEnabled,
  } = useAlertStore();

  const [tab, setTab] = useState<'rules' | 'notifications'>('rules');
  const [showForm, setShowForm] = useState(false);
  const [testingRule, setTestingRule] = useState<string | null>(null);
  const [newRule, setNewRule] = useState<{
    name: string;
    panelId: string;
    panelTitle: string;
    conditionType: AlertConditionType;
    conditionValue: string;
    channels: AlertChannel[];
  }>({
    name: '',
    panelId: panelTitle ? Object.entries(PANEL_META).find(([, m]) => m.title === panelTitle)?.[0] || 'markets_overview' : 'markets_overview',
    panelTitle: panelTitle || 'Markets Overview',
    conditionType: 'price_above',
    conditionValue: '',
    channels: ['in-app'],
  });

  useEffect(() => {
    if (panelTitle) {
      const panelId = Object.entries(PANEL_META).find(([, m]) => m.title === panelTitle)?.[0] || 'markets_overview';
      setNewRule(prev => ({ ...prev, panelId, panelTitle }));
    }
  }, [panelTitle]);

  if (!open) return null;

  const handleChannelToggle = (ch: AlertChannel) => {
    setNewRule(prev => ({
      ...prev,
      channels: prev.channels.includes(ch)
        ? prev.channels.filter(c => c !== ch)
        : [...prev.channels, ch],
    }));
  };

  const handleAddRule = () => {
    if (!newRule.name.trim() || !newRule.conditionValue.trim()) {
      toast.error('Please fill in rule name and condition value');
      return;
    }
    addRule({
      name: newRule.name.trim(),
      panelId: newRule.panelId,
      panelTitle: newRule.panelTitle,
      conditionType: newRule.conditionType,
      conditionValue: newRule.conditionValue,
      channels: newRule.channels.length > 0 ? newRule.channels : ['in-app'],
      isActive: true,
    });
    setNewRule({
      name: '',
      panelId: 'markets_overview',
      panelTitle: 'Markets Overview',
      conditionType: 'price_above',
      conditionValue: '',
      channels: ['in-app'],
    });
    setShowForm(false);
    toast.success('✓ Alert rule created and armed', { duration: 2500 });
  };

  const handleTestRule = (rule: AlertRule) => {
    setTestingRule(rule.id);
    setTimeout(() => {
      pushNotification({
        ruleId: rule.id,
        message: `TEST: ${rule.name} — ${rule.conditionType.replace('_', ' ')} ${rule.conditionValue} triggered on ${rule.panelTitle}`,
        severity: 'info',
        source: 'Alert System (TEST)',
      });
      toast.success(`Test notification sent for: ${rule.name}`, { duration: 2000 });
      setTestingRule(null);
    }, 800);
  };

  const handleDeleteRule = (id: string) => {
    removeRule(id);
    toast.info('Alert rule removed');
  };

  const severityColors: Record<string, string> = {
    info: '#00ccff',
    warning: '#ffaa00',
    critical: '#ff3355',
  };

  const getSeverityIcon = (sev: string) => {
    if (sev === 'critical') return <AlertTriangle size={8} color="#ff3355" />;
    if (sev === 'warning') return <Activity size={8} color="#ffaa00" />;
    return <Bell size={8} color="#00ccff" />;
  };

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 10000, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ width: 580, maxHeight: '85vh', background: '#0a0a12', border: '1px solid #1a1a2e', display: 'flex', flexDirection: 'column', fontFamily: 'JetBrains Mono, monospace' }}>

        {/* Header */}
        <div style={{ height: 36, background: '#0d0d18', borderBottom: '1px solid #1a1a2e', display: 'flex', alignItems: 'center', padding: '0 12px', gap: 8, flexShrink: 0 }}>
          <Bell size={11} color="#ffaa00" />
          <span style={{ fontSize: 10, color: '#ffaa00', letterSpacing: 2 }}>⬡ ALERT CONFIGURATION</span>
          {panelTitle && <span style={{ fontSize: 8, color: '#333', marginLeft: 2 }}>— {panelTitle}</span>}
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              onClick={() => setAudioEnabled(!audioEnabled)}
              title={audioEnabled ? 'Mute audio alerts' : 'Enable audio alerts'}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: audioEnabled ? '#00ff88' : '#444', display: 'flex', alignItems: 'center' }}
            >
              {audioEnabled ? <Volume2 size={11} /> : <VolumeX size={11} />}
            </button>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#666680', display: 'flex', alignItems: 'center' }}>
              <X size={12} />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid #1a1a2e', flexShrink: 0 }}>
          {(['rules', 'notifications'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{ flex: 1, padding: '7px 0', background: tab === t ? '#0d0d18' : 'transparent', border: 'none', borderBottom: tab === t ? '2px solid #ffaa00' : '2px solid transparent', color: tab === t ? '#ffaa00' : '#444', cursor: 'pointer', fontFamily: 'JetBrains Mono', fontSize: 9, letterSpacing: 1 }}
            >
              {t === 'rules' ? `ALERT RULES (${rules.length})` : `NOTIFICATIONS ${unreadCount > 0 ? `(${unreadCount} NEW)` : ''}`}
            </button>
          ))}
        </div>

        {/* Stats bar */}
        <div style={{ display: 'flex', padding: '5px 12px', borderBottom: '1px solid #1a1a2e', gap: 16, fontSize: 8, flexShrink: 0, alignItems: 'center' }}>
          <span style={{ color: '#444' }}>TOTAL: <span style={{ color: '#e8e8e8' }}>{rules.length}</span></span>
          <span style={{ color: '#444' }}>ACTIVE: <span style={{ color: '#00ff88' }}>{rules.filter(r => r.isActive).length}</span></span>
          <span style={{ color: '#444' }}>PAUSED: <span style={{ color: '#ffaa00' }}>{rules.filter(r => !r.isActive).length}</span></span>
          <span style={{ color: '#444' }}>AUDIO: <span style={{ color: audioEnabled ? '#00ff88' : '#444' }}>{audioEnabled ? 'ON' : 'OFF'}</span></span>
          {tab === 'rules' && (
            <button
              onClick={() => setShowForm(v => !v)}
              style={{ marginLeft: 'auto', padding: '3px 10px', background: showForm ? 'rgba(0,204,255,0.15)' : 'rgba(0,204,255,0.1)', border: '1px solid #00ccff33', color: '#00ccff', cursor: 'pointer', fontSize: 8, fontFamily: 'JetBrains Mono', display: 'flex', alignItems: 'center', gap: 4 }}
            >
              <Plus size={9} /> {showForm ? 'CANCEL' : 'NEW ALERT'}
            </button>
          )}
          {tab === 'notifications' && unreadCount > 0 && (
            <button
              onClick={markAllRead}
              style={{ marginLeft: 'auto', padding: '3px 10px', background: 'rgba(0,255,136,0.08)', border: '1px solid #00ff8833', color: '#00ff88', cursor: 'pointer', fontSize: 8, fontFamily: 'JetBrains Mono', display: 'flex', alignItems: 'center', gap: 4 }}
            >
              <Check size={9} /> MARK ALL READ
            </button>
          )}
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto' }}>

          {/* ─── RULES TAB ─── */}
          {tab === 'rules' && (
            <>
              {/* New Rule Form */}
              {showForm && (
                <div style={{ padding: '10px 12px', borderBottom: '1px solid #1a1a2e', background: 'rgba(0,204,255,0.03)' }}>
                  <div style={{ fontSize: 8, color: '#00ccff', letterSpacing: 1, marginBottom: 8 }}>▶ NEW ALERT RULE</div>

                  {/* Row 1 */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 6 }}>
                    <div>
                      <div style={labelStyle}>RULE NAME</div>
                      <input
                        value={newRule.name}
                        onChange={e => setNewRule(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="e.g. VIX Spike Alert"
                        style={inputStyle}
                      />
                    </div>
                    <div>
                      <div style={labelStyle}>PANEL / SOURCE</div>
                      <select
                        value={newRule.panelId}
                        onChange={e => {
                          const opt = QUICK_PANEL_OPTIONS.find(p => p.id === e.target.value);
                          setNewRule(prev => ({ ...prev, panelId: e.target.value, panelTitle: opt?.label || e.target.value }));
                        }}
                        style={selectStyle}
                      >
                        {QUICK_PANEL_OPTIONS.map(p => (
                          <option key={p.id} value={p.id}>{p.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Row 2 */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6, marginBottom: 6 }}>
                    <div>
                      <div style={labelStyle}>CONDITION TYPE</div>
                      <select
                        value={newRule.conditionType}
                        onChange={e => setNewRule(prev => ({ ...prev, conditionType: e.target.value as AlertConditionType }))}
                        style={selectStyle}
                      >
                        {CONDITION_OPTIONS.map(o => (
                          <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <div style={labelStyle}>
                        {newRule.conditionType === 'keyword' ? 'KEYWORD' : 'VALUE'}
                      </div>
                      <input
                        value={newRule.conditionValue}
                        onChange={e => setNewRule(prev => ({ ...prev, conditionValue: e.target.value }))}
                        placeholder={newRule.conditionType === 'keyword' ? 'e.g. siren, alert' : newRule.conditionType === 'pct_change' ? '±5%' : '550.00'}
                        style={inputStyle}
                      />
                    </div>
                    <div>
                      <div style={labelStyle}>SEVERITY</div>
                      <select style={selectStyle}>
                        <option>WARNING</option>
                        <option>CRITICAL</option>
                        <option>INFO</option>
                      </select>
                    </div>
                  </div>

                  {/* Channels */}
                  <div style={{ marginBottom: 8 }}>
                    <div style={labelStyle}>NOTIFICATION CHANNELS</div>
                    <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                      {CHANNEL_OPTIONS.map(ch => (
                        <button
                          key={ch.value}
                          onClick={() => handleChannelToggle(ch.value)}
                          style={{
                            padding: '4px 10px', cursor: 'pointer', fontFamily: 'JetBrains Mono', fontSize: 8,
                            background: newRule.channels.includes(ch.value) ? 'rgba(0,204,255,0.15)' : '#0d0d18',
                            border: `1px solid ${newRule.channels.includes(ch.value) ? '#00ccff' : '#1a1a2e'}`,
                            color: newRule.channels.includes(ch.value) ? '#00ccff' : '#444',
                          }}
                        >
                          {ch.icon} {ch.label.toUpperCase()}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={handleAddRule}
                    disabled={!newRule.name.trim() || !newRule.conditionValue.trim()}
                    style={{ padding: '5px 16px', background: 'rgba(0,255,136,0.1)', border: '1px solid #00ff8833', color: '#00ff88', cursor: 'pointer', fontSize: 9, fontFamily: 'JetBrains Mono', opacity: !newRule.name.trim() || !newRule.conditionValue.trim() ? 0.4 : 1 }}
                  >
                    ▶ ARM ALERT RULE
                  </button>
                </div>
              )}

              {/* Rules List */}
              {rules.length === 0 && (
                <div style={{ padding: 24, textAlign: 'center', fontSize: 10, color: '#333', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                  <Bell size={24} color="#1a1a2e" />
                  <span>No alert rules configured</span>
                  <span style={{ fontSize: 8 }}>Click NEW ALERT to arm your first rule</span>
                </div>
              )}

              {rules.map(rule => {
                const typeColor = TYPE_COLORS[rule.conditionType] || '#666680';
                return (
                  <div
                    key={rule.id}
                    style={{ padding: '8px 12px', borderBottom: '1px solid #0f0f18', display: 'flex', alignItems: 'center', gap: 8, opacity: rule.isActive ? 1 : 0.5, borderLeft: `2px solid ${rule.isActive ? typeColor : '#222'}` }}
                  >
                    {/* Toggle */}
                    <div
                      onClick={() => { toggleRule(rule.id); toast.info(`Rule ${rule.isActive ? 'paused' : 'armed'}: ${rule.name}`, { duration: 1500 }); }}
                      style={{ width: 28, height: 14, background: rule.isActive ? typeColor + '22' : '#1a1a2e', border: `1px solid ${rule.isActive ? typeColor : '#333'}`, position: 'relative', cursor: 'pointer', flexShrink: 0 }}
                    >
                      <div style={{ position: 'absolute', left: rule.isActive ? 'calc(100% - 12px)' : '2px', top: 2, width: 8, height: 8, background: rule.isActive ? typeColor : '#333', transition: 'left 0.2s' }} />
                    </div>

                    {/* Type badge */}
                    <span style={{ fontSize: 7, padding: '1px 5px', color: typeColor, border: `1px solid ${typeColor}33`, flexShrink: 0 }}>
                      {TYPE_LABELS[rule.conditionType] || rule.conditionType.toUpperCase()}
                    </span>

                    {/* Description */}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 1, minWidth: 0 }}>
                      <span style={{ fontSize: 10, color: '#e8e8e8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{rule.name}</span>
                      <span style={{ fontSize: 8, color: '#444' }}>{rule.panelTitle} · value: {rule.conditionValue}</span>
                    </div>

                    {/* Channels */}
                    <div style={{ display: 'flex', gap: 3, flexShrink: 0 }}>
                      {rule.channels.map(ch => (
                        <span key={ch} style={{ fontSize: 6, padding: '1px 4px', background: '#1a1a2e', color: '#555', border: '1px solid #1a1a2e' }}>{ch.toUpperCase()}</span>
                      ))}
                    </div>

                    {/* Direction icon */}
                    {rule.conditionType === 'price_above' ? <TrendingUp size={9} color="#00ff88" /> : rule.conditionType === 'price_below' ? <TrendingDown size={9} color="#ff3355" /> : null}

                    {/* Test */}
                    <button
                      onClick={() => handleTestRule(rule)}
                      title="Test this alert"
                      style={{ background: 'none', border: '1px solid #1a1a2e', cursor: 'pointer', color: testingRule === rule.id ? '#00ff88' : '#333', padding: '2px 5px', display: 'flex', alignItems: 'center' }}
                    >
                      {testingRule === rule.id ? <Check size={8} /> : <Play size={8} />}
                    </button>

                    {/* Delete */}
                    <button
                      onClick={() => handleDeleteRule(rule.id)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#333', padding: 2, display: 'flex', alignItems: 'center' }}
                      onMouseEnter={e => (e.currentTarget.style.color = '#ff3355')}
                      onMouseLeave={e => (e.currentTarget.style.color = '#333')}
                    >
                      <Trash2 size={9} />
                    </button>
                  </div>
                );
              })}
            </>
          )}

          {/* ─── NOTIFICATIONS TAB ─── */}
          {tab === 'notifications' && (
            <>
              {notifications.length === 0 && (
                <div style={{ padding: 24, textAlign: 'center', fontSize: 10, color: '#333' }}>
                  <Bell size={24} color="#1a1a2e" style={{ marginBottom: 8 }} />
                  <div>No notifications</div>
                </div>
              )}
              {notifications.map(n => (
                <div
                  key={n.id}
                  style={{ padding: '8px 12px', borderBottom: '1px solid #0f0f18', display: 'flex', gap: 8, alignItems: 'flex-start', opacity: n.read ? 0.55 : 1, borderLeft: `2px solid ${n.read ? '#222' : severityColors[n.severity]}` }}
                >
                  <div style={{ marginTop: 1, flexShrink: 0 }}>{getSeverityIcon(n.severity)}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 10, color: n.read ? '#555' : '#e8e8e8', lineHeight: 1.4 }}>{n.message}</div>
                    <div style={{ fontSize: 7, color: '#333', marginTop: 2, display: 'flex', gap: 8 }}>
                      <span>{n.source}</span>
                      {n.ticker && <span style={{ color: '#444' }}>{n.ticker}</span>}
                      <span>{n.timestamp.toLocaleTimeString('en-US', { hour12: false })}</span>
                    </div>
                  </div>
                  {!n.read && <div style={{ width: 5, height: 5, borderRadius: '50%', background: severityColors[n.severity], flexShrink: 0, marginTop: 4 }} />}
                  <button onClick={() => dismissNotification(n.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#333', padding: 2, flexShrink: 0 }} onMouseEnter={e => (e.currentTarget.style.color = '#ff3355')} onMouseLeave={e => (e.currentTarget.style.color = '#333')}>
                    <X size={9} />
                  </button>
                </div>
              ))}
            </>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '6px 12px', borderTop: '1px solid #1a1a2e', display: 'flex', justifyContent: 'space-between', fontSize: 8, color: '#333', flexShrink: 0, alignItems: 'center' }}>
          <span>Rules fire in real-time when conditions are met · {rules.filter(r => r.isActive).length} rules armed</span>
          <button onClick={onClose} style={{ background: '#0d0d18', border: '1px solid #1a1a2e', padding: '3px 12px', color: '#e8e8e8', cursor: 'pointer', fontFamily: 'JetBrains Mono', fontSize: 9 }}>DONE</button>
        </div>
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%', background: '#0d0d18', border: '1px solid #1a1a2e',
  color: '#e8e8e8', fontFamily: 'JetBrains Mono', fontSize: 9, padding: '5px 7px',
  outline: 'none', boxSizing: 'border-box',
};

const selectStyle: React.CSSProperties = {
  width: '100%', background: '#0d0d18', border: '1px solid #1a1a2e',
  color: '#e8e8e8', fontFamily: 'JetBrains Mono', fontSize: 9, padding: '5px 7px',
  outline: 'none', cursor: 'pointer',
};

const labelStyle: React.CSSProperties = {
  fontSize: 7, color: '#444', marginBottom: 3, letterSpacing: 1,
};
