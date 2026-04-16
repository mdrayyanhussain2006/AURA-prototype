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

    try {
      const [statusRes, policiesRes] = await Promise.all([securityIpc.getStatus(), securityIpc.getPolicies()]);

      const nextStatus = statusRes.ok ? statusRes.status ?? null : null;
      const nextPolicies = policiesRes.ok ? policiesRes.policies ?? null : null;
      const errors = [statusRes.ok ? '' : statusRes.error, policiesRes.ok ? '' : policiesRes.error].filter(Boolean);

      setStatus(nextStatus);
      setPolicies(nextPolicies);

      if (errors.length > 0) {
        const message = errors.join(' | ');
        setError(message);
        return { ok: false, error: message, status: nextStatus, policies: nextPolicies };
      }

      return { ok: true, status: nextStatus, policies: nextPolicies };
    } catch (err) {
      setStatus(null);
      setPolicies(null);
      const message = err instanceof Error ? err.message : 'Failed to load security data';
      setError(message);
      return { ok: false, error: message, status: null, policies: null };
    } finally {
      setLoading(false);
    }
  }, []);

  const fixGuard = useCallback(async (guardKey) => {
    try {
      const result = await securityIpc.enableGuard(guardKey);
      await refresh();
      return result;
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : 'Fix failed' };
    }
  }, [refresh]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { status, policies, loading, error, refresh, fixGuard };
}

