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
    SIDEBAR_WIDTH: 256,
    TOP_BAR_HEIGHT: 56
  }),
  IPC_NAMESPACE: 'aura'
});