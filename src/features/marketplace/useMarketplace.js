import { useState, useEffect, useCallback } from 'react';
import * as marketplaceIpc from './marketplaceIpc';

export function useMarketplace() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await marketplaceIpc.listItems();
      if (res.ok) {
        const normalizedItems = Array.isArray(res.items) ? res.items : [];
        setItems(normalizedItems);
        return { ok: true, items: normalizedItems };
      }

      setItems([]);
      const message = res.error ?? 'Failed to list marketplace items';
      setError(message);
      return { ok: false, error: message, items: [] };
    } catch (err) {
      setItems([]);
      const message = err instanceof Error ? err.message : 'Failed to list marketplace items';
      setError(message);
      return { ok: false, error: message, items: [] };
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const getItemDetails = useCallback((id) => marketplaceIpc.getItemDetails(id), []);

  return { items, loading, error, refresh, getItemDetails };
}
