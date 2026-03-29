/**
 * Consent IPC service — renderer-side only.
 */

export async function getAll() {
  if (!window.aura?.consent?.getAll) return { ok: false, error: 'Consent API not available', consents: [] };
  return window.aura.consent.getAll();
}

export async function update(payload, grantedArg) {
  if (!window.aura?.consent?.update) return { ok: false, error: 'Consent API not available' };

  if (payload && typeof payload === 'object' && !Array.isArray(payload)) {
    return window.aura.consent.update(payload);
  }

  return window.aura.consent.update({
    scope: payload,
    granted: Boolean(grantedArg)
  });
}
