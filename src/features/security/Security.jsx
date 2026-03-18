import React from 'react';
import { useSecurity } from './useSecurity';

function Security() {
  const { status, policies, loading, error } = useSecurity();

  return (
    <div className="space-y-4">
      <header>
        <h2 className="text-sm font-semibold text-slate-100">Security</h2>
        <p className="text-xs text-slate-400">Vault status and policies.</p>
      </header>
      {error && (
        <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
          {error}
        </div>
      )}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-aura-border bg-slate-950/80 p-4">
          <h3 className="text-xs font-medium text-slate-400">Status</h3>
          {loading ? (
            <p className="mt-2 text-xs text-slate-500">Loading…</p>
          ) : status ? (
            <dl className="mt-2 space-y-1 text-xs text-slate-300">
              <dt>Vault locked</dt>
              <dd>{status.vaultLocked ? 'Yes' : 'No'}</dd>
              <dt>Last unlock</dt>
              <dd>{status.lastUnlock ?? '—'}</dd>
            </dl>
          ) : (
            <p className="mt-2 text-xs text-slate-500">No status</p>
          )}
        </div>
        <div className="rounded-xl border border-aura-border bg-slate-950/80 p-4">
          <h3 className="text-xs font-medium text-slate-400">Policies</h3>
          {loading ? (
            <p className="mt-2 text-xs text-slate-500">Loading…</p>
          ) : policies ? (
            <ul className="mt-2 space-y-1 text-xs text-slate-300">
              {Object.entries(policies).map(([key, value]) => (
                <li key={key}>{key}: {String(value)}</li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-xs text-slate-500">No policies</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default Security;
