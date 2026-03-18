// Renderer-side wrapper over the secure preload API.
// This is where your UI can interact with the encrypted storage layer without knowing IPC details.

export async function saveSecureItem(key, value) {
  if (!window.aura?.storage?.saveSecureItem) {
    return { ok: false, error: 'Secure storage API not available' };
  }
  return window.aura.storage.saveSecureItem(key, value);
}

export async function getSecureItem(key) {
  if (!window.aura?.storage?.getSecureItem) {
    return { ok: false, error: 'Secure storage API not available', value: null };
  }
  return window.aura.storage.getSecureItem(key);
}

