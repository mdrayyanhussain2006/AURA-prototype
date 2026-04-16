'use strict';

const { contextBridge, ipcRenderer } = require('electron');

// ──────────────────────────────────────────────
//  Channel constants — inlined because sandbox: true
//  blocks require() for relative modules.
//
//  These MUST match src/shared/ipcChannels.cjs exactly.
//  Run `node scripts/validate-channels.cjs` to verify sync.
// ──────────────────────────────────────────────

const CH = Object.freeze({
  VAULT_LIST_ITEMS: 'aura:vault:listItems',
  VAULT_GET_ITEM: 'aura:vault:getItem',
  VAULT_SAVE_ITEM: 'aura:vault:saveItem',
  VAULT_DELETE_ITEM: 'aura:vault:deleteItem',
  VAULT_EXPORT_ALL: 'aura:vault:exportAll',
  CONSENT_GET_ALL: 'aura:consent:getAll',
  CONSENT_UPDATE: 'aura:consent:update',
  DEMO_PING: 'aura:demo:ping',
  DEMO_GET_INFO: 'aura:demo:getInfo',
  INSIGHTS_GET_SUMMARY: 'aura:insights:getSummary',
  INSIGHTS_GET_ACTIVITY: 'aura:insights:getActivity',
  INSIGHTS_GET_SCORE_HISTORY: 'aura:insights:getScoreHistory',
  MARKETPLACE_LIST_ITEMS: 'aura:marketplace:listItems',
  MARKETPLACE_GET_ITEM_DETAILS: 'aura:marketplace:getItemDetails',
  SECURITY_GET_STATUS: 'aura:security:getStatus',
  SECURITY_GET_POLICIES: 'aura:security:getPolicies',
  SECURITY_ENABLE_GUARD: 'aura:security:enableGuard',
  SETTINGS_GET: 'aura:settings:get',
  SETTINGS_UPDATE: 'aura:settings:update',
  SETTINGS_RESET: 'aura:settings:reset',
  ENV_GET_PLATFORM: 'aura:env:getPlatform',
  AUTH_GET_SESSION: 'aura:auth:getSession',
  AUTH_LOGIN: 'aura:auth:login',
  AUTH_LOGOUT: 'aura:auth:logout',
  AUTH_STORE_TOKEN: 'aura:auth:storeToken',
  AUTH_GET_TOKEN: 'aura:auth:getToken',
  AUTH_CLEAR_TOKEN: 'aura:auth:clearToken',
  AUTH_INITIATE_GOOGLE: 'aura:auth:initiateGoogleAuth',
  AUTH_SESSION_CHANGED: 'aura:auth:sessionChanged',
  AI_RUN_ARCHIVE_ASSISTANT: 'aura:ai:runArchiveAssistant',
  STORAGE_SAVE_SECURE_ITEM: 'aura:storage:saveSecureItem',
  STORAGE_GET_SECURE_ITEM: 'aura:storage:getSecureItem'
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
//  Push listener registry — for Main→Renderer channels
// ──────────────────────────────────────────────

const pushListeners = new Map();

function registerPushListener(channel, callback) {
  if (typeof callback !== 'function') {
    throw new TypeError('Push listener callback must be a function');
  }

  // Wrap the callback to extract the data argument from ipcRenderer.on
  const wrapped = (_event, data) => callback(data);

  // Remove previous listener if any (prevent leaks)
  removePushListener(channel);

  pushListeners.set(channel, wrapped);
  ipcRenderer.on(channel, wrapped);
}

function removePushListener(channel) {
  const existing = pushListeners.get(channel);
  if (existing) {
    ipcRenderer.removeListener(channel, existing);
    pushListeners.delete(channel);
  }
}

// ──────────────────────────────────────────────
//  API surface — one source, one mapping, no magic
// ──────────────────────────────────────────────

const api = Object.freeze({
  auth: Object.freeze({
    getSession: () => safeInvoke(CH.AUTH_GET_SESSION),
    login: (p) => { assertObjectPayload(p, 'auth.login'); return safeInvoke(CH.AUTH_LOGIN, p); },
    logout: () => safeInvoke(CH.AUTH_LOGOUT),
    storeToken: (p) => { assertObjectPayload(p, 'auth.storeToken'); return safeInvoke(CH.AUTH_STORE_TOKEN, p); },
    getToken: () => safeInvoke(CH.AUTH_GET_TOKEN),
    clearToken: () => safeInvoke(CH.AUTH_CLEAR_TOKEN),
    initiateGoogleAuth: () => safeInvoke(CH.AUTH_INITIATE_GOOGLE),
    onSessionChanged: (callback) => registerPushListener(CH.AUTH_SESSION_CHANGED, callback),
    removeSessionListener: () => removePushListener(CH.AUTH_SESSION_CHANGED)
  }),

  ai: Object.freeze({
    runArchiveAssistant: (p) => { assertObjectPayload(p, 'ai.runArchiveAssistant'); return safeInvoke(CH.AI_RUN_ARCHIVE_ASSISTANT, p); }
  }),

  storage: Object.freeze({
    saveSecureItem: (p) => { assertObjectPayload(p, 'storage.saveSecureItem'); return safeInvoke(CH.STORAGE_SAVE_SECURE_ITEM, p); },
    getSecureItem: (p) => { assertObjectPayload(p, 'storage.getSecureItem'); return safeInvoke(CH.STORAGE_GET_SECURE_ITEM, p); }
  }),

  vault: Object.freeze({
    listItems: () => safeInvoke(CH.VAULT_LIST_ITEMS),
    getItem: (p) => { assertObjectPayload(p, 'vault.getItem'); return safeInvoke(CH.VAULT_GET_ITEM, p); },
    saveItem: (p) => { assertObjectPayload(p, 'vault.saveItem'); return safeInvoke(CH.VAULT_SAVE_ITEM, p); },
    deleteItem: (p) => { assertObjectPayload(p, 'vault.deleteItem'); return safeInvoke(CH.VAULT_DELETE_ITEM, p); },
    exportAll: () => safeInvoke(CH.VAULT_EXPORT_ALL)
  }),

  consent: Object.freeze({
    getAll: () => safeInvoke(CH.CONSENT_GET_ALL),
    update: (p) => { assertObjectPayload(p, 'consent.update'); return safeInvoke(CH.CONSENT_UPDATE, p); }
  }),

  demo: Object.freeze({
    ping: () => safeInvoke(CH.DEMO_PING),
    getInfo: () => safeInvoke(CH.DEMO_GET_INFO)
  }),

  insights: Object.freeze({
    getSummary: () => safeInvoke(CH.INSIGHTS_GET_SUMMARY),
    getActivity: (p) => { assertObjectPayload(p, 'insights.getActivity'); return safeInvoke(CH.INSIGHTS_GET_ACTIVITY, p); },
    getScoreHistory: (p) => { assertObjectPayload(p, 'insights.getScoreHistory'); return safeInvoke(CH.INSIGHTS_GET_SCORE_HISTORY, p); },
    // Push listener: Main process pushes health audit data every 30s
    onHealthUpdate: (callback) => registerPushListener(CH.INSIGHTS_GET_SUMMARY, callback),
    removeHealthListener: () => removePushListener(CH.INSIGHTS_GET_SUMMARY)
  }),

  marketplace: Object.freeze({
    listItems: () => safeInvoke(CH.MARKETPLACE_LIST_ITEMS),
    getItemDetails: (p) => { assertObjectPayload(p, 'marketplace.getItemDetails'); return safeInvoke(CH.MARKETPLACE_GET_ITEM_DETAILS, p); }
  }),

  security: Object.freeze({
    getStatus: () => safeInvoke(CH.SECURITY_GET_STATUS),
    getPolicies: () => safeInvoke(CH.SECURITY_GET_POLICIES),
    enableGuard: (p) => { assertObjectPayload(p, 'security.enableGuard'); return safeInvoke(CH.SECURITY_ENABLE_GUARD, p); }
  }),

  settings: Object.freeze({
    get: () => safeInvoke(CH.SETTINGS_GET),
    update: (p) => { assertObjectPayload(p, 'settings.update'); return safeInvoke(CH.SETTINGS_UPDATE, p); },
    reset: () => safeInvoke(CH.SETTINGS_RESET)
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
