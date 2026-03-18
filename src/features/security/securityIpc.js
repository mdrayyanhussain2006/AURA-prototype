/**
 * Security IPC service — renderer-side only.
 */

export async function getStatus() {
  if (!window.aura?.security?.getStatus) return { ok: false, error: 'Security API not available', status: null };
  return window.aura.security.getStatus();
}

export async function getPolicies() {
  if (!window.aura?.security?.getPolicies) return { ok: false, error: 'Security API not available', policies: null };
  return window.aura.security.getPolicies();
}
