/**
 * AURA IPC Channel Contract — Single Source of Truth
 *
 * Every channel listed here MUST have a matching ipcMain.handle() in src/main/ipc/.
 * Every channel exposed in secure_preload.js MUST exist in this file.
 *
 * DO NOT create copies of this file. All imports must point here.
 */

module.exports = Object.freeze({
  // AI
  AI_RUN_ARCHIVE_ASSISTANT: 'aura:ai:runArchiveAssistant',

  // Auth
  AUTH_GET_SESSION: 'aura:auth:getSession',
  AUTH_LOGIN: 'aura:auth:login',
  AUTH_LOGOUT: 'aura:auth:logout',
  AUTH_STORE_TOKEN: 'aura:auth:storeToken',
  AUTH_GET_TOKEN: 'aura:auth:getToken',
  AUTH_CLEAR_TOKEN: 'aura:auth:clearToken',
  AUTH_INITIATE_GOOGLE: 'aura:auth:initiateGoogleAuth',
  AUTH_SESSION_CHANGED: 'aura:auth:sessionChanged',

  // Vault
  VAULT_LIST_ITEMS: 'aura:vault:listItems',
  VAULT_GET_ITEM: 'aura:vault:getItem',
  VAULT_SAVE_ITEM: 'aura:vault:saveItem',
  VAULT_DELETE_ITEM: 'aura:vault:deleteItem',
  VAULT_EXPORT_ALL: 'aura:vault:exportAll',

  // Consent
  CONSENT_GET_ALL: 'aura:consent:getAll',
  CONSENT_UPDATE: 'aura:consent:update',

  // Demo
  DEMO_PING: 'aura:demo:ping',
  DEMO_GET_INFO: 'aura:demo:getInfo',

  // Env
  ENV_GET_APP_NAME: 'aura:env:getAppName',
  ENV_GET_PLATFORM: 'aura:env:getPlatform',

  // Insights
  INSIGHTS_GET_SUMMARY: 'aura:insights:getSummary',
  INSIGHTS_GET_ACTIVITY: 'aura:insights:getActivity',
  INSIGHTS_GET_SCORE_HISTORY: 'aura:insights:getScoreHistory',

  // Marketplace
  MARKETPLACE_LIST_ITEMS: 'aura:marketplace:listItems',
  MARKETPLACE_GET_ITEM_DETAILS: 'aura:marketplace:getItemDetails',

  // Security
  SECURITY_GET_STATUS: 'aura:security:getStatus',
  SECURITY_GET_POLICIES: 'aura:security:getPolicies',
  SECURITY_ENABLE_GUARD: 'aura:security:enableGuard',

  // Settings
  SETTINGS_GET: 'aura:settings:get',
  SETTINGS_UPDATE: 'aura:settings:update',
  SETTINGS_RESET: 'aura:settings:reset',

  // Storage
  STORAGE_SAVE_SECURE_ITEM: 'aura:storage:saveSecureItem',
  STORAGE_GET_SECURE_ITEM: 'aura:storage:getSecureItem'
});