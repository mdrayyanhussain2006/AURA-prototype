const { ipcMain, app } = require('electron');
const Channels = require('../../shared/ipcChannels.cjs');

function registerHandler(channelName, handler) {
  if (!channelName) return;
  ipcMain.handle(channelName, handler);
}

function registerEnvIpc() {
  registerHandler('aura:env:getAppName', async () => {
    return app.getName();
  });

  registerHandler('aura:env:getPlatform', async () => {
    return process.platform;
  });
}

module.exports = { registerEnvIpc };

