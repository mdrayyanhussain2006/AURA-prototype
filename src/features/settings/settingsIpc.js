/**
 * Settings IPC service — renderer-side only.
 */

function normalizeMessage(error, fallback) {
  if (typeof error === 'string' && error.trim()) return error.trim();
  return fallback;
}

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function getSettingsBridge() {
  return window.aura?.settings || null;
}

export async function getSettings() {
  const bridge = getSettingsBridge();
  if (!bridge || typeof bridge.get !== 'function') {
    return { ok: false, error: 'Settings API not available', settings: null };
  }

  try {
    const res = await bridge.get();
    if (res && res.ok && isObject(res.settings)) {
      return { ok: true, settings: res.settings };
    }

    return {
      ok: false,
      error: normalizeMessage(res?.error, 'Failed to load settings'),
      settings: null
    };
  } catch (err) {
    return {
      ok: false,
      error: normalizeMessage(err?.message, 'Settings request failed'),
      settings: null
    };
  }
}

export async function updateSettings(payload) {
  const bridge = getSettingsBridge();
  if (!bridge || typeof bridge.update !== 'function') {
    return { ok: false, error: 'Settings API not available', settings: null };
  }

  if (!isObject(payload)) {
    return { ok: false, error: 'Invalid settings payload', settings: null };
  }

  try {
    const res = await bridge.update(payload);
    if (res && res.ok && isObject(res.settings)) {
      return { ok: true, settings: res.settings };
    }

    return {
      ok: false,
      error: normalizeMessage(res?.error, 'Failed to update settings'),
      settings: null
    };
  } catch (err) {
    return {
      ok: false,
      error: normalizeMessage(err?.message, 'Settings update request failed'),
      settings: null
    };
  }
}

export async function resetSettings() {
  const bridge = getSettingsBridge();
  if (!bridge || typeof bridge.reset !== 'function') {
    return { ok: false, error: 'Settings API not available', settings: null };
  }

  try {
    const res = await bridge.reset();
    if (res && res.ok && isObject(res.settings)) {
      return { ok: true, settings: res.settings };
    }

    return {
      ok: false,
      error: normalizeMessage(res?.error, 'Failed to reset settings'),
      settings: null
    };
  } catch (err) {
    return {
      ok: false,
      error: normalizeMessage(err?.message, 'Settings reset request failed'),
      settings: null
    };
  }
}
