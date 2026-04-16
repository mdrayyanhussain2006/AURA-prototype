/**
 * AURA Integrity Guard — HMAC-SHA256 tamper detection for local JSON files.
 *
 * Key derivation: The HMAC key is derived deterministically from safeStorage,
 * which is tied to the OS-level user keychain (DPAPI on Windows, Keychain on macOS).
 * This means the key is unique per OS user and never stored in plaintext.
 *
 * File format (integrity envelope):
 *   { payload: <any>, hmac: "<hex>" }
 *
 * Migration: If a file has no `hmac` field (pre-upgrade data), it is read as raw
 * JSON and auto-migrated to the envelope format on next write.
 */

const { safeStorage } = require('electron');
const crypto = require('node:crypto');
const fs = require('node:fs/promises');
const path = require('node:path');

// ── HMAC Key Derivation ──
let _hmacKey = null;

function getHmacKey() {
  if (_hmacKey) return _hmacKey;

  if (!safeStorage.isEncryptionAvailable()) {
    console.warn('[integrityGuard] safeStorage unavailable — HMAC integrity disabled');
    return null;
  }

  try {
    const encrypted = safeStorage.encryptString('aura-hmac-key-seed-v1');
    _hmacKey = crypto.createHash('sha256').update(encrypted).digest();
    return _hmacKey;
  } catch (err) {
    console.error('[integrityGuard] Failed to derive HMAC key:', err.message);
    return null;
  }
}

function computeHmac(jsonString) {
  const key = getHmacKey();
  if (!key) return null;
  return crypto.createHmac('sha256', key).update(jsonString, 'utf8').digest('hex');
}

async function writeWithIntegrity(filePath, data) {
  try {
    const jsonString = JSON.stringify(data, null, 2);
    const hmac = computeHmac(jsonString);

    const envelope = hmac
      ? JSON.stringify({ payload: data, hmac }, null, 2)
      : jsonString;

    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, envelope, 'utf8');
    return true;
  } catch (err) {
    console.error(`[integrityGuard] Write failed for ${filePath}:`, err.message);
    return false;
  }
}

async function readWithIntegrity(filePath, fallback) {
  try {
    await fs.access(filePath);
  } catch {
    return fallback;
  }

  try {
    const raw = await fs.readFile(filePath, 'utf8');
    if (!raw || !raw.trim()) return fallback;

    const parsed = JSON.parse(raw);

    if (parsed && typeof parsed === 'object' && 'payload' in parsed && 'hmac' in parsed) {
      const payloadJson = JSON.stringify(parsed.payload, null, 2);
      const expectedHmac = computeHmac(payloadJson);

      if (expectedHmac && parsed.hmac !== expectedHmac) {
        console.error(`[integrityGuard] INTEGRITY VIOLATION: ${filePath} — HMAC mismatch`);
        throw new Error('INTEGRITY_VIOLATION');
      }

      return parsed.payload;
    }

    // Legacy format — return raw, auto-migrate on next write
    console.info(`[integrityGuard] Legacy format detected for ${filePath} — will migrate on next write`);
    return parsed;
  } catch (err) {
    if (err.message === 'INTEGRITY_VIOLATION') throw err;
    console.error(`[integrityGuard] Read failed for ${filePath}:`, err.message);
    return fallback;
  }
}

async function verifyIntegrity(filePath) {
  try {
    await fs.access(filePath);
  } catch {
    return { valid: true, reason: 'File does not exist' };
  }

  try {
    const raw = await fs.readFile(filePath, 'utf8');
    if (!raw || !raw.trim()) return { valid: true, reason: 'Empty file' };

    const parsed = JSON.parse(raw);

    if (parsed && typeof parsed === 'object' && 'payload' in parsed && 'hmac' in parsed) {
      const payloadJson = JSON.stringify(parsed.payload, null, 2);
      const expectedHmac = computeHmac(payloadJson);

      if (!expectedHmac) return { valid: false, reason: 'HMAC key unavailable' };
      if (parsed.hmac !== expectedHmac) return { valid: false, reason: 'HMAC mismatch — file may have been tampered with' };

      return { valid: true };
    }

    return { valid: true, reason: 'Legacy format (no HMAC)' };
  } catch (err) {
    return { valid: false, reason: err.message };
  }
}

module.exports = { writeWithIntegrity, readWithIntegrity, verifyIntegrity };
