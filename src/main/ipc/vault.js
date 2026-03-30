const { ipcMain, safeStorage } = require('electron');
const Channels = require('../../shared/ipcChannels.cjs');
const { getSessionState } = require('./auth');
const { readVaultItems, writeVaultItems } = require('../services/storage');
const { appendActivityEvent } = require('../services/activityLog');

/**
 * Helper: Encrypt string to Base64
 */
function encrypt(text) {
  if (!text) return '';
  // safeStorage.encryptString returns a Buffer
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


  // --- VAULT_LIST_ITEMS ---
  ipcMain.handle(Channels.VAULT_LIST_ITEMS, async () => {
    const session = getSessionState();
    // Demo bypass for controlled execution mode:
    // if (!session) {
    //   return { ok: false, error: 'Unauthorized: Please login to access the vault' };
    // }

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

  // --- VAULT_SAVE_ITEM ---
  ipcMain.handle(Channels.VAULT_SAVE_ITEM, async (_event, { id, payload }) => {
    const session = getSessionState();
    // Demo bypass for controlled execution mode:
    // if (!session) {
    //   return { ok: false, error: 'Unauthorized: Please login to access the vault' };
    // }

    try {
      const items = readVaultItems();
      const encryptedItem = {
        id: id || `aura_${Date.now()}`,
        encryptedTitle: encrypt(payload.title),
        encryptedContent: encrypt(payload.content),
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

  // --- VAULT_GET_ITEM ---
  ipcMain.handle(Channels.VAULT_GET_ITEM, async (_event, { id }) => {
    const session = getSessionState();
    // Demo bypass for controlled execution mode:
    // if (!session) return { ok: false, error: 'Unauthorized' };

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
}

function registerHandlers(ipcMainInstance) {
  // No-op if already registered
}

module.exports = { registerVaultIpc, registerHandlers };