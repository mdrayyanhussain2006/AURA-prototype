/**
 * Auth IPC service — renderer-side only.
 * Invokes main process via preload (window.aura.auth).
 */

export async function getSession() {
  if (!window.aura?.auth?.getSession) return { ok: false, error: 'Auth API not available', session: null };
  return window.aura.auth.getSession();
}

export async function login(username, passphrase) {
  if (!window.aura?.auth?.login) return { ok: false, error: 'Auth API not available' };
  return window.aura.auth.login({ username, passphrase });
}

export async function logout() {
  if (!window.aura?.auth?.logout) return { ok: false, error: 'Auth API not available' };
  return window.aura.auth.logout();
}

export async function initiateGoogleAuth() {
  if (!window.aura?.auth?.initiateGoogleAuth) return { ok: false, error: 'Google Auth not available' };
  return window.aura.auth.initiateGoogleAuth();
}

export async function storeToken(payload) {
  if (!window.aura?.auth?.storeToken) return { ok: false, error: 'Token API not available' };
  return window.aura.auth.storeToken(payload);
}

export async function getToken() {
  if (!window.aura?.auth?.getToken) return { ok: false, error: 'Token API not available', token: null };
  return window.aura.auth.getToken();
}

export async function clearToken() {
  if (!window.aura?.auth?.clearToken) return { ok: false, error: 'Token API not available' };
  return window.aura.auth.clearToken();
}
