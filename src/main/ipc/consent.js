const { ipcMain } = require('electron');
const Channels = require('../../shared/ipcChannels.cjs');
const { inferRiskLevel, readConsents, writeConsents } = require('../services/consentStorage');
const { ConsentUpdateSchema, validatePayload } = require('./schemas');

function normalizeText(value, fallback) { if (typeof value !== 'string') return fallback; const t = value.trim(); return t || fallback; }
function scopeToApp(scope) { if (typeof scope !== 'string' || !scope.trim()) return 'Unknown App'; return scope.replace(/[_-]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()); }
function toIsoOrNull(v) { if (typeof v !== 'string' || !v.trim()) return null; const d = new Date(v); return Number.isNaN(d.getTime()) ? null : d.toISOString(); }

function normalizeHistory(history) {
  if (!Array.isArray(history)) return [];
  return history.filter((e) => e && typeof e === 'object' && typeof e.action === 'string').map((e) => ({ action: e.action, at: toIsoOrNull(e.at) || new Date().toISOString() }));
}

function buildConsentRecord(payload, existingRecord) {
  const now = new Date().toISOString();
  const granted = Boolean(payload.granted);
  const createdAt = normalizeText(payload.createdAt, existingRecord?.createdAt || now);
  const history = normalizeHistory(existingRecord?.history);
  const wasGranted = Boolean(existingRecord?.granted);
  const action = existingRecord ? (granted === wasGranted ? 'updated' : granted ? 'granted' : 'revoked') : (granted ? 'granted' : 'revoked');
  const riskLevel = payload.riskLevel === 'high' || payload.riskLevel === 'moderate' || payload.riskLevel === 'safe' ? payload.riskLevel : existingRecord?.riskLevel || inferRiskLevel(payload.app || existingRecord?.app, payload.purpose || existingRecord?.purpose);
  const expiresAt = toIsoOrNull(payload.expiresAt) || toIsoOrNull(existingRecord?.expiresAt);
  return {
    id: normalizeText(payload.id, existingRecord?.id || `consent_${Date.now()}`),
    app: normalizeText(payload.app, existingRecord?.app || scopeToApp(payload.scope)),
    purpose: normalizeText(payload.purpose, existingRecord?.purpose || `Permission scope: ${payload.scope || 'custom'}`),
    granted, riskLevel, createdAt, updatedAt: now, revokedAt: granted ? null : now, expiresAt,
    lastUsedAt: toIsoOrNull(existingRecord?.lastUsedAt), lastUsedBy: normalizeText(existingRecord?.lastUsedBy, null),
    history: [...history, { action, at: now }]
  };
}

function findConsentIndex(consents, payload) {
  if (typeof payload.id === 'string' && payload.id.trim()) return consents.findIndex((r) => r.id === payload.id);
  if (typeof payload.app === 'string' && payload.app.trim()) return consents.findIndex((r) => r.app === payload.app);
  if (typeof payload.scope === 'string' && payload.scope.trim()) { const a = scopeToApp(payload.scope); return consents.findIndex((r) => r.app === a); }
  return -1;
}

function registerConsentIpc() {
  ipcMain.handle(Channels.CONSENT_GET_ALL, async () => {
    try { return { ok: true, consents: await readConsents() }; }
    catch (err) { console.error('[Consent] getAll failed:', err?.message ?? err); return { ok: false, error: 'Failed to load consent records' }; }
  });

  ipcMain.handle(Channels.CONSENT_UPDATE, async (_event, rawPayload) => {
    const validation = validatePayload(ConsentUpdateSchema, rawPayload, 'CONSENT_UPDATE');
    if (!validation.ok) return validation;
    const payload = validation.data;
    try {
      const consents = await readConsents();
      const index = findConsentIndex(consents, payload);
      const existingRecord = index > -1 ? consents[index] : null;
      const newConsent = buildConsentRecord(payload, existingRecord);
      if (index > -1) { consents[index] = newConsent; } else { consents.push(newConsent); }
      const saved = await writeConsents(consents);
      if (!saved) return { ok: false, error: 'Failed to persist consent record' };
      return { ok: true, consent: newConsent, consents };
    } catch (err) { console.error('[Consent] update failed:', err?.message ?? err); return { ok: false, error: 'Failed to update consent record' }; }
  });
}

function registerHandlers() { /* backward compat */ }
module.exports = { registerConsentIpc, registerHandlers };
