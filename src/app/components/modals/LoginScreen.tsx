import { useState, useEffect } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { Eye, EyeOff, Shield, AlertTriangle, User, Lock, Mail, Radio } from 'lucide-react';

interface LoginScreenProps {
  onAuthenticated: () => void;
}

const BOOT_LINES = [
  '▶ STOCKWAR TERMINAL v3.0.0 — SECURE GATEWAY',
  '░░ Initializing cryptographic handshake...',
  '░░ Validating security certificates [AES-256]...',
  '░░ Establishing secure connection [TLS 1.3]...',
  '░░ Loading authentication modules...',
  '► Authentication gateway ready',
];

const ACCENT = '#00ff88';
const ACCENT2 = '#00ccff';
const RED = '#ff3355';
const INDIA_ORANGE = '#FF9933';

export function LoginScreen({ onAuthenticated }: LoginScreenProps) {
  const [mode, setMode] = useState<'LOGIN' | 'REGISTER'>('LOGIN');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [callsign, setCallsign] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [bootLines, setBootLines] = useState<string[]>([]);
  const [bootDone, setBootDone] = useState(false);
  const [scanPos, setScanPos] = useState(0);
  const { login, register, isLoading, error, clearError } = useAuthStore();

  // Boot animation
  useEffect(() => {
    let idx = 0;
    const add = () => {
      if (idx < BOOT_LINES.length) {
        setBootLines(prev => [...prev, BOOT_LINES[idx]]);
        idx++;
        setTimeout(add, idx < BOOT_LINES.length - 1 ? 80 : 200);
      } else {
        setTimeout(() => setBootDone(true), 300);
      }
    };
    setTimeout(add, 100);
  }, []);

  // Scan line animation
  useEffect(() => {
    const t = setInterval(() => setScanPos(p => (p + 1) % 100), 30);
    return () => clearInterval(t);
  }, []);

  const handleLogin = async () => {
    if (!identifier || !password) return;
    const ok = await login(identifier, password);
    if (ok) onAuthenticated();
  };

  const handleRegister = async () => {
    if (!email || !username || !callsign || !password) return;
    const ok = await register(email, username, callsign, password);
    if (ok) onAuthenticated();
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') mode === 'LOGIN' ? handleLogin() : handleRegister();
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    background: '#06060d',
    border: `1px solid ${ACCENT2}33`,
    borderRadius: 0,
    color: '#e8e8e8',
    fontFamily: 'JetBrains Mono, monospace',
    fontSize: 12,
    padding: '10px 36px 10px 38px',
    outline: 'none',
    letterSpacing: 0.5,
    boxSizing: 'border-box',
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 99999,
      background: '#06060d',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'JetBrains Mono, monospace',
      overflow: 'hidden',
    }}>
      {/* Grid background */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `
          linear-gradient(rgba(0,255,136,0.03) 1px, transparent 1px),
          linear-gradient(90deg, rgba(0,255,136,0.03) 1px, transparent 1px)
        `,
        backgroundSize: '40px 40px',
        pointerEvents: 'none',
      }} />

      {/* Scan line */}
      <div style={{
        position: 'absolute', left: 0, right: 0,
        top: `${scanPos}%`, height: 2,
        background: 'linear-gradient(90deg, transparent, rgba(0,255,136,0.08), transparent)',
        pointerEvents: 'none',
        transition: 'top 0.03s linear',
      }} />

      {/* Corner decorations */}
      {[
        { top: 16, left: 16, borderTop: `2px solid ${ACCENT}`, borderLeft: `2px solid ${ACCENT}` },
        { top: 16, right: 16, borderTop: `2px solid ${ACCENT}`, borderRight: `2px solid ${ACCENT}` },
        { bottom: 16, left: 16, borderBottom: `2px solid ${ACCENT}`, borderLeft: `2px solid ${ACCENT}` },
        { bottom: 16, right: 16, borderBottom: `2px solid ${ACCENT}`, borderRight: `2px solid ${ACCENT}` },
      ].map((s, i) => (
        <div key={i} style={{ position: 'absolute', width: 32, height: 32, ...s }} />
      ))}

      {/* Status bar */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0,
        background: '#0a0a12', borderBottom: `1px solid ${ACCENT}22`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '4px 16px', fontSize: 8, color: '#333',
      }}>
        <span style={{ color: ACCENT2, letterSpacing: 2 }}>● SECURE MODE ACTIVE</span>
        <span>STOCKWAR TERMINAL — CLASSIFIED SYSTEM — AUTHORIZED USERS ONLY</span>
        <span style={{ color: ACCENT }}>{new Date().toUTCString().slice(0, 25)} UTC</span>
      </div>

      <div style={{
        width: '100%', maxWidth: 520,
        display: 'flex', flexDirection: 'column', gap: 0,
        position: 'relative', zIndex: 1,
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{
            display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 4,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
              <div style={{ width: 40, height: 40, border: `2px solid ${ACCENT}`, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0a12' }}>
                <Shield size={22} color={ACCENT} />
              </div>
              <div>
                <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: 6, color: '#e8e8e8' }}>
                  <span style={{ color: ACCENT }}>STOCK</span>WAR
                </div>
                <div style={{ fontSize: 8, letterSpacing: 4, color: '#555', marginTop: 2 }}>
                  TERMINAL · PROFESSIONAL INTELLIGENCE SYSTEM
                </div>
              </div>
            </div>
            <div style={{ height: 1, background: `linear-gradient(90deg, transparent, ${ACCENT}88, transparent)`, width: 300 }} />
            <div style={{ display: 'flex', gap: 16, marginTop: 6, fontSize: 7, color: '#444', letterSpacing: 1 }}>
              <span>🇮🇳 INDIA</span>
              <span>·</span>
              <span>💹 MARKETS</span>
              <span>·</span>
              <span>🌐 WORLD</span>
              <span>·</span>
              <span>⚡ REAL-TIME</span>
            </div>
          </div>
        </div>

        {/* Boot console */}
        {!bootDone && (
          <div style={{
            background: '#080810', border: `1px solid ${ACCENT}22`,
            padding: '12px 16px', marginBottom: 16,
            maxHeight: 140, overflow: 'hidden',
          }}>
            {bootLines.map((line, i) => (
              <div key={i} style={{
                fontSize: 9, marginBottom: 3, letterSpacing: 0.5,
                color: line?.startsWith('▶') ? ACCENT : line?.startsWith('►') ? ACCENT2 : '#3a3a5a',
              }}>{line}</div>
            ))}
            {!bootDone && <span style={{ color: ACCENT2 }}>▌</span>}
          </div>
        )}

        {/* Login/Register Card */}
        {bootDone && (
          <div style={{
            background: '#0a0a12',
            border: `1px solid ${ACCENT}33`,
            overflow: 'hidden',
            boxShadow: `0 0 40px ${ACCENT}08, 0 0 80px ${ACCENT2}04`,
          }}>
            {/* Card Header */}
            <div style={{
              background: '#0f0f1a',
              borderBottom: `1px solid ${ACCENT}22`,
              display: 'flex',
            }}>
              {(['LOGIN', 'REGISTER'] as const).map(m => (
                <button
                  key={m}
                  onClick={() => { setMode(m); clearError(); }}
                  style={{
                    flex: 1, padding: '10px 0',
                    background: mode === m ? `${ACCENT}10` : 'transparent',
                    border: 'none',
                    borderBottom: mode === m ? `2px solid ${ACCENT}` : '2px solid transparent',
                    color: mode === m ? ACCENT : '#555',
                    fontSize: 10, fontFamily: 'JetBrains Mono', letterSpacing: 2,
                    cursor: 'pointer', transition: 'all 0.2s',
                  }}
                >
                  {m === 'LOGIN' ? '▶ AUTHENTICATE' : '+ REGISTER ACCESS'}
                </button>
              ))}
            </div>

            <div style={{ padding: 24 }}>
              {/* Error */}
              {error && (
                <div style={{
                  background: `${RED}10`, border: `1px solid ${RED}44`,
                  padding: '8px 12px', marginBottom: 16,
                  display: 'flex', alignItems: 'center', gap: 8,
                  fontSize: 10, color: RED,
                }}>
                  <AlertTriangle size={12} />
                  {error}
                </div>
              )}

              {/* No demo credentials shown in production builds */}

              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {mode === 'LOGIN' ? (
                  <>
                    <InputField
                      label="USERNAME / EMAIL / CALLSIGN"
                      icon={<User size={13} color={ACCENT2} />}
                      value={identifier}
                      onChange={setIdentifier}
                      placeholder="e.g. analyst or ALPHA-1"
                      autoFocus={bootDone}
                      onKeyDown={handleKey}
                      inputStyle={inputStyle}
                    />
                    <InputField
                      label="AUTHORIZATION CODE"
                      icon={<Lock size={13} color={ACCENT2} />}
                      value={password}
                      onChange={setPassword}
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      onKeyDown={handleKey}
                      inputStyle={inputStyle}
                      right={
                        <button onClick={() => setShowPassword(v => !v)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#555', padding: 0, display: 'flex' }}>
                          {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                      }
                    />
                  </>
                ) : (
                  <>
                    <InputField
                      label="EMAIL ADDRESS"
                      icon={<Mail size={13} color={ACCENT2} />}
                      value={email}
                      onChange={setEmail}
                      placeholder="analyst@domain.com"
                      onKeyDown={handleKey}
                      inputStyle={inputStyle}
                    />
                    <InputField
                      label="USERNAME"
                      icon={<User size={13} color={ACCENT2} />}
                      value={username}
                      onChange={setUsername}
                      placeholder="your_username"
                      onKeyDown={handleKey}
                      inputStyle={inputStyle}
                    />
                    <InputField
                      label="CALLSIGN / OPERATOR TAG"
                      icon={<Radio size={13} color={INDIA_ORANGE} />}
                      value={callsign}
                      onChange={setCallsign}
                      placeholder="e.g. BRAVO-7"
                      onKeyDown={handleKey}
                      inputStyle={inputStyle}
                    />
                    <InputField
                      label="AUTHORIZATION CODE"
                      icon={<Lock size={13} color={ACCENT2} />}
                      value={password}
                      onChange={setPassword}
                      type={showPassword ? 'text' : 'password'}
                      placeholder="min. 6 characters"
                      onKeyDown={handleKey}
                      inputStyle={inputStyle}
                      right={
                        <button onClick={() => setShowPassword(v => !v)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#555', padding: 0, display: 'flex' }}>
                          {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                      }
                    />
                  </>
                )}

                {/* Submit Button */}
                <button
                  onClick={mode === 'LOGIN' ? handleLogin : handleRegister}
                  disabled={isLoading}
                  style={{
                    marginTop: 8,
                    background: isLoading ? '#0f0f1a' : `${ACCENT}15`,
                    border: `1px solid ${isLoading ? '#333' : ACCENT}`,
                    color: isLoading ? '#555' : ACCENT,
                    padding: '12px 0',
                    fontFamily: 'JetBrains Mono', fontSize: 11, letterSpacing: 3,
                    cursor: isLoading ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  }}
                >
                  {isLoading ? (
                    <>
                      <div style={{ width: 10, height: 10, border: `1px solid ${ACCENT}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                      AUTHENTICATING...
                    </>
                  ) : (
                    <>
                      <Shield size={12} />
                      {mode === 'LOGIN' ? 'AUTHENTICATE & ENTER TERMINAL' : 'REQUEST ACCESS CLEARANCE'}
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Footer */}
            <div style={{
              background: '#080810', borderTop: `1px solid ${ACCENT}11`,
              padding: '8px 24px',
              display: 'flex', justifyContent: 'space-between',
              fontSize: 7, color: '#2a2a3a', letterSpacing: 1,
            }}>
              <span>CLASSIFIED SYSTEM — AUTHORIZED ACCESS ONLY</span>
              <span style={{ color: ACCENT2 }}>AES-256 · TLS 1.3 ENCRYPTED</span>
            </div>
          </div>
        )}

        {/* Bottom status */}
        <div style={{ textAlign: 'center', marginTop: 16, fontSize: 8, color: '#222', letterSpacing: 1 }}>
          STOCKWAR TERMINAL v3.0.0 · PHASE 3 · ALL RIGHTS RESERVED
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

// Reusable input field
interface InputFieldProps {
  label: string;
  icon: React.ReactNode;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  inputStyle: React.CSSProperties;
  right?: React.ReactNode;
  autoFocus?: boolean;
}

function InputField({ label, icon, value, onChange, placeholder, type = 'text', onKeyDown, inputStyle, right, autoFocus }: InputFieldProps) {
  return (
    <div>
      <div style={{ fontSize: 8, color: '#555', letterSpacing: 2, marginBottom: 5 }}>{label}</div>
      <div style={{ position: 'relative' }}>
        <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', display: 'flex', zIndex: 1 }}>
          {icon}
        </div>
        <input
          type={type}
          value={value}
          onChange={e => onChange(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          style={inputStyle}
          autoComplete="off"
          autoFocus={autoFocus}
        />
        {right && (
          <div style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', display: 'flex' }}>
            {right}
          </div>
        )}
      </div>
    </div>
  );
}