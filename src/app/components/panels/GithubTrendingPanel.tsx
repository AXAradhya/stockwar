import { useState, useEffect } from 'react';
import { fetchGithubTrending } from '../../services/apiServices';
import { Star, TrendingUp, GitFork } from 'lucide-react';
import { fmtNum } from '../../utils/numberFormat';

const LANGUAGE_COLORS: Record<string, string> = {
  Python: '#3572A5',
  TypeScript: '#3178c6',
  'C++': '#f34b7d',
  Rust: '#dea584',
  Go: '#00ADD8',
  JavaScript: '#f1e05a',
  Java: '#b07219',
  Kotlin: '#A97BFF',
  Swift: '#F05138',
  Ruby: '#701516',
  default: '#666680',
};

function fmtStars(n: number): string {
  if (n >= 1000) return `${fmtNum(n / 1000, 1)}k`;
  return String(n);
}

const STOCK_IMPACT: Record<string, string[]> = {
  'microsoft/phi-4': ['MSFT'],
  'deepseek-ai/DeepSeek-V3': ['BABA', 'NVDA'],
  'browser-use/browser-use': ['GOOGL', 'META'],
  'anthropics/claude-code': ['AMZN', 'GOOGL'],
  'mem0ai/mem0': ['NVDA', 'MSFT'],
  'openai/openai-agents-python': ['MSFT', 'NVDA'],
  'ggerganov/whisper.cpp': ['AAPL', 'NVDA'],
};

export function GithubTrendingPanel() {
  const [repos, setRepos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<'today' | 'week'>('today');
  const [filter, setFilter] = useState<string | null>(null);
  const ALLOW_PUBLIC_PROXIES = import.meta.env.VITE_ALLOW_PUBLIC_PROXIES === '1';

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const data = await fetchGithubTrending();
        if (mounted) { setRepos(data); setLoading(false); setError(null); }
      } catch (e: any) {
        if (mounted) { setError(e.message); setLoading(false); }
      }
    };
    load();
    const t = setInterval(load, 1800000); // 30 min refresh
    return () => { mounted = false; clearInterval(t); };
  }, []);

  const languages = [...new Set(repos.map(r => r.language))];
  const filtered = filter ? repos.filter(r => r.language === filter) : repos;
  const sorted = [...filtered].sort((a, b) => b.today - a.today);

  if (loading) return <div style={{ padding: 16, color: '#444', fontSize: 9, fontFamily: 'JetBrains Mono' }}>LOADING GITHUB TRENDING (PUBLIC SCRAPE)...</div>;
  if (error) return (
    <div style={{ padding: 16, color: '#ff3355', fontSize: 9, fontFamily: 'JetBrains Mono' }}>
      <div>⚠ GITHUB TRENDING UNAVAILABLE</div>
      <div style={{ marginTop: 6, color: '#444', fontSize: 8 }}>{error}</div>
      <div style={{ marginTop: 8, color: '#00ccff', fontSize: 8 }}>
        {ALLOW_PUBLIC_PROXIES
          ? 'Uses public allorigins.win proxy — may be temporarily blocked'
          : 'Public CORS proxies are disabled; configure VITE_API_PROXY_URL to enable BYOK or set VITE_ALLOW_PUBLIC_PROXIES=1 for testing.'}
      </div>
    </div>
  );

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', fontFamily: 'JetBrains Mono, monospace' }}>
      {/* Controls */}
      <div style={{ display: 'flex', borderBottom: '1px solid #1a1a2e', alignItems: 'center', overflowX: 'auto' }}>
        {(['today', 'week'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: '4px 10px', border: 'none',
            borderRight: '1px solid #1a1a2e',
            background: tab === t ? '#1a1a2e' : 'transparent',
            color: tab === t ? '#00ccff' : '#555',
            cursor: 'pointer', fontSize: 8, fontFamily: 'JetBrains Mono',
            letterSpacing: 1, whiteSpace: 'nowrap', flexShrink: 0,
          }}>
            {t === 'today' ? '📅 TODAY' : '📊 WEEK'}
          </button>
        ))}
        <div style={{ borderLeft: '1px solid #1a1a2e', display: 'flex', overflowX: 'auto' }}>
          <button onClick={() => setFilter(null)} style={{
            padding: '4px 8px', border: 'none', borderRight: '1px solid #1a1a2e',
            background: !filter ? '#1a1a2e' : 'transparent',
            color: !filter ? '#e8e8e8' : '#444',
            cursor: 'pointer', fontSize: 7, fontFamily: 'JetBrains Mono', flexShrink: 0,
          }}>ALL</button>
          {languages.map(lang => (
            <button key={lang} onClick={() => setFilter(filter === lang ? null : lang)} style={{
              padding: '4px 8px', border: 'none', borderRight: '1px solid #1a1a2e',
              background: filter === lang ? '#1a1a2e' : 'transparent',
              color: filter === lang ? LANGUAGE_COLORS[lang] || LANGUAGE_COLORS.default : '#444',
              cursor: 'pointer', fontSize: 7, fontFamily: 'JetBrains Mono', flexShrink: 0,
              whiteSpace: 'nowrap',
            }}>{lang}</button>
          ))}
        </div>
      </div>

      {/* List */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {sorted.map((repo, i) => {
          const langColor = LANGUAGE_COLORS[repo.language] || LANGUAGE_COLORS.default;
          const tickers = STOCK_IMPACT[repo.name] || [];
          return (
            <div
              key={repo.name}
              style={{
                padding: '6px 8px',
                borderBottom: '1px solid #0f0f18',
                cursor: 'pointer',
              }}
            >
              {/* Rank + Name */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                <span style={{ fontSize: 8, color: i < 3 ? '#ffaa00' : '#333', minWidth: 14, textAlign: 'right' }}>
                  {i < 3 ? ['🥇', '🥈', '🥉'][i] : `${i + 1}.`}
                </span>
                <span style={{
                  fontSize: 9, color: '#00ccff',
                  flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {repo.name}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 2, color: '#ffaa00', flexShrink: 0 }}>
                  <Star size={8} fill="#ffaa00" />
                  <span style={{ fontSize: 8 }}>{fmtStars(repo.stars)}</span>
                </div>
              </div>

              {/* Description */}
              <div style={{
                fontSize: 8, color: '#666680', lineHeight: 1.4,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                marginLeft: 20, marginBottom: 3,
              }}>
                {repo.description}
              </div>

              {/* Meta row */}
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginLeft: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                  <div style={{ width: 7, height: 7, borderRadius: '50%', background: langColor }} />
                  <span style={{ fontSize: 7, color: langColor }}>{repo.language}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <TrendingUp size={8} color="#00ff88" />
                  <span style={{ fontSize: 8, color: '#00ff88' }}>+{repo.today}/day</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <GitFork size={8} color="#555" />
                  <span style={{ fontSize: 7, color: '#444' }}>{fmtStars(repo.forks)}</span>
                </div>
                {tickers.length > 0 && (
                  <div style={{ marginLeft: 'auto', display: 'flex', gap: 3 }}>
                    {tickers.map(t => (
                      <span key={t} style={{ fontSize: 7, color: '#00ccff', border: '1px solid #00ccff33', padding: '0 2px' }}>{t}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div style={{
        borderTop: '1px solid #1a1a2e', padding: '3px 8px',
        display: 'flex', gap: 8, fontSize: 7, color: '#333',
      }}>
        <span>SRC: GITHUB.COM/TRENDING</span>
        <span style={{ marginLeft: 'auto' }}>UPDATED: 30m</span>
      </div>
    </div>
  );
}
