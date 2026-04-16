import React from 'react';
import { motion } from 'framer-motion';
import { useInsights } from './useInsights';
import TrendChart from './TrendChart';
import GlassCard from '../../renderer/components/ui/GlassCard';
import SkeletonCard from '../../renderer/components/ui/SkeletonCard';
import EmptyState from '../../renderer/components/ui/EmptyState';

const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0 }
};

function CategoryBar({ name, count, maxCount }) {
  const pct = maxCount > 0 ? Math.round((count / maxCount) * 100) : 0;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-slate-200 capitalize">{name}</span>
        <span className="text-slate-400">{count}</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-white/[0.06] overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-purple-500 to-pink-500"
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}

function Insights() {
  const {
    data,
    loading,
    error,
    consentRequired,
    requestInsightsConsent,
    loadInsights
  } = useInsights();

  const categoryEntries = data ? Object.entries(data.categories || {}).sort((a, b) => b[1] - a[1]) : [];
  const maxCategoryCount = categoryEntries.length > 0 ? categoryEntries[0][1] : 0;

  return (
    <div className="space-y-6 p-2">
      {/* Header */}
      <GlassCard priority="primary" className="p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-white">Local Insights Engine</h2>
            <p className="text-xs text-slate-300 mt-1">
              AI-like analysis from local patterns, category grouping, and recent vault activity.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={loadInsights}
              className="rounded-xl border border-white/15 bg-white/10 px-4 py-2 text-xs font-medium text-white transition-all hover:bg-white/15 hover:scale-[1.02] active:scale-[0.98]"
            >
              Refresh
            </button>
            {consentRequired && (
              <button
                type="button"
                onClick={requestInsightsConsent}
                className="rounded-xl bg-emerald-500/20 border border-emerald-500/30 px-4 py-2 text-xs font-medium text-emerald-200 transition-all hover:bg-emerald-500/30 active:scale-[0.98]"
              >
                Enable Consent
              </button>
            )}
          </div>
        </div>

        {consentRequired && (
          <div className="mt-4 rounded-xl border border-yellow-500/40 bg-yellow-500/10 px-3 py-2 text-xs text-yellow-200">
            Enable consent to unlock smart suggestions and vault analytics.
          </div>
        )}
        {error && !consentRequired && (
          <div className="mt-4 rounded-xl border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
            {error}
          </div>
        )}
      </GlassCard>

      {/* Loading */}
      {loading && !data ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2, 3, 4].map((i) => <SkeletonCard key={i} lines={2} />)}
        </div>
      ) : consentRequired && !data ? (
        <GlassCard className="py-8">
          <EmptyState
            title="Insights require consent"
            description="Grant consent to the Insights Engine to analyze your vault data locally and provide smart suggestions."
            actionLabel="Enable Consent"
            onAction={requestInsightsConsent}
            icon={
              <svg className="w-8 h-8 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            }
          />
        </GlassCard>
      ) : data ? (
        <motion.div
          className="space-y-6"
          initial="hidden"
          animate="show"
          variants={{ show: { transition: { staggerChildren: 0.06 } } }}
        >
          {/* Total Items */}
          <motion.div variants={cardVariants}>
            <GlassCard className="p-6">
              <h3 className="text-slate-400 text-xs uppercase tracking-widest">Total Vault Items</h3>
              <p className="text-4xl font-bold text-white mt-2">{data.totalItems}</p>
              <p className="text-sm text-cyan-300/80 mt-2">
                {data.smartInsightText || `You have ${data.totalItems} items.`}
              </p>
            </GlassCard>
          </motion.div>

          {/* Score Trend Chart */}
          <motion.div variants={cardVariants}>
            <GlassCard className="p-5">
              <h3 className="text-slate-400 text-xs uppercase tracking-widest mb-4">Security Score Trend (7 Days)</h3>
              <TrendChart days={7} />
            </GlassCard>
          </motion.div>

          <motion.div variants={cardVariants} className="grid gap-4 md:grid-cols-2">
            {/* Categories */}
            <GlassCard className="p-5">
              <h3 className="text-slate-400 text-xs uppercase tracking-widest mb-4">Categories</h3>
              {categoryEntries.length === 0 ? (
                <p className="text-sm text-slate-500">No categories detected yet.</p>
              ) : (
                <div className="space-y-3">
                  {categoryEntries.map(([key, val]) => (
                    <CategoryBar key={key} name={key} count={val} maxCount={maxCategoryCount} />
                  ))}
                </div>
              )}
            </GlassCard>

            {/* Recent Activity */}
            <GlassCard className="p-5">
              <h3 className="text-slate-400 text-xs uppercase tracking-widest mb-4">Recent Activity</h3>
              {(data.recentActivity || []).length === 0 ? (
                <p className="text-sm text-slate-500">No recent updates found.</p>
              ) : (
                <div className="space-y-2">
                  {(data.recentActivity || []).map((item) => (
                    <div key={item.id} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
                      <span className="text-xs text-slate-200 capitalize">{item.type || 'item'}</span>
                      <span className="text-xs text-slate-500">
                        {item.updatedAt ? new Date(item.updatedAt).toLocaleDateString() : 'Unknown'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </GlassCard>
          </motion.div>

          {/* AI Highlights */}
          <motion.div variants={cardVariants}>
            <GlassCard className="p-5">
              <h3 className="text-slate-400 text-xs uppercase tracking-widest mb-4">AI-Like Highlights</h3>
              <div className="space-y-2">
                {(data.aiHighlights || []).map((line, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm text-slate-200">
                    <span className="text-purple-400 mt-0.5 shrink-0">✦</span>
                    <span>{line}</span>
                  </div>
                ))}
              </div>
            </GlassCard>
          </motion.div>
        </motion.div>
      ) : (
        <GlassCard className="py-8">
          <EmptyState
            title="No insight data available"
            description="Add items to your vault and enable consent to see analytics."
          />
        </GlassCard>
      )}
    </div>
  );
}

export default Insights;
