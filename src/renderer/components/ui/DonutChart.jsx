import React from 'react';
import { motion } from 'framer-motion';

/**
 * DonutChart — SVG-based animated donut chart for data categorization.
 *
 * Props:
 *   segments: [{ label: string, value: number, color: string }]
 *   size: number (px)
 *   strokeWidth: number (px)
 *   showLegend: boolean
 */
export default function DonutChart({
  segments = [],
  size = 160,
  strokeWidth = 18,
  showLegend = true
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;
  const total = segments.reduce((sum, s) => sum + (s.value || 0), 0);

  // Build arc offsets
  let accumulated = 0;
  const arcs = segments.map((seg) => {
    const pct = total > 0 ? seg.value / total : 0;
    const dash = pct * circumference;
    const gap = circumference - dash;
    const offset = -(accumulated * circumference) + circumference * 0.25;
    accumulated += pct;
    return { ...seg, pct, dash, gap, offset };
  });

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {/* Background track */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth={strokeWidth}
          />

          {/* Segments */}
          {arcs.map((arc, i) => (
            <motion.circle
              key={arc.label || i}
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              stroke={arc.color}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeDasharray={`${arc.dash} ${arc.gap}`}
              strokeDashoffset={arc.offset}
              initial={{ strokeDasharray: `0 ${circumference}` }}
              animate={{ strokeDasharray: `${arc.dash} ${arc.gap}` }}
              transition={{ duration: 0.8, delay: i * 0.15, ease: 'easeOut' }}
              style={{ filter: `drop-shadow(0 0 6px ${arc.color}40)` }}
            />
          ))}
        </svg>

        {/* Center label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            className="text-2xl font-bold text-white"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            {total}
          </motion.span>
          <span className="text-[10px] uppercase tracking-widest text-slate-400">
            Total
          </span>
        </div>
      </div>

      {/* Legend */}
      {showLegend && arcs.length > 0 && (
        <div className="flex flex-wrap justify-center gap-3">
          {arcs.map((arc, i) => (
            <div key={arc.label || i} className="flex items-center gap-1.5">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: arc.color, boxShadow: `0 0 8px ${arc.color}60` }}
              />
              <span className="text-[11px] text-slate-300 capitalize">{arc.label}</span>
              <span className="text-[10px] text-slate-500">
                {total > 0 ? Math.round(arc.pct * 100) : 0}%
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
