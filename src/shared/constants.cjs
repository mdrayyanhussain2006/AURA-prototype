module.exports = Object.freeze({
  APP_NAME: 'AURA Desktop Vault',
  APP_SCOPE: 'aura',
  FEATURES: Object.freeze({
    AUTH: 'auth',
    VAULT: 'vault',
    INSIGHTS: 'insights',
    MARKETPLACE: 'marketplace',
    CONSENT: 'consent',
    SECURITY: 'security',
    SETTINGS: 'settings',
    DEMO: 'demo'
  }),
  DEFAULTS: Object.freeze({
    SIDEBAR_WIDTH: 88,
    TOP_BAR_HEIGHT: 64
  }),
  IPC_NAMESPACE: 'aura',
  THEME: Object.freeze({
    SIDEBAR_WIDTH: 88,
    TOP_BAR_HEIGHT: 64,
    GLASS_BLUR: 'blur(18px)',
    GLASS_BLUR_XL: 'blur(24px)',
    GLASS_BG: 'rgba(255, 255, 255, 0.05)',
    GLASS_BORDER: 'rgba(255, 255, 255, 0.10)',
    GLASS_BG_PRIMARY: 'rgba(15, 23, 42, 0.20)',
    GLASS_BG_HOVER: 'rgba(255, 255, 255, 0.08)',
    NEON_PURPLE: '#a855f7',
    NEON_PINK: '#ec4899',
    NEON_EMERALD: '#34d399',
    NEON_CYAN: '#22d3ee',
    NEON_AMBER: '#fbbf24',
    NEON_ROSE: '#fb7185',
    GRADIENT_PRIMARY: 'linear-gradient(135deg, #a855f7, #ec4899)',
    GRADIENT_SECURITY: 'linear-gradient(135deg, #34d399, #22d3ee)',
    GRADIENT_WARNING: 'linear-gradient(135deg, #fbbf24, #f97316)',
    GRADIENT_DANGER: 'linear-gradient(135deg, #f87171, #ef4444)',
    SCORE_STRONG: '#34d399',
    SCORE_MODERATE: '#fbbf24',
    SCORE_ATTENTION: '#f87171',
    SURFACE_DARK: '#020617',
    SURFACE_MID: '#0f172a',
    SURFACE_CARD: 'rgba(255, 255, 255, 0.04)'
  })
});