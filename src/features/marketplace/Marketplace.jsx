import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMarketplace } from './useMarketplace';
import GlassCard from '../../renderer/components/ui/GlassCard';
import SkeletonCard from '../../renderer/components/ui/SkeletonCard';
import EmptyState from '../../renderer/components/ui/EmptyState';

const STATUS_STYLES = {
  Ready: 'border-emerald-500/40 bg-emerald-500/15 text-emerald-300',
  Preview: 'border-amber-500/40 bg-amber-500/15 text-amber-300',
  Beta: 'border-cyan-500/40 bg-cyan-500/15 text-cyan-300'
};

const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0 }
};

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
    <div className="space-y-6 p-2">
      {/* Header */}
      <GlassCard priority="primary" className="p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-100">Marketplace</h2>
            <p className="mt-1 text-xs text-slate-300">
              Discover local modules, templates, and workflow accelerators.
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

      {/* Loading */}
      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3].map((i) => <SkeletonCard key={i} lines={3} />)}
        </div>
      ) : items.length === 0 ? (
        <GlassCard className="py-8">
          <EmptyState
            title="No marketplace modules available"
            description="Check back later for new local modules, templates, and workflow packs."
            icon={
              <svg className="w-8 h-8 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            }
          />
        </GlassCard>
      ) : (
        <motion.div
          className="grid gap-4 md:grid-cols-2 xl:grid-cols-3"
          initial="hidden"
          animate="show"
          variants={{ show: { transition: { staggerChildren: 0.06 } } }}
        >
          {items.map((item) => {
            const statusStyle = STATUS_STYLES[item.status] || STATUS_STYLES.Preview;
            return (
              <motion.div key={item.id} variants={cardVariants}>
                <GlassCard className="flex h-full flex-col justify-between p-5 transition-all duration-200 hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(56,189,248,0.12)]">
                  <div>
                    <div className="mb-3 flex items-start justify-between gap-2">
                      <h3 className="text-sm font-semibold text-slate-100">{item.title ?? item.id}</h3>
                      <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide ${statusStyle}`}>
                        {item.status ?? 'Preview'}
                      </span>
                    </div>
                    <p className="text-xs leading-relaxed text-slate-300">
                      {item.shortDescription ?? 'Description coming soon.'}
                    </p>
                    <p className="mt-3 text-[11px] uppercase tracking-wide text-purple-300/80">
                      {item.purpose ?? 'General utility'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleViewDetails(item.id)}
                    className="mt-4 rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-xs font-medium text-white transition-all hover:bg-white/15 hover:scale-[1.02] active:scale-[0.98]"
                    disabled={detailsLoadingId === item.id}
                  >
                    {detailsLoadingId === item.id ? 'Loading...' : item.actionLabel ?? 'View details'}
                  </button>
                </GlassCard>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      {/* Detail panel */}
      <AnimatePresence>
        {(details || detailsError) && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            <GlassCard priority="primary" className="p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-slate-100">
                  {details?.title || 'Item Details'}
                </h3>
                <button
                  type="button"
                  onClick={() => { setDetails(null); setDetailsError(null); }}
                  className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs text-slate-300 hover:bg-white/10 transition-colors"
                >
                  Close
                </button>
              </div>

              {detailsError ? (
                <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
                  {detailsError}
                </div>
              ) : details ? (
                <>
                  <p className="text-xs leading-relaxed text-slate-300">
                    {details.fullDescription ?? details.shortDescription ?? 'No detailed description available.'}
                  </p>
                  {Array.isArray(details.highlights) && details.highlights.length > 0 && (
                    <ul className="mt-3 space-y-1.5">
                      {details.highlights.map((line) => (
                        <li key={line} className="flex items-start gap-2 text-xs text-slate-300">
                          <span className="text-purple-400 mt-0.5">•</span>
                          <span>{line}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              ) : null}
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default Marketplace;
