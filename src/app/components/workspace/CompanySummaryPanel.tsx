import React, { useEffect, useState } from 'react';
import { fetchStockProfile } from '../../services/apiServices';
import { useConfigStore } from '../../stores/configStore';
import { Building2, Globe, Hash, Briefcase, DollarSign, Activity } from 'lucide-react';
import { fmtNum } from '../../utils/numberFormat';

export function CompanySummaryPanel({ symbol }: { symbol: string }) {
  const [profile, setProfile] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { apiKeys } = useConfigStore();

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        if (!apiKeys.finnhub) {
          if (active) {
            setError('Finnhub API key required for company profiles');
            setLoading(false);
          }
          return;
        }
        const data = await fetchStockProfile(symbol);
        if (!data || Object.keys(data).length === 0) {
          if (active) {
            setError(`Profile not found for ${symbol}`);
            setLoading(false);
          }
          return;
        }
        if (active) setProfile(data);
      } catch (err: any) {
        if (active) setError(err.message);
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => { active = false; };
  }, [symbol, apiKeys.finnhub]);

  return (
    <div style={{ background: '#0a0a12', border: '1px solid #1a1a2e', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '8px 12px', borderBottom: '1px solid #1a1a2e', background: '#0d0d18', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0, color: '#00ccff', fontSize: '10px', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Building2 size={12} />
          COMPANY PROFILE
        </h3>
      </div>
      
      <div style={{ flex: 1, padding: '12px', overflowY: 'auto' }}>
        {loading ? (
          <div style={{ color: '#00ccff', fontSize: '10px' }}>Loading profile...</div>
        ) : error ? (
          <div style={{ color: '#ff3355', fontSize: '10px', background: 'rgba(255,51,85,0.1)', padding: '8px', border: '1px solid #ff335533' }}>
            {error}
          </div>
        ) : profile ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
              {profile.logo ? (
                <img src={profile.logo} alt="Logo" style={{ width: 48, height: 48, borderRadius: 4, background: '#fff', padding: 2 }} />
              ) : (
                <div style={{ width: 48, height: 48, borderRadius: 4, background: '#1a1a2e', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Building2 size={24} color="#444" />
                </div>
              )}
              <div>
                <div style={{ fontSize: 16, color: '#e8e8e8', fontWeight: 600 }}>{profile.name}</div>
                <div style={{ fontSize: 10, color: '#00ccff' }}>{profile.ticker} • {profile.exchange}</div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <div style={{ background: '#11111a', padding: 8, border: '1px solid #1a1a2e' }}>
                <div style={{ fontSize: 8, color: '#666', display: 'flex', alignItems: 'center', gap: 4 }}><Briefcase size={10} /> INDUSTRY</div>
                <div style={{ fontSize: 10, color: '#e8e8e8', marginTop: 4 }}>{profile.finnhubIndustry || '-'}</div>
              </div>
              <div style={{ background: '#11111a', padding: 8, border: '1px solid #1a1a2e' }}>
                <div style={{ fontSize: 8, color: '#666', display: 'flex', alignItems: 'center', gap: 4 }}><DollarSign size={10} /> MARKET CAP</div>
                <div style={{ fontSize: 10, color: '#e8e8e8', marginTop: 4 }}>
                  {profile.marketCapitalization ? `$${fmtNum(profile.marketCapitalization, 2)}M` : '-'}
                </div>
              </div>
              <div style={{ background: '#11111a', padding: 8, border: '1px solid #1a1a2e' }}>
                <div style={{ fontSize: 8, color: '#666', display: 'flex', alignItems: 'center', gap: 4 }}><Activity size={10} /> SHARES OUT</div>
                <div style={{ fontSize: 10, color: '#e8e8e8', marginTop: 4 }}>
                  {profile.shareOutstanding ? `${fmtNum(profile.shareOutstanding, 2)}M` : '-'}
                </div>
              </div>
              <div style={{ background: '#11111a', padding: 8, border: '1px solid #1a1a2e' }}>
                <div style={{ fontSize: 8, color: '#666', display: 'flex', alignItems: 'center', gap: 4 }}><Globe size={10} /> WEBSITE</div>
                <div style={{ fontSize: 10, color: '#00ccff', marginTop: 4, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {profile.weburl ? <a href={profile.weburl} target="_blank" rel="noreferrer" style={{ color: 'inherit', textDecoration: 'none' }}>{profile.weburl}</a> : '-'}
                </div>
              </div>
              <div style={{ background: '#11111a', padding: 8, border: '1px solid #1a1a2e', gridColumn: '1 / -1' }}>
                <div style={{ fontSize: 8, color: '#666', display: 'flex', alignItems: 'center', gap: 4 }}><Hash size={10} /> ISIN</div>
                <div style={{ fontSize: 10, color: '#e8e8e8', marginTop: 4 }}>{profile.isin || profile.cusip || '-'}</div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
