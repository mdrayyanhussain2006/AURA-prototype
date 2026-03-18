import React from 'react';
import { useDemo } from './useDemo';

function Demo() {
  const { info, latency, error, ping, loadInfo } = useDemo();

  return (
    <div className="space-y-4">
      <header>
        <h2 className="text-sm font-semibold text-slate-100">Demo</h2>
        <p className="text-xs text-slate-400">Verify IPC and feature wiring.</p>
      </header>
      {error && (
        <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
          {error}
        </div>
      )}
      <div className="rounded-xl border border-aura-border bg-slate-950/80 p-4 space-y-4">
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={ping}
            className="rounded-md border border-aura-border bg-slate-800 px-3 py-1.5 text-xs text-slate-200 hover:bg-slate-700"
          >
            Ping main process
          </button>
          <button
            type="button"
            onClick={loadInfo}
            className="rounded-md border border-aura-border bg-slate-800 px-3 py-1.5 text-xs text-slate-200 hover:bg-slate-700"
          >
            Load info
          </button>
        </div>
        {latency != null && (
          <p className="text-xs text-slate-400">Last ping latency: <strong>{latency} ms</strong></p>
        )}
        {info && (
          <pre className="rounded-lg border border-slate-800 bg-slate-900/80 p-3 text-[11px] text-slate-300 overflow-auto">
            {JSON.stringify(info, null, 2)}
          </pre>
        )}
      </div>
    </div>
  );
}

export default Demo;
