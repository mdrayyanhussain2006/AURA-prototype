import { useState, useEffect, useCallback } from 'react';
import * as marketplaceIpc from './marketplaceIpc';

export function useMarketplace() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await marketplaceIpc.listItems();
    if (res.ok) setItems(res.items ?? []);
    else setError(res.error ?? 'Failed to list marketplace items');
    setLoading(false);
    return res;
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const getItemDetails = useCallback((id) => marketplaceIpc.getItemDetails(id), []);

  return { items, loading, error, refresh, getItemDetails };
}
