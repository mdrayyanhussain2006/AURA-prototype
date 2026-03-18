/**
 * Consent IPC service — renderer-side only.
 */

export async function getAll() {
  if (!window.aura?.consent?.getAll) return { ok: false, error: 'Consent API not available', consents: {} };
  return window.aura.consent.getAll();
}

export async function update(scope, granted) {
  if (!window.aura?.consent?.update) return { ok: false, error: 'Consent API not available' };
  return window.aura.consent.update({ scope, granted });
}
