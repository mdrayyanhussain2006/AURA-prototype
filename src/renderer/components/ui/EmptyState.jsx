import React from 'react';

export default function EmptyState({
  icon,
  title = 'Nothing here yet',
  description = '',
  actionLabel = '',
  onAction = null,
  className = ''
}) {
  return (
    <div className={`flex flex-col items-center justify-center py-16 px-6 text-center ${className}`}>
      {icon ? (
        <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/[0.06] text-slate-400 shadow-inner">
          {icon}
        </div>
      ) : (
        <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/[0.06] shadow-inner">
          <svg className="w-8 h-8 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
        </div>
      )}
      <h3 className="text-base font-semibold text-slate-200">{title}</h3>
      {description && (
        <p className="mt-2 max-w-xs text-xs text-slate-400 leading-relaxed">{description}</p>
      )}
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="mt-5 rounded-xl bg-gradient-to-r from-purple-500/80 to-pink-500/80 px-5 py-2 text-xs font-semibold text-white shadow-lg transition-all duration-200 hover:scale-105 hover:shadow-[0_0_20px_rgba(168,85,247,0.4)]"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
