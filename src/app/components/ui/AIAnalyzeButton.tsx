import { useState } from 'react';
import { Bot, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { projectId, publicAnonKey } from '/utils/supabase/info';
import { useUiStore } from '../../stores/uiStore';
import { postAIChat } from '../../services/apiServices';

interface AIAnalyzeButtonProps {
  panelTitle: string;
  panelData?: string; // Optional raw data context
  compact?: boolean;
}

// Inline AI analysis — shows result directly in panel
export function AIAnalyzeButton({ panelTitle, panelData, compact }: AIAnalyzeButtonProps) {
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const { settings } = useUiStore();

  const handleAnalyze = async () => {
    if (analyzing) return;
    setAnalyzing(true);
    setOpen(true);
    setResult(null);

    const systemPrompt = `You are STOCKWAR ANALYST — elite AI in a military-style trading intelligence terminal. Be concise, formatted (bullets, **bold key points**), and actionable. Max 200 words.`;

    const userMessage = `Analyze the "${panelTitle}" panel data and give me 3-4 bullet-point insights on what the current data signals for traders. Focus on: current state, key risk/opportunity, and one actionable recommendation.\n\n${panelData ? `Data context:\n${panelData}` : ''}`;

    try {
      const data = await postAIChat({ messages: [{ role: 'user', content: userMessage }], model: settings.aiModel || 'meta-llama/llama-3.3-8b-instruct:free', systemPrompt, apiKey: settings.openrouterApiKey });
      setResult(data.content || data);
    } catch (err: any) {
      setResult(`Error: ${String(err)}`);
      toast.error('AI analysis failed — check API key in Settings');
    } finally {
      setAnalyzing(false);
    }
  };

  const formatResult = (text: string) => {
    return text.split('\n').map((line, i) => {
      if (line.startsWith('**') && line.endsWith('**')) {
        return <div key={i} style={{ color: '#00ccff', fontSize: 9, fontWeight: 700, marginBottom: 2 }}>{line.replace(/\*\*/g, '')}</div>;
      }
      if (line.startsWith('• ') || line.startsWith('- ')) {
        return (
          <div key={i} style={{ display: 'flex', gap: 4, marginBottom: 2 }}>
            <span style={{ color: '#00ccff', flexShrink: 0 }}>•</span>
            <span style={{ fontSize: 9, color: '#ccc', lineHeight: 1.5 }}>
              {line.slice(2).replace(/\*\*(.*?)\*\*/g, '$1')}
            </span>
          </div>
        );
      }
      if (line === '') return <div key={i} style={{ height: 3 }} />;
      return <div key={i} style={{ fontSize: 9, color: '#bbb', lineHeight: 1.5 }}>{line.replace(/\*\*(.*?)\*\*/g, '$1')}</div>;
    });
  };

  if (compact) {
    return (
      <button
        onClick={handleAnalyze}
        title={`AI analyze ${panelTitle}`}
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: analyzing ? '#00ccff' : '#333', padding: '2px 4px', display: 'flex', alignItems: 'center' }}
        onMouseEnter={e => (e.currentTarget.style.color = '#00ccff')}
        onMouseLeave={e => (e.currentTarget.style.color = analyzing ? '#00ccff' : '#333')}
      >
        {analyzing ? <Loader2 size={9} style={{ animation: 'spin 1s linear infinite' }} /> : <Bot size={9} />}
      </button>
    );
  }

  return (
    <div style={{ fontFamily: 'JetBrains Mono, monospace' }}>
      {!open ? (
        <button
          onClick={handleAnalyze}
          style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '3px 8px', background: 'rgba(0,204,255,0.08)', border: '1px solid #00ccff22', color: '#00ccff44', cursor: 'pointer', fontFamily: 'JetBrains Mono', fontSize: 8, transition: 'all 0.2s' }}
          onMouseEnter={e => { e.currentTarget.style.color = '#00ccff'; e.currentTarget.style.borderColor = '#00ccff66'; }}
          onMouseLeave={e => { e.currentTarget.style.color = '#00ccff44'; e.currentTarget.style.borderColor = '#00ccff22'; }}
        >
          <Bot size={9} />
          AI ANALYSIS
        </button>
      ) : (
        <div style={{ background: 'rgba(0,204,255,0.04)', border: '1px solid #00ccff22', padding: '6px 8px', margin: '4px 0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Bot size={9} color="#00ccff" />
              <span style={{ fontSize: 8, color: '#00ccff', letterSpacing: 1 }}>AI ANALYSIS — {panelTitle.toUpperCase()}</span>
            </div>
            <button onClick={() => { setOpen(false); setResult(null); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#444', fontSize: 10 }}>×</button>
          </div>
          {analyzing ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 0' }}>
              <Loader2 size={10} color="#00ccff" style={{ animation: 'spin 1s linear infinite' }} />
              <span style={{ fontSize: 9, color: '#00ccff' }}>Analyzing {panelTitle}...</span>
            </div>
          ) : result ? (
            <div style={{ maxHeight: 120, overflowY: 'auto' }}>
              {formatResult(result)}
            </div>
          ) : null}
          {result && !analyzing && (
            <button onClick={handleAnalyze} style={{ marginTop: 4, fontSize: 7, color: '#444', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'JetBrains Mono' }}>↻ refresh</button>
          )}
        </div>
      )}
    </div>
  );
}
