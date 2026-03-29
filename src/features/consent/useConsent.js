import { useState, useEffect, useCallback } from 'react';
import * as consentIpc from './consentIpc';

export function useConsent() {
  const [consents, setConsents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadConsents = useCallback(async () => {
    setLoading(true);
    setError(null);

    const res = await consentIpc.getAll();
    if (res.ok) {
      setConsents(Array.isArray(res.consents) ? res.consents : []);
    } else {
      setError(res.error ?? 'Failed to load consents');
    }

    setLoading(false);
    return res;
  }, []);

  useEffect(() => {
    loadConsents();
  }, [loadConsents]);

  const updateConsent = useCallback(async (data) => {
    const res = await consentIpc.update(data);
    if (res.ok) {
      await loadConsents();
    }

    return res;
  }, [loadConsents]);

  return { consents, loading, error, loadConsents, updateConsent };
}
