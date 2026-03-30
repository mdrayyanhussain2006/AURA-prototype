const { app } = require('electron');
const fs = require('node:fs');
const path = require('node:path');

const BASE_PATH = typeof app?.getPath === 'function' ? app.getPath('userData') : process.env.APPDATA || __dirname;
const CONSENTS_FILE_PATH = path.join(BASE_PATH, 'aura-consents.json');
const LEGACY_CONSENTS_FILE_PATH = path.join(BASE_PATH, 'aura_consents.json');

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function toIsoOrNull(value) {
  if (typeof value !== 'string' || !value.trim()) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function inferRiskLevel(appName, purpose) {
  const text = `${appName || ''} ${purpose || ''}`.toLowerCase();
  if (text.includes('sharing') || text.includes('third-party') || text.includes('external')) {
    return 'high';
  }
  if (text.includes('analy') || text.includes('insight') || text.includes('ai')) {
    return 'moderate';
  }
  return 'safe';
}

function normalizeHistory(history, fallbackGranted, fallbackUpdatedAt) {
  const normalizedHistory = Array.isArray(history)
    ? history
      .filter((entry) => isObject(entry) && typeof entry.action === 'string')
      .map((entry) => ({
        action: entry.action,
        at: toIsoOrNull(entry.at) || fallbackUpdatedAt
      }))
    : [];

  if (normalizedHistory.length > 0) return normalizedHistory;

  return [
    {
      action: fallbackGranted ? 'granted' : 'revoked',
      at: fallbackUpdatedAt
    }
  ];
}

function normalizeConsent(entry, fallbackIndex = 0) {
  const now = new Date().toISOString();
  const normalized = isObject(entry) ? entry : {};
  const id = typeof normalized.id === 'string' && normalized.id.trim() ? normalized.id.trim() : `consent_${Date.now()}_${fallbackIndex}`;
  const appName = typeof normalized.app === 'string' && normalized.app.trim() ? normalized.app.trim() : 'Unknown App';
  const purpose = typeof normalized.purpose === 'string' && normalized.purpose.trim() ? normalized.purpose.trim() : 'Permission scope not provided';
  const granted = Boolean(normalized.granted);
  const createdAt = toIsoOrNull(normalized.createdAt) || now;
  const updatedAt = toIsoOrNull(normalized.updatedAt) || createdAt;
  const revokedAt = granted ? null : toIsoOrNull(normalized.revokedAt) || updatedAt;
  const expiresAt = toIsoOrNull(normalized.expiresAt);
  const riskLevel = normalized.riskLevel === 'high' || normalized.riskLevel === 'moderate' || normalized.riskLevel === 'safe'
    ? normalized.riskLevel
    : inferRiskLevel(appName, purpose);
  const history = normalizeHistory(normalized.history, granted, updatedAt);
  const lastUsedAt = toIsoOrNull(normalized.lastUsedAt);
  const lastUsedBy = typeof normalized.lastUsedBy === 'string' && normalized.lastUsedBy.trim() ? normalized.lastUsedBy.trim() : null;

  return {
    id,
    app: appName,
    purpose,
    granted,
    riskLevel,
    createdAt,
    updatedAt,
    revokedAt,
    expiresAt,
    lastUsedAt,
    lastUsedBy,
    history
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
  if (Array.isArray(currentConsents)) {
    return applyAutoExpiry(currentConsents);
  }

  const legacyConsents = readConsentsFromPath(LEGACY_CONSENTS_FILE_PATH);
  if (Array.isArray(legacyConsents)) {
    const withExpiry = applyAutoExpiry(legacyConsents);
    writeConsents(withExpiry);
    return withExpiry;
  }

  return [];
}

function applyAutoExpiry(consents) {
  const now = new Date();
  let changed = false;

  const next = consents.map((consent) => {
    const normalized = normalizeConsent(consent);
    if (!normalized.granted || !normalized.expiresAt) return normalized;

    const expiresDate = new Date(normalized.expiresAt);
    if (Number.isNaN(expiresDate.getTime()) || expiresDate > now) return normalized;

    const revokedAt = now.toISOString();
    changed = true;

    return {
      ...normalized,
      granted: false,
      revokedAt,
      updatedAt: revokedAt,
      history: [
        ...normalized.history,
        { action: 'expired', at: revokedAt }
      ]
    };
  });

  if (changed) {
    writeConsents(next);
  }

  return next;
}

function touchConsentUsageByApp(appName, featureName) {
  if (typeof appName !== 'string' || !appName.trim()) return false;

  const consents = readConsents();
  const index = consents.findIndex((consent) => consent.app === appName);
  if (index < 0) return false;

  const now = new Date().toISOString();
  const updatedConsent = {
    ...consents[index],
    lastUsedAt: now,
    lastUsedBy: typeof featureName === 'string' && featureName.trim() ? featureName : 'Unknown Feature',
    history: [
      ...(Array.isArray(consents[index].history) ? consents[index].history : []),
      {
        action: 'used',
        at: now
      }
    ]
  };

  consents[index] = updatedConsent;
  return writeConsents(consents);
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
  inferRiskLevel,
  readConsents,
  touchConsentUsageByApp,
  writeConsents
};
