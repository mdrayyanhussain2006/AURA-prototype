import { useState, useEffect, useCallback } from 'react';
import * as securityIpc from './securityIpc';

export function useSecurity() {
  const [status, setStatus] = useState(null);
  const [policies, setPolicies] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    const [statusRes, policiesRes] = await Promise.all([
      securityIpc.getStatus(),
      securityIpc.getPolicies()
    ]);
    if (statusRes.ok) setStatus(statusRes.status ?? null);
    if (policiesRes.ok) setPolicies(policiesRes.policies ?? null);
    if (!statusRes.ok) setError(statusRes.error ?? 'Failed to load security');
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { status, policies, loading, error, refresh };
}
