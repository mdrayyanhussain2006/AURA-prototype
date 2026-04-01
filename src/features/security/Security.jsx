import React from 'react';
import { motion } from 'framer-motion';
import { useSecurity } from './useSecurity';
import GlassCard from '../../renderer/components/ui/GlassCard';
import SkeletonCard from '../../renderer/components/ui/SkeletonCard';

function formatDate(value) {
  if (!value || typeof value !== 'string') return 'Not recorded';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Not recorded';
  return date.toLocaleString();
}

function humanizeKey(key) {
  if (typeof key !== 'string' || !key) return 'Unknown policy';
  return key
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[_-]/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function IntegrityRing({ score, level }) {
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = level === 'strong' ? '#34d399' : level === 'moderate' ? '#fbbf24' : '#f87171';

  return (
    <div className="relative flex items-center justify-center">
      <svg width="88" height="88" className="aura-progress-ring">
        <circle cx="44" cy="44" r={radius} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="6" />
        <circle
          cx="44" cy="44" r={radius} fill="none" stroke={color} strokeWidth="6"
          strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.8s ease-out' }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-xl font-bold text-white">{score}%</span>
        <span className="text-[10px] uppercase tracking-wider text-slate-400 capitalize">{level}</span>
      </div>
    </div>
  );
}

function GuardBadge({ label, enabled }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 backdrop-blur-xl">
      <p className="text-[11px] text-slate-400 mb-1.5">{label}</p>
      <div className="flex items-center gap-2">
        <span className={`h-2 w-2 rounded-full ${enabled ? 'bg-emerald-400' : 'bg-rose-400'}`} />
        <span className={`text-xs font-medium ${enabled ? 'text-emerald-300' : 'text-rose-300'}`}>
          {enabled ? 'Enabled' : 'Disabled'}
        </span>
      </div>
    </div>
  );
}

const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0 }
};

function Security() {
  const { status, policies, loading, error, refresh } = useSecurity();
  const policyEntries = React.useMemo(() => Object.entries(policies || {}), [policies]);
  const integrity = status?.integrity || null;
  const truePolicies = policyEntries.filter(([, value]) => Boolean(value)).length;
  const policyCoverage = policyEntries.length > 0 ? Math.round((truePolicies / policyEntries.length) * 100) : 0;

  return (
    <div className="space-y-6 p-2">
      {/* Header */}
      <GlassCard priority="primary" className="p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-100">Security Trust Center</h2>
            <p className="mt-1 text-xs text-slate-300">
              Local-first security posture, runtime guardrails, and policy integrity.
            </p>
          </div>
          <button
            type="button"
            onClick={refresh}
            className="rounded-xl border border-white/15 bg-white/10 px-4 py-2 text-xs font-medium text-white transition-all hover:bg-white/15 hover:scale-[1.02] active:scale-[0.98]"
          >
            Refresh
          </button>
        </div>
        {error && (
          <div className="mt-4 rounded-xl border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
            {error}
          </div>
        )}
      </GlassCard>

      {loading && !status && !policies ? (
        <div className="grid gap-4 lg:grid-cols-3">
          {[1, 2, 3].map((i) => <SkeletonCard key={i} lines={2} />)}
        </div>
      ) : (
        <motion.div
          className="space-y-6"
          initial="hidden"
          animate="show"
          variants={{ show: { transition: { staggerChildren: 0.06 } } }}
        >
          {/* Top stats */}
          <motion.div variants={cardVariants} className="grid gap-4 lg:grid-cols-3">
            {/* Vault Status */}
            <GlassCard className="p-5">
              <h3 className="text-[10px] font-medium uppercase tracking-widest text-slate-400">Vault Status</h3>
              <p className="mt-3 text-2xl font-bold text-slate-100">
                {status?.vaultLocked ? 'Locked' : 'Unlocked'}
              </p>
              <p className="mt-2 text-xs text-slate-300">Last unlock: {formatDate(status?.lastUnlock)}</p>
              <p className="mt-1 text-xs text-slate-500">Checked: {formatDate(status?.checkedAt)}</p>
            </GlassCard>

            {/* Integrity */}
            <GlassCard className="p-5 flex flex-col items-center justify-center">
              <h3 className="text-[10px] font-medium uppercase tracking-widest text-slate-400 mb-3 self-start">Integrity</h3>
              {integrity ? (
                <>
                  <IntegrityRing score={integrity.score} level={integrity.level} />
                  <p className="mt-2 text-xs text-slate-400">
                    {integrity.healthyChecks}/{integrity.totalChecks} checks passed
                  </p>
                </>
              ) : (
                <p className="text-xs text-slate-500">Integrity data unavailable.</p>
              )}
            </GlassCard>

            {/* Policy Coverage */}
            <GlassCard className="p-5">
              <h3 className="text-[10px] font-medium uppercase tracking-widest text-slate-400">Policy Coverage</h3>
              <p className="mt-3 text-2xl font-bold text-cyan-200">{policyCoverage}%</p>
              <p className="mt-2 text-xs text-slate-300">
                Active: {truePolicies}/{policyEntries.length || 0}
              </p>
              <p className="mt-1 text-xs text-slate-500">Deterministic local evaluation.</p>
            </GlassCard>
          </motion.div>

          {/* Policy State */}
          <motion.div variants={cardVariants}>
            <GlassCard className="p-5">
              <h3 className="text-sm font-semibold text-slate-100 mb-4">Policy State</h3>
              {policyEntries.length === 0 ? (
                <p className="text-xs text-slate-500">No policy data available.</p>
              ) : (
                <ul className="grid gap-2 md:grid-cols-2">
                  {policyEntries.map(([key, value]) => (
                    <li
                      key={key}
                      className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5"
                    >
                      <span className="text-xs text-slate-200">{humanizeKey(key)}</span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                          value
                            ? 'border border-emerald-500/40 bg-emerald-500/15 text-emerald-200'
                            : 'border border-rose-500/40 bg-rose-500/15 text-rose-200'
                        }`}
                      >
                        {value ? 'Enabled' : 'Disabled'}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </GlassCard>
          </motion.div>

          {/* Runtime Guards */}
          <motion.div variants={cardVariants}>
            <GlassCard className="p-5">
              <h3 className="text-sm font-semibold text-slate-100 mb-4">Runtime Guards</h3>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <GuardBadge label="Context Isolation" enabled={status?.contextIsolation} />
                <GuardBadge label="Sandbox" enabled={status?.sandboxEnabled} />
                <GuardBadge label="Node Disabled" enabled={status?.nodeIntegrationDisabled} />
                <GuardBadge label="Secure Storage" enabled={status?.secureStorageAvailable} />
              </div>
            </GlassCard>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}

export default Security;
