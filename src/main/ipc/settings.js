const { ipcMain } = require('electron');
const Channels = require('../../shared/ipcChannels.cjs');
const { cloneDefaultSettings, normalizeSettings, readSettings, writeSettings } = require('../services/settingsStorage');
const { SettingsUpdateSchema, validatePayload } = require('./schemas');

function isObject(v) { return v !== null && typeof v === 'object' && !Array.isArray(v); }

function mergeSettings(current, update) {
  const c = normalizeSettings(current);
  const u = isObject(update) ? update : {};
  const uc = isObject(u.consentDefaults) ? u.consentDefaults : {};
  return { ...c, ...u, consentDefaults: { ...(c.consentDefaults || {}), ...uc } };
}

function registerSettingsIpc() {
  ipcMain.handle(Channels.SETTINGS_GET, async () => {
    try { return { ok: true, settings: await readSettings() }; }
    catch (err) { console.error('[Settings] get failed:', err?.message ?? err); return { ok: false, error: 'Failed to load settings' }; }
  });

  ipcMain.handle(Channels.SETTINGS_UPDATE, async (_event, rawPayload) => {
    const validation = validatePayload(SettingsUpdateSchema, rawPayload, 'SETTINGS_UPDATE');
    if (!validation.ok) return validation;
    try {
      const current = await readSettings();
      const merged = mergeSettings(current, validation.data);
      const saved = await writeSettings(merged);
      if (!saved) return { ok: false, error: 'Failed to persist settings' };
      return { ok: true, settings: await readSettings() };
    } catch (err) { console.error('[Settings] update failed:', err?.message ?? err); return { ok: false, error: 'Failed to update settings' }; }
  });

  ipcMain.handle(Channels.SETTINGS_RESET, async () => {
    try {
      const saved = await writeSettings(cloneDefaultSettings());
      if (!saved) return { ok: false, error: 'Failed to reset settings' };
      return { ok: true, settings: await readSettings() };
    } catch (err) { console.error('[Settings] reset failed:', err?.message ?? err); return { ok: false, error: 'Failed to reset settings' }; }
  });
}

module.exports = { registerSettingsIpc };
