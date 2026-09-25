export function fmtNum(value: any, digits = 2, fallback = '—') {
  const n = Number(value);
  if (!isFinite(n)) return fallback;
  return n.toFixed(digits);
}

export function fmtPct(value: any, digits = 2, fallback = '—') {
  const n = Number(value);
  if (!isFinite(n)) return fallback;
  return (n >= 0 ? '+' : '') + n.toFixed(digits) + '%';
}

export function roundTo(value: any, digits = 2): number | null {
  const n = Number(value);
  if (!isFinite(n)) return null;
  const factor = Math.pow(10, digits);
  return Math.round(n * factor) / factor;
}
