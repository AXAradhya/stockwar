/** 
 * Circuit Breaker utility for per-domain data staleness tracking.
 * States: CLOSED (normal) → OPEN (blocking) → HALF-OPEN (testing)
 */
export type CBState = 'closed' | 'open' | 'half-open';

export interface CircuitBreakerConfig {
  failureThreshold: number;  // failures before OPEN
  cooldownMs: number;        // time before HALF-OPEN
  successThreshold: number;  // successes in HALF-OPEN to close
}

export interface CBStatus {
  state: CBState;
  failures: number;
  lastFailureAt: number | null;
  lastSuccessAt: number | null;
  halfOpenSuccesses: number;
}

const DEFAULT_CONFIG: CircuitBreakerConfig = {
  failureThreshold: 5,
  cooldownMs: 60_000,
  successThreshold: 2,
};

const breakers: Map<string, CBStatus> = new Map();
const configs: Map<string, CircuitBreakerConfig> = new Map();

export function configureBreaker(domain: string, config: Partial<CircuitBreakerConfig> = {}): void {
  configs.set(domain, { ...DEFAULT_CONFIG, ...config });
}

function getStatus(domain: string): CBStatus {
  if (!breakers.has(domain)) {
    breakers.set(domain, {
      state: 'closed',
      failures: 0,
      lastFailureAt: null,
      lastSuccessAt: Date.now(),
      halfOpenSuccesses: 0,
    });
  }
  return breakers.get(domain)!;
}

function getConfig(domain: string): CircuitBreakerConfig {
  return configs.get(domain) || DEFAULT_CONFIG;
}

/** Returns true if the domain is allowed to make a request */
export function canRequest(domain: string): boolean {
  const status = getStatus(domain);
  const config = getConfig(domain);

  if (status.state === 'closed') return true;

  if (status.state === 'open') {
    // Check if cooldown has passed → transition to half-open
    const now = Date.now();
    if (status.lastFailureAt && now - status.lastFailureAt >= config.cooldownMs) {
      status.state = 'half-open';
      status.halfOpenSuccesses = 0;
      return true;
    }
    return false;
  }

  // half-open: allow one test request
  return true;
}

export function recordSuccess(domain: string): void {
  const status = getStatus(domain);
  const config = getConfig(domain);
  status.lastSuccessAt = Date.now();

  if (status.state === 'half-open') {
    status.halfOpenSuccesses += 1;
    if (status.halfOpenSuccesses >= config.successThreshold) {
      status.state = 'closed';
      status.failures = 0;
      status.halfOpenSuccesses = 0;
    }
  } else {
    status.failures = 0;
  }
}

export function recordFailure(domain: string): void {
  const status = getStatus(domain);
  const config = getConfig(domain);
  status.failures += 1;
  status.lastFailureAt = Date.now();

  if (status.failures >= config.failureThreshold || status.state === 'half-open') {
    status.state = 'open';
    status.halfOpenSuccesses = 0;
  }
}

export function getBreakerStatus(domain: string): CBStatus {
  return { ...getStatus(domain) };
}

export function resetBreaker(domain: string): void {
  breakers.delete(domain);
}

/** Human-readable staleness */
export function getStalenessLabel(lastSuccessAt: number | null): string {
  if (!lastSuccessAt) return 'UNKNOWN';
  const secs = Math.floor((Date.now() - lastSuccessAt) / 1000);
  if (secs < 60) return `${secs}s`;
  if (secs < 3600) return `${Math.floor(secs / 60)}m`;
  return `${Math.floor(secs / 3600)}h`;
}
