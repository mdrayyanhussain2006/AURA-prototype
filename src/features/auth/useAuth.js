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

  const loginWithGoogle = useCallback(async () => {
    setError(null);
    try {
      // Initiate Google OAuth via main process (redirect-based)
      const res = await authIpc.initiateGoogleAuth();
      if (res.ok && res.session) {
        setSession(res.session);
      } else if (res.ok && !res.session) {
        // OAuth window opened — session will arrive via push listener
        // Set up a one-time listener for session changes
        if (window.aura?.auth?.onSessionChanged) {
          window.aura.auth.onSessionChanged((sessionData) => {
            if (sessionData) {
              setSession(sessionData);
              setError(null);
            }
          });
        }
      } else {
        setError(res.error ?? 'Google sign-in failed');
      }
      return res;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Google sign-in failed';
      setError(message);
      return { ok: false, error: message };
    }
  }, []);

  const logout = useCallback(async () => {
    setError(null);
    const res = await authIpc.logout();
    if (res.ok) setSession(null);
    return res;
  }, []);

  return { session, loading, error, refreshSession, login, loginWithGoogle, logout };
}
