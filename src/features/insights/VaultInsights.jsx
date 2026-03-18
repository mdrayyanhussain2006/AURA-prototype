import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { analyzeVault } from './insightEngine';

export default function VaultInsights({ items = [] }) {
  const { totalItems, sensitiveCount, score, warnings, insightMessage } = useMemo(
    () => analyzeVault(items),
    [items]
  );

  return (
    <motion.article
      className="p-6 rounded-3xl bg-gradient-to-r from-green-400/20 to-cyan-400/20 backdrop-blur-xl border border-white/10 transition-all duration-300 hover:scale-[1.02]"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold">Vault Intelligence</h3>
          <p className="text-sm opacity-70">Local analysis of current vault metadata</p>
        </div>

        <div className="text-right flex items-center justify-end gap-3">
          <div className="relative flex items-center justify-center w-16 h-16 rounded-full bg-white/5 border border-white/10 shadow-[0_0_20px_rgba(52,211,153,0.15)] overflow-hidden">
            <div className="absolute inset-0 bg-emerald-400/20 blur-xl" />
            <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-white/10"
                strokeWidth="3"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className="text-emerald-400"
                strokeDasharray={`${Math.max(0, Math.min(100, score || 0))}, 100`}
                strokeWidth="3"
                strokeLinecap="round"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <p className="text-xl font-extrabold text-emerald-300 relative z-10">{score}</p>
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs opacity-70">Total Items</p>
          <p className="text-xl font-bold">{totalItems}</p>
        </div>
        <div>
          <p className="text-xs opacity-70">Sensitive Count</p>
          <p className="text-xl font-bold">{sensitiveCount}</p>
        </div>
      </div>

      {totalItems === 0 ? (
        <p className="mt-4 text-sm opacity-70">No data available for analysis</p>
      ) : (
        <div className="mt-4 space-y-2">
          <p className="text-xs opacity-70">Warnings</p>
          {warnings.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {warnings.map((warning) => (
                <span key={warning} className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  <svg className="w-3 h-3 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  {warning}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm opacity-70">No warnings detected</p>
          )}
        </div>
      )}

      <div className="mt-4">
        <p className="text-xs opacity-70">Insight Message</p>
        <p className="text-sm">{insightMessage}</p>
      </div>

      <p className="mt-4 text-xs opacity-70">Last scan: just now</p>
    </motion.article>
  );
}
