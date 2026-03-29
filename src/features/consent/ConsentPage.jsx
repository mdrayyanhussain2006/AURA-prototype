import React from 'react';
import { useConsent } from './useConsent';

function formatTimestamp(value) {
  if (!value) return 'N/A';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'N/A' : date.toLocaleString();
}

export default function ConsentPage() {
  const { consents, loading, error, updateConsent } = useConsent();

  const seedInsightsConsent = async () => {
    await updateConsent({
      app: 'Insights Engine',
      purpose: 'Analyze vault data for suggestions',
      granted: true
    });
  };

  return (
    <div className="space-y-4 p-6">
      <h1 className="text-xl font-semibold text-slate-100">Consent Manager</h1>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={seedInsightsConsent}
          className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 hover:bg-slate-800"
        >
          Seed Insights Consent
        </button>
      </div>

      {loading && <p className="text-sm text-slate-400">Loading consent records...</p>}
      {error && <p className="text-sm text-rose-300">{error}</p>}

      {!loading && consents.length === 0 && (
        <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 text-sm text-slate-300">
          No consent records yet. Seed one to start testing grant and revoke flows.
        </div>
      )}

      {consents.map((consent) => (
        <div key={consent.id} className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
          <h2 className="text-base font-semibold text-slate-100">{consent.app}</h2>
          <p className="mt-1 text-sm text-slate-400">{consent.purpose}</p>

          <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-400">
            <span>Status: {consent.granted ? 'Granted' : 'Revoked'}</span>
            <span>Updated: {formatTimestamp(consent.updatedAt)}</span>
            <span>Revoked At: {formatTimestamp(consent.revokedAt)}</span>
          </div>

          <button
            type="button"
            onClick={() => updateConsent({ ...consent, granted: !consent.granted })}
            className="mt-3 rounded-lg bg-sky-600 px-3 py-2 text-sm font-medium text-white hover:bg-sky-500"
          >
            {consent.granted ? 'Revoke' : 'Grant'}
          </button>
        </div>
      ))}
    </div>
  );
}
