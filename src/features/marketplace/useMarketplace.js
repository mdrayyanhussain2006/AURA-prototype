import { useState, useEffect, useCallback } from 'react';
import * as marketplaceIpc from './marketplaceIpc';
import * as firestoreService from '../../renderer/services/firestoreService';

/**
 * useMarketplace — Firestore-first data fetch with IPC offline fallback.
 *
 * Strategy:
 *   1. Try Firestore (cloud data from aura_modules collection)
 *   2. If Firestore fails (offline/error), fall back to IPC local mock
 *   3. Track data source for UI display
 */
export function useMarketplace() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [source, setSource] = useState(null); // 'firestore' | 'local'

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);

    // ── Attempt 1: Firestore (cloud) ──
    try {
      const cloudRes = await firestoreService.fetchModules();
      if (cloudRes.ok && cloudRes.items.length > 0) {
        setItems(cloudRes.items);
        setSource('firestore');
        setLoading(false);
        return { ok: true, items: cloudRes.items, source: 'firestore' };
      }
    } catch (err) {
      console.warn('[useMarketplace] Firestore fetch failed:', err?.message ?? err);
      // Firestore failed — fall through to IPC
    }

    // ── Attempt 2: IPC local mock (offline fallback) ──
    try {
      const localRes = await marketplaceIpc.listItems();
      if (localRes.ok) {
        const normalizedItems = Array.isArray(localRes.items) ? localRes.items : [];
        setItems(normalizedItems);
        setSource('local');
        setLoading(false);
        return { ok: true, items: normalizedItems, source: 'local' };
      }

      setItems([]);
      const message = localRes.error ?? 'Failed to load marketplace items';
      setError(message);
      setLoading(false);
      return { ok: false, error: message, items: [] };
    } catch (err) {
      setItems([]);
      const message = err instanceof Error ? err.message : 'Failed to load marketplace';
      setError(message);
      setLoading(false);
      return { ok: false, error: message, items: [] };
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const getItemDetails = useCallback(async (id) => {
    // Try Firestore first, then IPC fallback
    try {
      const cloudRes = await firestoreService.fetchModuleById(id);
      if (cloudRes.ok && cloudRes.item) return cloudRes;
    } catch (err) { console.warn('[useMarketplace] Firestore detail fallback:', err?.message ?? err); /* fallback */ }

    return marketplaceIpc.getItemDetails(id);
  }, []);

  return { items, loading, error, source, refresh, getItemDetails };
}
