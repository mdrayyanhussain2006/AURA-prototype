'use strict';

const { contextBridge, ipcRenderer } = require('electron');

let Channels;

try {
  Channels = require('../shared/ipcChannels.cjs');
} catch (err) {
  console.warn('[preload] ipcChannels fallback used');
  Channels = {
    VAULT_LIST_ITEMS: 'aura:vault:listItems',
    VAULT_GET_ITEM: 'aura:vault:getItem',
    VAULT_SAVE_ITEM: 'aura:vault:saveItem',
    CONSENT_GET_ALL: 'aura:consent:getAll',
    CONSENT_UPDATE: 'aura:consent:update',
    DEMO_PING: 'aura:demo:ping',
    MARKETPLACE_LIST_ITEMS: 'aura:marketplace:listItems',
    MARKETPLACE_GET_ITEM_DETAILS: 'aura:marketplace:getItemDetails',
    SECURITY_GET_STATUS: 'aura:security:getStatus',
    SECURITY_GET_POLICIES: 'aura:security:getPolicies',
    SETTINGS_GET: 'aura:settings:get',
    SETTINGS_UPDATE: 'aura:settings:update',
    SETTINGS_RESET: 'aura:settings:reset'
  };
}

console.log('[preload] loaded channels:', Object.keys(Channels));

const FALLBACK_CHANNELS = Object.freeze({
  VAULT_LIST_ITEMS: 'aura:vault:listItems',
  VAULT_GET_ITEM: 'aura:vault:getItem',
  VAULT_SAVE_ITEM: 'aura:vault:saveItem',
  CONSENT_GET_ALL: 'aura:consent:getAll',
  CONSENT_UPDATE: 'aura:consent:update',
  DEMO_PING: 'aura:demo:ping',
  INSIGHTS_GET_SUMMARY: 'aura:insights:getSummary',
  MARKETPLACE_LIST_ITEMS: 'aura:marketplace:listItems',
  MARKETPLACE_GET_ITEM_DETAILS: 'aura:marketplace:getItemDetails',
  SECURITY_GET_STATUS: 'aura:security:getStatus',
  SECURITY_GET_POLICIES: 'aura:security:getPolicies',
  SETTINGS_GET: 'aura:settings:get',
  SETTINGS_UPDATE: 'aura:settings:update',
  SETTINGS_RESET: 'aura:settings:reset',
  ENV_GET_PLATFORM: 'aura:env:getPlatform'
});

function resolveChannel(key) {
  const candidate = Channels && typeof Channels[key] === 'string' ? Channels[key] : '';
  return candidate || FALLBACK_CHANNELS[key];
}

const CHANNELS = Object.freeze({
  VAULT_LIST_ITEMS: resolveChannel('VAULT_LIST_ITEMS'),
  VAULT_GET_ITEM: resolveChannel('VAULT_GET_ITEM'),
  VAULT_SAVE_ITEM: resolveChannel('VAULT_SAVE_ITEM'),
  CONSENT_GET_ALL: resolveChannel('CONSENT_GET_ALL'),
  CONSENT_UPDATE: resolveChannel('CONSENT_UPDATE'),
  DEMO_PING: resolveChannel('DEMO_PING'),
  INSIGHTS_GET_SUMMARY: resolveChannel('INSIGHTS_GET_SUMMARY'),
  MARKETPLACE_LIST_ITEMS: resolveChannel('MARKETPLACE_LIST_ITEMS'),
  MARKETPLACE_GET_ITEM_DETAILS: resolveChannel('MARKETPLACE_GET_ITEM_DETAILS'),
  SECURITY_GET_STATUS: resolveChannel('SECURITY_GET_STATUS'),
  SECURITY_GET_POLICIES: resolveChannel('SECURITY_GET_POLICIES'),
  SETTINGS_GET: resolveChannel('SETTINGS_GET'),
  SETTINGS_UPDATE: resolveChannel('SETTINGS_UPDATE'),
  SETTINGS_RESET: resolveChannel('SETTINGS_RESET'),
  ENV_GET_PLATFORM: resolveChannel('ENV_GET_PLATFORM')
});

function assertIpcAvailable() {
  if (!ipcRenderer || typeof ipcRenderer.invoke !== 'function') {
    throw new Error('ipcRenderer.invoke is not available in preload');
  }
}

function assertObjectPayload(payload, methodName) {
  if (payload === null || typeof payload !== 'object' || Array.isArray(payload)) {
    throw new TypeError(`${methodName} expects an object payload`);
  }
}

function isStructuredCloneable(value) {
  if (value === undefined) return true;
  if (typeof structuredClone === 'function') {
    try {
      structuredClone(value);
      return true;
    } catch (err) {
      return false;
    }
  }
  return isPlainCloneable(value, new WeakSet());
}

function isPlainCloneable(value, seen) {
  if (value === null) return true;
  const valueType = typeof value;
  if (valueType === 'string' || valueType === 'number' || valueType === 'boolean' || valueType === 'bigint') {
    return true;
  }
  if (valueType === 'undefined') return true;
  if (valueType === 'function' || valueType === 'symbol') return false;
  if (valueType !== 'object') return false;
  if (seen.has(value)) return true;
  seen.add(value);
  if (Array.isArray(value)) {
    for (const entry of value) {
      if (!isPlainCloneable(entry, seen)) return false;
    }
    return true;
  }
  for (const entry of Object.values(value)) {
    if (!isPlainCloneable(entry, seen)) return false;
  }
  return true;
}

function wrapIpcError(err, channel) {
  const message = err instanceof Error ? err.message : String(err);
  const wrapped = new Error(`IPC invoke failed for ${channel}: ${message}`);
  wrapped.name = 'IpcInvokeError';
  wrapped.cause = err instanceof Error ? err : undefined;
  return wrapped;
}

async function safeInvoke(channel, payload, options = {}) {
  assertIpcAvailable();
  if (!channel || typeof channel !== 'string') {
    throw new Error('Invalid IPC channel');
  }

  const hasPayload = payload !== undefined;
  if (options.requirePayload && !hasPayload) {
    throw new TypeError(`Missing payload for ${channel}`);
  }
  if (hasPayload && !isStructuredCloneable(payload)) {
    throw new TypeError(`Unsafe payload for ${channel}`);
  }

  try {
    if (hasPayload) {
      return await ipcRenderer.invoke(channel, payload);
    }
    return await ipcRenderer.invoke(channel);
  } catch (err) {
    throw wrapIpcError(err, channel);
  }
}

function deepFreeze(value) {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
  Object.freeze(value);
  for (const entry of Object.values(value)) {
    deepFreeze(entry);
  }
  return value;
}

const api = deepFreeze({
  vault: {
    listItems: () => safeInvoke(CHANNELS.VAULT_LIST_ITEMS),
    getItem: (payload) => {
      assertObjectPayload(payload, 'vault.getItem');
      return safeInvoke(CHANNELS.VAULT_GET_ITEM, payload, { requirePayload: true });
    },
    saveItem: (payload) => {
      assertObjectPayload(payload, 'vault.saveItem');
      return safeInvoke(CHANNELS.VAULT_SAVE_ITEM, payload, { requirePayload: true });
    }
  },
  consent: {
    getAll: () => safeInvoke(CHANNELS.CONSENT_GET_ALL),
    update: (payload) => {
      assertObjectPayload(payload, 'consent.update');
      return safeInvoke(CHANNELS.CONSENT_UPDATE, payload, { requirePayload: true });
    }
  },
  demo: {
    ping: () => safeInvoke(CHANNELS.DEMO_PING)
  },
  insights: {
    getSummary: () => safeInvoke(CHANNELS.INSIGHTS_GET_SUMMARY)
  },
  marketplace: {
    listItems: () => safeInvoke(CHANNELS.MARKETPLACE_LIST_ITEMS),
    getItemDetails: (payload) => {
      assertObjectPayload(payload, 'marketplace.getItemDetails');
      return safeInvoke(CHANNELS.MARKETPLACE_GET_ITEM_DETAILS, payload, { requirePayload: true });
    }
  },
  security: {
    getStatus: () => safeInvoke(CHANNELS.SECURITY_GET_STATUS),
    getPolicies: () => safeInvoke(CHANNELS.SECURITY_GET_POLICIES)
  },
  settings: {
    get: () => safeInvoke(CHANNELS.SETTINGS_GET),
    update: (payload) => {
      assertObjectPayload(payload, 'settings.update');
      return safeInvoke(CHANNELS.SETTINGS_UPDATE, payload, { requirePayload: true });
    },
    reset: () => safeInvoke(CHANNELS.SETTINGS_RESET)
  },
  env: {
    getPlatform: () => safeInvoke(CHANNELS.ENV_GET_PLATFORM)
  }
});

if (process && process.contextIsolated) {
  contextBridge.exposeInMainWorld('aura', api);
} else {
  console.error('[secure_preload] contextIsolation is disabled; refusing to expose `aura` bridge.');
}
