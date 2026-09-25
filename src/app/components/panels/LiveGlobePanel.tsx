import { useEffect, useRef, useState } from 'react';

// Seeded RNG for deterministic land dots
function seededRand(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = Math.imul(s ^ (s >>> 17), 0xac4d28d9) >>> 0;
    s = Math.imul(s ^ (s >>> 23), 0xb6a3b5c7) >>> 0;
    return (s >>> 0) / 4294967296;
  };
}

// Generate land dot cloud — deterministic, ~370 points
const LAND_REGIONS: [number, number, number, number, number][] = [
  [25, 72, -168, -52, 60],    // North America
  [8, 25, -120, -77, 20],     // Mexico / Central America
  [-58, 12, -82, -34, 42],    // South America
  [36, 72, -12, 42, 32],      // Europe
  [-36, 38, -18, 52, 48],     // Africa
  [10, 80, 26, 90, 52],       // West + Central Asia
  [10, 76, 90, 180, 58],      // East Asia + Russia Far East
  [-10, 10, 95, 150, 20],     // SE Asia islands
  [-44, -10, 113, 155, 24],   // Australia
  [60, 83, -60, -17, 12],     // Greenland
  [-80, -62, -180, 180, 14],  // Antarctica
];

function buildLandDots(): Array<[number, number]> {
  const rng = seededRand(7331);
  const pts: Array<[number, number]> = [];
  for (const [la0, la1, lo0, lo1, n] of LAND_REGIONS) {
    for (let i = 0; i < n; i++) {
      pts.push([la0 + rng() * (la1 - la0), lo0 + rng() * (lo1 - lo0)]);
    }
  }
  return pts;
}
const LAND_DOTS = buildLandDots();

// Key hotspots: [lat, lon, type, label]
const HOTSPOTS: Array<[number, number, 'conflict' | 'market' | 'india', string]> = [
  // Conflicts
  [32, 35, 'conflict', 'Israel-Gaza'],
  [50, 34, 'conflict', 'Ukraine'],
  [15, 44, 'conflict', 'Yemen'],
  [13, 22, 'conflict', 'Sudan'],
  [33, 65, 'conflict', 'Afghanistan'],
  [5, 30, 'conflict', 'South Sudan'],
  [-2, 30, 'conflict', 'DRC'],
  // Markets
  [40.7, -74, 'market', 'NYSE/NASDAQ'],
  [51.5, -0.1, 'market', 'London'],
  [48.9, 2.3, 'market', 'Paris'],
  [35.7, 139.7, 'market', 'Tokyo'],
  [22.3, 114.2, 'market', 'Hong Kong'],
  [1.3, 103.8, 'market', 'Singapore'],
  // India
  [28.6, 77.2, 'india', 'New Delhi'],
  [19.1, 72.9, 'india', 'Mumbai NSE/BSE'],
];

interface DrawConfig {
  rotation: number;
  pulse: number;
  indiaHighlight: boolean;
}

function drawGlobe(canvas: HTMLCanvasElement, cfg: DrawConfig) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const W = canvas.width, H = canvas.height;
  const cx = W / 2, cy = H / 2;
  const r = Math.min(cx, cy) - 6;
  const rotRad = cfg.rotation * Math.PI / 180;

  ctx.clearRect(0, 0, W, H);

  // Atmosphere glow
  const atm = ctx.createRadialGradient(cx, cy, r * 0.92, cx, cy, r * 1.18);
  atm.addColorStop(0, 'rgba(0,100,200,0.25)');
  atm.addColorStop(0.6, 'rgba(0,100,200,0.06)');
  atm.addColorStop(1, 'rgba(0,100,200,0)');
  ctx.beginPath(); ctx.arc(cx, cy, r * 1.18, 0, Math.PI * 2); ctx.fillStyle = atm; ctx.fill();

  // Save & clip to globe sphere
  ctx.save();
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.clip();

  // Ocean gradient
  const ocean = ctx.createRadialGradient(cx - r * 0.28, cy - r * 0.28, 0, cx, cy, r);
  ocean.addColorStop(0, '#0a1832');
  ocean.addColorStop(0.6, '#06101e');
  ocean.addColorStop(1, '#040c18');
  ctx.fillStyle = ocean;
  ctx.fillRect(cx - r, cy - r, r * 2, r * 2);

  // Grid lines
  ctx.strokeStyle = 'rgba(0,100,200,0.12)'; ctx.lineWidth = 0.5;
  for (let lat = -80; lat <= 80; lat += 20) {
    ctx.beginPath();
    const phi = lat * Math.PI / 180;
    for (let lo = -180; lo <= 180; lo += 2) {
      const lam = (lo * Math.PI / 180) + rotRad;
      const sx = cx + r * Math.cos(phi) * Math.sin(lam);
      const sy = cy - r * Math.sin(phi);
      const vis = Math.cos(phi) * Math.cos(lam) > 0;
      if (lo === -180 || !vis) ctx.moveTo(sx, sy); else ctx.lineTo(sx, sy);
    }
    ctx.stroke();
  }
  for (let lo = 0; lo < 360; lo += 30) {
    ctx.beginPath();
    for (let lat = -90; lat <= 90; lat += 2) {
      const phi = lat * Math.PI / 180;
      const lam = (lo * Math.PI / 180) + rotRad;
      const vis = Math.cos(phi) * Math.cos(lam) > 0;
      const sx = cx + r * Math.cos(phi) * Math.sin(lam);
      const sy = cy - r * Math.sin(phi);
      if (lat === -90 || !vis) ctx.moveTo(sx, sy); else ctx.lineTo(sx, sy);
    }
    ctx.stroke();
  }

  // Land dots
  for (const [lat, lon] of LAND_DOTS) {
    const phi = lat * Math.PI / 180;
    const lam = (lon * Math.PI / 180) + rotRad;
    const vis = Math.cos(phi) * Math.cos(lam);
    if (vis <= 0.06) continue;
    const sx = cx + r * Math.cos(phi) * Math.sin(lam);
    const sy = cy - r * Math.sin(phi);
    const brightness = 0.4 + vis * 0.6;
    ctx.fillStyle = `rgba(${Math.round(20 + brightness * 30)}, ${Math.round(80 + brightness * 80)}, ${Math.round(30 + brightness * 40)}, ${0.7 + vis * 0.3})`;
    const dotR = 1.4 + vis * 0.7;
    ctx.beginPath(); ctx.arc(sx, sy, dotR, 0, Math.PI * 2); ctx.fill();
  }

  // India highlight when in India context
  if (cfg.indiaHighlight) {
    // Draw orange glow over India subcontinent
    const indPhi = 20 * Math.PI / 180;
    const indLam = (80 * Math.PI / 180) + rotRad;
    const indVis = Math.cos(indPhi) * Math.cos(indLam);
    if (indVis > 0) {
      const indX = cx + r * Math.cos(indPhi) * Math.sin(indLam);
      const indY = cy - r * Math.sin(indPhi);
      const grad = ctx.createRadialGradient(indX, indY, 0, indX, indY, r * 0.3);
      grad.addColorStop(0, 'rgba(255,153,51,0.2)');
      grad.addColorStop(1, 'rgba(255,153,51,0)');
      ctx.fillStyle = grad;
      ctx.beginPath(); ctx.arc(indX, indY, r * 0.3, 0, Math.PI * 2); ctx.fill();
    }
  }

  ctx.restore();

  // Globe edge
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(0,150,255,0.3)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Highlight (specular)
  const spec = ctx.createRadialGradient(cx - r * 0.35, cy - r * 0.35, 0, cx - r * 0.35, cy - r * 0.35, r * 0.5);
  spec.addColorStop(0, 'rgba(255,255,255,0.06)');
  spec.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = spec; ctx.fill();

  // Hotspots
  for (const [lat, lon, type, label] of HOTSPOTS) {
    const phi = lat * Math.PI / 180;
    const lam = (lon * Math.PI / 180) + rotRad;
    const vis = Math.cos(phi) * Math.cos(lam);
    if (vis < 0.1) continue;
    const sx = cx + r * Math.cos(phi) * Math.sin(lam);
    const sy = cy - r * Math.sin(phi);

    const pulseFactor = 0.5 + 0.5 * Math.sin(cfg.pulse + lon * 0.1);
    const dotSize = type === 'india' ? 4 : type === 'conflict' ? 3.5 : 3;
    const color = type === 'india' ? '#FF9933' : type === 'conflict' ? '#ff3355' : '#00ccff';

    // Pulse ring
    ctx.beginPath();
    ctx.arc(sx, sy, dotSize + 4 * pulseFactor, 0, Math.PI * 2);
    ctx.strokeStyle = `${color}${Math.round((0.4 - 0.4 * pulseFactor) * 255).toString(16).padStart(2, '0')}`;
    ctx.lineWidth = 1;
    ctx.stroke();

    // Dot
    ctx.beginPath(); ctx.arc(sx, sy, dotSize, 0, Math.PI * 2);
    ctx.fillStyle = color; ctx.fill();
  }
}

interface LiveGlobePanelProps {
  indiaContext?: boolean;
}

export function LiveGlobePanel({ indiaContext = false }: LiveGlobePanelProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rotRef = useRef(0);
  const pulseRef = useRef(0);
  const animRef = useRef<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState(200);
  const [hovered, setHovered] = useState<string | null>(null);
  const [autoRotate, setAutoRotate] = useState(true);
  const [rotation, setRotation] = useState(indiaContext ? -80 : 0); // Center on India if India context
  const dragging = useRef(false);
  const lastX = useRef(0);

  useEffect(() => {
    const ro = new ResizeObserver(([entry]) => {
      const w = entry.contentRect.width;
      const h = entry.contentRect.height;
      setSize(Math.min(w, h));
    });
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = size;
    canvas.height = size;
  }, [size]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const animate = () => {
      if (autoRotate) rotRef.current = (rotRef.current + 0.12) % 360;
      pulseRef.current += 0.05;
      drawGlobe(canvas, { rotation: rotRef.current, pulse: pulseRef.current, indiaHighlight: indiaContext });
      animRef.current = requestAnimationFrame(animate);
    };
    animRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animRef.current);
  }, [autoRotate, indiaContext, size]);

  const handleMouseDown = (e: React.MouseEvent) => {
    dragging.current = true;
    lastX.current = e.clientX;
    setAutoRotate(false);
  };
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragging.current) return;
    rotRef.current = (rotRef.current + (e.clientX - lastX.current) * 0.4) % 360;
    lastX.current = e.clientX;
  };
  const handleMouseUp = () => { dragging.current = false; };

  const conflictCount = HOTSPOTS.filter(h => h[2] === 'conflict').length;
  const marketCount = HOTSPOTS.filter(h => h[2] === 'market').length;

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', fontFamily: 'JetBrains Mono, monospace', background: '#080c14' }}>
      {/* Controls */}
      <div style={{ padding: '4px 8px', borderBottom: '1px solid #1a1a2e', display: 'flex', alignItems: 'center', gap: 8, fontSize: 8 }}>
        <span style={{ color: '#00ccff' }}>🌐 LIVE GLOBE</span>
        <div style={{ display: 'flex', gap: 8, marginLeft: 'auto', alignItems: 'center' }}>
          <span style={{ color: '#ff3355' }}>● {conflictCount} CONFLICTS</span>
          <span style={{ color: '#00ccff' }}>● {marketCount} MARKETS</span>
          {indiaContext && <span style={{ color: '#FF9933' }}>🇮🇳 INDIA</span>}
          <button
            onClick={() => setAutoRotate(v => !v)}
            style={{ background: autoRotate ? 'rgba(0,255,136,0.1)' : '#1a1a2e', border: `1px solid ${autoRotate ? '#00ff8833' : '#333'}`, color: autoRotate ? '#00ff88' : '#666', padding: '1px 6px', fontFamily: 'JetBrains Mono', fontSize: 7, cursor: 'pointer', letterSpacing: 1 }}
          >
            {autoRotate ? '⏸ PAUSE' : '▶ SPIN'}
          </button>
        </div>
      </div>

      {/* Globe */}
      <div
        ref={containerRef}
        style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 8, cursor: dragging.current ? 'grabbing' : 'grab' }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <canvas
          ref={canvasRef}
          width={size}
          height={size}
          style={{ maxWidth: '100%', maxHeight: '100%', display: 'block' }}
        />
      </div>

      {/* Legend */}
      <div style={{ padding: '4px 8px', borderTop: '1px solid #1a1a2e', display: 'flex', gap: 12, fontSize: 7, color: '#444', alignItems: 'center' }}>
        <span style={{ color: '#ff3355' }}>■ Conflict Zone</span>
        <span style={{ color: '#00ccff' }}>■ Market Center</span>
        <span style={{ color: '#FF9933' }}>■ India</span>
        <span style={{ marginLeft: 'auto', color: '#333' }}>DRAG TO ROTATE</span>
      </div>
    </div>
  );
}
