import React from 'react';
import { motion } from 'framer-motion';
import { APP_NAME } from '../../shared/constants';
import packageJson from '../../../package.json';
import { useSettings } from './useSettings';
import { useToast } from '../../renderer/components/ui/ToastProvider';
import GlassCard from '../../renderer/components/ui/GlassCard';
import SkeletonCard from '../../renderer/components/ui/SkeletonCard';

const AUTO_LOCK_OPTIONS = [1, 5, 10, 15, 30, 60, 120, 240];

function Toggle({ label, description, enabled, onToggle, disabled = false }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled}
      className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-left transition-all hover:bg-white/[0.06] disabled:cursor-not-allowed disabled:opacity-60"
      aria-pressed={enabled}
    >
      <span>
        <span className="block text-xs font-medium text-slate-100">{label}</span>
        <span className="mt-0.5 block text-[11px] text-slate-400">{description}</span>
      </span>
      <span
        className={`inline-flex h-5 w-9 items-center rounded-full px-0.5 transition-colors duration-200 ${
          enabled ? 'bg-emerald-500/60' : 'bg-slate-700'
        }`}
      >
        <span
          className={`h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${
            enabled ? 'translate-x-4' : 'translate-x-0'
          }`}
        />
      </span>
    </button>
  );
}

const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0 }
};

function Settings() {
  const { settings, loading, saving, error, refresh, update, reset } = useSettings();
  const toast = useToast();
  const [exporting, setExporting] = React.useState(false);

  const handleThemeChange = React.useCallback(
    async (theme) => {
      if (theme === settings.theme) return;
      const res = await update({ theme });
      if (res.ok) toast.success('Theme updated');
    },
    [settings.theme, update, toast]
  );

  const handleAutoLockChange = React.useCallback(
    async (event) => {
      const nextValue = Number(event.target.value);
      if (!Number.isFinite(nextValue)) return;
      const res = await update({ autoLockMinutes: nextValue });
      if (res.ok) toast.success(`Auto-lock set to ${nextValue} minutes`);
    },
    [update, toast]
  );

  const handleToggle = React.useCallback(
    async (key, currentValue) => {
      const res = await update({ [key]: !currentValue });
      if (res.ok) toast.success('Setting updated');
    },
    [update, toast]
  );

  const handleConsentToggle = React.useCallback(
    async (key) => {
      const res = await update({
        consentDefaults: {
          ...settings.consentDefaults,
          [key]: !settings.consentDefaults[key]
        }
      });
      if (res.ok) toast.success('Consent default updated');
    },
    [settings.consentDefaults, update, toast]
  );

  const handleReset = React.useCallback(async () => {
    const res = await reset();
    if (res.ok) toast.success('Settings restored to defaults');
    else toast.error('Failed to reset settings');
  }, [reset, toast]);

  const handleExport = React.useCallback(async () => {
    if (!window.aura?.vault?.exportAll) {
      toast.error('Export not available');
      return;
    }

    const confirmed = window.confirm(
      'This export contains decrypted vault data in plain JSON. Continue?'
    );
    if (!confirmed) {
      return;
    }

    setExporting(true);
    try {
      const res = await window.aura.vault.exportAll();
      if (res.ok && Array.isArray(res.items)) {
        const blob = new Blob([JSON.stringify(res.items, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `aura-vault-export-${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success(`Exported ${res.items.length} items`);
      } else {
        toast.error(res.error || 'Export failed');
      }
    } catch (err) {
      toast.error('Export failed');
    } finally {
      setExporting(false);
    }
  }, [toast]);

  return (
    <div className="space-y-6 p-2">
      {/* Header */}
      <GlassCard priority="primary" className="p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-100">Settings Control Center</h2>
            <p className="mt-1 text-xs text-slate-300">
              Manage local behavior, privacy defaults, and runtime preferences.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {saving && (
              <span className="rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-2.5 py-1 text-[11px] font-medium text-cyan-200">
                Saving...
              </span>
            )}
            <button
              type="button"
              onClick={refresh}
              className="rounded-xl border border-white/15 bg-white/10 px-4 py-2 text-xs font-medium text-white transition-all hover:bg-white/15 hover:scale-[1.02] active:scale-[0.98]"
            >
              Refresh
            </button>
          </div>
        </div>
        {error && (
          <div className="mt-4 rounded-xl border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
            {error}
          </div>
        )}
      </GlassCard>

      {loading ? (
        <div className="grid gap-4 xl:grid-cols-2">
          {[1, 2, 3, 4].map((i) => <SkeletonCard key={i} lines={3} />)}
        </div>
      ) : (
        <motion.div
          className="space-y-6"
          initial="hidden"
          animate="show"
          variants={{ show: { transition: { staggerChildren: 0.06 } } }}
        >
          <motion.div variants={cardVariants} className="grid gap-4 xl:grid-cols-2">
            {/* Appearance */}
            <GlassCard className="p-5">
              <h3 className="text-sm font-semibold text-slate-100">Appearance</h3>
              <p className="mt-1 text-xs text-slate-400">Personalize interface behavior.</p>
              <div className="mt-4 space-y-3">
                <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                  <p className="text-xs font-medium text-slate-100 mb-2">Theme</p>
                  <div className="flex gap-2">
                    {['dark', 'light'].map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => handleThemeChange(t)}
                        className={`rounded-lg border px-4 py-2 text-xs font-medium capitalize transition-all ${
                          settings.theme === t
                            ? 'border-purple-500/60 bg-purple-500/20 text-purple-100'
                            : 'border-white/10 bg-white/[0.03] text-slate-300 hover:bg-white/[0.06]'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
                <Toggle
                  label="Reduced Motion"
                  description="Soften visual transitions and animated effects."
                  enabled={settings.reducedMotion}
                  onToggle={() => handleToggle('reducedMotion', settings.reducedMotion)}
                />
              </div>
            </GlassCard>

            {/* Privacy Defaults */}
            <GlassCard className="p-5">
              <h3 className="text-sm font-semibold text-slate-100">Privacy Defaults</h3>
              <p className="mt-1 text-xs text-slate-400">Set baseline consent behavior.</p>
              <div className="mt-4 space-y-3">
                <Toggle
                  label="Default Consent for Insights"
                  description="Pre-select consent for Insights workflows."
                  enabled={settings.consentDefaults.insights}
                  onToggle={() => handleConsentToggle('insights')}
                />
                <Toggle
                  label="Default Consent for Marketplace"
                  description="Pre-select consent for Marketplace sharing."
                  enabled={settings.consentDefaults.marketplace}
                  onToggle={() => handleConsentToggle('marketplace')}
                />
                <Toggle
                  label="Developer Mode"
                  description="Enable advanced debug controls."
                  enabled={settings.developerMode}
                  onToggle={() => handleToggle('developerMode', settings.developerMode)}
                />
              </div>
            </GlassCard>
          </motion.div>

          <motion.div variants={cardVariants} className="grid gap-4 xl:grid-cols-2">
            {/* Storage & Locking */}
            <GlassCard className="p-5">
              <h3 className="text-sm font-semibold text-slate-100">Storage & Locking</h3>
              <p className="mt-1 text-xs text-slate-400">Control lock timing and persistence.</p>
              <label className="mt-4 block rounded-xl border border-white/10 bg-white/[0.03] p-3">
                <span className="text-xs font-medium text-slate-100">Auto-lock timeout</span>
                <span className="mt-0.5 block text-[11px] text-slate-400">Minutes of inactivity before vault lock.</span>
                <select
                  className="mt-3 w-full rounded-lg border border-white/10 bg-slate-950/80 px-3 py-2 text-xs text-slate-100 outline-none focus:border-purple-500/60"
                  value={settings.autoLockMinutes}
                  onChange={handleAutoLockChange}
                >
                  {AUTO_LOCK_OPTIONS.map((minutes) => (
                    <option key={minutes} value={minutes}>
                      {minutes} minute{minutes === 1 ? '' : 's'}
                    </option>
                  ))}
                </select>
              </label>
              <p className="mt-3 text-[11px] text-slate-500">
                Settings are stored locally and never sent externally.
              </p>
            </GlassCard>

            {/* App Info */}
            <GlassCard className="p-5">
              <h3 className="text-sm font-semibold text-slate-100">App Info</h3>
              <div className="mt-4 space-y-2 text-xs">
                {[
                  ['Product', APP_NAME],
                  ['Version', packageJson.version || '0.1.0'],
                  ['Mode', 'Local-first desktop']
                ].map(([label, value]) => (
                  <div key={label} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
                    <span className="text-slate-400">{label}</span>
                    <span className="text-slate-100">{value}</span>
                  </div>
                ))}
              </div>
            </GlassCard>
          </motion.div>

          {/* Data Management */}
          <motion.div variants={cardVariants}>
            <GlassCard className="p-5">
              <h3 className="text-sm font-semibold text-slate-100">Data Management</h3>
              <p className="mt-1 text-xs text-slate-400 mb-4">Export or reset your local data.</p>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={handleExport}
                  disabled={exporting}
                  className="rounded-xl border border-purple-500/30 bg-purple-500/15 px-4 py-2 text-xs font-medium text-purple-200 transition-all hover:bg-purple-500/25 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                >
                  {exporting ? 'Exporting...' : 'Export Vault as JSON'}
                </button>
                <button
                  type="button"
                  onClick={handleReset}
                  className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-xs font-medium text-rose-200 transition-all hover:bg-rose-500/20 hover:scale-[1.02] active:scale-[0.98]"
                >
                  Restore Defaults
                </button>
              </div>
            </GlassCard>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}

export default Settings;
