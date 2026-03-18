/**
 * Demo IPC service — renderer-side only.
 */

export async function ping() {
  if (!window.aura?.demo?.ping) return { ok: false, error: 'Demo API not available', pong: null };
  return window.aura.demo.ping();
}

export async function getInfo() {
  if (!window.aura?.demo?.getInfo) return { ok: false, error: 'Demo API not available', info: null };
  return window.aura.demo.getInfo();
}
