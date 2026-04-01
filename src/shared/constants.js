/**
 * Shared constants for main and renderer processes.
 * Use for app-wide values, feature names, and cross-process contracts.
 */

export const APP_NAME = 'AURA Desktop Vault';
export const APP_SCOPE = 'aura';

export const FEATURES = Object.freeze({
  AUTH: 'auth',
  VAULT: 'vault',
  INSIGHTS: 'insights',
  MARKETPLACE: 'marketplace',
  CONSENT: 'consent',
  SECURITY: 'security',
  SETTINGS: 'settings',
  DEMO: 'demo'
});

export const DEFAULTS = Object.freeze({
  SIDEBAR_WIDTH: 88,
  TOP_BAR_HEIGHT: 64
});

export const IPC_NAMESPACE = 'aura';

/**
 * THEME — Centralized design tokens for the "Hyper-Glass" UI.
 * All visual components MUST reference these values to maintain
 * brand consistency across the entire application.
 */
export const THEME = Object.freeze({
  // Layout
  SIDEBAR_WIDTH: 88,
  TOP_BAR_HEIGHT: 64,

  // Glass effects
  GLASS_BLUR: 'blur(18px)',
  GLASS_BLUR_XL: 'blur(24px)',
  GLASS_BG: 'rgba(255, 255, 255, 0.05)',
  GLASS_BORDER: 'rgba(255, 255, 255, 0.10)',
  GLASS_BG_PRIMARY: 'rgba(15, 23, 42, 0.20)',
  GLASS_BG_HOVER: 'rgba(255, 255, 255, 0.08)',

  // Neon accent colors
  NEON_PURPLE: '#a855f7',
  NEON_PINK: '#ec4899',
  NEON_EMERALD: '#34d399',
  NEON_CYAN: '#22d3ee',
  NEON_AMBER: '#fbbf24',
  NEON_ROSE: '#fb7185',

  // Gradients
  GRADIENT_PRIMARY: 'linear-gradient(135deg, #a855f7, #ec4899)',
  GRADIENT_SECURITY: 'linear-gradient(135deg, #34d399, #22d3ee)',
  GRADIENT_WARNING: 'linear-gradient(135deg, #fbbf24, #f97316)',
  GRADIENT_DANGER: 'linear-gradient(135deg, #f87171, #ef4444)',

  // Score level colors
  SCORE_STRONG: '#34d399',
  SCORE_MODERATE: '#fbbf24',
  SCORE_ATTENTION: '#f87171',

  // Surface colors
  SURFACE_DARK: '#020617',
  SURFACE_MID: '#0f172a',
  SURFACE_CARD: 'rgba(255, 255, 255, 0.04)'
});

const Constants = Object.freeze({
  APP_NAME,
  APP_SCOPE,
  FEATURES,
  DEFAULTS,
  IPC_NAMESPACE,
  THEME
});

export default Constants;
