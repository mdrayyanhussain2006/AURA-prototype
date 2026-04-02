import React from 'react';

export default function SkeletonCard({ lines = 3, className = '' }) {
  return (
    <div
      aria-hidden="true"
      className={`rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl animate-pulse ${className}`}
    >
      {/* Title line */}
      <div className="aura-shimmer h-3 w-2/5 rounded-full bg-white/10 mb-4" />

      {/* Content lines */}
      <div className="space-y-3">
        {Array.from({ length: lines }, (_, i) => (
          <div
            key={i}
            className="aura-shimmer h-2.5 rounded-full bg-white/[0.07]"
            style={{ width: `${85 - i * 15}%` }}
          />
        ))}
      </div>

      {/* Bottom action area */}
      <div className="mt-5 flex items-center gap-3">
        <div className="aura-shimmer h-8 w-24 rounded-lg bg-white/[0.07]" />
        <div className="aura-shimmer h-8 w-16 rounded-lg bg-white/[0.05]" />
      </div>
    </div>
  );
}
