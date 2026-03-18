const { ipcMain, app } = require('electron');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const Channels = require('../../shared/ipcChannels.cjs');

const AUTH_STORE_FILENAME = 'auth-store.json';
const SCRYPT_N = 16384;
const SCRYPT_R = 8;
const SCRYPT_P = 1;
const KEY_LEN = 64;
const SALT = 'aura-vault-v1';

function getAuthStorePath() {
  return path.join(app.getPath('userData'), AUTH_STORE_FILENAME);
}

function hashPassphrase(passphrase) {
  if (!passphrase || typeof passphrase !== 'string') return null;
  return crypto.scryptSync(passphrase, SALT, KEY_LEN).toString('hex');
}

function loadStoredHash() {
  try {
    const p = getAuthStorePath();
    if (!fs.existsSync(p)) return null;
    const data = JSON.parse(fs.readFileSync(p, 'utf8'));
    return data.vaultHash && typeof data.vaultHash === 'string' ? data.vaultHash : null;
  } catch {
    return null;
  }
}

function saveStoredHash(hash) {
  try {
    const p = getAuthStorePath();
    fs.mkdirSync(path.dirname(p), { recursive: true });
    fs.writeFileSync(p, JSON.stringify({ vaultHash: hash }), 'utf8');
    return true;
  } catch {
    return false;
  }
}

// In-memory session only (cleared on logout; passphrase hash is persisted)
let currentSession = null;

function registerAuthIpc() {
  ipcMain.handle(Channels.AUTH_GET_SESSION, async () => {
    return { ok: true, session: currentSession };
  });

  ipcMain.handle(Channels.AUTH_LOGIN, async (_event, { username, passphrase }) => {
    const u = username?.trim();
    if (!u || u.length === 0) return { ok: false, error: 'Username is required' };
    if (!passphrase || typeof passphrase !== 'string') return { ok: false, error: 'Passphrase is required' };

    const hash = hashPassphrase(passphrase);
    if (!hash) return { ok: false, error: 'Invalid passphrase' };

    const storedHash = loadStoredHash();

    if (!storedHash) {
      // First-time setup: store hash and create session
      if (!saveStoredHash(hash)) return { ok: false, error: 'Could not save vault' };
      currentSession = { username: u, createdAt: Date.now() };
      return { ok: true, session: currentSession };
    }

    // Verify passphrase
    if (hash !== storedHash) {
      return { ok: false, error: 'Invalid passphrase' };
    }

    currentSession = { username: u, createdAt: Date.now() };
    return { ok: true, session: currentSession };
  });

  ipcMain.handle(Channels.AUTH_LOGOUT, async () => {
    currentSession = null;
    return { ok: true };
  });
}

// Add this function to allow other main-process modules to check auth status
function getSessionState() {
  return currentSession;
}

// Update exports
module.exports = { registerAuthIpc, getSessionState };
