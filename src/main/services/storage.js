const { app } = require('electron');
const fs = require('node:fs/promises');
const path = require('node:path');
const { writeWithIntegrity, readWithIntegrity } = require('./integrityGuard');

const USER_DATA_PATH = app.getPath('userData');
const VAULT_FILE_PATH = path.join(USER_DATA_PATH, 'aura_vault.json');

// ── Generic async JSON helpers (non-HMAC, for consent/legacy files) ──

async function readJSON(filePath, fallbackValue) {
  try {
    await fs.access(filePath);
    const raw = await fs.readFile(filePath, 'utf8');
    if (!raw || !raw.trim()) return fallbackValue;
    return JSON.parse(raw);
  } catch (error) {
    if (error.code !== 'ENOENT') {
      console.error(`[storage] Failed reading JSON from ${filePath}:`, error.message);
    }
    return fallbackValue;
  }
}

async function writeJSON(filePath, data) {
  try {
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error(`[storage] Failed writing JSON to ${filePath}:`, error.message);
    return false;
  }
}

// ── Vault (HMAC-protected via integrityGuard) ──

async function readVaultItems() {
  try {
    const items = await readWithIntegrity(VAULT_FILE_PATH, []);
    return Array.isArray(items) ? items : [];
  } catch (err) {
    if (err.message === 'INTEGRITY_VIOLATION') {
      console.error('[storage] VAULT INTEGRITY VIOLATION — refusing to load data');
      throw err;
    }
    return [];
  }
}

async function writeVaultItems(items) {
  return writeWithIntegrity(VAULT_FILE_PATH, Array.isArray(items) ? items : []);
}

async function readData() {
  return { vault: await readVaultItems(), consent: [] };
}

async function writeData(data) {
  if (!data || typeof data !== 'object') return false;
  return writeVaultItems(Array.isArray(data.vault) ? data.vault : []);
}

module.exports = {
  VAULT_FILE_PATH,
  readJSON, writeJSON,
  readVaultItems, writeVaultItems,
  readData, writeData
};
