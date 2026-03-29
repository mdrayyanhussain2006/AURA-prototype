const { ipcMain } = require('electron');
const Channels = require('../../shared/ipcChannels.cjs');
const { readConsents, writeConsents } = require('../services/consentStorage');

function normalizeText(value, fallback) {
  if (typeof value !== 'string') return fallback;
  const trimmed = value.trim();
  return trimmed || fallback;
}

function scopeToApp(scope) {
  if (typeof scope !== 'string' || !scope.trim()) return 'Unknown App';
  return scope.replace(/[_-]/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}

function buildConsentRecord(payload, existingRecord) {
  const now = new Date().toISOString();
  const granted = Boolean(payload.granted);

  return {
    id: normalizeText(payload.id, existingRecord?.id || `consent_${Date.now()}`),
    app: normalizeText(payload.app, existingRecord?.app || scopeToApp(payload.scope)),
    purpose: normalizeText(payload.purpose, existingRecord?.purpose || `Permission scope: ${payload.scope || 'custom'}`),
    granted,
    createdAt: normalizeText(payload.createdAt, existingRecord?.createdAt || now),
    updatedAt: now,
    revokedAt: granted ? null : now
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
