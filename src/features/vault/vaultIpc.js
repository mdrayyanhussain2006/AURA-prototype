// src/features/vault/vaultIpc.js

/**
 * Fetches all items from the vault. 
 * Titles are decrypted by the main process for display.
 */
export async function listItems() {
  if (!window.aura?.vault?.listItems) {
    return { ok: false, error: 'Vault API unavailable' };
  }
  return window.aura.vault.listItems();
}

/**
 * Fetches a single item with full decrypted content.
 */
export async function getItem(id) {
  if (!window.aura?.vault?.getItem) {
    return { ok: false, error: 'Vault API unavailable' };
  }
  return window.aura.vault.getItem({ id });
}

/**
 * Encrypts and saves an item to the local aura_vault.json.
 * @param {string|null} id - Existing ID to update, or null for new.
 * @param {object} payload - { title, content, type }
 */
export async function saveItem(id, payload) {
  if (!window.aura?.vault?.saveItem) {
    return { ok: false, error: 'Vault API unavailable' };
  }
  return window.aura.vault.saveItem({ id, payload });
}