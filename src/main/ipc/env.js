const { ipcMain, app } = require('electron');
const Channels = require('../../shared/ipcChannels.cjs');

function registerEnvIpc() {
  ipcMain.handle(Channels.ENV_GET_APP_NAME, async () => {
    return { ok: true, name: app.getName() };
  });

  ipcMain.handle(Channels.ENV_GET_PLATFORM, async () => {
    return { ok: true, platform: process.platform };
  });
}

module.exports = { registerEnvIpc };
