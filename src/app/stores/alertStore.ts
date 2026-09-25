import { create } from 'zustand';

export type AlertChannel = 'in-app' | 'audio' | 'banner';
export type AlertConditionType = 'price_above' | 'price_below' | 'pct_change' | 'keyword' | 'sentiment';
export type AlertSeverity = 'info' | 'warning' | 'critical';

export interface AlertRule {
  id: string;
  name: string;
  panelId: string;
  panelTitle: string;
  conditionType: AlertConditionType;
  conditionValue: string | number;
  channels: AlertChannel[];
  isActive: boolean;
  createdAt: Date;
  triggeredAt?: Date;
}

export interface AlertNotification {
  id: string;
  ruleId?: string;
  message: string;
  severity: AlertSeverity;
  ticker?: string;
  timestamp: Date;
  read: boolean;
  source: string;
}

interface AlertStoreState {
  rules: AlertRule[];
  notifications: AlertNotification[];
  unreadCount: number;
  audioEnabled: boolean;
  // Actions
  addRule: (rule: Omit<AlertRule, 'id' | 'createdAt'>) => void;
  removeRule: (id: string) => void;
  toggleRule: (id: string) => void;
  pushNotification: (n: Omit<AlertNotification, 'id' | 'timestamp' | 'read'>) => void;
  markAllRead: () => void;
  dismissNotification: (id: string) => void;
  setAudioEnabled: (v: boolean) => void;
}

const DEFAULT_RULES: AlertRule[] = [
  {
    id: 'r1',
    name: 'VIX Spike Alert',
    panelId: 'markets_overview',
    panelTitle: 'Markets Overview',
    conditionType: 'price_above',
    conditionValue: 25,
    channels: ['in-app', 'banner'],
    isActive: true,
    createdAt: new Date(),
  },
  {
    id: 'r2',
    name: 'BTC -5% Drop',
    panelId: 'crypto',
    panelTitle: 'Crypto Prices',
    conditionType: 'pct_change',
    conditionValue: -5,
    channels: ['in-app', 'audio'],
    isActive: true,
    createdAt: new Date(),
  },
  {
    id: 'r3',
    name: 'OREF Siren Detected',
    panelId: 'israel_sirens',
    panelTitle: 'Israel Sirens',
    conditionType: 'keyword',
    conditionValue: 'siren',
    channels: ['in-app', 'banner', 'audio'],
    isActive: true,
    createdAt: new Date(),
  },
];

const INITIAL_NOTIFICATIONS: AlertNotification[] = [
  {
    id: 'n1',
    message: 'NVDA +4.8% — Blackwell Ultra demand exceeds supply estimates',
    severity: 'info',
    ticker: 'NVDA',
    timestamp: new Date(Date.now() - 180000),
    read: false,
    source: 'Markets',
  },
  {
    id: 'n2',
    message: 'VIX spiked to 17.1 — elevated options activity detected',
    severity: 'warning',
    ticker: 'VIX',
    timestamp: new Date(Date.now() - 420000),
    read: false,
    source: 'Markets',
  },
  {
    id: 'n3',
    message: 'OREF: Rocket alert — Ashkelon region [ACTIVE]',
    severity: 'critical',
    timestamp: new Date(Date.now() - 600000),
    read: true,
    source: 'Intel',
  },
];

export const useAlertStore = create<AlertStoreState>((set) => ({
  rules: DEFAULT_RULES,
  notifications: INITIAL_NOTIFICATIONS,
  unreadCount: INITIAL_NOTIFICATIONS.filter(n => !n.read).length,
  audioEnabled: true,

  addRule: (rule) =>
    set((state) => ({
      rules: [
        ...state.rules,
        { ...rule, id: Date.now().toString(), createdAt: new Date() },
      ],
    })),

  removeRule: (id) =>
    set((state) => ({ rules: state.rules.filter(r => r.id !== id) })),

  toggleRule: (id) =>
    set((state) => ({
      rules: state.rules.map(r => r.id === id ? { ...r, isActive: !r.isActive } : r),
    })),

  pushNotification: (n) =>
    set((state) => {
      const notification: AlertNotification = {
        ...n,
        id: Date.now().toString(),
        timestamp: new Date(),
        read: false,
      };
      const notifications = [notification, ...state.notifications].slice(0, 50);
      return {
        notifications,
        unreadCount: notifications.filter(x => !x.read).length,
      };
    }),

  markAllRead: () =>
    set((state) => ({
      notifications: state.notifications.map(n => ({ ...n, read: true })),
      unreadCount: 0,
    })),

  dismissNotification: (id) =>
    set((state) => {
      const notifications = state.notifications.filter(n => n.id !== id);
      return { notifications, unreadCount: notifications.filter(n => !n.read).length };
    }),

  setAudioEnabled: (v) => set({ audioEnabled: v }),
}));
