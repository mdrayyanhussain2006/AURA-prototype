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
  SIDEBAR_WIDTH: 256,
  TOP_BAR_HEIGHT: 56
});

export const IPC_NAMESPACE = 'aura';

const Constants = Object.freeze({
  APP_NAME,
  APP_SCOPE,
  FEATURES,
  DEFAULTS,
  IPC_NAMESPACE
});

export default Constants;
