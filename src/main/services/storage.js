const { app } = require('electron');
const fs = require('node:fs/promises');
const path = require('node:path');
const { writeWithIntegrity, readWithIntegrity } = require('./integrityGuard');
const Database = require('better-sqlite3');

const USER_DATA_PATH = app.getPath('userData');
const VAULT_FILE_PATH = path.join(USER_DATA_PATH, 'aura_vault.db'); // Changed to .db for SQLite

// ── Database Initialization ──
let dbInstance = null;

function getDb() {
  if (dbInstance) return dbInstance;
  
  dbInstance = new Database(VAULT_FILE_PATH);
  dbInstance.pragma('journal_mode = WAL');
  
  dbInstance.exec(`
    CREATE TABLE IF NOT EXISTS vault_items (
      id TEXT PRIMARY KEY,
      payload TEXT NOT NULL
    )
  `);
  
  return dbInstance;
}

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

// ── Vault (SQLite Backed) ──

async function readVaultItems() {
  try {
    const db = getDb();
    const rows = db.prepare('SELECT payload FROM vault_items').all();
    return rows.map(r => JSON.parse(r.payload));
  } catch (err) {
    console.error('[storage] SQLite read error:', err.message);
    return [];
  }
}

async function writeVaultItems(items) {
  try {
    const db = getDb();
    const insert = db.prepare('INSERT OR REPLACE INTO vault_items (id, payload) VALUES (@id, @payload)');
    
    const transaction = db.transaction((itemsArray) => {
      db.prepare('DELETE FROM vault_items').run();
      for (const item of itemsArray) {
        insert.run({ id: item.id, payload: JSON.stringify(item) });
      }
    });
    
    transaction(Array.isArray(items) ? items : []);
    return true;
  } catch (err) {
    console.error('[storage] SQLite write error:', err.message);
    return false;
  }
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

