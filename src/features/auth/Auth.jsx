import React from 'react';
import { useAuth } from './useAuth';

function Auth() {
  const { session, loading, error, login, logout } = useAuth();

  if (loading) {
    return (
      <div className="rounded-xl border border-aura-border bg-slate-950/80 p-6 text-center text-slate-400">
        Loading auth…
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <header>
        <h2 className="text-sm font-semibold text-slate-100">Auth</h2>
        <p className="text-xs text-slate-400">Session and vault access.</p>
      </header>
      {error && (
        <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
          {error}
        </div>
      )}
      <div className="rounded-xl border border-aura-border bg-slate-950/80 p-4 text-xs text-slate-300">
        {session ? (
          <div className="flex items-center justify-between">
            <span>Logged in as <strong>{session.username}</strong></span>
            <button
              type="button"
              onClick={logout}
              className="rounded-md border border-slate-600 px-3 py-1.5 text-slate-200 hover:bg-slate-800"
            >
              Log out
            </button>
          </div>
        ) : (
          <p>No active session. Use Settings or vault unlock to sign in.</p>
        )}
      </div>
    </div>
  );
}

export default Auth;
