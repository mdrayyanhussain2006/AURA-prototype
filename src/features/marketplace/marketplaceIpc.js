/**
 * Marketplace IPC service — renderer-side only.
 */

function normalizeMessage(error, fallback) {
  if (typeof error === 'string' && error.trim()) return error.trim();
  return fallback;
}

function getMarketplaceBridge() {
  return window.aura?.marketplace || null;
}

export async function listItems() {
  const bridge = getMarketplaceBridge();
  if (!bridge || typeof bridge.listItems !== 'function') {
    return { ok: false, error: 'Marketplace API not available', items: [] };
  }

  try {
    const res = await bridge.listItems();
    if (res && res.ok) {
      return { ok: true, items: Array.isArray(res.items) ? res.items : [] };
    }
    return {
      ok: false,
      error: normalizeMessage(res?.error, 'Failed to load marketplace items'),
      items: []
    };
  } catch (err) {
    return {
      ok: false,
      error: normalizeMessage(err?.message, 'Marketplace request failed'),
      items: []
    };
  }
}

export async function getItemDetails(id) {
  const bridge = getMarketplaceBridge();
  if (!bridge || typeof bridge.getItemDetails !== 'function') {
    return { ok: false, error: 'Marketplace API not available', item: null };
  }

  const normalizedId = typeof id === 'string' ? id.trim() : '';
  if (!normalizedId) {
    return { ok: false, error: 'Marketplace item id is required', item: null };
  }

  try {
    const res = await bridge.getItemDetails({ id: normalizedId });
    if (res && res.ok && res.item && typeof res.item === 'object') {
      return { ok: true, item: res.item };
    }
    return {
      ok: false,
      error: normalizeMessage(res?.error, 'Failed to load marketplace item details'),
      item: null
    };
  } catch (err) {
    return {
      ok: false,
      error: normalizeMessage(err?.message, 'Marketplace details request failed'),
      item: null
    };
  }
}
