const { registerStorageIpc } = require('./storage');
const { registerAiIpc } = require('./ai');
const { registerEnvIpc } = require('./env');
const { registerAuthIpc } = require('./auth');
const { registerVaultIpc } = require('./vault');
const { registerInsightsIpc } = require('./insights');
const { registerMarketplaceIpc } = require('./marketplace');
const { registerConsentIpc } = require('./consent');
const { registerSecurityIpc } = require('./security');
const { registerSettingsIpc } = require('./settings');
const { registerDemoIpc } = require('./demo');

let ipcHandlersRegistered = false;

function registerIpcHandlers() {
  if (ipcHandlersRegistered) return;

  registerEnvIpc();
  registerStorageIpc();
  registerAiIpc();
  registerAuthIpc();
  registerVaultIpc();
  registerInsightsIpc();
  registerMarketplaceIpc();
  registerConsentIpc();
  registerSecurityIpc();
  registerSettingsIpc();
  registerDemoIpc();

  ipcHandlersRegistered = true;
}

module.exports = { registerIpcHandlers };

