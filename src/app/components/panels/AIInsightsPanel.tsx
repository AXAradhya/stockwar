import { Bot } from 'lucide-react';

// AIInsightsPanel — powered by OpenRouter AI via AIChatModal
// Requires OpenRouter API key in Settings → API Keys
// Use Ctrl+Shift+A or the AI chat button to generate AI-powered market insights

export function AIInsightsPanel() {
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', fontFamily: 'JetBrains Mono, monospace' }}>
      {/* Header */}
      <div style={{ padding: '4px 8px', background: 'rgba(0,204,255,0.05)', borderBottom: '1px solid #1a1a2e', display: 'flex', alignItems: 'center', gap: 6 }}>
        <Bot size={10} color="#00ccff" />
        <span style={{ fontSize: 8, color: '#00ccff', letterSpacing: 1 }}>AI/ML INTELLIGENCE FEED</span>
        <span style={{ marginLeft: 'auto', fontSize: 7, color: '#444' }}>OpenRouter Powered</span>
      </div>

      {/* Prompt to use AI chat */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, textAlign: 'center', gap: 12 }}>
        <Bot size={32} color="#00ccff44" />
        <div style={{ fontSize: 10, color: '#444', lineHeight: 1.6 }}>
          AI insights are generated on-demand.<br />
          Configure your OpenRouter key in<br />
          <span style={{ color: '#00ccff' }}>Settings → API Keys</span>
        </div>
        <div style={{ fontSize: 8, color: '#333', marginTop: 4 }}>
          Press <kbd style={{ background: '#1a1a2e', border: '1px solid #2a2a3e', padding: '1px 6px', color: '#00ccff', fontSize: 8 }}>Ctrl+Shift+A</kbd> to open AI Analyst
        </div>
        <div style={{ fontSize: 7, color: '#333', marginTop: 8 }}>
          Use the 3-dots menu → "AI: Analyze Panel" on any panel<br />to get context-aware intelligence for that panel's data.
        </div>
      </div>

      <div style={{ borderTop: '1px solid #1a1a2e', padding: '3px 8px', display: 'flex', gap: 8, fontSize: 7, color: '#333' }}>
        <span>PROVIDER: OpenRouter (Claude / Gemini / Llama / DeepSeek)</span>
      </div>
    </div>
  );
}
