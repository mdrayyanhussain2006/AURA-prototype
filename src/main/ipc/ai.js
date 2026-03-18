const { ipcMain } = require('electron');
const Channels = require('../../shared/ipcChannels.cjs');

/**
 * Register AI IPC handlers.
 *
 * NOTE: Keep API keys out of the renderer process.
 * When you integrate an AI provider, do it here in main (or in a separate local service),
 * and expose only the minimum capabilities via IPC.
 */
function registerAiIpc() {
  ipcMain.handle(Channels.AI_RUN_ARCHIVE_ASSISTANT, async (_event, { payload }) => {
    void payload;
    return {
      ok: false,
      error: 'Not implemented (AI stub)',
      result: { message: 'AI integration not yet wired. This is a safe placeholder.' }
    };
  });
}

module.exports = { registerAiIpc };

