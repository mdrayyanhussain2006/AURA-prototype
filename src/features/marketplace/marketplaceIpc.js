/**
 * Marketplace IPC service — renderer-side only.
 */

export async function listItems() {
  if (!window.aura?.marketplace?.listItems) return { ok: false, error: 'Marketplace API not available', items: [] };
  return window.aura.marketplace.listItems();
}

export async function getItemDetails(id) {
  if (!window.aura?.marketplace?.getItemDetails) return { ok: false, error: 'Marketplace API not available', item: null };
  return window.aura.marketplace.getItemDetails({ id });
}
