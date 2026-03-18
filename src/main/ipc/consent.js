const { app, ipcMain, safeStorage } = require('electron');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const Channels = require('../../shared/ipcChannels.cjs');
const { readData, writeData } = require('../services/storage');

const CONSENT_FILE_PATH = path.join(app.getPath('userData'), 'aura_consents.json');

function createDefaultStore() {
  return {
    version: 1,
    consents: {},
    hmacKey: null,
    integrity: null
  };
}

function serializeConsents(consents) {
  return JSON.stringify(
    Object.keys(consents)
      .sort()
      .reduce((result, key) => {
        result[key] = Boolean(consents[key]);
        return result;
      }, {})
  );
}

function readConsentStore() {
  if (!fs.existsSync(CONSENT_FILE_PATH)) return createDefaultStore();

  try {
    const raw = fs.readFileSync(CONSENT_FILE_PATH, 'utf8');
    const parsed = JSON.parse(raw);

    return {
      ...createDefaultStore(),
      ...parsed,
      consents: parsed && typeof parsed.consents === 'object' && parsed.consents !== null ? parsed.consents : {}
    };
  } catch {
    return createDefaultStore();
  }
}

function writeConsentStore(store) {
  fs.writeFileSync(CONSENT_FILE_PATH, JSON.stringify(store, null, 2), 'utf8');
}

function signConsents(consents, hmacKey) {
  return crypto.createHmac('sha256', hmacKey).update(serializeConsents(consents)).digest('hex');
}

function getOrCreateHmacKey(store) {
  const existingKey = store.hmacKey;

  if (existingKey && typeof existingKey === 'object' && typeof existingKey.value === 'string') {
    if (existingKey.encoding === 'safeStorage-base64') {
      if (!safeStorage.isEncryptionAvailable()) {
        throw new Error('SAFE_STORAGE_UNAVAILABLE');
      }

      return safeStorage.decryptString(Buffer.from(existingKey.value, 'base64'));
    }

    if (existingKey.encoding === 'utf8-base64') {
      return Buffer.from(existingKey.value, 'base64').toString('utf8');
    }
  }

  const hmacKey = crypto.randomBytes(32).toString('base64');

  if (safeStorage.isEncryptionAvailable()) {
    const encryptedBuffer = safeStorage.encryptString(hmacKey);
    store.hmacKey = {
      encoding: 'safeStorage-base64',
      value: encryptedBuffer.toString('base64')
    };
  } else {
    store.hmacKey = {
      encoding: 'utf8-base64',
      value: Buffer.from(hmacKey, 'utf8').toString('base64')
    };
  }

  return hmacKey;
}

function getConsentsWithIntegrityCheck() {
  const store = readConsentStore();
  const hmacKey = getOrCreateHmacKey(store);

  if (store.integrity) {
    const expectedSignature = signConsents(store.consents, hmacKey);
    if (expectedSignature !== store.integrity) {
      throw new Error('CONSENT_INTEGRITY_CHECK_FAILED');
    }
  } else {
    store.integrity = signConsents(store.consents, hmacKey);
    writeConsentStore(store);
  }

  return { consents: store.consents, store, hmacKey };
}

function registerConsentIpc() {
  // Mock implementations to prevent crashing
  ipcMain.handle("consent:create", async (_, data) => {
    const db = readData();
    db.consent.push(data);
    writeData(db);
    return { success: true };
  });

  ipcMain.handle("consent:list", async () => {
    return readData().consent;
  });

  ipcMain.handle(Channels.CONSENT_GET_ALL, async () => {
    try {
      const { consents } = getConsentsWithIntegrityCheck();
      return { ok: true, consents };
    } catch (error) {
      if (error.message === 'SAFE_STORAGE_UNAVAILABLE') {
        return { ok: false, error: 'Secure storage is unavailable on this device' };
      }

      if (error.message === 'CONSENT_INTEGRITY_CHECK_FAILED') {
        return { ok: false, error: 'Consent data failed integrity validation' };
      }

      return { ok: false, error: 'Failed to load consent records' };
    }
  });

  ipcMain.handle(Channels.CONSENT_UPDATE, async (_event, { scope, granted }) => {
    if (!scope || typeof scope !== 'string') {
      return { ok: false, error: 'Invalid scope' };
    }

    try {
      const { consents, store, hmacKey } = getConsentsWithIntegrityCheck();
      const nextConsents = {
        ...consents,
        [scope]: Boolean(granted)
      };

      store.consents = nextConsents;
      store.integrity = signConsents(nextConsents, hmacKey);
      writeConsentStore(store);

      return { ok: true, consents: nextConsents };
    } catch (error) {
      if (error.message === 'SAFE_STORAGE_UNAVAILABLE') {
        return { ok: false, error: 'Secure storage is unavailable on this device' };
      }

      if (error.message === 'CONSENT_INTEGRITY_CHECK_FAILED') {
        return { ok: false, error: 'Consent data failed integrity validation' };
      }

      return { ok: false, error: 'Failed to update consent record' };
    }
  });
}

function registerHandlers(ipcMainInstance) {
  // No-op if already registered
}

module.exports = { registerConsentIpc, registerHandlers };
