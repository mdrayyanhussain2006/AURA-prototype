const { ipcMain } = require('electron');
const Channels = require('../../shared/ipcChannels.cjs');

function registerSecurityIpc() {
  ipcMain.handle(Channels.SECURITY_GET_STATUS, async () => {
    return { ok: true, status: { vaultLocked: false, lastUnlock: null } };
  });

  ipcMain.handle(Channels.SECURITY_GET_POLICIES, async () => {
    return { ok: true, policies: { localFirst: true, aiScoped: true } };
  });
}

module.exports = { registerSecurityIpc };
