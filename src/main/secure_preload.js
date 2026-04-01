'use strict';

const { contextBridge, ipcRenderer } = require('electron');

// ──────────────────────────────────────────────
//  Channel constants — inlined because sandbox: true
//  blocks require() for relative modules.
//
//  These MUST match src/shared/ipcChannels.cjs exactly.
//  If you add a channel there, add it here too.
// ──────────────────────────────────────────────

const CH = Object.freeze({
  VAULT_LIST_ITEMS:           'aura:vault:listItems',
  VAULT_GET_ITEM:             'aura:vault:getItem',
  VAULT_SAVE_ITEM:            'aura:vault:saveItem',
  VAULT_DELETE_ITEM:          'aura:vault:deleteItem',
  VAULT_EXPORT_ALL:           'aura:vault:exportAll',
  CONSENT_GET_ALL:            'aura:consent:getAll',
  CONSENT_UPDATE:             'aura:consent:update',
  DEMO_PING:                  'aura:demo:ping',
  INSIGHTS_GET_SUMMARY:       'aura:insights:getSummary',
  MARKETPLACE_LIST_ITEMS:     'aura:marketplace:listItems',
  MARKETPLACE_GET_ITEM_DETAILS: 'aura:marketplace:getItemDetails',
  SECURITY_GET_STATUS:        'aura:security:getStatus',
  SECURITY_GET_POLICIES:      'aura:security:getPolicies',
  SETTINGS_GET:               'aura:settings:get',
  SETTINGS_UPDATE:            'aura:settings:update',
  SETTINGS_RESET:             'aura:settings:reset',
  ENV_GET_PLATFORM:           'aura:env:getPlatform'
});

// ──────────────────────────────────────────────
//  Helpers
// ──────────────────────────────────────────────

function assertObjectPayload(payload, methodName) {
  if (payload === null || typeof payload !== 'object' || Array.isArray(payload)) {
    throw new TypeError(`${methodName} expects an object payload`);
  }
}

function isPlainCloneable(value, seen) {
  if (value === null) return true;
  const t = typeof value;
  if (t === 'string' || t === 'number' || t === 'boolean' || t === 'bigint' || t === 'undefined') return true;
  if (t === 'function' || t === 'symbol') return false;
  if (t !== 'object') return false;
  if (seen.has(value)) return true;
  seen.add(value);
  if (Array.isArray(value)) {
    for (const entry of value) { if (!isPlainCloneable(entry, seen)) return false; }
    return true;
  }
  for (const entry of Object.values(value)) { if (!isPlainCloneable(entry, seen)) return false; }
  return true;
}

function isStructuredCloneable(value) {
  if (value === undefined) return true;
  if (typeof structuredClone === 'function') {
    try { structuredClone(value); return true; } catch (_e) { return false; }
  }
  return isPlainCloneable(value, new WeakSet());
}

async function safeInvoke(channel, payload) {
  if (!ipcRenderer || typeof ipcRenderer.invoke !== 'function') {
    throw new Error('ipcRenderer.invoke is not available');
  }
  if (!channel || typeof channel !== 'string') {
    throw new Error('Invalid IPC channel');
  }
  if (payload !== undefined && !isStructuredCloneable(payload)) {
    throw new TypeError(`Unsafe payload for ${channel}`);
  }
  try {
    return payload !== undefined
      ? await ipcRenderer.invoke(channel, payload)
      : await ipcRenderer.invoke(channel);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    const wrapped = new Error(`IPC invoke failed for ${channel}: ${msg}`);
    wrapped.name = 'IpcInvokeError';
    wrapped.cause = err instanceof Error ? err : undefined;
    throw wrapped;
  }
}

// ──────────────────────────────────────────────
//  API surface — one source, one mapping, no magic
// ──────────────────────────────────────────────

const api = Object.freeze({
  vault: Object.freeze({
    listItems:  () => safeInvoke(CH.VAULT_LIST_ITEMS),
    getItem:    (p) => { assertObjectPayload(p, 'vault.getItem');    return safeInvoke(CH.VAULT_GET_ITEM, p); },
    saveItem:   (p) => { assertObjectPayload(p, 'vault.saveItem');   return safeInvoke(CH.VAULT_SAVE_ITEM, p); },
    deleteItem: (p) => { assertObjectPayload(p, 'vault.deleteItem'); return safeInvoke(CH.VAULT_DELETE_ITEM, p); },
    exportAll:  () => safeInvoke(CH.VAULT_EXPORT_ALL)
  }),

  consent: Object.freeze({
    getAll: () => safeInvoke(CH.CONSENT_GET_ALL),
    update: (p) => { assertObjectPayload(p, 'consent.update'); return safeInvoke(CH.CONSENT_UPDATE, p); }
  }),

  demo: Object.freeze({
    ping: () => safeInvoke(CH.DEMO_PING)
  }),

  insights: Object.freeze({
    getSummary: () => safeInvoke(CH.INSIGHTS_GET_SUMMARY)
  }),

  marketplace: Object.freeze({
    listItems:      () => safeInvoke(CH.MARKETPLACE_LIST_ITEMS),
    getItemDetails: (p) => { assertObjectPayload(p, 'marketplace.getItemDetails'); return safeInvoke(CH.MARKETPLACE_GET_ITEM_DETAILS, p); }
  }),

  security: Object.freeze({
    getStatus:   () => safeInvoke(CH.SECURITY_GET_STATUS),
    getPolicies: () => safeInvoke(CH.SECURITY_GET_POLICIES)
  }),

  settings: Object.freeze({
    get:    () => safeInvoke(CH.SETTINGS_GET),
    update: (p) => { assertObjectPayload(p, 'settings.update'); return safeInvoke(CH.SETTINGS_UPDATE, p); },
    reset:  () => safeInvoke(CH.SETTINGS_RESET)
  }),

  env: Object.freeze({
    getPlatform: () => safeInvoke(CH.ENV_GET_PLATFORM)
  })
});

// ──────────────────────────────────────────────
//  Expose — context isolation required
// ──────────────────────────────────────────────

if (process && process.contextIsolated) {
  contextBridge.exposeInMainWorld('aura', api);
  console.log('[secure_preload] aura bridge exposed:', Object.keys(api));
} else {
  console.error('[secure_preload] contextIsolation is disabled; refusing to expose aura bridge.');
}
