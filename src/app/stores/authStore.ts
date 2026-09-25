import { create } from 'zustand';

export type UserRole = 'ANALYST' | 'OPERATOR' | 'COMMANDER';
export type UserTier = 'FREE' | 'PRO' | 'ENTERPRISE';

export interface StockWarUser {
  id: string;
  email: string;
  username: string;
  callsign: string;
  role: UserRole;
  tier: UserTier;
  createdAt: string;
  lastLogin: string;
  // persisted per-user API keys (optional)
  savedApiKeys?: Record<string, string>;
}

interface AuthState {
  user: StockWarUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (identifier: string, password: string) => Promise<boolean>;
  register: (email: string, username: string, callsign: string, password: string) => Promise<boolean>;
  logout: () => void;
  clearError: () => void;
  checkSession: () => boolean;
  setTier: (tier: UserTier) => void;
  saveApiKeys: (keys: Record<string, string>) => void;
}

const SESSION_KEY = 'stockwar_session_v1';
const USERS_KEY = 'stockwar_users_v1';

function getUsers(): Array<StockWarUser & { passwordHash: string }> {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  // No seeded users in production-ready builds
  return [];
}

function saveUsers(users: Array<StockWarUser & { passwordHash: string }>) {
  try { localStorage.setItem(USERS_KEY, JSON.stringify(users)); } catch { /* ignore */ }
}

function saveSession(user: StockWarUser) {
  try { localStorage.setItem(SESSION_KEY, JSON.stringify({ user, expiresAt: Date.now() + 86400000 * 7 })); } catch { /* ignore */ }
}

function clearSession() {
  try { localStorage.removeItem(SESSION_KEY); } catch { /* ignore */ }
}

function loadSession(): StockWarUser | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const { user, expiresAt } = JSON.parse(raw);
    if (Date.now() > expiresAt) { clearSession(); return null; }
    return user;
  } catch { return null; }
}

import { useConfigStore } from './configStore';

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  checkSession: () => {
    const user = loadSession();
    if (user) {
      set({ user, isAuthenticated: true });
      // Load any saved API keys into the runtime config
      try {
        const cfg = useConfigStore.getState();
        if (user.savedApiKeys) {
          type ApiKeyName = keyof ReturnType<typeof useConfigStore.getState>['apiKeys'];
          (Object.entries(user.savedApiKeys) as Array<[ApiKeyName, string]>).forEach(([k, v]) => {
            if (v) cfg.setApiKey(k, v);
          });
        }
      } catch (e) { /* ignore */ }
      return true;
    }
    return false;
  },

  login: async (identifier, password) => {
    set({ isLoading: true, error: null });
    if (import.meta.env.DEV && import.meta.env.VITE_DEV_ALLOW_FALLBACKS === '1') {
      await new Promise(r => setTimeout(r, 800)); // simulate network (dev-only)
    }
    const users = getUsers();
    const match = users.find(
      u => (u.email === identifier || u.username === identifier || u.callsign === identifier)
        && u.passwordHash === btoa(password)
    );
    if (!match) {
      set({ isLoading: false, error: 'Invalid credentials. Access denied.' });
      return false;
    }
    const { passwordHash: _, ...user } = match;
    const updated = { ...user, lastLogin: new Date().toISOString() };
    saveSession(updated);
    saveUsers(users.map(u => u.id === updated.id ? { ...u, lastLogin: updated.lastLogin } : u));
    set({ user: updated, isAuthenticated: true, isLoading: false, error: null });
    // Apply saved API keys (if any)
    try {
      const cfg = useConfigStore.getState();
      const saved = (match as any).savedApiKeys || {};
      type ApiKeyName = keyof ReturnType<typeof useConfigStore.getState>['apiKeys'];
      (Object.entries(saved) as Array<[ApiKeyName, string]>).forEach(([k, v]) => { if (v) cfg.setApiKey(k, v); });
    } catch (e) { /* ignore */ }
    return true;
  },

  register: async (email, username, callsign, password) => {
    set({ isLoading: true, error: null });
    if (import.meta.env.DEV && import.meta.env.VITE_DEV_ALLOW_FALLBACKS === '1') {
      await new Promise(r => setTimeout(r, 1000));
    }
    const users = getUsers();
    if (users.find(u => u.email === email || u.username === username)) {
      set({ isLoading: false, error: 'Username or email already registered.' });
      return false;
    }
    const newUser: StockWarUser & { passwordHash: string } = {
      id: `usr-${Date.now()}`,
      email,
      username,
      callsign: callsign.toUpperCase(),
      role: 'ANALYST',
      tier: 'PRO',
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
      savedApiKeys: {},
      passwordHash: btoa(password),
    };
    const { passwordHash: _, ...user } = newUser;
    saveUsers([...users, newUser]);
    saveSession(user);
    set({ user, isAuthenticated: true, isLoading: false, error: null });
    return true;
  },

  logout: () => {
    clearSession();
    set({ user: null, isAuthenticated: false, error: null });
  },

  setTier: (tier) => {
    set(state => {
      if (!state.user) return state;
      const updated = { ...state.user, tier };
      try {
        const raw = localStorage.getItem(SESSION_KEY);
        if (raw) {
          const session = JSON.parse(raw);
          localStorage.setItem(SESSION_KEY, JSON.stringify({ ...session, user: updated }));
        }
      } catch { /* ignore */ }
      return { user: updated };
    });
  },

  saveApiKeys: (keys) => {
    set(state => {
      if (!state.user) return state;
      const updatedUser = { ...state.user, savedApiKeys: { ...(state.user.savedApiKeys || {}), ...keys } };
      try {
        const users = getUsers();
        const next = users.map(u => u.id === updatedUser.id ? { ...u, savedApiKeys: updatedUser.savedApiKeys } : u);
        saveUsers(next);
        // update session
        try {
          const raw = localStorage.getItem(SESSION_KEY);
          if (raw) {
            const session = JSON.parse(raw);
            localStorage.setItem(SESSION_KEY, JSON.stringify({ ...session, user: updatedUser }));
          }
        } catch { /* ignore */ }
      } catch { /* ignore */ }
      return { user: updatedUser };
    });
  },

  clearError: () => set({ error: null }),
}));
