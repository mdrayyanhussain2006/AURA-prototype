const { app } = require('electron');
const fs = require('node:fs');
const path = require('node:path');

const BASE_PATH = typeof app?.getPath === 'function' ? app.getPath('userData') : process.env.APPDATA || __dirname;
const CONSENTS_FILE_PATH = path.join(BASE_PATH, 'aura-consents.json');
const LEGACY_CONSENTS_FILE_PATH = path.join(BASE_PATH, 'aura_consents.json');

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function normalizeConsent(entry, fallbackIndex = 0) {
  const now = new Date().toISOString();
  const normalized = isObject(entry) ? entry : {};
  const id = typeof normalized.id === 'string' && normalized.id.trim() ? normalized.id.trim() : `consent_${Date.now()}_${fallbackIndex}`;
  const appName = typeof normalized.app === 'string' && normalized.app.trim() ? normalized.app.trim() : 'Unknown App';
  const purpose = typeof normalized.purpose === 'string' && normalized.purpose.trim() ? normalized.purpose.trim() : 'Permission scope not provided';
  const granted = Boolean(normalized.granted);
  const createdAt = typeof normalized.createdAt === 'string' && normalized.createdAt ? normalized.createdAt : now;
  const updatedAt = typeof normalized.updatedAt === 'string' && normalized.updatedAt ? normalized.updatedAt : createdAt;
  const revokedAt = granted ? null : typeof normalized.revokedAt === 'string' && normalized.revokedAt ? normalized.revokedAt : updatedAt;

  return {
    id,
    app: appName,
    purpose,
    granted,
    createdAt,
    updatedAt,
    revokedAt
  };
}

function mapLegacyConsentStoreToList(legacyStore) {
  if (!isObject(legacyStore) || !isObject(legacyStore.consents)) return [];

  return Object.keys(legacyStore.consents).map((scope, index) => {
    const granted = Boolean(legacyStore.consents[scope]);
    return normalizeConsent(
      {
        id: `consent_${scope}`,
        app: scope.replace(/[_-]/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase()),
        purpose: `Permission scope: ${scope}`,
        granted,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        revokedAt: granted ? null : new Date().toISOString()
      },
      index
    );
  });
}

function readConsentsFromPath(filePath) {
  if (!fs.existsSync(filePath)) return null;

  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    if (!raw || !raw.trim()) return [];
    const parsed = JSON.parse(raw);

    if (Array.isArray(parsed)) {
      return parsed.map((entry, index) => normalizeConsent(entry, index));
    }

    return mapLegacyConsentStoreToList(parsed);
  } catch {
    return null;
  }
}

function readConsents() {
  const currentConsents = readConsentsFromPath(CONSENTS_FILE_PATH);
  if (Array.isArray(currentConsents)) return currentConsents;

  const legacyConsents = readConsentsFromPath(LEGACY_CONSENTS_FILE_PATH);
  if (Array.isArray(legacyConsents)) {
    writeConsents(legacyConsents);
    return legacyConsents;
  }

  return [];
}

function writeConsents(data) {
  try {
    const normalizedData = Array.isArray(data) ? data.map((entry, index) => normalizeConsent(entry, index)) : [];
    fs.mkdirSync(path.dirname(CONSENTS_FILE_PATH), { recursive: true });
    fs.writeFileSync(CONSENTS_FILE_PATH, JSON.stringify(normalizedData, null, 2), 'utf-8');
    return true;
  } catch {
    return false;
  }
}

module.exports = {
  CONSENTS_FILE_PATH,
  readConsents,
  writeConsents
};
