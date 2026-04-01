const { ipcMain, safeStorage } = require('electron');
const Channels = require('../../shared/ipcChannels.cjs');
const { getSessionState } = require('./auth');
const { readVaultItems, writeVaultItems } = require('../services/storage');
const { appendActivityEvent } = require('../services/activityLog');
const { quickRedact } = require('../services/redactionGate');
const {
  VaultSaveItemSchema,
  VaultGetItemSchema,
  VaultDeleteItemSchema,
  validatePayload
} = require('./schemas');

/**
 * Helper: Encrypt string to Base64 via OS Keychain (DPAPI / Keychain)
 */
function encrypt(text) {
  if (!text) return '';
  const encryptedBuffer = safeStorage.encryptString(text);
  return encryptedBuffer.toString('base64');
}

/**
 * Helper: Decrypt Base64 to string
 * Wraps safeStorage in try/catch to handle OS Keychain/DPAPI access denial
 */
function decrypt(base64Text) {
  if (!base64Text) return '';
  try {
    const buffer = Buffer.from(base64Text, 'base64');
    return safeStorage.decryptString(buffer);
  } catch (error) {
    console.error('AURA Vault Decryption Error:', error);
    throw new Error('OS_ACCESS_DENIED');
  }
}

function registerVaultIpc() {

  // ── Startup guard: Verify OS Keychain is available ──
  if (!safeStorage.isEncryptionAvailable()) {
    console.error('[Vault] OS Keychain unavailable — vault encryption will not function.');
  }

  // --- VAULT_LIST_ITEMS ---
  ipcMain.handle(Channels.VAULT_LIST_ITEMS, async () => {
    try {
      const rawItems = readVaultItems();
      // Decrypt titles for the UI list, but do NOT decrypt content here (performance/security)
      const items = rawItems.map(item => ({
        id: item.id,
        title: decrypt(item.encryptedTitle),
        updatedAt: item.updatedAt,
        type: item.type
      }));

      appendActivityEvent({
        feature: 'Vault',
        action: 'list_items',
        target: 'vault',
        meta: { count: items.length }
      });

      return { ok: true, items };
    } catch (err) {
      const message = err.message === 'OS_ACCESS_DENIED'
        ? 'Access denied by System Keychain'
        : 'Failed to read vault';
      return { ok: false, error: message };
    }
  });

  // --- VAULT_SAVE_ITEM (with Zod Validation + Redaction Privacy Gate) ---
  ipcMain.handle(Channels.VAULT_SAVE_ITEM, async (_event, rawPayload) => {
    // ── Step 1: Schema validation ──
    const validation = validatePayload(VaultSaveItemSchema, rawPayload, 'VAULT_SAVE_ITEM');
    if (!validation.ok) return validation;

    const { id, payload } = validation.data;

    try {
      // ── Step 2: Redaction Privacy Gate ──
      // Scrub PII BEFORE encryption — even if the renderer already redacted,
      // the server-side gate is the authoritative defense.
      const titleRedaction = quickRedact(payload.title);
      const contentRedaction = quickRedact(payload.content);

      const redactedTitle = titleRedaction.redacted;
      const redactedContent = contentRedaction.redacted;

      // Log redaction activity if anything was scrubbed
      const allRedactions = [...titleRedaction.redactionSummary, ...contentRedaction.redactionSummary];
      if (allRedactions.length > 0) {
        appendActivityEvent({
          feature: 'RedactionGate',
          action: 'pii_scrubbed',
          target: 'vault_item',
          meta: { redactedTypes: allRedactions, itemId: id || 'new' }
        });
      }

      // ── Step 3: Encrypt and persist ──
      const items = readVaultItems();
      const encryptedItem = {
        id: id || `aura_${Date.now()}`,
        encryptedTitle: encrypt(redactedTitle),
        encryptedContent: encrypt(redactedContent),
        type: payload.type || 'note',
        updatedAt: new Date().toISOString()
      };

      const index = items.findIndex(i => i.id === id);
      if (index > -1) {
        items[index] = encryptedItem;
      } else {
        items.push(encryptedItem);
      }

      const writeOk = writeVaultItems(items);
      if (!writeOk) {
        return { ok: false, error: 'Failed to persist vault item' };
      }

      appendActivityEvent({
        feature: 'Vault',
        action: index > -1 ? 'update_item' : 'create_item',
        target: 'vault_item',
        meta: { id: encryptedItem.id, type: encryptedItem.type }
      });

      return { ok: true, id: encryptedItem.id };
    } catch (err) {
      return { ok: false, error: 'Encryption failed: Could not secure data' };
    }
  });

  // --- VAULT_GET_ITEM (with Zod Validation) ---
  ipcMain.handle(Channels.VAULT_GET_ITEM, async (_event, rawPayload) => {
    const validation = validatePayload(VaultGetItemSchema, rawPayload, 'VAULT_GET_ITEM');
    if (!validation.ok) return validation;

    const { id } = validation.data;

    try {
      const items = readVaultItems();
      const item = items.find(i => i.id === id);
      if (!item) return { ok: false, error: 'Item not found' };

      appendActivityEvent({
        feature: 'Vault',
        action: 'read_item',
        target: 'vault_item',
        meta: { id: item.id }
      });

      return {
        ok: true,
        item: {
          id: item.id,
          title: decrypt(item.encryptedTitle),
          content: decrypt(item.encryptedContent),
          updatedAt: item.updatedAt
        }
      };
    } catch (err) {
      return { ok: false, error: 'Decryption failed' };
    }
  });

  // --- VAULT_DELETE_ITEM (with Zod Validation) ---
  ipcMain.handle(Channels.VAULT_DELETE_ITEM, async (_event, rawPayload) => {
    const validation = validatePayload(VaultDeleteItemSchema, rawPayload, 'VAULT_DELETE_ITEM');
    if (!validation.ok) return validation;

    const { id } = validation.data;

    try {
      const items = readVaultItems();
      const index = items.findIndex(i => i.id === id);
      if (index === -1) return { ok: false, error: 'Item not found' };

      items.splice(index, 1);
      const writeOk = writeVaultItems(items);
      if (!writeOk) {
        return { ok: false, error: 'Failed to persist deletion' };
      }

      appendActivityEvent({
        feature: 'Vault',
        action: 'delete_item',
        target: 'vault_item',
        meta: { id }
      });

      return { ok: true, id };
    } catch (err) {
      return { ok: false, error: 'Failed to delete item' };
    }
  });

  // --- VAULT_EXPORT_ALL ---
  ipcMain.handle(Channels.VAULT_EXPORT_ALL, async () => {
    try {
      const rawItems = readVaultItems();
      const items = rawItems.map(item => ({
        id: item.id,
        title: decrypt(item.encryptedTitle),
        content: decrypt(item.encryptedContent),
        type: item.type,
        updatedAt: item.updatedAt
      }));

      appendActivityEvent({
        feature: 'Vault',
        action: 'export_all',
        target: 'vault',
        meta: { count: items.length }
      });

      return { ok: true, items };
    } catch (err) {
      const message = err.message === 'OS_ACCESS_DENIED'
        ? 'Access denied by System Keychain'
        : 'Failed to export vault';
      return { ok: false, error: message };
    }
  });
}

function registerHandlers(ipcMainInstance) {
  // No-op — kept for backward compatibility with main.js startup
}

module.exports = { registerVaultIpc, registerHandlers };