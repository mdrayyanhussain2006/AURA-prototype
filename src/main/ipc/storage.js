const { ipcMain } = require('electron');
const Channels = require('../../shared/ipcChannels.cjs');

function registerHandler(channelName, handler) {
  if (!channelName) return;
  ipcMain.handle(channelName, handler);
}

/**
 * Register storage IPC handlers.
 *
 * NOTE: This is a secure stub. The actual implementation should:
 * - use a per-user vault key derived from a passphrase (or OS keychain)
 * - encrypt at rest (e.g., AES-GCM)
 * - authenticate requests and validate inputs
 * - store data in app.getPath('userData') or a user-selected vault location
 */
function registerStorageIpc() {
  registerHandler(Channels.STORAGE_SAVE_SECURE_ITEM, async (_event, { key, value }) => {
    if (typeof key !== 'string' || key.length === 0) return { ok: false, error: 'Invalid key' };

    // Placeholder: persist encrypted data
    void value;
    return { ok: false, error: 'Not implemented (encrypted storage stub)' };
  });

  registerHandler(Channels.STORAGE_GET_SECURE_ITEM, async (_event, { key }) => {
    if (typeof key !== 'string' || key.length === 0) return { ok: false, error: 'Invalid key' };

    return { ok: false, error: 'Not implemented (encrypted storage stub)', value: null };
  });
}

module.exports = { registerStorageIpc };

