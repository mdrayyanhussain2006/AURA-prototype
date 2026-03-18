import React from 'react';
import { useInsights } from './useInsights';

function Insights() {
  const { summary, activity, loading, error } = useInsights(10);

  return (
    <div className="space-y-4">
      <header>
        <h2 className="text-sm font-semibold text-slate-100">Insights</h2>
        <p className="text-xs text-slate-400">Vault summary and activity.</p>
      </header>
      {error && (
        <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
          {error}
        </div>
      )}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-aura-border bg-slate-950/80 p-4">
          <h3 className="text-xs font-medium text-slate-400">Summary</h3>
          {loading ? (
            <p className="mt-2 text-xs text-slate-500">Loading…</p>
          ) : summary ? (
            <dl className="mt-2 space-y-1 text-xs text-slate-300">
              <dt>Indexed</dt>
              <dd>{summary.indexedCount ?? 0}</dd>
              <dt>Integrity</dt>
              <dd>{summary.integrityScore ?? 0}%</dd>
            </dl>
          ) : (
            <p className="mt-2 text-xs text-slate-500">No summary</p>
          )}
        </div>
        <div className="rounded-xl border border-aura-border bg-slate-950/80 p-4">
          <h3 className="text-xs font-medium text-slate-400">Activity</h3>
          {loading ? (
            <p className="mt-2 text-xs text-slate-500">Loading…</p>
          ) : activity.length === 0 ? (
            <p className="mt-2 text-xs text-slate-500">No recent activity.</p>
          ) : (
            <ul className="mt-2 space-y-1 text-xs text-slate-300">
              {activity.map((a, i) => (
                <li key={i}>{a.type ?? a.id ?? JSON.stringify(a)}</li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

export default Insights;
