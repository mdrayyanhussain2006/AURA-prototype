const { ipcMain } = require('electron');
const Channels = require('../../shared/ipcChannels.cjs');
const Constants = require('../../shared/constants.cjs');

function registerDemoIpc() {
  ipcMain.handle(Channels.DEMO_PING, async () => {
    return { ok: true, pong: Date.now() };
  });

  ipcMain.handle(Channels.DEMO_GET_INFO, async () => {
    return {
      ok: true,
      info: {
        version: '0.1.0',
        appName: Constants.APP_NAME,
        features: Object.values(Constants.FEATURES)
      }
    };
  });
}

module.exports = { registerDemoIpc };
