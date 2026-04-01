const { ipcMain } = require('electron');
const Channels = require('../../shared/ipcChannels.cjs');
const {
  cloneDefaultSettings,
  normalizeSettings,
  readSettings,
  writeSettings
} = require('../services/settingsStorage');
const { SettingsUpdateSchema, validatePayload } = require('./schemas');

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function mergeSettings(currentSettings, updatePayload) {
  const current = normalizeSettings(currentSettings);
  const updates = isObject(updatePayload) ? updatePayload : {};
  const updateConsentDefaults = isObject(updates.consentDefaults) ? updates.consentDefaults : {};

  return {
    ...current,
    ...updates,
    consentDefaults: {
      ...(current.consentDefaults || {}),
      ...updateConsentDefaults
    }
  };
}

function registerSettingsIpc() {
  ipcMain.handle(Channels.SETTINGS_GET, async () => {
    try {
      return { ok: true, settings: readSettings() };
    } catch {
      return { ok: false, error: 'Failed to load settings' };
    }
  });

  ipcMain.handle(Channels.SETTINGS_UPDATE, async (_event, rawPayload) => {
    // ── Zod Schema Validation ──
    const validation = validatePayload(SettingsUpdateSchema, rawPayload, 'SETTINGS_UPDATE');
    if (!validation.ok) return validation;

    const payload = validation.data;

    try {
      const current = readSettings();
      const merged = mergeSettings(current, payload);
      const saved = writeSettings(merged);

      if (!saved) {
        return { ok: false, error: 'Failed to persist settings' };
      }

      return { ok: true, settings: readSettings() };
    } catch {
      return { ok: false, error: 'Failed to update settings' };
    }
  });

  ipcMain.handle(Channels.SETTINGS_RESET, async () => {
    try {
      const resetSettings = cloneDefaultSettings();
      const saved = writeSettings(resetSettings);

      if (!saved) {
        return { ok: false, error: 'Failed to reset settings' };
      }

      return { ok: true, settings: readSettings() };
    } catch {
      return { ok: false, error: 'Failed to reset settings' };
    }
  });
}

module.exports = { registerSettingsIpc };
