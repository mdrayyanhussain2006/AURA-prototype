import { useState, useEffect, useCallback } from 'react';
import * as consentIpc from './consentIpc';

export function useConsent() {
  const [consents, setConsents] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await consentIpc.getAll();
    if (res.ok) setConsents(res.consents ?? {});
    else setError(res.error ?? 'Failed to load consents');
    setLoading(false);
    return res;
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const updateConsent = useCallback(async (scope, granted) => {
    const res = await consentIpc.update(scope, granted);
    if (res.ok) await refresh();
    return res;
  }, [refresh]);

  return { consents, loading, error, refresh, updateConsent };
}
