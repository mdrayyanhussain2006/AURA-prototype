import { useState, useEffect, useCallback } from 'react';
import * as authIpc from './authIpc';

export function useAuth() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refreshSession = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await authIpc.getSession();
    if (res.ok) setSession(res.session ?? null);
    else setError(res.error ?? 'Failed to get session');
    setLoading(false);
    return res;
  }, []);

  useEffect(() => {
    refreshSession();
  }, [refreshSession]);

  const login = useCallback(async (username, passphrase) => {
    setError(null);
    const res = await authIpc.login(username, passphrase);
    if (res.ok) setSession(res.session ?? null);
    else setError(res.error ?? 'Login failed');
    return res;
  }, []);

  const logout = useCallback(async () => {
    setError(null);
    const res = await authIpc.logout();
    if (res.ok) setSession(null);
    return res;
  }, []);

  return { session, loading, error, refreshSession, login, logout };
}
