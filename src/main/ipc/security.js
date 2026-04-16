const { ipcMain, safeStorage } = require('electron');
const Channels = require('../../shared/ipcChannels.cjs');
const { defaultBrowserWindowOptions } = require('../security');
const { ensureOfflineCapable } = require('../services/offlineGuard');
const { readSettings, writeSettings } = require('../services/settingsStorage');

const FIXABLE_GUARDS = new Set(['redactionEnabled', 'developerMode']);
const RESTART_GUARDS = new Set(['contextIsolation', 'sandboxEnabled', 'nodeIntegrationDisabled']);
const HARDWARE_GUARDS = new Set(['secureStorageAvailable']);

function getRuntimeSecurityFlags() {
  const wp = defaultBrowserWindowOptions?.webPreferences || {};
  return {
    contextIsolation: Boolean(wp.contextIsolation),
    sandboxEnabled: Boolean(wp.sandbox),
    nodeIntegrationDisabled: !Boolean(wp.nodeIntegration),
    secureStorageAvailable: safeStorage && typeof safeStorage.isEncryptionAvailable === 'function' ? Boolean(safeStorage.isEncryptionAvailable()) : false
  };
}

function buildIntegritySummary(flags) {
  const checks = [flags.contextIsolation, flags.sandboxEnabled, flags.nodeIntegrationDisabled, flags.secureStorageAvailable];
  const healthy = checks.filter(Boolean).length;
  const score = Math.round((healthy / checks.length) * 100);
  return { score, level: score >= 90 ? 'strong' : score >= 60 ? 'moderate' : 'attention', healthyChecks: healthy, totalChecks: checks.length };
}

function buildStatusPayload() {
  const flags = getRuntimeSecurityFlags();
  const offline = ensureOfflineCapable();
  return {
    vaultLocked: false, lastUnlock: null, checkedAt: new Date().toISOString(),
    contextIsolation: flags.contextIsolation, sandboxEnabled: flags.sandboxEnabled,
    nodeIntegrationDisabled: flags.nodeIntegrationDisabled, secureStorageAvailable: flags.secureStorageAvailable,
    keychainAvailable: flags.secureStorageAvailable, offlineCapable: offline.offlineCapable,
    integrity: buildIntegritySummary(flags)
  };
}

function buildPoliciesPayload() {
  const flags = getRuntimeSecurityFlags();
  return {
    localFirst: true, outboundNetworkBlocked: true, consentRequiredForInsights: true,
    consentRequiredForMarketplaceSharing: true, secureStorageRequired: flags.secureStorageAvailable,
    contextIsolationRequired: flags.contextIsolation, sandboxRequired: flags.sandboxEnabled,
    nodeIntegrationDisabled: flags.nodeIntegrationDisabled
  };
}

function registerSecurityIpc() {
  ipcMain.handle(Channels.SECURITY_GET_STATUS, async () => {
    try { return { ok: true, status: buildStatusPayload() }; }
    catch { return { ok: false, error: 'Failed to load security status' }; }
  });

  ipcMain.handle(Channels.SECURITY_GET_POLICIES, async () => {
    try { return { ok: true, policies: buildPoliciesPayload() }; }
    catch { return { ok: false, error: 'Failed to load security policies' }; }
  });

  ipcMain.handle(Channels.SECURITY_ENABLE_GUARD, async (_event, rawPayload) => {
    const guard = rawPayload?.guard;
    if (!guard || typeof guard !== 'string') return { ok: false, error: 'Guard key is required' };

    if (FIXABLE_GUARDS.has(guard)) {
      try {
        const current = await readSettings();
        let updated;
        if (guard === 'developerMode') updated = { ...current, developerMode: false };
        else if (guard === 'redactionEnabled') updated = { ...current, redactionEnabled: true };
        else updated = current;
        const saved = await writeSettings(updated);
        if (!saved) return { ok: false, error: 'Failed to persist guard update' };
        return { ok: true, guard, status: 'enabled' };
      } catch (err) { return { ok: false, error: `Failed to enable guard: ${err.message}` }; }
    }

    if (RESTART_GUARDS.has(guard)) return { ok: true, guard, status: 'restart_required', restartRequired: true, message: 'This guard is configured at build time. Requires app restart with updated configuration.' };
    if (HARDWARE_GUARDS.has(guard)) return { ok: false, guard, error: 'OS Keychain is not available on this system.' };
    return { ok: false, error: `Unknown guard: ${guard}` };
  });
}

module.exports = { registerSecurityIpc };
