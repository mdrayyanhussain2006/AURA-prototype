import React from 'react';

function SettingsPage() {
  return (
    <div className="space-y-4">
      <header>
        <h2 className="text-sm font-semibold text-slate-100">Settings</h2>
        <p className="text-xs text-slate-400">
          Configure encryption, vault behavior, and AI integration policies.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        <section className="rounded-xl border border-aura-border bg-slate-950/80 p-4 text-xs text-slate-200">
          <h3 className="text-xs font-semibold text-slate-100">Encryption</h3>
          <p className="mt-1 text-slate-400">
            Wire this panel into your key management and local encrypted storage module.
          </p>
          <div className="mt-3 space-y-2">
            <label className="flex items-center justify-between gap-3">
              <span>Require vault passphrase on startup</span>
              <span className="inline-flex h-5 w-9 items-center rounded-full bg-slate-800 px-0.5">
                <span className="h-4 w-4 rounded-full bg-emerald-400 translate-x-4" />
              </span>
            </label>
            <label className="flex items-center justify-between gap-3">
              <span>Auto-lock after inactivity</span>
              <span className="rounded border border-slate-800 px-2 py-0.5 text-[11px] text-slate-300">
                15 min
              </span>
            </label>
          </div>
        </section>

        <section className="rounded-xl border border-aura-border bg-slate-950/80 p-4 text-xs text-slate-200">
          <h3 className="text-xs font-semibold text-slate-100">AI Policies</h3>
          <p className="mt-1 text-slate-400">
            Future AI requests should respect these global policies before leaving the local sandbox.
          </p>
          <div className="mt-3 space-y-2">
            <label className="flex items-center justify-between gap-3">
              <span>Allow external AI APIs</span>
              <span className="inline-flex h-5 w-9 items-center rounded-full bg-slate-900 px-0.5">
                <span className="h-4 w-4 rounded-full bg-slate-600" />
              </span>
            </label>
            <label className="flex items-center justify-between gap-3">
              <span>Redact sensitive entities before sending</span>
              <span className="inline-flex h-5 w-9 items-center rounded-full bg-slate-800 px-0.5">
                <span className="h-4 w-4 rounded-full bg-emerald-400 translate-x-4" />
              </span>
            </label>
          </div>
        </section>
      </div>
    </div>
  );
}

export default SettingsPage;

