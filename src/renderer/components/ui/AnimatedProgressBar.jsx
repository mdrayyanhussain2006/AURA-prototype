import React from 'react';
import { motion } from 'framer-motion';

/**
 * AnimatedProgressBar — Glass-style progress bar with optional neon glow.
 *
 * Props:
 *   value: number (0–100)
 *   label: string
 *   color: string (CSS color)
 *   showGlow: boolean
 *   height: number (px)
 */
export default function AnimatedProgressBar({
  value = 0,
  label = '',
  color = '#a855f7',
  showGlow = true,
  height = 8
}) {
  const clamped = Math.max(0, Math.min(100, value));

  return (
    <div className="space-y-1.5">
      {label && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-300">{label}</span>
          <span className="text-xs font-semibold text-slate-200">{clamped}%</span>
        </div>
      )}
      <div
        className="w-full rounded-full overflow-hidden"
        style={{
          height: `${height}px`,
          background: 'rgba(255, 255, 255, 0.06)'
        }}
      >
        <motion.div
          className="h-full rounded-full"
          style={{
            background: `linear-gradient(90deg, ${color}, ${color}cc)`,
            boxShadow: showGlow ? `0 0 12px ${color}60, 0 0 4px ${color}40` : 'none'
          }}
          initial={{ width: 0 }}
          animate={{ width: `${clamped}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}
