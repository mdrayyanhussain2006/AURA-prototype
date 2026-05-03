const { app } = require('electron');
const fs = require('node:fs/promises');
const path = require('node:path');

const BASE_PATH = typeof app?.getPath === 'function' ? app.getPath('userData') : process.env.APPDATA || __dirname;
const CONSENTS_FILE_PATH = path.join(BASE_PATH, 'aura-consents.json');
const LEGACY_CONSENTS_FILE_PATH = path.join(BASE_PATH, 'aura_consents.json');

function isObject(v) { return v !== null && typeof v === 'object' && !Array.isArray(v); }

function toIsoOrNull(v) {
  if (typeof v !== 'string' || !v.trim()) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

function inferRiskLevel(appName, purpose) {
  const text = `${appName || ''} ${purpose || ''}`.toLowerCase();
  if (text.includes('sharing') || text.includes('third-party') || text.includes('external')) return 'high';
  if (text.includes('analy') || text.includes('insight') || text.includes('ai')) return 'moderate';
  return 'safe';
}

function normalizeHistory(history, fallbackGranted, fallbackUpdatedAt) {
  const nh = Array.isArray(history)
    ? history.filter((e) => isObject(e) && typeof e.action === 'string').map((e) => ({ action: e.action, at: toIsoOrNull(e.at) || fallbackUpdatedAt }))
    : [];
  if (nh.length > 0) return nh;
  return [{ action: fallbackGranted ? 'granted' : 'revoked', at: fallbackUpdatedAt }];
}

function normalizeConsent(entry, fallbackIndex = 0) {
  const now = new Date().toISOString();
  const n = isObject(entry) ? entry : {};
  const id = typeof n.id === 'string' && n.id.trim() ? n.id.trim() : `consent_${Date.now()}_${fallbackIndex}`;
  const appName = typeof n.app === 'string' && n.app.trim() ? n.app.trim() : 'Unknown App';
  const purpose = typeof n.purpose === 'string' && n.purpose.trim() ? n.purpose.trim() : 'Permission scope not provided';
  const granted = Boolean(n.granted);
  const createdAt = toIsoOrNull(n.createdAt) || now;
  const updatedAt = toIsoOrNull(n.updatedAt) || createdAt;
  const revokedAt = granted ? null : toIsoOrNull(n.revokedAt) || updatedAt;
  const expiresAt = toIsoOrNull(n.expiresAt);
  const riskLevel = n.riskLevel === 'high' || n.riskLevel === 'moderate' || n.riskLevel === 'safe' ? n.riskLevel : inferRiskLevel(appName, purpose);
  const history = normalizeHistory(n.history, granted, updatedAt);
  const lastUsedAt = toIsoOrNull(n.lastUsedAt);
  const lastUsedBy = typeof n.lastUsedBy === 'string' && n.lastUsedBy.trim() ? n.lastUsedBy.trim() : null;
  return { id, app: appName, purpose, granted, riskLevel, createdAt, updatedAt, revokedAt, expiresAt, lastUsedAt, lastUsedBy, history };
}

function mapLegacyConsentStoreToList(legacyStore) {
  if (!isObject(legacyStore) || !isObject(legacyStore.consents)) return [];
  return Object.keys(legacyStore.consents).map((scope, index) => {
    const granted = Boolean(legacyStore.consents[scope]);
    let appName = scope.replace(/[_-]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
    if (appName === 'Insights') appName = 'Insights Engine';
    return normalizeConsent({ id: `consent_${scope}`, app: appName, purpose: `Permission scope: ${scope}`, granted, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), revokedAt: granted ? null : new Date().toISOString() }, index);
  });
}

async function readConsentsFromPath(filePath) {
  try { await fs.access(filePath); } catch { return null; }
  try {
    const raw = await fs.readFile(filePath, 'utf-8');
    if (!raw || !raw.trim()) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed.map((e, i) => normalizeConsent(e, i));
    return mapLegacyConsentStoreToList(parsed);
  } catch { return null; }
}

let ioMutex = Promise.resolve();
function withMutex(fn) {
  return new Promise((resolve, reject) => {
    ioMutex = ioMutex.then(async () => {
      try { resolve(await fn()); }
      catch (e) { reject(e); }
    });
  });
}

async function _readConsents() {
  const current = await readConsentsFromPath(CONSENTS_FILE_PATH);
  if (Array.isArray(current)) return _applyAutoExpiry(current);
  const legacy = await readConsentsFromPath(LEGACY_CONSENTS_FILE_PATH);
  if (Array.isArray(legacy)) { const w = await _applyAutoExpiry(legacy); await _writeConsents(w); return w; }
  return [];
}

function readConsents() {
  return withMutex(_readConsents);
}

async function _applyAutoExpiry(consents) {
  const now = new Date();
  let changed = false;
  const next = consents.map((c) => {
    const n = normalizeConsent(c);
    if (!n.granted || !n.expiresAt) return n;
    const exp = new Date(n.expiresAt);
    if (Number.isNaN(exp.getTime()) || exp > now) return n;
    const ra = now.toISOString();
    changed = true;
    return { ...n, granted: false, revokedAt: ra, updatedAt: ra, history: [...n.history, { action: 'expired', at: ra }] };
  });
  if (changed) await _writeConsents(next);
  return next;
}

async function _touchConsentUsageByApp(appName, featureName) {
  if (typeof appName !== 'string' || !appName.trim()) return false;
  const consents = await _readConsents();
  const index = consents.findIndex((c) => c.app === appName);
  if (index < 0) return false;
  const now = new Date().toISOString();
  consents[index] = { ...consents[index], lastUsedAt: now, lastUsedBy: typeof featureName === 'string' && featureName.trim() ? featureName : 'Unknown Feature', history: [...(Array.isArray(consents[index].history) ? consents[index].history : []), { action: 'used', at: now }] };
  return _writeConsents(consents);
}

function touchConsentUsageByApp(appName, featureName) {
  return withMutex(() => _touchConsentUsageByApp(appName, featureName));
}

async function _writeConsents(data) {
  try {
    const nd = Array.isArray(data) ? data.map((e, i) => normalizeConsent(e, i)) : [];
    await fs.mkdir(path.dirname(CONSENTS_FILE_PATH), { recursive: true });
    await fs.writeFile(CONSENTS_FILE_PATH, JSON.stringify(nd, null, 2), 'utf-8');
    return true;
  } catch { return false; }
}

function writeConsents(data) {
  return withMutex(() => _writeConsents(data));
}

module.exports = { CONSENTS_FILE_PATH, inferRiskLevel, readConsents, touchConsentUsageByApp, writeConsents };
