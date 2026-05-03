import React from 'react';
import { useLocation } from 'react-router-dom';

const ROUTE_META = {
  '/vault': { title: 'Vault', subtitle: 'Manage your encrypted archive entries securely.' },
  '/consent': { title: 'Consent Manager', subtitle: 'Control permissions and audit consent history.' },
  '/insights': { title: 'Insights Engine', subtitle: 'AI-like analysis from local vault patterns.' },
  '/marketplace': { title: 'Marketplace', subtitle: 'Discover local modules and workflow accelerators.' },
  '/security': { title: 'Security Trust Center', subtitle: 'Runtime guardrails and policy integrity.' },
  '/settings': { title: 'Settings', subtitle: 'Manage preferences, privacy defaults, and exports.' },
  '/demo': { title: 'Demo Sandbox', subtitle: 'Test IPC connectivity and module health.' },
  '/dashboard': { title: 'Dashboard', subtitle: 'Overview of vault activity and system status.' },
  '/archives': { title: 'Archives', subtitle: 'Browse archived vault entries.' }
};

function normalizePlatform(value) {
  if (typeof value !== 'string') return 'Desktop';
  const raw = value.trim().toLowerCase();
  if (!raw) return 'Desktop';
  if (raw === 'win32' || raw.startsWith('win')) return 'Windows';
  if (raw === 'darwin' || raw.startsWith('mac')) return 'macOS';
  if (raw === 'linux') return 'Linux';
  return value;
}

function TopBar() {
  const location = useLocation();
  const meta = ROUTE_META[location.pathname] || { title: 'AURA', subtitle: 'Privacy-first local AI assistant.' };

  const [platform, setPlatform] = React.useState(() => {
    const raw = navigator?.platform || '';
    return normalizePlatform(raw);
  });

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await window.aura?.env?.getPlatform?.();
        if (mounted && res) {
          const value = typeof res === 'string' ? res : res?.platform;
          if (value) setPlatform(normalizePlatform(value));
        }
      } catch (err) {
        console.warn('[TopBar] getPlatform failed:', err?.message ?? err);
        // keep local fallback
      }
    })();
    return () => { mounted = false; };
  }, []);

  return (
    <header className="flex h-16 items-center justify-between border-b border-white/10 bg-gradient-to-r from-[#2b124c]/95 via-[#522b5b]/90 to-[#2b124c]/95 px-6 backdrop-blur-xl">
      <div>
        <h1 className="text-base font-semibold text-slate-100">{meta.title}</h1>
        <p className="text-xs text-[#dfb6b2]">{meta.subtitle}</p>
      </div>
      <div className="flex items-center gap-3 text-[11px] text-[#fbe4d8]">
        <div className="flex items-center gap-1 rounded-full border border-white/20 bg-white/10 px-3 py-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>System</span>
          <span className="text-[#dfb6b2]">•</span>
          <span className="text-white">Online</span>
        </div>
        <div className="hidden items-center gap-1 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 md:flex">
          <span className="text-[#dfb6b2]">Platform</span>
          <span className="text-white">{platform}</span>
        </div>
      </div>
    </header>
  );
}

export default TopBar;
