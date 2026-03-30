// src/shared/ipcChannels.js

/**
 * AURA IPC Channel Contract — Single Source of Truth
 */

const IPC_CHANNELS = Object.freeze({
  // Vault
  VAULT_LIST_ITEMS: 'aura:vault:listItems',
  VAULT_GET_ITEM: 'aura:vault:getItem',
  VAULT_SAVE_ITEM: 'aura:vault:saveItem',

  // Consent
  CONSENT_GET_ALL: 'aura:consent:getAll',
  CONSENT_UPDATE: 'aura:consent:update',

  // Demo
  DEMO_PING: 'aura:demo:ping',

  // Insights
  INSIGHTS_GET_SUMMARY: 'aura:insights:getSummary',

  // Security
  SECURITY_GET_STATUS: 'aura:security:getStatus',

  // Settings
  SETTINGS_GET: 'aura:settings:get',
  SETTINGS_UPDATE: 'aura:settings:update',
  SETTINGS_RESET: 'aura:settings:reset',

  // Env
  ENV_GET_PLATFORM: 'aura:env:getPlatform'
});

module.exports = IPC_CHANNELS;