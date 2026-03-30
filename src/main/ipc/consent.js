const { ipcMain } = require('electron');
const Channels = require('../../shared/ipcChannels.cjs');
const { inferRiskLevel, readConsents, writeConsents } = require('../services/consentStorage');

function normalizeText(value, fallback) {
  if (typeof value !== 'string') return fallback;
  const trimmed = value.trim();
  return trimmed || fallback;
}

function scopeToApp(scope) {
  if (typeof scope !== 'string' || !scope.trim()) return 'Unknown App';
  return scope.replace(/[_-]/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}

function toIsoOrNull(value) {
  if (typeof value !== 'string' || !value.trim()) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function normalizeHistory(history) {
  if (!Array.isArray(history)) return [];
  return history
    .filter((entry) => entry && typeof entry === 'object' && typeof entry.action === 'string')
    .map((entry) => ({
      action: entry.action,
      at: toIsoOrNull(entry.at) || new Date().toISOString()
    }));
}

function buildConsentRecord(payload, existingRecord) {
  const now = new Date().toISOString();
  const granted = Boolean(payload.granted);
  const createdAt = normalizeText(payload.createdAt, existingRecord?.createdAt || now);
  const history = normalizeHistory(existingRecord?.history);
  const wasGranted = Boolean(existingRecord?.granted);
  const action = existingRecord
    ? granted === wasGranted ? 'updated' : granted ? 'granted' : 'revoked'
    : granted ? 'granted' : 'revoked';
  const riskLevel = payload.riskLevel === 'high' || payload.riskLevel === 'moderate' || payload.riskLevel === 'safe'
    ? payload.riskLevel
    : existingRecord?.riskLevel || inferRiskLevel(payload.app || existingRecord?.app, payload.purpose || existingRecord?.purpose);
  const expiresAt = toIsoOrNull(payload.expiresAt) || toIsoOrNull(existingRecord?.expiresAt);

  return {
    id: normalizeText(payload.id, existingRecord?.id || `consent_${Date.now()}`),
    app: normalizeText(payload.app, existingRecord?.app || scopeToApp(payload.scope)),
    purpose: normalizeText(payload.purpose, existingRecord?.purpose || `Permission scope: ${payload.scope || 'custom'}`),
    granted,
    riskLevel,
    createdAt,
    updatedAt: now,
    revokedAt: granted ? null : now,
    expiresAt,
    lastUsedAt: toIsoOrNull(existingRecord?.lastUsedAt),
    lastUsedBy: normalizeText(existingRecord?.lastUsedBy, null),
    history: [
      ...history,
      {
        action,
        at: now
      }
    ]
  };
}

function findConsentIndex(consents, payload) {
  if (typeof payload.id === 'string' && payload.id.trim()) {
    return consents.findIndex((record) => record.id === payload.id);
  }

  if (typeof payload.app === 'string' && payload.app.trim()) {
    return consents.findIndex((record) => record.app === payload.app);
  }

  if (typeof payload.scope === 'string' && payload.scope.trim()) {
    const appName = scopeToApp(payload.scope);
    return consents.findIndex((record) => record.app === appName);
  }

  return -1;
}

function registerConsentIpc() {
  ipcMain.handle(Channels.CONSENT_GET_ALL, async () => {
    try {
      const consents = readConsents();
      return { ok: true, consents };
    } catch {
      return { ok: false, error: 'Failed to load consent records' };
    }
  });

  ipcMain.handle(Channels.CONSENT_UPDATE, async (_event, payload) => {
    if (!payload || typeof payload !== 'object') {
      return { ok: false, error: 'Invalid consent payload' };
    }

    if (typeof payload.granted !== 'boolean') {
      return { ok: false, error: 'Invalid granted flag' };
    }

    try {
      const consents = readConsents();
      const index = findConsentIndex(consents, payload);
      const existingRecord = index > -1 ? consents[index] : null;
      const newConsent = buildConsentRecord(payload, existingRecord);

      if (index > -1) {
        consents[index] = newConsent;
      } else {
        consents.push(newConsent);
      }

      const saved = writeConsents(consents);
      if (!saved) {
        return { ok: false, error: 'Failed to persist consent record' };
      }

      return { ok: true, consent: newConsent, consents };
    } catch {
      return { ok: false, error: 'Failed to update consent record' };
    }
  });
}

function registerHandlers() {
  // Kept for backward compatibility with existing startup checks.
}

module.exports = { registerConsentIpc, registerHandlers };
