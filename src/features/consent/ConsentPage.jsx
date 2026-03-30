import React from 'react';
import { useConsent } from './useConsent';

function formatDate(value) {
  if (!value) return 'Not set';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Not set' : date.toLocaleString();
}

function timeAgo(value) {
  if (!value) return 'Unknown';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Unknown';
  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  if (diffMinutes < 1) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

function riskMeta(level) {
  if (level === 'high') {
    return { label: 'High Risk', className: 'text-red-300 bg-red-500/20' };
  }
  if (level === 'moderate') {
    return { label: 'Moderate Risk', className: 'text-yellow-300 bg-yellow-500/20' };
  }
  return { label: 'Safe', className: 'text-emerald-300 bg-emerald-500/20' };
}

function historyLabel(action) {
  if (action === 'granted') return 'Granted';
  if (action === 'revoked') return 'Revoked';
  if (action === 'expired') return 'Auto-expired';
  if (action === 'used') return 'Used by app';
  return 'Updated';
}

export default function ConsentPage() {
  const { consents, loading, error, updateConsent, loadConsents } = useConsent();

  const grantedCount = consents.filter((item) => item.granted).length;
  const allRevoked = consents.length > 0 && grantedCount === 0;

  const seedInsightsConsent = async () => {
    await updateConsent({
      app: 'Insights Engine',
      purpose: 'Analyze vault data for suggestions',
      granted: true,
      riskLevel: 'moderate'
    });
  };

  const revokeAll = async () => {
    const grantedConsents = consents.filter((consent) => consent.granted);
    await Promise.all(
      grantedConsents.map((consent) =>
        updateConsent({
          ...consent,
          granted: false
        })
      )
    );
    await loadConsents();
  };

  const setExpiry = async (consent, days) => {
    const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
    await updateConsent({
      ...consent,
      granted: true,
      expiresAt
    });
  };

  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-[#020617] to-[#0f172a] p-6">
      <div className="pointer-events-none absolute -top-24 -right-16 h-56 w-56 rounded-full bg-cyan-500/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-16 h-56 w-56 rounded-full bg-indigo-500/20 blur-3xl" />

      <div className="relative space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-white">Consent Manager</h1>
            <p className="mt-1 text-xs text-slate-300">
              Manage permissions across AURA features with audit-ready history and revocation controls.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={seedInsightsConsent}
              className="rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-xs font-medium text-white shadow-[0_0_18px_rgba(56,189,248,0.25)] transition-all active:scale-[0.98] hover:scale-[1.02] hover:bg-white/15"
            >
              Seed Insights Consent
            </button>
            <button
              type="button"
              onClick={revokeAll}
              disabled={grantedCount === 0}
              className="rounded-xl border border-red-500/30 bg-red-500/20 px-3 py-2 text-xs font-medium text-red-200 shadow-[0_0_18px_rgba(248,113,113,0.2)] transition-all active:scale-[0.98] hover:scale-[1.02] hover:bg-red-500/30 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Revoke All
            </button>
          </div>
        </div>

        {loading && <p className="text-sm text-slate-400">Loading consent records...</p>}
        {error && <p className="text-sm text-rose-300">{error}</p>}

        {allRevoked && (
          <div className="rounded-2xl border border-yellow-500/30 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-200">
            Insights are disabled. Enable consent to unlock smart suggestions.
          </div>
        )}

        {!loading && consents.length === 0 && (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300 backdrop-blur-xl">
            No consent records yet. Seed one to start testing grant, revoke, and expiry flows.
          </div>
        )}

        {consents.map((c) => {
          const risk = riskMeta(c.riskLevel);
          const timeline = Array.isArray(c.history) ? c.history.slice(-4).reverse() : [];

          return (
            <div
              key={c.id}
              className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl p-5 mb-4 transition-all hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(56,189,248,0.18)]"
            >
              <div className="flex justify-between items-center gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-white">{c.app}</h2>
                  <p className="text-xs text-gray-400 mt-1">{c.purpose}</p>
                </div>

                <span
                  className={`px-3 py-1 rounded-full text-xs ${
                    c.granted ? 'bg-green-500/20 text-green-300 animate-pulse' : 'bg-red-500/20 text-red-300'
                  }`}
                >
                  {c.granted ? 'Granted' : 'Revoked'}
                </span>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                <span className={`rounded-full px-2 py-1 ${risk.className}`}>{risk.label}</span>
                <span className="rounded-full bg-white/10 px-2 py-1 text-slate-300">
                  Updated {timeAgo(c.updatedAt)}
                </span>
                {c.lastUsedAt && (
                  <span className="rounded-full bg-white/10 px-2 py-1 text-slate-300">
                    Last used by {c.lastUsedBy || 'app'} {timeAgo(c.lastUsedAt)}
                  </span>
                )}
                <span className="rounded-full bg-white/10 px-2 py-1 text-slate-300">
                  Expires: {formatDate(c.expiresAt)}
                </span>
              </div>

              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => updateConsent({ ...c, granted: true })}
                  className="px-4 py-1 rounded-xl bg-green-500/20 hover:bg-green-500/30 text-green-300 transition-all active:scale-[0.98]"
                >
                  Allow
                </button>

                <button
                  type="button"
                  onClick={() => updateConsent({ ...c, granted: false })}
                  className="px-4 py-1 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-300 transition-all active:scale-[0.98]"
                >
                  Revoke
                </button>

                <button
                  type="button"
                  onClick={() => setExpiry(c, 30)}
                  className="px-4 py-1 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 transition-all active:scale-[0.98]"
                >
                  Expire in 30d
                </button>
              </div>

              <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300">Consent Timeline</h3>
                {timeline.length === 0 ? (
                  <p className="mt-2 text-xs text-slate-400">No timeline events yet.</p>
                ) : (
                  <ul className="mt-2 space-y-1 text-xs text-slate-300">
                    {timeline.map((entry, index) => (
                      <li key={`${entry.action}_${entry.at}_${index}`} className="flex items-center justify-between">
                        <span>{historyLabel(entry.action)}</span>
                        <span className="text-slate-400">{timeAgo(entry.at)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
