const { app } = require('electron');
const fs = require('node:fs');
const path = require('node:path');

function resolveBasePath() {
  if (!app || typeof app.getPath !== 'function') {
    return process.env.APPDATA || __dirname;
  }

  try {
    return app.getPath('userData');
  } catch {
    return process.env.APPDATA || __dirname;
  }
}

const BASE_PATH = resolveBasePath();
const SETTINGS_FILE_PATH = path.join(BASE_PATH, 'aura_settings.json');

const DEFAULT_SETTINGS = Object.freeze({
  theme: 'dark',
  reducedMotion: false,
  autoLockMinutes: 10,
  consentDefaults: Object.freeze({
    insights: false,
    marketplace: false
  }),
  developerMode: false
});

const ALLOWED_THEMES = new Set(['dark', 'light']);

function asObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
}

function cloneDefaultSettings() {
  return {
    theme: DEFAULT_SETTINGS.theme,
    reducedMotion: DEFAULT_SETTINGS.reducedMotion,
    autoLockMinutes: DEFAULT_SETTINGS.autoLockMinutes,
    consentDefaults: {
      insights: DEFAULT_SETTINGS.consentDefaults.insights,
      marketplace: DEFAULT_SETTINGS.consentDefaults.marketplace
    },
    developerMode: DEFAULT_SETTINGS.developerMode
  };
}

function normalizeTheme(value, fallback) {
  if (typeof value !== 'string') return fallback;
  const normalized = value.trim().toLowerCase();
  return ALLOWED_THEMES.has(normalized) ? normalized : fallback;
}

function normalizeBoolean(value, fallback) {
  return typeof value === 'boolean' ? value : fallback;
}

function normalizeAutoLock(value, fallback) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  const rounded = Math.round(parsed);
  if (rounded < 1) return 1;
  if (rounded > 240) return 240;
  return rounded;
}

function normalizeSettings(value) {
  const defaults = cloneDefaultSettings();
  const raw = asObject(value);
  const rawConsentDefaults = asObject(raw.consentDefaults);

  return {
    theme: normalizeTheme(raw.theme, defaults.theme),
    reducedMotion: normalizeBoolean(raw.reducedMotion, defaults.reducedMotion),
    autoLockMinutes: normalizeAutoLock(raw.autoLockMinutes, defaults.autoLockMinutes),
    consentDefaults: {
      insights: normalizeBoolean(rawConsentDefaults.insights, defaults.consentDefaults.insights),
      marketplace: normalizeBoolean(rawConsentDefaults.marketplace, defaults.consentDefaults.marketplace)
    },
    developerMode: normalizeBoolean(raw.developerMode, defaults.developerMode)
  };
}

function readSettings() {
  try {
    if (!fs.existsSync(SETTINGS_FILE_PATH)) {
      return cloneDefaultSettings();
    }

    const raw = fs.readFileSync(SETTINGS_FILE_PATH, 'utf8');
    if (!raw || !raw.trim()) {
      return cloneDefaultSettings();
    }

    const parsed = JSON.parse(raw);
    return normalizeSettings(parsed);
  } catch (error) {
    console.error('[settingsStorage] Failed to read settings:', error.message);
    return cloneDefaultSettings();
  }
}

function writeSettings(settings) {
  try {
    const normalized = normalizeSettings(settings);
    fs.mkdirSync(path.dirname(SETTINGS_FILE_PATH), { recursive: true });
    fs.writeFileSync(SETTINGS_FILE_PATH, JSON.stringify(normalized, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error('[settingsStorage] Failed to write settings:', error.message);
    return false;
  }
}

module.exports = {
  SETTINGS_FILE_PATH,
  DEFAULT_SETTINGS,
  cloneDefaultSettings,
  normalizeSettings,
  readSettings,
  writeSettings
};
