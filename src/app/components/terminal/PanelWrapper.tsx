import { useState, useEffect, useRef, useCallback } from 'react';
import { MoreVertical, Pin, Maximize2, Minimize2, X, RefreshCw, Bot, TrendingUp, Bell, Lock, Settings, Download, Camera } from 'lucide-react';
import React from 'react';
import { createPortal } from 'react-dom';
import type { PanelBadge } from '../../stores/panelNotifStore';
import { usePanelCustomizeStore } from '../../stores/panelCustomizeStore';

const CATEGORY_COLORS: Record<string, string> = {
  MARKETS: '#00ff88',
  INTELLIGENCE: '#ff3355',
  TECHNOLOGY: '#00ccff',
  COMMODITIES: '#ffaa00',
  CRYPTO: '#a78bfa',
  NEWS: '#fb923c',
  SYSTEM: '#666680',
};

const BADGE_COLORS: Record<string, string> = {
  info: '#00ccff',
  warning: '#ffaa00',
  critical: '#ff3355',
};

const headerBtnStyle: React.CSSProperties = {
  background: 'transparent', border: 'none',
  cursor: 'pointer', color: '#666680',
  padding: 2, display: 'flex', alignItems: 'center',
};

// ─── Helper Components (defined before PanelWrapper) ──────────────────────────

function MenuGroup({ children }: { children: React.ReactNode }) {
  return <div style={{ borderBottom: '1px solid #1a1a2e' }}>{children}</div>;
}

function MenuItem({ icon, label, onClick, color }: { icon: React.ReactNode; label: string; onClick?: () => void; color?: string }) {
  const [hover, setHover] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        width: '100%', textAlign: 'left',
        background: hover ? '#1a1a2e' : 'transparent',
        border: 'none', padding: '6px 10px',
        display: 'flex', alignItems: 'center', gap: 8,
        color: color || (hover ? '#e8e8e8' : '#aaa'),
        cursor: 'pointer', fontSize: 10,
        fontFamily: 'JetBrains Mono, monospace',
      }}
    >
      {icon} {label}
    </button>
  );
}

interface ContextMenuProps {
  x: number; y: number;
  title: string;
  isPinned: boolean;
  onPin: () => void;
  onMaximize: () => void;
  onClose: () => void;
  onRefresh: () => void;
  onDismiss: () => void;
  onOpenAlerts?: () => void;
  onOpenCorrelation?: () => void;
  onAIAnalyze?: () => void;
  onCustomize?: () => void;
  onExportData?: () => void;
  onSnapshot?: () => void;
  onResize?: (size: 'small' | 'medium' | 'large') => void;
  onGenerateBrief?: () => void;
  onMinimize?: () => void;
}

const PanelContextMenu = React.forwardRef<HTMLDivElement, ContextMenuProps>(
  ({ x, y, title, isPinned, onPin, onMaximize, onClose, onRefresh, onDismiss, onOpenAlerts, onOpenCorrelation, onAIAnalyze, onCustomize, onExportData, onSnapshot, onResize, onGenerateBrief, onMinimize }, ref) => {
    const left = Math.min(x, window.innerWidth - 220);
    const top = Math.min(y, window.innerHeight - 400);

    return (
      <div
        ref={ref}
        style={{
          position: 'fixed', left, top, zIndex: 100002,
          width: 220, background: '#0d0d18',
          border: '1px solid #1a1a2e',
          fontFamily: 'JetBrains Mono, monospace', fontSize: 10,
          boxShadow: '0 8px 32px rgba(0,0,0,0.9)',
        }}
        onPointerDown={e => e.stopPropagation()}
      >
        <div style={{ padding: '6px 10px', background: '#0f0f1a', color: '#00ccff', fontSize: 9, letterSpacing: 1, borderBottom: '1px solid #1a1a2e' }}>
          ▶ PANEL: {title.toUpperCase()}
        </div>

        <MenuGroup>
          <MenuItem icon={<Pin size={10} />} label={isPinned ? 'Unpin Panel' : 'Pin Panel'} onClick={onPin} />
          <MenuItem icon={<Maximize2 size={10} />} label="Maximize Panel" onClick={onMaximize} />
          <MenuItem icon={<Minimize2 size={10} />} label="Minimize" onClick={onMinimize || onDismiss} />
        </MenuGroup>

        <MenuGroup>
          <MenuItem icon={<Bell size={10} />} label="Configure Alerts" onClick={onOpenAlerts || onDismiss} />
          <MenuItem icon={<TrendingUp size={10} />} label="Correlate to Tickers" onClick={onOpenCorrelation || onDismiss} />
          <MenuItem icon={<Settings size={10} />} label="Customize Widget" onClick={onCustomize || onDismiss} color="#ffaa00" />
        </MenuGroup>

        <MenuGroup>
          <MenuItem icon={<Bot size={10} />} label="AI: Analyze This Panel" onClick={onAIAnalyze || onDismiss} color="#00ccff" />
          <MenuItem icon={<Bot size={10} />} label="AI: Generate Brief" onClick={onGenerateBrief || onDismiss} color="#00ccff" />
          <MenuItem icon={<RefreshCw size={10} />} label="Force Refresh" onClick={onRefresh} />
        </MenuGroup>

        <MenuGroup>
          <MenuItem icon={<Download size={10} />} label="⤓ Export Data as CSV" onClick={onExportData || onDismiss} color="#00ff88" />
          <MenuItem icon={<Camera size={10} />} label="📸 Snapshot Panel (PNG)" onClick={onSnapshot || onDismiss} color="#00ccff" />
        </MenuGroup>

        <MenuGroup>
          <MenuItem
            icon={<span style={{ fontSize: 9 }}>SM</span>}
            label="Resize: Small (2×4)"
            onClick={() => onResize?.('small')}
          />
          <MenuItem
            icon={<span style={{ fontSize: 9 }}>MD</span>}
            label="Resize: Medium (4×7)"
            onClick={() => onResize?.('medium')}
          />
          <MenuItem
            icon={<span style={{ fontSize: 9 }}>LG</span>}
            label="Resize: Large (6×9)"
            onClick={() => onResize?.('large')}
          />
        </MenuGroup>

        <MenuGroup>
          <MenuItem icon={<X size={10} />} label="Remove Panel" onClick={onClose} color="#ff3355" />
        </MenuGroup>
      </div>
    );
  }
);
PanelContextMenu.displayName = 'PanelContextMenu';

// ─── PanelWrapper ─────────────────────────────────────────────────────────────

interface PanelWrapperProps {
  id: string;
  title: string;
  shortCode: string;
  category: string;
  tier?: 'free' | 'pro';
  onClose?: () => void;
  onMaximize?: () => void;
  isMaximized?: boolean;
  children: React.ReactNode;
  className?: string;
  dragHandle?: string;
  onOpenAlerts?: () => void;
  onOpenCorrelation?: (ticker?: string) => void;
  onAIAnalyze?: (panelTitle: string) => void;
  onCustomize?: () => void;
  badge?: PanelBadge;
  onClearBadge?: () => void;
  onExportData?: () => void;
  onSnapshot?: () => void;
  onResize?: (size: 'small' | 'medium' | 'large') => void;
  onGenerateBrief?: () => void;
  onMinimize?: () => void;
}

export function PanelWrapper({
  id,
  title,
  shortCode,
  category,
  tier = 'free',
  onClose,
  onMaximize,
  isMaximized,
  children,
  dragHandle = 'drag-handle',
  onOpenAlerts,
  onOpenCorrelation,
  onAIAnalyze,
  onCustomize,
  badge,
  onClearBadge,
  onExportData,
  onSnapshot,
  onResize,
  onGenerateBrief,
  onMinimize,
}: PanelWrapperProps) {
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  
  const { getCustomization, setCustomization } = usePanelCustomizeStore();
  const isPinned = getCustomization(id).isPinned || false;
  const setIsPinned = (val: boolean) => setCustomization(id, { isPinned: val });
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [status, setStatus] = useState<'fresh' | 'stale' | 'error' | 'no_key'>('fresh');
  const [externalStatus, setExternalStatus] = useState<'ok' | 'no_key' | 'error' | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pulseAlert, setPulseAlert] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const catColor = CATEGORY_COLORS[category] || '#666680';

  const timeAgo = useCallback(() => {
    const secs = Math.floor((Date.now() - lastUpdated.getTime()) / 1000);
    if (secs < 60) return `${secs}s`;
    if (secs < 3600) return `${Math.floor(secs / 60)}m`;
    return `${Math.floor(secs / 3600)}h`;
  }, [lastUpdated]);

  const [ago, setAgo] = useState('0s');

  useEffect(() => {
    const t = setInterval(() => {
      setAgo(timeAgo());
      const secs = Math.floor((Date.now() - lastUpdated.getTime()) / 1000);
      setStatus(secs > 300 ? 'stale' : 'fresh');
    }, 1000);
    return () => clearInterval(t);
  }, [lastUpdated, timeAgo]);

  // Badge pulse animation
  useEffect(() => {
    if (badge && badge.count > 0) {
      setPulseAlert(true);
      const t = setTimeout(() => setPulseAlert(false), 2000);
      return () => clearTimeout(t);
    }
  }, [badge]);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    setRefreshKey(k => k + 1);
    setLastUpdated(new Date());
    // Dispatch event for panels using usePanelRefresh hook
    window.dispatchEvent(new CustomEvent('stockwar:refreshPanel', { detail: { panelId: id } }));
    setTimeout(() => setIsRefreshing(false), 800);
  }, [id]);

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY });
  };

  useEffect(() => {
    if (contextMenu) console.log(`[PanelWrapper:${id}] contextMenu opened at ${contextMenu.x},${contextMenu.y}`);
    else console.log(`[PanelWrapper:${id}] contextMenu closed`);
  }, [contextMenu, id]);

  useEffect(() => {
    const handleClick = (e: PointerEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setContextMenu(null);
      }
    };
    if (contextMenu) document.addEventListener('pointerdown', handleClick as EventListener);
    return () => document.removeEventListener('pointerdown', handleClick as EventListener);
  }, [contextMenu]);

  // Listen for panel status events to show NO_KEY / ERROR badges
  useEffect(() => {
    const handler = (e: Event) => {
      try {
        const d = (e as CustomEvent).detail;
        if (!d || d.panelId !== id) return;
        if (d.status === 'no_key') setExternalStatus('no_key');
        else if (d.status === 'error') setExternalStatus('error');
        else if (d.status === 'fresh') setExternalStatus('ok');
      } catch (err) {
        // ignore
      }
    };
    window.addEventListener('stockwar:panelStatus', handler as EventListener);
    return () => window.removeEventListener('stockwar:panelStatus', handler as EventListener);
  }, [id]);

  // Listen for global force-refresh events and trigger local refresh
  useEffect(() => {
    const onForce = () => { handleRefresh(); };
    window.addEventListener('stockwar:forceRefresh', onForce as EventListener);
    return () => window.removeEventListener('stockwar:forceRefresh', onForce as EventListener);
  }, [handleRefresh]);

  const statusColor = status === 'fresh' ? '#00ff88' : status === 'stale' ? '#ffaa00' : '#ff3355';

  const borderColor = pulseAlert && badge
    ? BADGE_COLORS[badge.severity] || '#00ccff'
    : '#1a1a2e';

  const handleCloseClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    console.log(`[PanelWrapper] close clicked: ${id}`);
    onClose?.();
  }, [id, onClose]);

  // Pass refreshKey to children via cloneElement so panels can react to it
  const childrenWithRefresh = React.Children.map(children, child => {
    if (React.isValidElement(child)) {
      return React.cloneElement(child as React.ReactElement<any>, { refreshKey });
    }
    return child;
  });

    return (
      <div
        ref={wrapperRef}
        onContextMenu={handleContextMenu}
        style={{
          width: '100%',
          height: '100%',
          background: '#0d0d18',
          border: `1px solid ${borderColor}`,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          position: 'relative',
          transition: 'border-color 0.3s',
        }}
      >
      {/* Panel Header */}
      <div
        style={{
          height: 28,
          background: '#0f0f1a',
          borderBottom: '1px solid #1a1a2e',
          display: 'flex',
          alignItems: 'center',
          padding: '0 8px',
          gap: 6,
          flexShrink: 0,
          userSelect: 'none',
          position: 'relative',
          zIndex: 100001,
        }}
      >
        {/* Drag handle (only title area) */}
        <div className={dragHandle} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'grab', flex: 1, overflow: 'hidden' }}>
          {/* Category indicator */}
          <div style={{ width: 6, height: 6, background: catColor, flexShrink: 0 }} />

          {/* Title */}
          <span style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 10, color: '#e8e8e8', letterSpacing: 1,
            textTransform: 'uppercase',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {title}
          </span>
        </div>

        {/* Notification Badge */}
        {badge && badge.count > 0 && (
          <div
            className="no-drag"
            onClick={e => { e.stopPropagation(); onClearBadge?.(); }}
            onPointerDown={e => e.stopPropagation()}
            title={badge.lastMessage}
            style={{
              minWidth: 16, height: 16, borderRadius: '50%', flexShrink: 0,
              background: BADGE_COLORS[badge.severity] || '#00ccff',
              color: '#000', fontSize: 8, fontWeight: 700,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', animation: pulseAlert ? 'badgePulse 0.5s ease-in-out 3' : 'none',
              padding: '0 3px',
            }}
          >
            {badge.count > 9 ? '9+' : badge.count}
          </div>
        )}

        {/* Status Dot */}
        <div style={{
          width: 5, height: 5, borderRadius: '50%',
          background: statusColor, boxShadow: `0 0 4px ${statusColor}`,
          flexShrink: 0,
        }} />

        {/* Time ago */}
        <span style={{ fontSize: 9, color: '#444', fontFamily: 'JetBrains Mono, monospace', flexShrink: 0 }}>
          {ago}
        </span>

        {/* Refresh */}
        <button className="no-drag" onClick={handleRefresh} onPointerDown={e => e.stopPropagation()} style={headerBtnStyle}>
          <RefreshCw size={9} style={{ transform: isRefreshing ? 'rotate(360deg)' : 'none', transition: 'transform 0.8s' }} />
        </button>

        {/* AI Analyze button — quick access */}
        {onAIAnalyze && (
          <button
            className="no-drag"
            onClick={e => { e.stopPropagation(); onAIAnalyze(title); }}
            onPointerDown={e => e.stopPropagation()}
            title="AI: Analyze This Panel"
            style={{ ...headerBtnStyle, color: '#00ccff33' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#00ccff')}
            onMouseLeave={e => (e.currentTarget.style.color = '#00ccff33')}
          >
            <Bot size={9} />
          </button>
        )}

        {/* Menu */}
        <button
          className="no-drag"
          data-panel-menu="true"
          onClick={e => { e.stopPropagation(); console.log(`[PanelWrapper:${id}] menu clicked`); setContextMenu({ x: e.clientX, y: e.clientY }); }}
          onPointerDown={e => e.stopPropagation()}
          onMouseDown={e => e.stopPropagation()}
          style={headerBtnStyle}
        >
          <MoreVertical size={10} />
        </button>

        {/* Window Controls */}
        {isPinned && <Pin size={9} color="#ffaa00" />}
        <button
          className="no-drag"
          onClick={e => { e.stopPropagation(); onMaximize?.(); }}
          onMouseDown={e => { e.stopPropagation(); e.preventDefault(); }}
          style={headerBtnStyle}
        >
          {isMaximized ? <Minimize2 size={9} /> : <Maximize2 size={9} />}
        </button>
        <button
          className="no-drag"
          data-panel-close="true"
          onClick={handleCloseClick}
          onMouseDown={e => { e.stopPropagation(); e.preventDefault(); }}
          style={{ ...headerBtnStyle, color: '#ff3355' }}
        >
          <X size={9} />
        </button>
      </div>

      {/* Panel Content — pass refreshKey to children without remounting */}
      <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
        {childrenWithRefresh}
      </div>

      {/* PRO lock badge */}
      {tier === 'pro' && (
        <div style={{
          position: 'absolute', top: 4, right: 44,
          display: 'flex', alignItems: 'center', gap: 2,
          background: '#ffaa0022', border: '1px solid #ffaa0044',
          padding: '1px 4px',
        }}>
          <Lock size={7} color="#ffaa00" />
          <span style={{ fontSize: 7, color: '#ffaa00', fontFamily: 'JetBrains Mono', letterSpacing: 1 }}>PRO</span>
        </div>
      )}

      {/* NO-KEY / PANEL ERROR badge */}
      {externalStatus === 'no_key' && (
        <div style={{ position: 'absolute', top: 6, right: 44, padding: '2px 6px', background: 'rgba(255,51,85,0.06)', border: '1px solid #ff335544', color: '#ff3355', fontSize: 8, borderRadius: 4 }}>
          ⚠ NO KEY
        </div>
      )}
      {externalStatus === 'error' && (
        <div style={{ position: 'absolute', top: 6, right: 44, padding: '2px 6px', background: 'rgba(255,51,85,0.06)', border: '1px solid #ff335544', color: '#ff3355', fontSize: 8, borderRadius: 4 }}>
          ⚠ ERROR
        </div>
      )}

      {/* Context Menu rendered in a portal to avoid clipping/stacking issues */}
      {contextMenu && (createPortal(
        <PanelContextMenu
          ref={menuRef}
          x={contextMenu.x}
          y={contextMenu.y}
          title={title}
          isPinned={isPinned}
          onPin={() => { setIsPinned(!isPinned); setContextMenu(null); }}
          onMaximize={() => { onMaximize?.(); setContextMenu(null); }}
          onClose={() => { onClose?.(); setContextMenu(null); }}
          onRefresh={() => { handleRefresh(); setContextMenu(null); }}
          onDismiss={() => setContextMenu(null)}
          onOpenAlerts={() => { onOpenAlerts?.(); setContextMenu(null); }}
          onOpenCorrelation={() => { onOpenCorrelation?.(); setContextMenu(null); }}
          onAIAnalyze={() => { onAIAnalyze?.(title); setContextMenu(null); }}
          onCustomize={() => { onCustomize?.(); setContextMenu(null); }}
          onExportData={() => { onExportData?.(); setContextMenu(null); }}
          onSnapshot={() => { onSnapshot?.(); setContextMenu(null); }}
          onResize={(size) => { onResize?.(size); setContextMenu(null); }}
          onGenerateBrief={() => { onGenerateBrief?.(); setContextMenu(null); }}
          onMinimize={() => { onMinimize?.(); setContextMenu(null); }}
        />,
        document.body
      ) as unknown as React.ReactNode)}
    </div>
  );
}
