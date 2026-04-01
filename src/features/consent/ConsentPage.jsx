import React from 'react';
import { motion } from 'framer-motion';
import { useConsent } from './useConsent';
import { useToast } from '../../renderer/components/ui/ToastProvider';
import GlassCard from '../../renderer/components/ui/GlassCard';
import SkeletonCard from '../../renderer/components/ui/SkeletonCard';
import EmptyState from '../../renderer/components/ui/EmptyState';

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
  if (level === 'high') return { label: 'High Risk', cls: 'text-red-300 bg-red-500/15 border-red-500/30' };
  if (level === 'moderate') return { label: 'Moderate', cls: 'text-yellow-300 bg-yellow-500/15 border-yellow-500/30' };
  return { label: 'Safe', cls: 'text-emerald-300 bg-emerald-500/15 border-emerald-500/30' };
}

function historyLabel(action) {
  if (action === 'granted') return 'Granted';
  if (action === 'revoked') return 'Revoked';
  if (action === 'expired') return 'Auto-expired';
  if (action === 'used') return 'Used by app';
  return 'Updated';
}

const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0 }
};

export default function ConsentPage() {
  const { consents, loading, error, updateConsent, loadConsents } = useConsent();
  const toast = useToast();

  const grantedCount = consents.filter((item) => item.granted).length;

  const seedInsightsConsent = async () => {
    await updateConsent({
      app: 'Insights Engine',
      purpose: 'Analyze vault data for suggestions',
      granted: true,
      riskLevel: 'moderate'
    });
    toast.success('Insights consent seeded');
  };

  const revokeAll = async () => {
    const grantedConsents = consents.filter((c) => c.granted);
    await Promise.all(
      grantedConsents.map((c) => updateConsent({ ...c, granted: false }))
    );
    await loadConsents();
    toast.info('All consents revoked');
  };

  const handleGrant = async (consent) => {
    await updateConsent({ ...consent, granted: true });
    toast.success(`${consent.app} consent granted`);
  };

  const handleRevoke = async (consent) => {
    await updateConsent({ ...consent, granted: false });
    toast.info(`${consent.app} consent revoked`);
  };

  const setExpiry = async (consent, days) => {
    const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
    await updateConsent({ ...consent, granted: true, expiresAt });
    toast.success(`Expiry set to ${days} days`);
  };

  return (
    <div className="space-y-6 p-2">
      {/* Header */}
      <GlassCard priority="primary" className="p-6 relative overflow-hidden">
        <div className="pointer-events-none absolute -top-24 -right-16 h-56 w-56 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-16 h-56 w-56 rounded-full bg-indigo-500/10 blur-3xl" />

        <div className="relative">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-white">Consent Manager</h2>
              <p className="mt-1 text-xs text-slate-300">
                Manage permissions with audit-ready history and revocation controls.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={seedInsightsConsent}
                className="rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-xs font-medium text-white transition-all hover:bg-white/15 hover:scale-[1.02] active:scale-[0.98]"
              >
                Seed Insights Consent
              </button>
              <button
                type="button"
                onClick={revokeAll}
                disabled={grantedCount === 0}
                className="rounded-xl border border-red-500/30 bg-red-500/15 px-3 py-2 text-xs font-medium text-red-200 transition-all hover:bg-red-500/25 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
              >
                Revoke All
              </button>
            </div>
          </div>

          {loading && <p className="mt-4 text-sm text-slate-400">Loading consent records...</p>}
          {error && <p className="mt-4 text-sm text-rose-300">{error}</p>}
        </div>
      </GlassCard>

      {/* Loading */}
      {loading && consents.length === 0 ? (
        <div className="space-y-4">
          {[1, 2].map((i) => <SkeletonCard key={i} lines={4} />)}
        </div>
      ) : consents.length === 0 ? (
        <GlassCard className="py-8">
          <EmptyState
            title="No consent records yet"
            description="Seed one to start testing grant, revoke, and expiry flows."
            actionLabel="Seed Insights Consent"
            onAction={seedInsightsConsent}
            icon={
              <svg className="w-8 h-8 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            }
          />
        </GlassCard>
      ) : (
        <motion.div
          className="space-y-4"
          initial="hidden"
          animate="show"
          variants={{ show: { transition: { staggerChildren: 0.06 } } }}
        >
          {/* Revoked warning */}
          {grantedCount === 0 && consents.length > 0 && (
            <div className="rounded-2xl border border-yellow-500/30 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-200">
              All consents revoked. Enable consent to unlock Insights.
            </div>
          )}

          {consents.map((c) => {
            const risk = riskMeta(c.riskLevel);
            const timeline = Array.isArray(c.history) ? c.history.slice(-4).reverse() : [];

            return (
              <motion.div key={c.id} variants={cardVariants}>
                <GlassCard className="p-5 transition-all duration-200 hover:shadow-[0_0_30px_rgba(56,189,248,0.10)]">
                  {/* Top row */}
                  <div className="flex justify-between items-center gap-3">
                    <div>
                      <h3 className="text-base font-semibold text-white">{c.app}</h3>
                      <p className="text-xs text-slate-400 mt-0.5">{c.purpose}</p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        c.granted
                          ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                          : 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                      }`}
                    >
                      {c.granted ? 'Granted' : 'Revoked'}
                    </span>
                  </div>

                  {/* Meta pills */}
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                    <span className={`rounded-full border px-2 py-1 ${risk.cls}`}>{risk.label}</span>
                    <span className="rounded-full bg-white/[0.06] px-2 py-1 text-slate-300">
                      Updated {timeAgo(c.updatedAt)}
                    </span>
                    {c.lastUsedAt && (
                      <span className="rounded-full bg-white/[0.06] px-2 py-1 text-slate-300">
                        Used by {c.lastUsedBy || 'app'} {timeAgo(c.lastUsedAt)}
                      </span>
                    )}
                    <span className="rounded-full bg-white/[0.06] px-2 py-1 text-slate-300">
                      Expires: {formatDate(c.expiresAt)}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => handleGrant(c)}
                      className="px-4 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-medium transition-all hover:bg-emerald-500/25 active:scale-[0.98]"
                    >
                      Allow
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRevoke(c)}
                      className="px-4 py-1.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-medium transition-all hover:bg-rose-500/25 active:scale-[0.98]"
                    >
                      Revoke
                    </button>
                    <button
                      type="button"
                      onClick={() => setExpiry(c, 30)}
                      className="px-4 py-1.5 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 text-xs font-medium transition-all hover:bg-cyan-500/25 active:scale-[0.98]"
                    >
                      Expire in 30d
                    </button>
                  </div>

                  {/* Timeline */}
                  <div className="mt-4 rounded-xl border border-white/10 bg-black/20 p-3">
                    <h4 className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">Consent Timeline</h4>
                    {timeline.length === 0 ? (
                      <p className="mt-2 text-xs text-slate-500">No timeline events yet.</p>
                    ) : (
                      <ul className="mt-2 space-y-1">
                        {timeline.map((entry, index) => (
                          <li key={`${entry.action}_${entry.at}_${index}`} className="flex items-center justify-between text-xs">
                            <span className="text-slate-300">{historyLabel(entry.action)}</span>
                            <span className="text-slate-500">{timeAgo(entry.at)}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </GlassCard>
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </div>
  );
}
