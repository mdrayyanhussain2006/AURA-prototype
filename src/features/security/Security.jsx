import React from 'react';
import { useSecurity } from './useSecurity';

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

function Security() {
  const { status, policies, loading, error, refresh } = useSecurity();

  const policyEntries = React.useMemo(() => Object.entries(policies || {}), [policies]);
  const integrity = status?.integrity || null;
  const integrityClassName =
    integrity?.level === 'strong'
      ? 'text-emerald-300'
      : integrity?.level === 'moderate'
        ? 'text-amber-300'
        : 'text-rose-300';

  const truePolicies = policyEntries.filter(([, value]) => Boolean(value)).length;
  const policyCoverage = policyEntries.length > 0 ? Math.round((truePolicies / policyEntries.length) * 100) : 0;

  return (
    <div className="space-y-6 p-2">
      <header className="rounded-2xl border border-aura-border bg-slate-950/75 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-100">Security Trust Center</h2>
            <p className="mt-1 text-xs text-slate-400">
              Local-first security posture, runtime guardrails, and policy integrity in one place.
            </p>
          </div>
          <button
            type="button"
            onClick={refresh}
            className="rounded-lg border border-cyan-400/30 bg-cyan-500/10 px-3 py-2 text-xs font-medium text-cyan-200 transition-colors hover:bg-cyan-500/20"
          >
            Refresh
          </button>
        </div>

        {error && (
          <div className="mt-4 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
            {error}
          </div>
        )}
      </header>

      {loading && !status && !policies ? (
        <div className="rounded-2xl border border-aura-border bg-slate-950/80 p-5 text-sm text-slate-400">
          Loading security status...
        </div>
      ) : (
        <>
          <section className="grid gap-4 lg:grid-cols-3">
            <article className="rounded-2xl border border-aura-border bg-slate-950/80 p-5">
              <h3 className="text-xs font-medium uppercase tracking-wide text-slate-400">Vault Status</h3>
              <p className="mt-3 text-2xl font-semibold text-slate-100">
                {status?.vaultLocked ? 'Locked' : 'Unlocked'}
              </p>
              <p className="mt-2 text-xs text-slate-300">Last unlock: {formatDate(status?.lastUnlock)}</p>
              <p className="mt-1 text-xs text-slate-500">Checked: {formatDate(status?.checkedAt)}</p>
            </article>

            <article className="rounded-2xl border border-aura-border bg-slate-950/80 p-5">
              <h3 className="text-xs font-medium uppercase tracking-wide text-slate-400">Integrity Summary</h3>
              {integrity ? (
                <>
                  <p className={`mt-3 text-2xl font-semibold ${integrityClassName}`}>{integrity.score}%</p>
                  <p className="mt-1 text-xs text-slate-300 capitalize">Level: {integrity.level}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    Checks passed: {integrity.healthyChecks}/{integrity.totalChecks}
                  </p>
                </>
              ) : (
                <p className="mt-3 text-xs text-slate-500">Integrity data unavailable.</p>
              )}
            </article>

            <article className="rounded-2xl border border-aura-border bg-slate-950/80 p-5">
              <h3 className="text-xs font-medium uppercase tracking-wide text-slate-400">Policy Coverage</h3>
              <p className="mt-3 text-2xl font-semibold text-cyan-200">{policyCoverage}%</p>
              <p className="mt-1 text-xs text-slate-300">
                Active controls: {truePolicies}/{policyEntries.length || 0}
              </p>
              <p className="mt-1 text-xs text-slate-500">Deterministic local policy evaluation.</p>
            </article>
          </section>

          <section className="rounded-2xl border border-aura-border bg-slate-950/80 p-5">
            <h3 className="text-sm font-semibold text-slate-100">Policy State</h3>

            {policyEntries.length === 0 ? (
              <p className="mt-3 text-xs text-slate-500">No policy data available.</p>
            ) : (
              <ul className="mt-4 grid gap-2 md:grid-cols-2">
                {policyEntries.map(([key, value]) => (
                  <li
                    key={key}
                    className="flex items-center justify-between rounded-lg border border-aura-border/70 bg-slate-900/60 px-3 py-2"
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
          </section>

          <section className="rounded-2xl border border-aura-border bg-slate-950/80 p-5">
            <h3 className="text-sm font-semibold text-slate-100">Runtime Guards</h3>
            <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-lg border border-aura-border/70 bg-slate-900/60 px-3 py-2">
                <p className="text-[11px] text-slate-400">Context Isolation</p>
                <p className="mt-1 text-xs font-medium text-slate-200">
                  {status?.contextIsolation ? 'Enabled' : 'Disabled'}
                </p>
              </div>
              <div className="rounded-lg border border-aura-border/70 bg-slate-900/60 px-3 py-2">
                <p className="text-[11px] text-slate-400">Sandbox</p>
                <p className="mt-1 text-xs font-medium text-slate-200">
                  {status?.sandboxEnabled ? 'Enabled' : 'Disabled'}
                </p>
              </div>
              <div className="rounded-lg border border-aura-border/70 bg-slate-900/60 px-3 py-2">
                <p className="text-[11px] text-slate-400">Node Integration</p>
                <p className="mt-1 text-xs font-medium text-slate-200">
                  {status?.nodeIntegrationDisabled ? 'Disabled' : 'Enabled'}
                </p>
              </div>
              <div className="rounded-lg border border-aura-border/70 bg-slate-900/60 px-3 py-2">
                <p className="text-[11px] text-slate-400">Secure Storage</p>
                <p className="mt-1 text-xs font-medium text-slate-200">
                  {status?.secureStorageAvailable ? 'Available' : 'Unavailable'}
                </p>
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
}

export default Security;
