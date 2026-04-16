import React, { useState, useEffect, useCallback } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

function formatDateLabel(dateStr) {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length < 3) return dateStr;
  return `${parts[1]}/${parts[2]}`;
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload || payload.length === 0) return null;
  const entry = payload[0]?.payload;
  if (!entry) return null;

  return (
    <div style={{
      background: 'rgba(15, 23, 42, 0.95)', border: '1px solid rgba(148, 163, 184, 0.15)',
      borderRadius: '10px', padding: '10px 14px', backdropFilter: 'blur(12px)',
      boxShadow: '0 8px 32px rgba(0,0,0,0.4)'
    }}>
      <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8', marginBottom: '4px' }}>{label}</p>
      <p style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: entry.score >= 80 ? '#34d399' : entry.score >= 50 ? '#fbbf24' : '#f87171' }}>
        {entry.score !== null ? `${entry.score}/100` : 'No data'}
      </p>
      {entry.itemCount !== null && (
        <p style={{ margin: 0, fontSize: '11px', color: '#64748b', marginTop: '2px' }}>{entry.itemCount} items scanned</p>
      )}
    </div>
  );
};

export default function TrendChart({ days = 7 }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const bridge = window.aura?.insights;
      if (!bridge?.getScoreHistory) { setError('Score history API not available'); setLoading(false); return; }
      const res = await bridge.getScoreHistory({ days });
      if (res.ok && Array.isArray(res.history)) {
        setHistory(res.history.map((e) => ({ ...e, date: formatDateLabel(e.date), score: e.score ?? 0 })));
      } else {
        setError(res.error || 'Failed to load score history');
      }
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }, [days]);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  if (loading) return <div style={{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', fontSize: '13px' }}>Loading trend data...</div>;
  if (error) return <div style={{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f87171', fontSize: '13px' }}>{error}</div>;
  if (history.length === 0) return <div style={{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', fontSize: '13px' }}>No trend data yet — audit scores are recorded daily.</div>;

  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={history} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#a78bfa" stopOpacity={0.4} />
            <stop offset="95%" stopColor="#a78bfa" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.08)" />
        <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={{ stroke: 'rgba(148,163,184,0.1)' }} tickLine={false} />
        <YAxis domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 11 }} axisLine={{ stroke: 'rgba(148,163,184,0.1)' }} tickLine={false} />
        <Tooltip content={<CustomTooltip />} />
        <Area type="monotone" dataKey="score" stroke="#a78bfa" strokeWidth={2} fill="url(#scoreGradient)" dot={{ fill: '#a78bfa', strokeWidth: 0, r: 3 }} activeDot={{ r: 5, fill: '#c4b5fd', strokeWidth: 0 }} />
      </AreaChart>
    </ResponsiveContainer>
  );
}
