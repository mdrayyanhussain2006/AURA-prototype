import React from 'react';
import { useMarketplace } from './useMarketplace';

function Marketplace() {
  const { items, loading, error, refresh, getItemDetails } = useMarketplace();
  const [details, setDetails] = React.useState(null);
  const [detailsError, setDetailsError] = React.useState(null);
  const [detailsLoadingId, setDetailsLoadingId] = React.useState('');

  const handleViewDetails = React.useCallback(
    async (id) => {
      setDetailsError(null);
      setDetailsLoadingId(id);

      const res = await getItemDetails(id);
      if (res.ok) {
        setDetails(res.item);
      } else {
        setDetails(null);
        setDetailsError(res.error ?? 'Failed to load item details');
      }

      setDetailsLoadingId('');
    },
    [getItemDetails]
  );

  return (
    <div className="space-y-4">
      <header className="rounded-2xl border border-aura-border bg-slate-950/70 p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-slate-100">Marketplace</h2>
            <p className="text-xs text-slate-400">Discover local modules, templates, and workflow accelerators.</p>
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
          <div className="mt-3 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
            {error}
          </div>
        )}
      </header>

      {loading ? (
        <div className="rounded-xl border border-aura-border bg-slate-950/80 p-4 text-xs text-slate-400">
          Loading marketplace items...
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-aura-border bg-slate-950/80 p-4 text-xs text-slate-400">
          No marketplace items available yet.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => (
            <article
              key={item.id}
              className="flex h-full flex-col justify-between rounded-xl border border-aura-border bg-slate-950/80 p-4"
            >
              <div>
                <div className="mb-2 flex items-start justify-between gap-2">
                  <h3 className="text-sm font-semibold text-slate-100">{item.title ?? item.id}</h3>
                  <span className="rounded-full border border-slate-700 bg-slate-900 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-slate-300">
                    {item.status ?? 'Preview'}
                  </span>
                </div>

                <p className="text-xs leading-relaxed text-slate-300">
                  {item.shortDescription ?? 'Description coming soon.'}
                </p>

                <p className="mt-3 text-[11px] uppercase tracking-wide text-cyan-300/80">
                  {item.purpose ?? 'General utility'}
                </p>
              </div>

              <button
                type="button"
                onClick={() => handleViewDetails(item.id)}
                className="mt-4 rounded-lg border border-cyan-400/30 bg-cyan-500/10 px-3 py-2 text-xs font-medium text-cyan-200 transition-colors hover:bg-cyan-500/20"
                disabled={detailsLoadingId === item.id}
              >
                {detailsLoadingId === item.id ? 'Loading...' : item.actionLabel ?? 'View details'}
              </button>
            </article>
          ))}
        </div>
      )}

      {(details || detailsError) && (
        <section className="rounded-xl border border-aura-border bg-slate-950/80 p-4">
          <h3 className="text-sm font-semibold text-slate-100">Marketplace Item Details</h3>

          {detailsError ? (
            <div className="mt-3 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
              {detailsError}
            </div>
          ) : details ? (
            <>
              <p className="mt-3 text-xs leading-relaxed text-slate-300">
                {details.fullDescription ?? details.shortDescription ?? 'No detailed description available.'}
              </p>

              {Array.isArray(details.highlights) && details.highlights.length > 0 && (
                <ul className="mt-3 space-y-1 text-xs text-slate-300">
                  {details.highlights.map((line) => (
                    <li key={line}>- {line}</li>
                  ))}
                </ul>
              )}
            </>
          ) : null}
        </section>
      )}
    </div>
  );
}

export default Marketplace;
