import React from 'react';
import { useMarketplace } from './useMarketplace';

function Marketplace() {
  const { items, loading, error } = useMarketplace();

  return (
    <div className="space-y-4">
      <header>
        <h2 className="text-sm font-semibold text-slate-100">Marketplace</h2>
        <p className="text-xs text-slate-400">Discover templates, lenses, and add-ons.</p>
      </header>
      {error && (
        <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
          {error}
        </div>
      )}
      <div className="rounded-xl border border-aura-border bg-slate-950/80 p-4">
        {loading ? (
          <p className="text-xs text-slate-400">Loading marketplace…</p>
        ) : items.length === 0 ? (
          <p className="text-xs text-slate-400">No items available. Simulation mode.</p>
        ) : (
          <ul className="space-y-2 text-xs text-slate-300">
            {items.map((item) => (
              <li key={item.id}>{item.name ?? item.id}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default Marketplace;
