/**
 * Security IPC service — renderer-side only.
 */

function normalizeMessage(error, fallback) {
  if (typeof error === 'string' && error.trim()) return error.trim();
  return fallback;
}

function getSecurityBridge() {
  return window.aura?.security || null;
}

export async function getStatus() {
  const bridge = getSecurityBridge();
  if (!bridge || typeof bridge.getStatus !== 'function') {
    return { ok: false, error: 'Security API not available', status: null };
  }

  try {
    const res = await bridge.getStatus();
    if (res && res.ok && res.status && typeof res.status === 'object') {
      return { ok: true, status: res.status };
    }

    return {
      ok: false,
      error: normalizeMessage(res?.error, 'Failed to load security status'),
      status: null
    };
  } catch (err) {
    return {
      ok: false,
      error: normalizeMessage(err?.message, 'Security status request failed'),
      status: null
    };
  }
}

export async function getPolicies() {
  const bridge = getSecurityBridge();
  if (!bridge || typeof bridge.getPolicies !== 'function') {
    return { ok: false, error: 'Security API not available', policies: null };
  }

  try {
    const res = await bridge.getPolicies();
    if (res && res.ok && res.policies && typeof res.policies === 'object') {
      return { ok: true, policies: res.policies };
    }

    return {
      ok: false,
      error: normalizeMessage(res?.error, 'Failed to load security policies'),
      policies: null
    };
  } catch (err) {
    return {
      ok: false,
      error: normalizeMessage(err?.message, 'Security policies request failed'),
      policies: null
    };
  }
}
