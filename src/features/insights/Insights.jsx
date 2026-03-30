import React from 'react';
import { useInsights } from './useInsights';

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
  const primaryCategory = categoryEntries.length > 0 ? categoryEntries[0][0] : 'uncategorized';
  const insightText = data ? `You have ${data.totalItems} items. Most are ${primaryCategory}.` : '';

  return (
    <div className="space-y-6 p-2">
      <header className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl p-6">
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
              className="rounded-xl bg-cyan-500/20 px-3 py-2 text-xs font-medium text-cyan-200 transition-all hover:bg-cyan-500/30 active:scale-[0.98]"
            >
              Refresh
            </button>
            {consentRequired && (
              <button
                type="button"
                onClick={requestInsightsConsent}
                className="rounded-xl bg-emerald-500/20 px-3 py-2 text-xs font-medium text-emerald-200 transition-all hover:bg-emerald-500/30 active:scale-[0.98]"
              >
                Enable Consent
              </button>
            )}
          </div>
        </div>

        {consentRequired && (
          <div className="mt-4 rounded-xl border border-yellow-500/40 bg-yellow-500/10 px-3 py-2 text-xs text-yellow-200">
            Enable consent to use Insights.
          </div>
        )}
        {error && (
          <div className="mt-4 rounded-xl border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
            {error}
          </div>
        )}
      </header>

      {loading && !data ? (
        <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 text-sm text-slate-300">
          Loading Insights...
        </div>
      ) : data ? (
        <>
          <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl p-6">
            <h2 className="text-gray-400 text-sm">Total Vault Items</h2>
            <p className="text-3xl font-bold text-white mt-1">{data.totalItems}</p>
            <p className="text-sm text-cyan-300 mt-2">{data.smartInsightText || insightText}</p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl p-6">
              <h2 className="text-gray-400 text-sm mb-3">Categories</h2>

              {categoryEntries.length === 0 ? (
                <p className="text-sm text-gray-400">No categories detected yet.</p>
              ) : (
                categoryEntries.map(([key, val]) => (
                  <div key={key} className="flex justify-between text-sm mb-1 text-slate-200">
                    <span className="capitalize">{key}</span>
                    <span>{val}</span>
                  </div>
                ))
              )}
            </div>

            <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl p-6">
              <h2 className="text-gray-400 text-sm mb-3">Recent Activity</h2>

              {(data.recentActivity || []).length === 0 ? (
                <p className="text-sm text-gray-400">No recent updates found.</p>
              ) : (
                (data.recentActivity || []).map((item) => (
                  <div key={item.id} className="text-sm text-gray-300 mb-2">
                    <span className="text-slate-200 capitalize">{item.type || 'item'}</span> updated {item.updatedAt ? new Date(item.updatedAt).toLocaleString() : 'Unknown'}
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl p-6">
            <h2 className="text-gray-400 text-sm mb-3">AI-Like Highlights</h2>
            <div className="space-y-2 text-sm text-slate-200">
              {(data.aiHighlights || []).map((line) => (
                <p key={line}>{line}</p>
              ))}
            </div>
          </div>
        </>
      ) : (
        <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 text-sm text-slate-300">
          No insight data available yet.
        </div>
      )}
      </div>
  );
}

export default Insights;
