import React from 'react';
import { motion } from 'framer-motion';
import { THEME } from '../../../shared/constants';

/**
 * SecurityScoreRing — Animated circular gauge for security score.
 *
 * Uses GRADIENT_SECURITY from the centralized theme for brand consistency.
 * Color transitions: red (<50) → amber (50-79) → emerald (80+)
 * Includes pulsing glow effect and animated stroke.
 *
 * Props:
 *   score: number (0–100)
 *   level: 'strong' | 'moderate' | 'attention'
 *   size: number (px)
 *   strokeWidth: number (px)
 *   label: string (optional bottom label)
 */
export default function SecurityScoreRing({
  score = 0,
  level = 'strong',
  size = 120,
  strokeWidth = 8,
  label = ''
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, score));
  const offset = circumference - (clamped / 100) * circumference;

  // Color based on score thresholds (using THEME tokens)
  const color =
    clamped >= 80
      ? THEME.SCORE_STRONG
      : clamped >= 50
        ? THEME.SCORE_MODERATE
        : THEME.SCORE_ATTENTION;

  const glowColor = `${color}50`;

  return (
    <div className="relative flex flex-col items-center justify-center">
      {/* Pulsing glow background */}
      <motion.div
        className="absolute rounded-full"
        style={{
          width: size + 16,
          height: size + 16,
          background: `radial-gradient(circle, ${glowColor} 0%, transparent 70%)`
        }}
        animate={{ opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
      />

      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="relative z-10"
        style={{ transform: 'rotate(-90deg)' }}
      >
        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={strokeWidth}
        />

        {/* Animated score arc */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
          style={{ filter: `drop-shadow(0 0 8px ${glowColor})` }}
        />
      </svg>

      {/* Center content */}
      <div className="absolute inset-0 z-20 flex flex-col items-center justify-center">
        <motion.span
          className="text-3xl font-extrabold text-white"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          {clamped}
        </motion.span>
        <span
          className="text-[10px] font-semibold uppercase tracking-widest capitalize"
          style={{ color }}
        >
          {level}
        </span>
      </div>

      {/* Optional bottom label */}
      {label && (
        <span className="mt-2 text-[10px] uppercase tracking-widest text-slate-400 relative z-10">
          {label}
        </span>
      )}
    </div>
  );
}
