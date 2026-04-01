/**
 * AURA Health Auditor — Autonomous Security Health Loop
 *
 * Runs every 30 seconds in the Main Process to proactively calculate
 * vault integrity scores. Results are pushed to the renderer via
 * webContents.send() — the UI never polls for this data.
 *
 * Scoring Algorithm:
 *   Base: 100
 *   -10  per item with unredacted PII (email, phone, API key)
 *   -5   per item with weak/short password (< 8 chars)
 *   -3   per item with common password pattern
 *   Floor: 0, Cap: 100
 */

const { safeStorage } = require('electron');
const { readVaultItems } = require('./storage');
const { loadPatterns } = require('./redactionGate');

// Top common passwords for entropy check
const COMMON_PASSWORDS = new Set([
  'password', '123456', '12345678', 'qwerty', 'abc123', 'monkey', 'master',
  'dragon', 'login', 'admin', 'letmein', 'welcome', 'shadow', 'sunshine',
  'princess', 'football', 'charlie', 'access', 'trustno1', 'iloveyou',
  'password1', '123456789', '1234567890', 'password123', 'admin123'
]);

/**
 * Attempts to decrypt a base64-encoded string via safeStorage.
 * Returns the decrypted text, or null on failure.
 */
function tryDecrypt(base64Text) {
  if (!base64Text || typeof base64Text !== 'string') return null;
  try {
    const buffer = Buffer.from(base64Text, 'base64');
    return safeStorage.decryptString(buffer);
  } catch {
    return null;
  }
}

/**
 * Checks text for unredacted PII using the redaction pipeline patterns.
 * Returns an array of detected PII types.
 */
function detectPII(text) {
  if (!text || typeof text !== 'string') return [];

  const patterns = loadPatterns();
  const detected = [];

  for (const [type, regexStr] of Object.entries(patterns)) {
    try {
      const cleanStr = regexStr.replace('(?i)', '');
      const regex = new RegExp(cleanStr, 'gi');
      if (regex.test(text)) {
        detected.push(type);
      }
    } catch {
      // Skip broken patterns
    }
  }

  return detected;
}

/**
 * Checks if a decrypted value looks like a weak or common password.
 */
function checkPasswordEntropy(text) {
  if (!text || typeof text !== 'string') return { weak: false, common: false };

  const trimmed = text.trim();
  const weak = trimmed.length > 0 && trimmed.length < 8;
  const common = COMMON_PASSWORDS.has(trimmed.toLowerCase());

  return { weak, common };
}

/**
 * Runs a full security health audit on the vault.
 * This is the main entry point called by the 30-second interval.
 *
 * @returns {object} Audit results with score, findings, and metadata.
 */
function runHealthAudit() {
  const auditedAt = new Date().toISOString();
  const findings = [];
  let score = 100;
  let piiCount = 0;
  let weakCount = 0;
  let commonCount = 0;
  let itemCount = 0;
  let decryptFailures = 0;

  try {
    const rawItems = readVaultItems();
    itemCount = rawItems.length;

    for (const item of rawItems) {
      // Decrypt content for analysis (title + content)
      const title = tryDecrypt(item.encryptedTitle);
      const content = tryDecrypt(item.encryptedContent);

      if (title === null && content === null) {
        decryptFailures++;
        continue;
      }

      const fullText = [title || '', content || ''].join(' ');

      // PII detection
      const piiTypes = detectPII(fullText);
      if (piiTypes.length > 0) {
        piiCount++;
        score -= 10;
        findings.push({
          itemId: item.id,
          type: 'PII_DETECTED',
          detail: `Unredacted PII: ${piiTypes.join(', ')}`,
          severity: 'high'
        });
      }

      // Password entropy checks (on content only)
      if (content) {
        const entropy = checkPasswordEntropy(content);
        if (entropy.weak) {
          weakCount++;
          score -= 5;
          findings.push({
            itemId: item.id,
            type: 'WEAK_SECRET',
            detail: 'Secret value is shorter than 8 characters',
            severity: 'medium'
          });
        }
        if (entropy.common) {
          commonCount++;
          score -= 3;
          findings.push({
            itemId: item.id,
            type: 'COMMON_PASSWORD',
            detail: 'Value matches a common password pattern',
            severity: 'high'
          });
        }
      }
    }
  } catch (err) {
    console.error('[HealthAuditor] Audit error:', err.message);
    findings.push({
      itemId: null,
      type: 'AUDIT_ERROR',
      detail: err.message,
      severity: 'critical'
    });
  }

  // Clamp score
  score = Math.max(0, Math.min(100, score));

  // Determine level
  const level = score >= 80 ? 'strong' : score >= 50 ? 'moderate' : 'attention';

  return {
    score,
    level,
    findings,
    itemCount,
    piiCount,
    weakCount,
    commonCount,
    decryptFailures,
    auditedAt
  };
}

module.exports = { runHealthAudit };
