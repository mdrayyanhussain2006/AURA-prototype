const { app } = require('electron');
const fs = require('node:fs/promises');
const path = require('node:path');

function resolveBasePath() {
  if (!app || typeof app.getPath !== 'function') return process.env.APPDATA || __dirname;
  try { return app.getPath('userData'); } catch { return process.env.APPDATA || __dirname; }
}

const BASE_PATH = resolveBasePath();
const SETTINGS_FILE_PATH = path.join(BASE_PATH, 'aura_settings.json');

const DEFAULT_SETTINGS = Object.freeze({
  theme: 'dark',
  reducedMotion: false,
  autoLockMinutes: 10,
  consentDefaults: Object.freeze({ insights: false, marketplace: false }),
  developerMode: false,
  installedModules: Object.freeze([])
});

const ALLOWED_THEMES = new Set(['dark', 'light']);

function asObject(v) { return v && typeof v === 'object' && !Array.isArray(v) ? v : {}; }

function cloneDefaultSettings() {
  return {
    theme: DEFAULT_SETTINGS.theme, reducedMotion: DEFAULT_SETTINGS.reducedMotion,
    autoLockMinutes: DEFAULT_SETTINGS.autoLockMinutes,
    consentDefaults: { insights: DEFAULT_SETTINGS.consentDefaults.insights, marketplace: DEFAULT_SETTINGS.consentDefaults.marketplace },
    developerMode: DEFAULT_SETTINGS.developerMode, installedModules: []
  };
}

function normalizeTheme(v, fb) { if (typeof v !== 'string') return fb; const n = v.trim().toLowerCase(); return ALLOWED_THEMES.has(n) ? n : fb; }
function normalizeBoolean(v, fb) { return typeof v === 'boolean' ? v : fb; }
function normalizeAutoLock(v, fb) { const p = Number(v); if (!Number.isFinite(p)) return fb; const r = Math.round(p); return r < 1 ? 1 : r > 240 ? 240 : r; }
function normalizeInstalledModules(v) { if (!Array.isArray(v)) return []; return v.filter(i => typeof i === 'string' && i.trim().length > 0); }

function normalizeSettings(value) {
  const d = cloneDefaultSettings();
  const raw = asObject(value);
  const rc = asObject(raw.consentDefaults);
  return {
    theme: normalizeTheme(raw.theme, d.theme),
    reducedMotion: normalizeBoolean(raw.reducedMotion, d.reducedMotion),
    autoLockMinutes: normalizeAutoLock(raw.autoLockMinutes, d.autoLockMinutes),
    consentDefaults: { insights: normalizeBoolean(rc.insights, d.consentDefaults.insights), marketplace: normalizeBoolean(rc.marketplace, d.consentDefaults.marketplace) },
    developerMode: normalizeBoolean(raw.developerMode, d.developerMode),
    installedModules: normalizeInstalledModules(raw.installedModules)
  };
}

async function readSettings() {
  try {
    await fs.access(SETTINGS_FILE_PATH);
    const raw = await fs.readFile(SETTINGS_FILE_PATH, 'utf8');
    if (!raw || !raw.trim()) return cloneDefaultSettings();
    return normalizeSettings(JSON.parse(raw));
  } catch (error) {
    if (error.code !== 'ENOENT') console.error('[settingsStorage] Failed to read settings:', error.message);
    return cloneDefaultSettings();
  }
}

async function writeSettings(settings) {
  try {
    const normalized = normalizeSettings(settings);
    await fs.mkdir(path.dirname(SETTINGS_FILE_PATH), { recursive: true });
    await fs.writeFile(SETTINGS_FILE_PATH, JSON.stringify(normalized, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error('[settingsStorage] Failed to write settings:', error.message);
    return false;
  }
}

module.exports = { SETTINGS_FILE_PATH, DEFAULT_SETTINGS, cloneDefaultSettings, normalizeSettings, readSettings, writeSettings };
