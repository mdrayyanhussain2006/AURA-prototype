import React from 'react';

export default function GlassCard({ children, className = '', priority = 'secondary', as: Component = 'div' }) {
  const tone = priority === 'primary' ? 'bg-slate-950/20' : 'bg-white/5';

  return (
    <Component
      className={`rounded-3xl border border-white/10 ${tone} shadow-2xl backdrop-blur-xl ${className}`.trim()}
    >
      {children}
    </Component>
  );
}
