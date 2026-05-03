const { ipcMain, safeStorage } = require('electron');
const Channels = require('../../shared/ipcChannels.cjs');
const { getSessionState } = require('./auth');
const { readVaultItems, writeVaultItems } = require('../services/storage');
const { appendActivityEvent } = require('../services/activityLog');
const { quickRedact } = require('../services/redactionGate');
const { VaultSaveItemSchema, VaultGetItemSchema, VaultDeleteItemSchema, validatePayload } = require('./schemas');
const { triggerHealthAudit } = require('../services/auditBridge');

function encrypt(text) {
  if (!text) return '';
  return safeStorage.encryptString(text).toString('base64');
}

function decrypt(base64Text) {
  if (!base64Text) return '';
  try {
    return safeStorage.decryptString(Buffer.from(base64Text, 'base64'));
  } catch (error) {
    console.error('AURA Vault Decryption Error:', error);
    throw new Error('OS_ACCESS_DENIED');
  }
}

function requireSession() {
  const session = getSessionState();
  if (!session) return { ok: false, error: 'AUTH_REQUIRED', code: 'AUTH_REQUIRED' };
  return null;
}

function registerVaultIpc() {
  if (!safeStorage.isEncryptionAvailable()) {
    console.error('[Vault] OS Keychain unavailable — vault encryption will not function.');
  }

  // --- VAULT_LIST_ITEMS ---
  ipcMain.handle(Channels.VAULT_LIST_ITEMS, async () => {
    const authError = requireSession();
    if (authError) return authError;
    try {
      const rawItems = await readVaultItems();
      const items = rawItems.map(item => ({
        id: item.id, title: decrypt(item.encryptedTitle), updatedAt: item.updatedAt, type: item.type
      }));
      await appendActivityEvent({ feature: 'Vault', action: 'list_items', target: 'vault', meta: { count: items.length } });
      return { ok: true, items };
    } catch (err) {
      if (err.message === 'INTEGRITY_VIOLATION') return { ok: false, error: 'Vault integrity check failed — data may have been tampered with' };
      return { ok: false, error: err.message === 'OS_ACCESS_DENIED' ? 'Access denied by System Keychain' : 'Failed to read vault' };
    }
  });

  // --- VAULT_SAVE_ITEM ---
  ipcMain.handle(Channels.VAULT_SAVE_ITEM, async (_event, rawPayload) => {
    const authError = requireSession();
    if (authError) return authError;
    const validation = validatePayload(VaultSaveItemSchema, rawPayload, 'VAULT_SAVE_ITEM');
    if (!validation.ok) return validation;
    const { id, payload } = validation.data;
    try {
      const titleRedaction = await quickRedact(payload.title);
      const contentRedaction = await quickRedact(payload.content);
      const allRedactions = [...titleRedaction.redactionSummary, ...contentRedaction.redactionSummary];
      if (allRedactions.length > 0) {
        await appendActivityEvent({ feature: 'RedactionGate', action: 'pii_scrubbed', target: 'vault_item', meta: { redactedTypes: allRedactions, itemId: id || 'new' } });
      }
      const items = await readVaultItems();
      const encryptedItem = {
        id: id || `aura_${Date.now()}`, encryptedTitle: encrypt(titleRedaction.redacted),
        encryptedContent: encrypt(contentRedaction.redacted), type: payload.type || 'note', updatedAt: new Date().toISOString()
      };
      const index = items.findIndex(i => i.id === id);
      if (index > -1) { items[index] = encryptedItem; } else { items.push(encryptedItem); }
      const writeOk = await writeVaultItems(items);
      if (!writeOk) return { ok: false, error: 'Failed to persist vault item' };
      await appendActivityEvent({ feature: 'Vault', action: index > -1 ? 'update_item' : 'create_item', target: 'vault_item', meta: { id: encryptedItem.id, type: encryptedItem.type } });
      triggerHealthAudit();
      return { ok: true, id: encryptedItem.id };
    } catch (err) { console.error('[Vault] Save failed:', err?.message ?? err); return { ok: false, error: 'Encryption failed: Could not secure data' }; }
  });

  // --- VAULT_GET_ITEM ---
  ipcMain.handle(Channels.VAULT_GET_ITEM, async (_event, rawPayload) => {
    const authError = requireSession();
    if (authError) return authError;
    const validation = validatePayload(VaultGetItemSchema, rawPayload, 'VAULT_GET_ITEM');
    if (!validation.ok) return validation;
    const { id } = validation.data;
    try {
      const items = await readVaultItems();
      const item = items.find(i => i.id === id);
      if (!item) return { ok: false, error: 'Item not found' };
      await appendActivityEvent({ feature: 'Vault', action: 'read_item', target: 'vault_item', meta: { id: item.id } });
      return { ok: true, item: { id: item.id, title: decrypt(item.encryptedTitle), content: decrypt(item.encryptedContent), updatedAt: item.updatedAt } };
    } catch (err) { console.error('[Vault] Get item failed:', err?.message ?? err); return { ok: false, error: 'Decryption failed' }; }
  });

  // --- VAULT_DELETE_ITEM ---
  ipcMain.handle(Channels.VAULT_DELETE_ITEM, async (_event, rawPayload) => {
    const authError = requireSession();
    if (authError) return authError;
    const validation = validatePayload(VaultDeleteItemSchema, rawPayload, 'VAULT_DELETE_ITEM');
    if (!validation.ok) return validation;
    const { id } = validation.data;
    try {
      const items = await readVaultItems();
      const index = items.findIndex(i => i.id === id);
      if (index === -1) return { ok: false, error: 'Item not found' };
      items.splice(index, 1);
      const writeOk = await writeVaultItems(items);
      if (!writeOk) return { ok: false, error: 'Failed to persist deletion' };
      await appendActivityEvent({ feature: 'Vault', action: 'delete_item', target: 'vault_item', meta: { id } });
      triggerHealthAudit();
      return { ok: true, id };
    } catch (err) { console.error('[Vault] Delete failed:', err?.message ?? err); return { ok: false, error: 'Failed to delete item' }; }
  });

  // --- VAULT_EXPORT_ALL ---
  ipcMain.handle(Channels.VAULT_EXPORT_ALL, async () => {
    const authError = requireSession();
    if (authError) return authError;
    try {
      const rawItems = await readVaultItems();
      const items = rawItems.map(item => ({
        id: item.id, title: decrypt(item.encryptedTitle), content: decrypt(item.encryptedContent), type: item.type, updatedAt: item.updatedAt
      }));
      await appendActivityEvent({ feature: 'Vault', action: 'export_all', target: 'vault', meta: { count: items.length } });
      return { ok: true, items };
    } catch (err) {
      if (err.message === 'INTEGRITY_VIOLATION') return { ok: false, error: 'Vault integrity check failed — data may have been tampered with' };
      return { ok: false, error: err.message === 'OS_ACCESS_DENIED' ? 'Access denied by System Keychain' : 'Failed to export vault' };
    }
  });
}

function registerHandlers(ipcMainInstance) { /* No-op — backward compat */ }

module.exports = { registerVaultIpc, registerHandlers };