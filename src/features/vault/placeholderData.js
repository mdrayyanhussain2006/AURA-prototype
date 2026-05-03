/**
 * Encrypted data placeholders for the Data Vault screen.
 * In production these would be real vault items decrypted in main process.
 */

export const ENCRYPTED_PLACEHOLDERS = [
  { id: 'vault-1', nameMasked: '••••••••••••••••', type: 'note', lastModified: '2025-01-28T14:32:00Z', previewMasked: '••••••••••••••••••••••••••••••••' },
  { id: 'vault-2', nameMasked: '••••••••••••••••', type: 'document', lastModified: '2025-01-27T09:15:00Z', previewMasked: '••••••••••••••••••••••••••••••••' },
  { id: 'vault-3', nameMasked: '••••••••••••••••', type: 'note', lastModified: '2025-01-26T18:00:00Z', previewMasked: '••••••••••••••••••••••••••••••••' },
  { id: 'vault-4', nameMasked: '••••••••••••••••', type: 'credential', lastModified: '2025-01-25T11:22:00Z', previewMasked: '••••••••••••••••••••••••••••••••' },
  { id: 'vault-5', nameMasked: '••••••••••••••••', type: 'note', lastModified: '2025-01-24T16:45:00Z', previewMasked: '••••••••••••••••••••••••••••••••' },
  { id: 'vault-6', nameMasked: '••••••••••••••••', type: 'document', lastModified: '2025-01-23T08:30:00Z', previewMasked: '••••••••••••••••••••••••••••••••' },
  { id: 'vault-7', nameMasked: '••••••••••••••••', type: 'note', lastModified: '2025-01-22T20:12:00Z', previewMasked: '••••••••••••••••••••••••••••••••' },
];

export function formatVaultDate(isoString) {
  try {
    const d = new Date(isoString);
    return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch (err) {
    console.warn('[placeholderData] Date format failed:', err?.message ?? err);
    return '—';
  }
}
