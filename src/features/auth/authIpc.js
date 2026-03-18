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
