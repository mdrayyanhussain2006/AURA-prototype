import React from 'react';
import { APP_NAME } from '../../shared/constants';
import packageJson from '../../../package.json';
import { useSettings } from './useSettings';

const AUTO_LOCK_OPTIONS = [1, 5, 10, 15, 30, 60, 120, 240];

function Toggle({ label, description, enabled, onToggle, disabled = false }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled}
      className="flex w-full items-center justify-between rounded-xl border border-aura-border/80 bg-slate-900/50 px-3 py-2 text-left transition-colors hover:bg-slate-900/70 disabled:cursor-not-allowed disabled:opacity-60"
      aria-pressed={enabled}
    >
      <span>
        <span className="block text-xs font-medium text-slate-100">{label}</span>
        <span className="mt-0.5 block text-[11px] text-slate-400">{description}</span>
      </span>
      <span
        className={`inline-flex h-5 w-9 items-center rounded-full px-0.5 transition-colors ${
          enabled ? 'bg-emerald-500/60' : 'bg-slate-700'
        }`}
      >
        <span
          className={`h-4 w-4 rounded-full bg-white transition-transform ${
            enabled ? 'translate-x-4' : 'translate-x-0'
          }`}
        />
      </span>
    </button>
  );
}

function Settings() {
  const { settings, loading, saving, error, refresh, update, reset } = useSettings();

  const handleThemeChange = React.useCallback(
    async (theme) => {
      if (theme === settings.theme) return;
      await update({ theme });
    },
    [settings.theme, update]
  );

  const handleAutoLockChange = React.useCallback(
    async (event) => {
      const nextValue = Number(event.target.value);
      if (!Number.isFinite(nextValue)) return;
      await update({ autoLockMinutes: nextValue });
    },
    [update]
  );

  const handleReset = React.useCallback(async () => {
    await reset();
  }, [reset]);

  return (
    <div className="space-y-6 p-2">
      <header className="rounded-2xl border border-aura-border bg-slate-950/75 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-100">Settings Control Center</h2>
            <p className="mt-1 text-xs text-slate-400">
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
              className="rounded-lg border border-cyan-400/30 bg-cyan-500/10 px-3 py-2 text-xs font-medium text-cyan-200 transition-colors hover:bg-cyan-500/20"
            >
              Refresh
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-4 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
            {error}
          </div>
        )}
      </header>

      {loading ? (
        <div className="rounded-2xl border border-aura-border bg-slate-950/80 p-5 text-sm text-slate-400">
          Loading settings...
        </div>
      ) : (
        <>
          <section className="grid gap-4 xl:grid-cols-2">
            <article className="rounded-2xl border border-aura-border bg-slate-950/80 p-5">
              <h3 className="text-sm font-semibold text-slate-100">Appearance</h3>
              <p className="mt-1 text-xs text-slate-400">Personalize interface behavior for comfort and focus.</p>

              <div className="mt-4 space-y-3">
                <div className="rounded-xl border border-aura-border/80 bg-slate-900/50 p-3">
                  <p className="text-xs font-medium text-slate-100">Theme</p>
                  <div className="mt-2 flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleThemeChange('dark')}
                      className={`rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${
                        settings.theme === 'dark'
                          ? 'border-cyan-400/60 bg-cyan-500/20 text-cyan-100'
                          : 'border-aura-border bg-slate-900/70 text-slate-300 hover:bg-slate-900'
                      }`}
                    >
                      Dark
                    </button>
                    <button
                      type="button"
                      onClick={() => handleThemeChange('light')}
                      className={`rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${
                        settings.theme === 'light'
                          ? 'border-cyan-400/60 bg-cyan-500/20 text-cyan-100'
                          : 'border-aura-border bg-slate-900/70 text-slate-300 hover:bg-slate-900'
                      }`}
                    >
                      Light
                    </button>
                  </div>
                </div>

                <Toggle
                  label="Reduced Motion"
                  description="Soften visual transitions and animated effects."
                  enabled={settings.reducedMotion}
                  onToggle={() => update({ reducedMotion: !settings.reducedMotion })}
                />
              </div>
            </article>

            <article className="rounded-2xl border border-aura-border bg-slate-950/80 p-5">
              <h3 className="text-sm font-semibold text-slate-100">Privacy Defaults</h3>
              <p className="mt-1 text-xs text-slate-400">Set baseline consent behavior for local modules.</p>

              <div className="mt-4 space-y-3">
                <Toggle
                  label="Default Consent for Insights"
                  description="Pre-select consent off or on for Insights workflows."
                  enabled={settings.consentDefaults.insights}
                  onToggle={() =>
                    update({
                      consentDefaults: {
                        ...settings.consentDefaults,
                        insights: !settings.consentDefaults.insights
                      }
                    })
                  }
                />
                <Toggle
                  label="Default Consent for Marketplace"
                  description="Pre-select consent off or on for Marketplace sharing requests."
                  enabled={settings.consentDefaults.marketplace}
                  onToggle={() =>
                    update({
                      consentDefaults: {
                        ...settings.consentDefaults,
                        marketplace: !settings.consentDefaults.marketplace
                      }
                    })
                  }
                />
                <Toggle
                  label="Developer Mode"
                  description="Enable advanced troubleshooting and debug-level controls."
                  enabled={settings.developerMode}
                  onToggle={() => update({ developerMode: !settings.developerMode })}
                />
              </div>
            </article>
          </section>

          <section className="grid gap-4 xl:grid-cols-2">
            <article className="rounded-2xl border border-aura-border bg-slate-950/80 p-5">
              <h3 className="text-sm font-semibold text-slate-100">Storage & Locking</h3>
              <p className="mt-1 text-xs text-slate-400">Control local lock timing and persistence policy.</p>

              <label className="mt-4 block rounded-xl border border-aura-border/80 bg-slate-900/50 p-3">
                <span className="text-xs font-medium text-slate-100">Auto-lock timeout</span>
                <span className="mt-0.5 block text-[11px] text-slate-400">Minutes of inactivity before vault lock.</span>
                <select
                  className="mt-3 w-full rounded-lg border border-aura-border bg-slate-950/80 px-3 py-2 text-xs text-slate-100 outline-none focus:border-cyan-400/60"
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
                Settings are stored locally in your user profile and never sent externally.
              </p>
            </article>

            <article className="rounded-2xl border border-aura-border bg-slate-950/80 p-5">
              <h3 className="text-sm font-semibold text-slate-100">App Info</h3>
              <div className="mt-4 space-y-2 text-xs">
                <div className="flex items-center justify-between rounded-lg border border-aura-border/80 bg-slate-900/50 px-3 py-2">
                  <span className="text-slate-400">Product</span>
                  <span className="text-slate-100">{APP_NAME}</span>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-aura-border/80 bg-slate-900/50 px-3 py-2">
                  <span className="text-slate-400">Version</span>
                  <span className="text-slate-100">{packageJson.version || '0.1.0'}</span>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-aura-border/80 bg-slate-900/50 px-3 py-2">
                  <span className="text-slate-400">Mode</span>
                  <span className="text-slate-100">Local-first desktop</span>
                </div>
              </div>
            </article>
          </section>

          <section className="rounded-2xl border border-rose-500/30 bg-rose-500/5 p-5">
            <h3 className="text-sm font-semibold text-rose-100">Reset Defaults</h3>
            <p className="mt-1 text-xs text-rose-200/80">
              Restore all settings to local defaults. Your vault data remains unchanged.
            </p>
            <button
              type="button"
              onClick={handleReset}
              className="mt-4 rounded-lg border border-rose-400/40 bg-rose-500/15 px-3 py-2 text-xs font-medium text-rose-100 transition-colors hover:bg-rose-500/25"
            >
              Restore Defaults
            </button>
          </section>
        </>
      )}
    </div>
  );
}

export default Settings;
