/**
 * apiKeyRotation.ts — Multi-key rotation and task routing
 * Manages OpenRouter/Gemini key pools, rotates on failure, logs to logStore.
 */

import { useConfigStore } from '../stores/configStore';
import { logToTerminal } from '../stores/logStore';

export type ApiTask = 'background' | 'realtime' | 'analysis' | 'fallback';

/**
 * Get the active OpenRouter key for a given task.
 * Falls back through available keys if the primary is rate-limited/failed.
 */
export function getOpenRouterKey(task: ApiTask = 'analysis'): string {
  const state = useConfigStore.getState();
  const keys = state.openRouterKeys ?? [];

  if (keys.length === 0) {
    logToTerminal('WARN', 'API:OpenRouter', 'No OpenRouter keys configured');
    return '';
  }

  // Get routing preference
  const routing = state.taskRouting;
  const preferredKeyId = routing?.[task];
  const preferredKey = preferredKeyId
    ? keys.find((k) => k.id === preferredKeyId && k.status === 'active')
    : null;

  if (preferredKey) return preferredKey.value;

  // Fallback: find first active key
  const activeKey = keys.find((k) => k.status === 'active');
  if (activeKey) {
    logToTerminal(
      'INFO',
      'API:OpenRouter',
      `Task routing fallback for ${task}: using key "${activeKey.label}"`
    );
    return activeKey.value;
  }

  logToTerminal(
    'ERROR',
    'API:OpenRouter',
    'All OpenRouter keys are failed or rate-limited'
  );
  return '';
}

/**
 * Get the Gemini API key.
 */
export function getGeminiKey(): string {
  const state = useConfigStore.getState();
  if (!state.geminiEnabled || !state.geminiKey) {
    return '';
  }
  return state.geminiKey;
}

/**
 * Get the best available AI key (OpenRouter preferred, Gemini fallback).
 */
export function getBestAiKey(task: ApiTask = 'analysis'): {
  provider: 'openrouter' | 'gemini' | 'none';
  key: string;
} {
  const orKey = getOpenRouterKey(task);
  if (orKey) return { provider: 'openrouter', key: orKey };

  const gemKey = getGeminiKey();
  if (gemKey) return { provider: 'gemini', key: gemKey };

  logToTerminal('ERROR', 'API:AI', 'No AI provider key available (OpenRouter or Gemini)');
  return { provider: 'none', key: '' };
}

/**
 * Mark an OpenRouter key as failed/rate-limited.
 * Called when an API request returns 401, 429, etc.
 */
export function markKeyFailed(
  keyId: string,
  reason: 'failed' | 'rate_limited'
) {
  const state = useConfigStore.getState();
  const setStatus = state.setOpenRouterKeyStatus;
  if (setStatus) {
    setStatus(keyId, reason);
    logToTerminal(
      'WARN',
      'API:OpenRouter',
      `Key "${keyId}" marked as ${reason} — will use next available key`
    );
  }
}

/**
 * Mark an OpenRouter key as active (after successful request).
 */
export function markKeyActive(keyId: string) {
  const state = useConfigStore.getState();
  const setStatus = state.setOpenRouterKeyStatus;
  if (setStatus) {
    setStatus(keyId, 'active');
  }
}
