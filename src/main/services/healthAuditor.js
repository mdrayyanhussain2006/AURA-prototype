/**
 * AURA Health Auditor — Autonomous Security Health Loop
 *
 * Runs every 30 seconds in the Main Process to proactively calculate
 * vault integrity scores. Results are pushed to the renderer via
 * webContents.send() — the UI never polls for this data.
 *
 * Scoring Algorithm:
 *   Base: 100,  -10 per PII item,  -5 per weak secret,  -3 per common password
 *   Floor: 0, Cap: 100
 */

const { safeStorage } = require('electron');
const { readVaultItems } = require('./storage');
const { loadPatterns } = require('./redactionGate');

const COMMON_PASSWORDS = new Set([
  'password', '123456', '12345678', 'qwerty', 'abc123', 'monkey', 'master',
  'dragon', 'login', 'admin', 'letmein', 'welcome', 'shadow', 'sunshine',
  'princess', 'football', 'charlie', 'access', 'trustno1', 'iloveyou',
  'password1', '123456789', '1234567890', 'password123', 'admin123'
]);

function tryDecrypt(base64Text) {
  if (!base64Text || typeof base64Text !== 'string') return null;
  try { return safeStorage.decryptString(Buffer.from(base64Text, 'base64')); }
  catch (err) { console.warn('[healthAuditor] Decrypt failed:', err?.message ?? err); return null; }
}

async function detectPII(text) {
  if (!text || typeof text !== 'string') return [];
  const patterns = await loadPatterns();
  const detected = [];
  for (const [type, regexStr] of Object.entries(patterns)) {
    try {
      const regex = new RegExp(regexStr.replace('(?i)', ''), 'gi');
      if (regex.test(text)) detected.push(type);
    } catch (err) { console.warn('[healthAuditor] PII regex error for', type, ':', err?.message ?? err); }
  }
  return detected;
}

function checkPasswordEntropy(text) {
  if (!text || typeof text !== 'string') return { weak: false, common: false };
  const t = text.trim();
  return { weak: t.length > 0 && t.length < 8, common: COMMON_PASSWORDS.has(t.toLowerCase()) };
}

async function runHealthAudit() {
  const auditedAt = new Date().toISOString();
  const findings = [];
  let score = 100, piiCount = 0, weakCount = 0, commonCount = 0, itemCount = 0, decryptFailures = 0;

  try {
    const rawItems = await readVaultItems();
    itemCount = rawItems.length;

    for (const item of rawItems) {
      const title = tryDecrypt(item.encryptedTitle);
      const content = tryDecrypt(item.encryptedContent);
      if (title === null && content === null) { decryptFailures++; continue; }
      const fullText = [title || '', content || ''].join(' ');

      const piiTypes = await detectPII(fullText);
      if (piiTypes.length > 0) {
        piiCount++; score -= 10;
        findings.push({ itemId: item.id, type: 'PII_DETECTED', detail: `Unredacted PII: ${piiTypes.join(', ')}`, severity: 'high' });
      }

      if (content) {
        const entropy = checkPasswordEntropy(content);
        if (entropy.weak) { weakCount++; score -= 5; findings.push({ itemId: item.id, type: 'WEAK_SECRET', detail: 'Secret value is shorter than 8 characters', severity: 'medium' }); }
        if (entropy.common) { commonCount++; score -= 3; findings.push({ itemId: item.id, type: 'COMMON_PASSWORD', detail: 'Value matches a common password pattern', severity: 'high' }); }
      }
    }
  } catch (err) {
    console.error('[HealthAuditor] Audit error:', err.message);
    findings.push({ itemId: null, type: 'AUDIT_ERROR', detail: err.message, severity: 'critical' });
  }

  score = Math.max(0, Math.min(100, score));
  const level = score >= 80 ? 'strong' : score >= 50 ? 'moderate' : 'attention';

  return { score, level, findings, itemCount, piiCount, weakCount, commonCount, decryptFailures, auditedAt };
}

module.exports = { runHealthAudit };
