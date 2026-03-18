const { ipcMain } = require('electron');
const Channels = require('../../shared/ipcChannels.cjs');

function registerMarketplaceIpc() {
  ipcMain.handle(Channels.MARKETPLACE_LIST_ITEMS, async () => {
    return { ok: true, items: [] };
  });

  ipcMain.handle(Channels.MARKETPLACE_GET_ITEM_DETAILS, async (_event, { id }) => {
    if (!id || typeof id !== 'string') return { ok: false, error: 'Invalid id', item: null };
    return { ok: true, item: null };
  });
}

module.exports = { registerMarketplaceIpc };
