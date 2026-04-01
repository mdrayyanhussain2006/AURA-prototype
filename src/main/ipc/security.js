const { ipcMain, safeStorage } = require('electron');
const Channels = require('../../shared/ipcChannels.cjs');
const { defaultBrowserWindowOptions } = require('../security');
const { ensureOfflineCapable } = require('../services/offlineGuard');

function getRuntimeSecurityFlags() {
  const webPreferences = defaultBrowserWindowOptions?.webPreferences || {};
  const contextIsolation = Boolean(webPreferences.contextIsolation);
  const sandboxEnabled = Boolean(webPreferences.sandbox);
  const nodeIntegrationDisabled = !Boolean(webPreferences.nodeIntegration);
  const secureStorageAvailable =
    safeStorage && typeof safeStorage.isEncryptionAvailable === 'function'
      ? Boolean(safeStorage.isEncryptionAvailable())
      : false;

  return {
    contextIsolation,
    sandboxEnabled,
    nodeIntegrationDisabled,
    secureStorageAvailable
  };
}

function buildIntegritySummary(flags) {
  const checks = [
    flags.contextIsolation,
    flags.sandboxEnabled,
    flags.nodeIntegrationDisabled,
    flags.secureStorageAvailable
  ];
  const healthyChecks = checks.filter(Boolean).length;
  const totalChecks = checks.length;
  const score = Math.round((healthyChecks / totalChecks) * 100);
  const level = score >= 90 ? 'strong' : score >= 60 ? 'moderate' : 'attention';

  return {
    score,
    level,
    healthyChecks,
    totalChecks
  };
}

function buildStatusPayload() {
  const flags = getRuntimeSecurityFlags();
  const offlineStatus = ensureOfflineCapable();

  return {
    vaultLocked: false,
    lastUnlock: null,
    checkedAt: new Date().toISOString(),
    contextIsolation: flags.contextIsolation,
    sandboxEnabled: flags.sandboxEnabled,
    nodeIntegrationDisabled: flags.nodeIntegrationDisabled,
    secureStorageAvailable: flags.secureStorageAvailable,
    keychainAvailable: flags.secureStorageAvailable,
    offlineCapable: offlineStatus.offlineCapable,
    integrity: buildIntegritySummary(flags)
  };
}

function buildPoliciesPayload() {
  const flags = getRuntimeSecurityFlags();

  return {
    localFirst: true,
    outboundNetworkBlocked: true,
    consentRequiredForInsights: true,
    consentRequiredForMarketplaceSharing: true,
    secureStorageRequired: flags.secureStorageAvailable,
    contextIsolationRequired: flags.contextIsolation,
    sandboxRequired: flags.sandboxEnabled,
    nodeIntegrationDisabled: flags.nodeIntegrationDisabled
  };
}

function registerSecurityIpc() {
  ipcMain.handle(Channels.SECURITY_GET_STATUS, async () => {
    try {
      return { ok: true, status: buildStatusPayload() };
    } catch {
      return { ok: false, error: 'Failed to load security status' };
    }
  });

  ipcMain.handle(Channels.SECURITY_GET_POLICIES, async () => {
    try {
      return { ok: true, policies: buildPoliciesPayload() };
    } catch {
      return { ok: false, error: 'Failed to load security policies' };
    }
  });
}

module.exports = { registerSecurityIpc };
