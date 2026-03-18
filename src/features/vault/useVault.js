import { useState, useEffect, useCallback } from 'react';
import * as vaultIpc from './vaultIpc';

export function useVault() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    const res = await vaultIpc.listItems();
    
    if (res.ok) {
      setItems(res.items ?? []);
    } else {
      // Handle Auth-Gate or OS-level errors
      setError(res.error);
      setItems([]);
    }
    
    setLoading(false);
    return res;
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const saveItem = useCallback(async (id, payload) => {
    setError(null);
    const res = await vaultIpc.saveItem(id, payload);
    if (res.ok) {
      await refresh();
    } else {
      setError(res.error);
    }
    return res;
  }, [refresh]);

  const getItem = useCallback(async (id) => {
    setError(null);
    const res = await vaultIpc.getItem(id);
    if (!res.ok) setError(res.error);
    return res;
  }, []);

  return { items, loading, error, refresh, getItem, saveItem };
}