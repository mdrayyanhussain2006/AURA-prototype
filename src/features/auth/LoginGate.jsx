import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from './useAuth';

/**
 * LoginGate — Hard gate that blocks all vault access until authenticated.
 *
 * Renders a full-screen login form with:
 *   - Username + passphrase local auth (primary)
 *   - Google Sign-In button (redirect-based, Electron-safe)
 *   - AURA branding and glassmorphic design
 *
 * If a valid session exists, renders children (the app).
 */
export default function LoginGate({ children }) {
  const { session, loading, error, login, loginWithGoogle } = useAuth();
  const [username, setUsername] = useState('');
  const [passphrase, setPassphrase] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // Session exists — render the app
  if (session) return <>{children}</>;

  // Still checking session — show loading
  if (loading) {
    return (
      <div style={{
        position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)',
        fontFamily: "'Inter', sans-serif"
      }}>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
            <div style={{
              width: '48px', height: '48px', borderRadius: '50%',
              border: '3px solid rgba(167, 139, 250, 0.3)', borderTopColor: '#a78bfa',
              animation: 'spin 1s linear infinite'
            }} />
            <span style={{ color: '#94a3b8', fontSize: '14px', letterSpacing: '0.05em' }}>Initializing AURA Vault...</span>
          </div>
        </motion.div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const handlePassphraseLogin = async (e) => {
    e.preventDefault();
    if (!username.trim() || !passphrase) return;
    setSubmitting(true);
    await login(username.trim(), passphrase);
    setSubmitting(false);
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    try {
      await loginWithGoogle();
    } catch { /* error set by hook */ }
    setGoogleLoading(false);
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)',
      fontFamily: "'Inter', sans-serif", overflow: 'hidden'
    }}>
      {/* Background glow */}
      <div style={{
        position: 'absolute', width: '500px', height: '500px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(139,92,246,0.15) 0%, transparent 70%)',
        top: '50%', left: '50%', transform: 'translate(-50%, -50%)', filter: 'blur(60px)', pointerEvents: 'none'
      }} />

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        style={{
          position: 'relative', width: '100%', maxWidth: '420px', padding: '0 24px'
        }}
      >
        <div style={{
          background: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
          border: '1px solid rgba(148, 163, 184, 0.1)', borderRadius: '24px',
          padding: '40px 32px', boxShadow: '0 25px 60px rgba(0,0,0,0.5)'
        }}>
          {/* Logo / Branding */}
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <div style={{
              width: '56px', height: '56px', margin: '0 auto 16px', borderRadius: '16px',
              background: 'linear-gradient(135deg, #8b5cf6, #6366f1)', display: 'flex',
              alignItems: 'center', justifyContent: 'center', fontSize: '24px', fontWeight: 800,
              color: '#fff', boxShadow: '0 8px 24px rgba(139, 92, 246, 0.3)'
            }}>A</div>
            <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 700, color: '#f1f5f9', letterSpacing: '-0.02em' }}>AURA Vault</h1>
            <p style={{ margin: '8px 0 0', fontSize: '13px', color: '#94a3b8' }}>
              Authenticate to access your encrypted vault
            </p>
          </div>

          {/* Error */}
          {error && (
            <div style={{
              marginBottom: '20px', padding: '10px 14px', borderRadius: '12px',
              border: '1px solid rgba(251, 113, 133, 0.3)', backgroundColor: 'rgba(251, 113, 133, 0.1)',
              color: '#fb7185', fontSize: '12px', lineHeight: 1.5
            }}>
              {error}
            </div>
          )}

          {/* Passphrase Form */}
          <form onSubmit={handlePassphraseLogin} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#94a3b8', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Username
              </label>
              <input
                id="login-username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                autoComplete="username"
                autoFocus
                style={{
                  width: '100%', padding: '11px 14px', borderRadius: '12px',
                  border: '1px solid rgba(148, 163, 184, 0.15)', backgroundColor: 'rgba(15, 23, 42, 0.6)',
                  color: '#e2e8f0', fontSize: '14px', outline: 'none', transition: 'border-color 0.2s',
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => { e.target.style.borderColor = 'rgba(139, 92, 246, 0.5)'; }}
                onBlur={(e) => { e.target.style.borderColor = 'rgba(148, 163, 184, 0.15)'; }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#94a3b8', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Passphrase
              </label>
              <input
                id="login-passphrase"
                type="password"
                value={passphrase}
                onChange={(e) => setPassphrase(e.target.value)}
                placeholder="Enter your vault passphrase"
                autoComplete="current-password"
                style={{
                  width: '100%', padding: '11px 14px', borderRadius: '12px',
                  border: '1px solid rgba(148, 163, 184, 0.15)', backgroundColor: 'rgba(15, 23, 42, 0.6)',
                  color: '#e2e8f0', fontSize: '14px', outline: 'none', transition: 'border-color 0.2s',
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => { e.target.style.borderColor = 'rgba(139, 92, 246, 0.5)'; }}
                onBlur={(e) => { e.target.style.borderColor = 'rgba(148, 163, 184, 0.15)'; }}
              />
            </div>
            <button
              id="login-submit"
              type="submit"
              disabled={submitting || !username.trim() || !passphrase}
              style={{
                width: '100%', padding: '12px', borderRadius: '12px', border: 'none',
                background: submitting ? 'rgba(139, 92, 246, 0.4)' : 'linear-gradient(135deg, #8b5cf6, #6366f1)',
                color: '#fff', fontSize: '14px', fontWeight: 600, cursor: submitting ? 'wait' : 'pointer',
                transition: 'all 0.2s', marginTop: '4px',
                boxShadow: submitting ? 'none' : '0 4px 16px rgba(139, 92, 246, 0.3)'
              }}
            >
              {submitting ? 'Unlocking Vault...' : 'Unlock Vault'}
            </button>
          </form>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '24px 0' }}>
            <div style={{ flex: 1, height: '1px', background: 'rgba(148, 163, 184, 0.15)' }} />
            <span style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>or</span>
            <div style={{ flex: 1, height: '1px', background: 'rgba(148, 163, 184, 0.15)' }} />
          </div>

          {/* Google Sign-In */}
          <button
            id="login-google"
            type="button"
            onClick={handleGoogleLogin}
            disabled={googleLoading}
            style={{
              width: '100%', padding: '11px', borderRadius: '12px',
              border: '1px solid rgba(148, 163, 184, 0.15)', backgroundColor: 'rgba(255, 255, 255, 0.05)',
              color: '#e2e8f0', fontSize: '13px', fontWeight: 500, cursor: googleLoading ? 'wait' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
              transition: 'all 0.2s'
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            {googleLoading ? 'Redirecting...' : 'Continue with Google'}
          </button>

          {/* Footer */}
          <p style={{ margin: '24px 0 0', textAlign: 'center', fontSize: '11px', color: '#475569', lineHeight: 1.5 }}>
            All data is encrypted locally with OS-level keychain protection.
            <br />Your vault never leaves this device.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
