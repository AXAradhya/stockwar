import { useState, useEffect, useRef, useCallback } from 'react';
import { X, Bot, Send, Cpu, Zap, ChevronDown, Copy, Check, RotateCcw } from 'lucide-react';
import { useAlertStore } from '../../stores/alertStore';
import { useUiStore } from '../../stores/uiStore';
import { useConfigStore } from '../../stores/configStore';
import { logToTerminal } from '../../stores/logStore';
import { toast } from 'sonner';
import { projectId, publicAnonKey } from '/utils/supabase/info';
import { postAIChat, postOpenRouterDirect } from '../../services/apiServices';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  model?: string;
  error?: boolean;
}

// Panel-specific context generator — feeds rich context to the AI
const PANEL_CONTEXTS: Record<string, string> = {
  'Markets Overview': `CURRENT MARKET DATA:
- S&P 500 (SPX): 5,487.32 +0.34% | Vol: 3.2B
- NASDAQ 100 (NDX): 19,342.55 -0.22% | Vol: 1.8B  
- DOW JONES (DJI): 40,489.12 +0.31%
- RUSSELL 2000 (RUT): 2,088.44 -0.53%
- VIX: 16.42 +5.66% (Complacency Zone)
- Top Movers: NVDA +4.80%, META +3.91%, TSLA -4.52%`,

  'Fear & Greed Index': `FEAR & GREED INDEX DATA:
- Overall Score: 62 / 100 (GREED)
- Market Momentum: 72 (Greed)
- Stock Price Strength: 58 (Greed)
- Put/Call Ratio: 0.72 (Neutral-Bullish)
- Market Volatility: 48 (Neutral)
- Safe Haven Demand: 44 (Fear)
- Junk Bond Demand: 55 (Neutral)`,

  'US Yield Curve': `YIELD CURVE DATA:
- 1M: 5.28% | 3M: 5.32% | 6M: 5.24%
- 1Y: 5.01% | 2Y: 4.72% | 5Y: 4.44%
- 10Y: 4.38% | 20Y: 4.62% | 30Y: 4.55%
- 10Y-2Y Spread: -0.34% (INVERTED — 22 months)
- 10Y-3M Spread: -0.94% (Deep inversion)
- Curve Shape: Inverted (recession signal historically reliable at 87%)`,

  'Armed Conflict Events': `ARMED CONFLICTS DATA:
- Gaza Strip (Middle East): HIGH severity — Active conflict, humanitarian crisis. Tickers: XOM, CVX, GLD
- Ukraine (Europe): HIGH severity — Interstate war, NATO supply active. Tickers: LMT, RTX, BA, GLD  
- Sudan (Africa): HIGH severity — Civil war, RSF advancing. Tickers: GLD
- Myanmar (Asia): MEDIUM severity — Civil conflict, junta vs resistance. Tickers: limited
- Yemen/Red Sea (Middle East): HIGH severity — Houthi attacks, Suez traffic -41%. Tickers: ZIM, DAC, XOM`,

  'Crypto Prices': `CRYPTO MARKET DATA:
- BTC: $64,822 +1.96% | MCap: $1.28T | Vol: $28.4B
- ETH: $3,488 -1.25% | MCap: $419B
- SOL: $182.44 +5.12% (DeFi rotation signal)
- BNB: $588 +2.16% | XRP: $0.584 -3.11%
- BTC Dominance: 52.4% (Rising — altcoin underperformance)
- ETF Inflows: $800M/day (BlackRock IBIT leading)
- Options: 68% call dominance, $70K strike cluster`,

  'Energy Complex': `ENERGY COMPLEX DATA:
- WTI Crude: $84.44 +3.25% (OPEC+ cut 500k bpd + Houthi disruption)
- Brent Crude: $87.92 +2.88%
- Natural Gas: $2.84 +4.28% (European seasonal demand)
- Gasoline: $2.684 +1.44%
- Heating Oil: $2.812 +2.12%
- Uranium: $88.22 +1.88% (Nuclear renaissance / AI power demand)
- XLE Sector ETF: +2.14% today`,

  'Geopolitical Hubs': `GEOPOLITICAL RISK MATRIX:
- Iran: 92/100 ESCALATING — 84% uranium enrichment (weapons-grade). US/Israel response 60-90 days. Assets: USO, GLD
- Russia: 88/100 STABLE — Kharkiv offensive, NATO supply corridors active. Assets: NG=F, GLD  
- China: 74/100 ESCALATING — 3rd carrier group near Taiwan, PLA exercises. Assets: TSM, AMAT, EWH
- North Korea: 71/100 STABLE — ICBM test. Assets: LMT, RTX, NOC
- Average Risk Score: 81/100 (Highest since Oct 2023)`,

  'Forex & Currencies': `FOREX DATA:
- EUR/USD: 1.0842 -0.13% | GBP/USD: 1.2688 +0.17%
- USD/JPY: 153.84 +0.27% (BOJ intervention risk zone)
- AUD/USD: 0.6458 -0.48% | USD/CHF: 0.9012 -0.09%
- USD/INR: 83.42 +0.22% (RBI managing range)
- USD/CNH: 7.2344 +0.12%
- DXY Index: 104.44 +0.22% (Dollar strength)`,

  'Macro Indicators': `MACRO INDICATORS:
- US GDP (QoQ): +2.8% (vs +3.2% prior) 
- US Unemployment: 3.7% (Improving)
- Fed Funds Rate: 5.25-5.50% (Cut expected June 2026)
- US CPI (YoY): 2.8% (vs 3.2% prior — BEAT, rate cut path clear)
- US PPI (YoY): 1.6%
- M2 Money Supply: $21.2T (Rising)
- 10Y-2Y Spread: -0.34% (Inverted)
- ISM Manufacturing: 50.3 (Expansion territory)`,

  'Options Flow & Dark Pool': `OPTIONS FLOW DATA:
- Total Premium: $48.3M (62% bullish skew)
- Top Flow: NVDA calls $12.4M (sweep, bullish)
- SPY: $8.2M calls vs $3.1M puts (2.6x bull ratio)
- Dark Pool Prints: 3 large blocks detected (QQQ, AAPL, MSFT)
- Put/Call Ratio: 0.72 (Bullish territory)
- Unusual Activity: TSLA puts elevated ($4.2M in 2h)`,

  'Sector Heatmap': `SECTOR PERFORMANCE:
- Technology (XLK): +1.42% | Energy (XLE): +2.14% | Comm Services (XLC): +1.88%
- Financials (XLF): +0.82% | Materials (XLB): +0.66% | Utilities (XLU): +0.22%
- Industrials (XLI): +0.44%
- Healthcare (XLV): -0.38% | Real Estate (XLRE): -0.77%
- Consumer Disc (XLY): -1.22% | Consumer Staples (XLP): -0.11%
- Leadership: Energy + Tech outperforming | Defensives lagging`,

  'Economic Calendar': `ECONOMIC CALENDAR (Today):
- 08:30 CPI (MoM): 0.3% vs 0.4% prior — BEAT
- 10:00 Core PCE: 2.7% vs 2.9% — DOVISH SIGNAL
- 14:00 FOMC Minutes: June cut probability now 78%
- Tomorrow: PPI, Retail Sales, Initial Jobless Claims
- This Week: GDP Advance Q1, Durable Goods Orders`,

  'Gold & Precious Metals': `PRECIOUS METALS DATA:
- Gold (XAUUSD): $2,344.80 +0.53% (Near all-time high $2,432)
- Silver (XAGUSD): $27.44 +1.22%
- Platinum (XPTUSD): $934.20 -0.44%
- Gold/Silver Ratio: 85.4 (Gold relatively expensive)
- Central Bank Buying: Record 1,037 tonnes in 2025
- India/China demand driving physical premium`,

  'Global Bond Yields': `GLOBAL BOND YIELDS:
- US 10Y: 4.38% | US 2Y: 4.72% | US 30Y: 4.55%
- Germany 10Y (Bund): 2.44% | UK 10Y Gilt: 4.22%
- Japan 10Y (JGB): 0.92% (BOJ yield curve control)
- Italy 10Y BTP: 3.88% | France OAT: 3.12%
- EM: Brazil 10Y: 11.44% | India 10Y: 7.12%
- US-Germany spread: 194bps (Dollar strong driver)`,

  'India Markets (NIFTY/BSE)': `INDIA MARKETS DATA:
- NIFTY 50: 22,419.95 +0.44%
- SENSEX: 73,847.15 +0.38%
- Bank Nifty: 48,024.55 +0.62%
- Nifty IT: 36,444.20 +1.12%
- USD/INR: 83.42 (RBI managing 83-84 band)
- India 10Y Yield: 7.12%
- FII flows: +₹2,844 Cr (3-day net inflow)`,

  'BSE / NSE Live': `BSE/NSE LIVE DATA:
- SENSEX: 73,847.15 +0.38% | NIFTY50: 22,419.95 +0.44%
- Top Gainers: RELIANCE +2.1%, HDFC Bank +1.8%, TCS +1.5%
- Top Losers: BAJFINANCE -1.2%, WIPRO -0.8%
- Market Cap: ₹3.89L Cr (NSE)
- Advance/Decline: 1,244 / 788
- Volume Leader: TATAMOTORS ₹844Cr`,
};

// Generate dynamic context based on analyzeTarget
function getPanelContext(target?: string): string {
  if (!target) return '';
  const key = Object.keys(PANEL_CONTEXTS).find(k =>
    target.toLowerCase().includes(k.toLowerCase()) ||
    k.toLowerCase().includes(target.toLowerCase())
  );
  return key ? PANEL_CONTEXTS[key] : `Panel: ${target}\nAnalyze current data and provide market insights.`;
}

const AVAILABLE_MODELS = [
  { id: 'meta-llama/llama-3.3-8b-instruct:free', label: 'Llama 3.3 8B', tier: 'FREE' },
  { id: 'deepseek/deepseek-r1-distill-llama-70b:free', label: 'DeepSeek R1 70B', tier: 'FREE' },
  { id: 'deepseek/deepseek-r1:free', label: 'DeepSeek R1', tier: 'FREE' },
  { id: 'mistralai/mistral-7b-instruct:free', label: 'Mistral 7B', tier: 'FREE' },
  { id: 'google/gemma-3-27b-it:free', label: 'Gemma 3 27B', tier: 'FREE' },
  { id: 'qwen/qwen3-235b-a22b:free', label: 'Qwen3 235B', tier: 'FREE' },
  { id: 'microsoft/phi-4-reasoning:free', label: 'Phi-4 Reasoning', tier: 'FREE' },
  { id: 'meta-llama/llama-4-scout:free', label: 'Llama 4 Scout', tier: 'FREE' },
];

const QUICK_PROMPTS = [
  "What's the biggest market risk right now?",
  'Analyze geopolitical risk to my portfolio',
  'Generate morning market brief',
  'What does the Fed signal mean for bonds?',
  'Is the yield curve inversion dangerous?',
  'Best sectors for current macro regime?',
];

interface AIChatModalProps {
  open: boolean;
  onClose: () => void;
  analyzeTarget?: string;
}

export function AIChatModal({ open, onClose, analyzeTarget }: AIChatModalProps) {
  const { notifications, unreadCount } = useAlertStore();
  const { monitorContext, settings } = useUiStore();

  const makeWelcomeMessage = (): Message => ({
    id: '0',
    role: 'assistant',
    content: `**STOCKWAR ANALYST ONLINE** — OpenRouter Connected\n\nTerminal context loaded:\n• Markets: S&P +0.34% | NASDAQ -0.22% | VIX 16.4\n• Energy: WTI +3.25% | Gold $2,344\n• Conflicts: 5 active zones | Iran risk 92/100\n• Crypto: BTC $64,822 +1.96% | ETF inflows $800M/day\n• Macro: CPI 2.8% | Rate cut probability 78% (June)\n• ${unreadCount} unread alerts | Context: ${monitorContext}\n\nModel: **${AVAILABLE_MODELS.find(m => m.id === settings.aiModel)?.label || settings.aiModel}**\n\nAsk me anything — or right-click any panel → "AI: Analyze This Panel" for deep panel analysis.`,
    timestamp: new Date(),
  });

  const [messages, setMessages] = useState<Message[]>([makeWelcomeMessage()]);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [model, setModel] = useState(settings.aiModel);
  const [copied, setCopied] = useState<string | null>(null);
  const [showModels, setShowModels] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const analyzeHandled = useRef(false);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
      setModel(settings.aiModel);
    } else {
      analyzeHandled.current = false;
    }
  }, [open, settings.aiModel]);

  // Auto-trigger panel analysis
  useEffect(() => {
    if (open && analyzeTarget && !analyzeHandled.current) {
      analyzeHandled.current = true;
      const panelContext = getPanelContext(analyzeTarget);
      const query = `Analyze the **${analyzeTarget}** panel. Give me a detailed, actionable breakdown — what does the current data mean for my positions and risk management?`;
      const userMsg: Message = {
        id: `auto_${Date.now()}`,
        role: 'user',
        content: query,
        timestamp: new Date(),
      };
      setMessages([makeWelcomeMessage(), userMsg]);
      callAI([userMsg], panelContext, query);
    }
  }, [open, analyzeTarget]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const callAI = useCallback(async (
    currentMessages: Message[],
    panelContext?: string,
    _userQuery?: string,
  ) => {
    setIsThinking(true);
    try {
      // Use centralized helper which supports proxy or direct supabase function.
      const data = await postAIChat({
        messages: currentMessages.map(m => ({ role: m.role, content: m.content })),
        model,
        systemPrompt: panelContext,
        apiKey: settings.openrouterApiKey || undefined,
      });

      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'assistant',
        content: data.content,
        timestamp: new Date(),
        model: data.model,
      }]);
    } catch (err) {
      // If Supabase function is unreachable, attempt direct OpenRouter calls using any configured keys (settings or configStore).
      try {
        const cfg = useConfigStore.getState();
        const candidateKeys: string[] = [];
        if (settings.openrouterApiKey) candidateKeys.push(settings.openrouterApiKey);
        if (cfg.openRouterKeys && cfg.openRouterKeys.length) candidateKeys.push(...cfg.openRouterKeys.map(k => k.value));

        if (candidateKeys.length > 0) {
          logToTerminal('WARN', 'AI:Chat', `Supabase AI function failed, attempting direct OpenRouter with ${candidateKeys.length} key(s): ${String(err)}`);
          const systemMessage = panelContext ? `You are STOCKWAR ANALYST. Active Panel Context:\n${panelContext}` : `You are STOCKWAR ANALYST.`;
          const openRouterBodyTemplate = {
            model,
            messages: [
              { role: 'system', content: systemMessage },
              ...currentMessages.map(m => ({ role: m.role, content: m.content })),
            ],
            max_tokens: 1200,
            temperature: 0.7,
          };

          for (const key of candidateKeys) {
            try {
              const systemMessage = panelContext ? `You are STOCKWAR ANALYST. Active Panel Context:\n${panelContext}` : `You are STOCKWAR ANALYST.`;
              const orResp = await postOpenRouterDirect({ messages: [{ role: 'system', content: systemMessage }, ...currentMessages.map(m => ({ role: m.role, content: m.content }))], model, apiKey: key });
              if (orResp && orResp.content) {
                setMessages(prev => [...prev, {
                  id: Date.now().toString(),
                  role: 'assistant',
                  content: orResp.content,
                  timestamp: new Date(),
                  model: orResp.model || model,
                }]);
                return;
              }
            } catch (err2) {
              logToTerminal('WARN', 'AI:OpenRouter', `Direct OpenRouter attempt failed: ${String(err2)}`);
              // try next key
            }
          }

          // All direct attempts failed
          setMessages(prev => [...prev, {
            id: Date.now().toString(),
            role: 'assistant',
            content: `**ERROR:** Could not reach AI backend via server proxy or direct OpenRouter attempts. Check network and OpenRouter API keys in Settings.`,
            timestamp: new Date(),
            error: true,
          }]);
          return;
        }
      } catch (outerErr) {
        // proceed to generic error below
        logToTerminal('ERROR', 'AI:Chat', `Fallback attempt failed: ${String(outerErr)}`);
      }

      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'assistant',
        content: `**CONNECTION ERROR:** Could not reach AI backend. Check your network connection.\n\nDetails: ${err}`,
        timestamp: new Date(),
        error: true,
      }]);
    } finally {
      setIsThinking(false);
    }
  }, [model, settings.openrouterApiKey]);

  if (!open) return null;

  const handleSend = () => {
    if (!input.trim() || isThinking) return;
    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    const panelContext = analyzeTarget ? getPanelContext(analyzeTarget) : undefined;
    callAI(newMessages, panelContext);
  };

  const handleCopy = (content: string, id: string) => {
    navigator.clipboard.writeText(content).then(() => {
      setCopied(id);
      setTimeout(() => setCopied(null), 2000);
    });
  };

  const handleClear = () => {
    setMessages([makeWelcomeMessage()]);
  };

  const formatContent = (content: string) => {
    return content.split('\n').map((line, i) => {
      // Section headers **HEADER**
      if (line.startsWith('**') && line.endsWith('**') && !line.slice(2, -2).includes('**')) {
        return (
          <div key={i} style={{ color: '#00ccff', fontSize: 10, letterSpacing: 1, fontWeight: 700, margin: '6px 0 2px', borderBottom: '1px solid #1a1a2e', paddingBottom: 2 }}>
            {line.replace(/\*\*/g, '')}
          </div>
        );
      }
      // Bullet points
      if (line.startsWith('• ') || line.startsWith('- ')) {
        const text = line.slice(2);
        return (
          <div key={i} style={{ display: 'flex', gap: 6, marginBottom: 2 }}>
            <span style={{ color: '#00ccff', flexShrink: 0, marginTop: 1 }}>•</span>
            <span style={{ fontSize: 10, color: '#ccc', lineHeight: 1.6 }}>
              {renderInline(text)}
            </span>
          </div>
        );
      }
      // Numbered list
      if (line.match(/^\d+\./)) {
        const num = line.split('.')[0];
        const rest = line.split('.').slice(1).join('.');
        return (
          <div key={i} style={{ display: 'flex', gap: 6, marginBottom: 2 }}>
            <span style={{ color: '#00ccff', flexShrink: 0, fontSize: 9 }}>{num}.</span>
            <span style={{ fontSize: 10, color: '#ccc', lineHeight: 1.6 }}>{renderInline(rest)}</span>
          </div>
        );
      }
      // Separator
      if (line === '---' || line === '***') {
        return <div key={i} style={{ height: 1, background: '#1a1a2e', margin: '4px 0' }} />;
      }
      if (line === '') return <div key={i} style={{ height: 4 }} />;
      return (
        <div key={i} style={{ fontSize: 10, color: '#ccc', lineHeight: 1.6, marginBottom: 1 }}>
          {renderInline(line)}
        </div>
      );
    });
  };

  function renderInline(text: string) {
    // Bold: **text**
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, j) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={j} style={{ color: '#e8e8e8' }}>{part.slice(2, -2)}</strong>;
      }
      return <span key={j}>{part}</span>;
    });
  }

  const activeModelLabel = AVAILABLE_MODELS.find(m => m.id === model)?.label || model;

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 10000, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ width: '75%', maxWidth: 960, height: '85vh', background: '#0a0a12', border: '1px solid #1a1a2e', display: 'flex', flexDirection: 'column', fontFamily: 'JetBrains Mono, monospace' }}>

        {/* Header */}
        <div style={{ height: 36, background: '#0d0d18', borderBottom: '1px solid #1a1a2e', display: 'flex', alignItems: 'center', padding: '0 12px', gap: 8, flexShrink: 0 }}>
          <Zap size={11} color="#00ccff" />
          <span style={{ fontSize: 10, color: '#00ccff', letterSpacing: 2, fontWeight: 700 }}>⬡ STOCKWAR ANALYST</span>
          <div style={{ fontSize: 8, color: '#333', border: '1px solid #1a1a2e', padding: '1px 5px' }}>OpenRouter</div>

          {/* Model Selector */}
          <div style={{ position: 'relative', marginLeft: 8 }}>
            <button
              onClick={() => setShowModels(v => !v)}
              style={{ background: '#1a1a2e', border: '1px solid #2a2a3e', padding: '2px 8px', color: '#aaa', cursor: 'pointer', fontFamily: 'JetBrains Mono', fontSize: 8, display: 'flex', alignItems: 'center', gap: 4 }}
            >
              {activeModelLabel} <ChevronDown size={8} />
            </button>
            {showModels && (
              <div style={{ position: 'absolute', top: '100%', left: 0, zIndex: 999, background: '#0d0d18', border: '1px solid #1a1a2e', minWidth: 220, boxShadow: '0 8px 24px rgba(0,0,0,0.9)' }}>
                {AVAILABLE_MODELS.map(m => (
                  <button key={m.id} onClick={() => { setModel(m.id); setShowModels(false); }} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '5px 10px', background: model === m.id ? '#1a1a2e' : 'transparent', color: model === m.id ? '#00ccff' : '#888', border: 'none', cursor: 'pointer', fontFamily: 'JetBrains Mono', fontSize: 9, borderBottom: '1px solid #1a1a2e' }}>
                    <span style={{ color: m.tier === 'FREE' ? '#00ff88' : '#ffaa00', fontSize: 7, marginRight: 6 }}>[{m.tier}]</span>{m.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
            <button onClick={handleClear} title="Clear conversation" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#444', display: 'flex', alignItems: 'center' }}>
              <RotateCcw size={10} />
            </button>
            <span style={{ fontSize: 8, color: '#333' }}>CONTEXT: {monitorContext}</span>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#666680', display: 'flex', alignItems: 'center' }}>
              <X size={12} />
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          {/* Messages Area */}
          <div style={{ flex: 1, overflowY: 'auto', padding: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {messages.map(msg => (
              <div key={msg.id} style={{ display: 'flex', gap: 8, flexDirection: msg.role === 'user' ? 'row-reverse' : 'row' }}>
                {/* Avatar */}
                <div style={{ width: 24, height: 24, flexShrink: 0, background: msg.role === 'assistant' ? (msg.error ? '#ff335522' : '#00ccff22') : '#1a1a2e', border: `1px solid ${msg.role === 'assistant' ? (msg.error ? '#ff3355' : '#00ccff44') : '#333'}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {msg.role === 'assistant' ? <Bot size={12} color={msg.error ? '#ff3355' : '#00ccff'} /> : <span style={{ fontSize: 9, color: '#666' }}>U</span>}
                </div>

                {/* Bubble */}
                <div style={{ maxWidth: '88%', position: 'relative' }}>
                  <div
                    style={{ padding: '8px 12px', background: msg.role === 'assistant' ? (msg.error ? 'rgba(255,51,85,0.05)' : '#0d0d18') : '#1a1a2e', border: `1px solid ${msg.role === 'assistant' ? (msg.error ? '#ff335544' : '#00ccff22') : '#2a2a3e'}`, borderLeft: msg.role === 'assistant' ? `2px solid ${msg.error ? '#ff3355' : '#00ccff'}` : undefined }}
                  >
                    {formatContent(msg.content)}
                    <div style={{ fontSize: 7, color: '#2a2a3e', marginTop: 4, display: 'flex', gap: 8, alignItems: 'center' }}>
                      <span>{msg.timestamp.toLocaleTimeString('en-US', { hour12: false })}</span>
                      {msg.model && <span style={{ color: '#1a1a2e' }}>{msg.model.split('/').pop()}</span>}
                    </div>
                  </div>
                  {msg.role === 'assistant' && !msg.error && (
                    <button onClick={() => handleCopy(msg.content, msg.id)} style={{ position: 'absolute', top: 4, right: 4, background: 'none', border: 'none', cursor: 'pointer', color: '#333', opacity: 0.7 }} title="Copy">
                      {copied === msg.id ? <Check size={9} color="#00ff88" /> : <Copy size={9} />}
                    </button>
                  )}
                </div>
              </div>
            ))}

            {isThinking && (
              <div style={{ display: 'flex', gap: 8 }}>
                <div style={{ width: 24, height: 24, background: '#00ccff22', border: '1px solid #00ccff44', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Bot size={12} color="#00ccff" />
                </div>
                <div style={{ padding: '10px 14px', background: '#0d0d18', border: '1px solid #00ccff22', borderLeft: '2px solid #00ccff', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Cpu size={10} color="#00ccff" />
                  <span style={{ fontSize: 9, color: '#00ccff' }}>Analyzing with {activeModelLabel}...</span>
                  <span style={{ color: '#00ccff', animation: 'blink 1s infinite' }}>▌</span>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Context Sidebar */}
          <div style={{ width: 190, borderLeft: '1px solid #1a1a2e', padding: 8, overflowY: 'auto', background: '#080810', flexShrink: 0 }}>
            {analyzeTarget && (
              <div style={{ padding: '6px 8px', marginBottom: 8, background: 'rgba(0,204,255,0.08)', border: '1px solid #00ccff33' }}>
                <div style={{ fontSize: 7, color: '#00ccff', letterSpacing: 1, marginBottom: 2 }}>⬡ ANALYZING PANEL</div>
                <div style={{ fontSize: 9, color: '#e8e8e8', fontWeight: 600 }}>{analyzeTarget}</div>
              </div>
            )}

            <div style={{ fontSize: 7, color: '#444', letterSpacing: 1, marginBottom: 6 }}>AVAILABLE CONTEXT</div>
            {Object.keys(PANEL_CONTEXTS).slice(0, 10).map(p => (
              <div key={p} style={{ padding: '2px 6px', borderBottom: '1px solid #0f0f18', fontSize: 8, color: analyzeTarget && (p.toLowerCase().includes((analyzeTarget || '').toLowerCase()) || (analyzeTarget || '').toLowerCase().includes(p.toLowerCase())) ? '#00ccff' : '#444', background: analyzeTarget && p.toLowerCase().includes((analyzeTarget || '').toLowerCase()) ? 'rgba(0,204,255,0.05)' : 'transparent', display: 'flex', alignItems: 'center', gap: 4 }}>
                <div style={{ width: 3, height: 3, background: '#00ff88', flexShrink: 0 }} />{p}
              </div>
            ))}

            <div style={{ fontSize: 7, color: '#444', letterSpacing: 1, marginTop: 10, marginBottom: 4 }}>TOKEN USAGE</div>
            <div style={{ width: '100%', height: 3, background: '#1a1a2e', marginBottom: 4 }}>
              <div style={{ width: `${Math.min(100, (messages.length / 20) * 100)}%`, height: '100%', background: '#00ff88', transition: 'width 0.5s' }} />
            </div>
            <div style={{ fontSize: 7, color: '#444' }}>{messages.length} messages in context</div>

            <div style={{ fontSize: 7, color: '#444', letterSpacing: 1, marginTop: 10, marginBottom: 4 }}>ALERTS</div>
            <div style={{ fontSize: 8, color: unreadCount > 0 ? '#ffaa00' : '#444' }}>{unreadCount} unread</div>

            <div style={{ marginTop: 10, padding: '5px', background: '#0d0d18', border: '1px solid #1a1a2e' }}>
              <div style={{ fontSize: 7, color: '#444', marginBottom: 2 }}>CONTEXT</div>
              <div style={{ fontSize: 8, color: '#00ccff' }}>{monitorContext}</div>
            </div>

            {!settings.openrouterApiKey && (
              <div style={{ marginTop: 8, padding: '5px', background: 'rgba(255,51,85,0.05)', border: '1px solid #ff335533' }}>
                <div style={{ fontSize: 7, color: '#ff3355', marginBottom: 2 }}>⚠ NO API KEY</div>
                <div style={{ fontSize: 7, color: '#666' }}>Add OpenRouter key in ⚙ Settings to use paid models</div>
              </div>
            )}
          </div>
        </div>

        {/* Quick Prompts */}
        <div style={{ padding: '5px 10px', borderTop: '1px solid #1a1a2e', display: 'flex', gap: 4, flexWrap: 'wrap', flexShrink: 0 }}>
          {QUICK_PROMPTS.map(p => (
            <button key={p} onClick={() => { setInput(p); }} style={{ padding: '2px 7px', background: '#0d0d18', border: '1px solid #1a1a2e', cursor: 'pointer', fontSize: 8, color: '#555', fontFamily: 'JetBrains Mono' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#e8e8e8')}
              onMouseLeave={e => (e.currentTarget.style.color = '#555')}
            >
              {p}
            </button>
          ))}
        </div>

        {/* Input */}
        <div style={{ padding: '8px 12px', borderTop: '1px solid #1a1a2e', display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
          <span style={{ color: '#00ccff', fontSize: 12 }}>⬡</span>
          <input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
            placeholder="Ask the analyst... (Enter to send)"
            style={{ flex: 1, background: 'transparent', border: 'none', color: '#e8e8e8', fontFamily: 'JetBrains Mono', fontSize: 10, outline: 'none' }}
          />
          <button
            onClick={handleSend}
            disabled={isThinking || !input.trim()}
            style={{ background: input.trim() ? '#00ccff22' : 'transparent', border: '1px solid #00ccff33', cursor: 'pointer', color: '#00ccff', padding: '5px 10px', opacity: isThinking || !input.trim() ? 0.4 : 1, display: 'flex', alignItems: 'center', gap: 4 }}
          >
            <Send size={11} />
          </button>
        </div>
      </div>
    </div>
  );
}