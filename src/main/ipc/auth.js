const { ipcMain, app, BrowserWindow, safeStorage } = require('electron');
const crypto = require('node:crypto');
const fs = require('node:fs/promises');
const path = require('node:path');
const Channels = require('../../shared/ipcChannels.cjs');

const AUTH_STORE_FILENAME = 'auth-store.json';
const TOKEN_STORE_FILENAME = 'auth-token.enc';
const SCRYPT_N = 16384;
const SCRYPT_R = 8;
const SCRYPT_P = 1;
const KEY_LEN = 64;

// Google OAuth config (matches Firebase project)
const GOOGLE_CLIENT_ID = '924019989743';
const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_REDIRECT_URI = 'https://aura-vault-49d27.firebaseapp.com/__/auth/handler';

function getAuthStorePath() {
  return path.join(app.getPath('userData'), AUTH_STORE_FILENAME);
}

function getTokenStorePath() {
  return path.join(app.getPath('userData'), TOKEN_STORE_FILENAME);
}

function generateSalt() {
  return crypto.randomBytes(32).toString('hex');
}

function hashPassphrase(passphrase, salt) {
  return new Promise((resolve, reject) => {
    if (!passphrase || typeof passphrase !== 'string') { resolve(null); return; }
    crypto.scrypt(passphrase, salt, KEY_LEN, { N: SCRYPT_N, r: SCRYPT_R, p: SCRYPT_P }, (err, key) => {
      if (err) { reject(err); return; }
      resolve(key.toString('hex'));
    });
  });
}

async function loadStoredAuth() {
  try {
    const p = getAuthStorePath();
    await fs.access(p);
    const raw = await fs.readFile(p, 'utf8');
    const data = JSON.parse(raw);
    if (!data || typeof data.vaultHash !== 'string') return null;
    return { vaultHash: data.vaultHash, salt: typeof data.salt === 'string' ? data.salt : null };
  } catch { return null; }
}

async function saveStoredAuth(vaultHash, salt) {
  try {
    const p = getAuthStorePath();
    await fs.mkdir(path.dirname(p), { recursive: true });
    await fs.writeFile(p, JSON.stringify({ vaultHash, salt }), 'utf8');
    return true;
  } catch { return false; }
}

// ── Token Storage (encrypted via safeStorage) ──

async function storeToken(tokenData) {
  try {
    if (!safeStorage.isEncryptionAvailable()) return false;
    const json = JSON.stringify(tokenData);
    const encrypted = safeStorage.encryptString(json).toString('base64');
    const p = getTokenStorePath();
    await fs.mkdir(path.dirname(p), { recursive: true });
    await fs.writeFile(p, encrypted, 'utf8');
    return true;
  } catch (err) {
    console.error('[Auth] Failed to store token:', err.message);
    return false;
  }
}

async function getStoredToken() {
  try {
    if (!safeStorage.isEncryptionAvailable()) return null;
    const p = getTokenStorePath();
    await fs.access(p);
    const encrypted = await fs.readFile(p, 'utf8');
    const buffer = Buffer.from(encrypted, 'base64');
    const json = safeStorage.decryptString(buffer);
    return JSON.parse(json);
  } catch { return null; }
}

async function clearStoredToken() {
  try {
    const p = getTokenStorePath();
    await fs.unlink(p);
    return true;
  } catch { return true; } // already gone is fine
}

// ── Session State ──

let currentSession = null;
let mainWindowRef = null;

function setMainWindowRef(win) {
  mainWindowRef = win;
}

function registerAuthIpc() {
  // ── Passphrase Auth ──
  ipcMain.handle(Channels.AUTH_GET_SESSION, async () => {
    return { ok: true, session: currentSession };
  });

  ipcMain.handle(Channels.AUTH_LOGIN, async (_event, { username, passphrase }) => {
    const u = username?.trim();
    if (!u || u.length === 0) return { ok: false, error: 'Username is required' };
    if (!passphrase || typeof passphrase !== 'string') return { ok: false, error: 'Passphrase is required' };

    try {
      const storedAuth = await loadStoredAuth();

      if (!storedAuth) {
        const salt = generateSalt();
        const hash = await hashPassphrase(passphrase, salt);
        if (!hash) return { ok: false, error: 'Invalid passphrase' };
        const saved = await saveStoredAuth(hash, salt);
        if (!saved) return { ok: false, error: 'Could not save vault credentials' };
        currentSession = { username: u, createdAt: Date.now(), provider: 'local' };
        return { ok: true, session: currentSession };
      }

      if (!storedAuth.salt) {
        const legacyHash = await hashPassphrase(passphrase, 'aura-vault-v1');
        if (legacyHash !== storedAuth.vaultHash) return { ok: false, error: 'Invalid passphrase' };
        const newSalt = generateSalt();
        const newHash = await hashPassphrase(passphrase, newSalt);
        await saveStoredAuth(newHash, newSalt);
        console.info('[Auth] Migrated from static salt to per-user salt');
        currentSession = { username: u, createdAt: Date.now(), provider: 'local' };
        return { ok: true, session: currentSession };
      }

      const hash = await hashPassphrase(passphrase, storedAuth.salt);
      if (hash !== storedAuth.vaultHash) return { ok: false, error: 'Invalid passphrase' };
      currentSession = { username: u, createdAt: Date.now(), provider: 'local' };
      return { ok: true, session: currentSession };
    } catch (err) {
      console.error('[Auth] Login error:', err.message);
      return { ok: false, error: 'Authentication failed' };
    }
  });

  ipcMain.handle(Channels.AUTH_LOGOUT, async () => {
    currentSession = null;
    await clearStoredToken();
    return { ok: true };
  });

  // ── Token Storage (for Firebase tokens) ──
  ipcMain.handle(Channels.AUTH_STORE_TOKEN, async (_event, payload) => {
    if (!payload || typeof payload !== 'object') return { ok: false, error: 'Invalid token payload' };
    const saved = await storeToken(payload);
    return saved ? { ok: true } : { ok: false, error: 'Failed to store token' };
  });

  ipcMain.handle(Channels.AUTH_GET_TOKEN, async () => {
    const token = await getStoredToken();
    return { ok: true, token };
  });

  ipcMain.handle(Channels.AUTH_CLEAR_TOKEN, async () => {
    await clearStoredToken();
    return { ok: true };
  });

  // ── Google OAuth (Redirect-based via BrowserWindow) ──
  ipcMain.handle(Channels.AUTH_INITIATE_GOOGLE, async () => {
    try {
      const authUrl = new URL(GOOGLE_AUTH_URL);
      authUrl.searchParams.set('client_id', `${GOOGLE_CLIENT_ID}.apps.googleusercontent.com`);
      authUrl.searchParams.set('redirect_uri', GOOGLE_REDIRECT_URI);
      authUrl.searchParams.set('response_type', 'token');
      authUrl.searchParams.set('scope', 'openid email profile');
      authUrl.searchParams.set('prompt', 'select_account');

      const authWindow = new BrowserWindow({
        width: 500,
        height: 700,
        show: true,
        modal: true,
        parent: mainWindowRef || undefined,
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true,
          sandbox: true
        },
        title: 'Sign in with Google — AURA Vault',
        autoHideMenuBar: true
      });

      authWindow.loadURL(authUrl.toString());

      return new Promise((resolve) => {
        // Listen for redirect URL containing the access token
        authWindow.webContents.on('will-redirect', (_event, url) => {
          handleAuthRedirect(url, authWindow, resolve);
        });

        authWindow.webContents.on('will-navigate', (_event, url) => {
          handleAuthRedirect(url, authWindow, resolve);
        });

        authWindow.on('closed', () => {
          resolve({ ok: false, error: 'Authentication window was closed' });
        });
      });
    } catch (err) {
      console.error('[Auth] Google OAuth error:', err.message);
      return { ok: false, error: 'Failed to start Google sign-in' };
    }
  });
}

function handleAuthRedirect(url, authWindow, resolve) {
  try {
    // Firebase Auth handler redirects with token in fragment
    if (!url.includes('access_token') && !url.includes('id_token')) return;

    const parsed = new URL(url);
    // Tokens are in the fragment (hash), not query params
    const fragment = parsed.hash.substring(1); // Remove leading #
    const params = new URLSearchParams(fragment);

    const accessToken = params.get('access_token');
    const idToken = params.get('id_token');

    if (accessToken || idToken) {
      const tokenData = {
        accessToken: accessToken || null,
        idToken: idToken || null,
        expiresAt: Date.now() + (Number(params.get('expires_in') || 3600) * 1000)
      };

      // Store token securely
      storeToken(tokenData).catch(() => {});

      // Create session
      currentSession = {
        username: 'Google User',
        createdAt: Date.now(),
        provider: 'google',
        email: null // Will be populated by renderer after Firebase Auth
      };

      // Push session to renderer
      if (mainWindowRef && !mainWindowRef.isDestroyed()) {
        mainWindowRef.webContents.send(Channels.AUTH_SESSION_CHANGED, currentSession);
      }

      if (!authWindow.isDestroyed()) authWindow.close();
      resolve({ ok: true, session: currentSession });
    }
  } catch (err) {
    console.error('[Auth] Redirect parse error:', err.message);
  }
}

function getSessionState() {
  return currentSession;
}

module.exports = { registerAuthIpc, getSessionState, setMainWindowRef };
