const { app } = require('electron');
const fs = require('node:fs');
const path = require('node:path');

const USER_DATA_PATH = app.getPath('userData');
const VAULT_FILE_PATH = path.join(USER_DATA_PATH, 'aura_vault.json');
const CONSENTS_FILE_PATH = path.join(USER_DATA_PATH, 'aura_consents.json');

function readJSON(filePath, fallbackValue) {
  try {
    if (!fs.existsSync(filePath)) return fallbackValue;
    const raw = fs.readFileSync(filePath, 'utf8');
    if (!raw || !raw.trim()) return fallbackValue;
    return JSON.parse(raw);
  } catch (error) {
    console.error(`[storage] Failed reading JSON from ${filePath}:`, error.message);
    return fallbackValue;
  }
}

function writeJSON(filePath, data) {
  try {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error(`[storage] Failed writing JSON to ${filePath}:`, error.message);
    return false;
  }
}

function readVaultItems() {
  const items = readJSON(VAULT_FILE_PATH, []);
  return Array.isArray(items) ? items : [];
}

function writeVaultItems(items) {
  return writeJSON(VAULT_FILE_PATH, Array.isArray(items) ? items : []);
}

function readConsentStore() {
  return readJSON(CONSENTS_FILE_PATH, {
    version: 1,
    consents: {},
    hmacKey: null,
    integrity: null
  });
}

function writeConsentStore(store) {
  return writeJSON(CONSENTS_FILE_PATH, store);
}

// Backward-compatible helpers for existing mock handlers.
function readData() {
  return {
    vault: readVaultItems(),
    consent: []
  };
}

function writeData(data) {
  if (!data || typeof data !== 'object') return false;
  return writeVaultItems(Array.isArray(data.vault) ? data.vault : []);
}

module.exports = {
  VAULT_FILE_PATH,
  CONSENTS_FILE_PATH,
  readJSON,
  writeJSON,
  readVaultItems,
  writeVaultItems,
  readConsentStore,
  writeConsentStore,
  readData,
  writeData
};
