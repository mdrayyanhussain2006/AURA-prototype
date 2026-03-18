const { ipcMain } = require('electron');
const Channels = require('../../shared/ipcChannels.cjs');

function registerInsightsIpc() {
  ipcMain.handle(Channels.INSIGHTS_GET_SUMMARY, async () => {
    return { ok: true, summary: { indexedCount: 0, integrityScore: 100 } };
  });

  ipcMain.handle(Channels.INSIGHTS_GET_ACTIVITY, async (_event, { limit }) => {
    const max = Math.min(Number(limit) || 10, 50);
    return { ok: true, activity: [] };
  });
}

module.exports = { registerInsightsIpc };
