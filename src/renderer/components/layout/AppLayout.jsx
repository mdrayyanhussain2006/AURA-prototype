import React, { useState, useEffect } from 'react';
import SidebarNav from './SidebarNav';
import TopBar from './TopBar';
import CursorDriftBackground from './CursorDriftBackground';
import VaultLockOverlay from '../ui/VaultLockOverlay';
import { useAutoLock } from '../../hooks/useAutoLock';

function AppLayout({ children }) {
  const [autoLockMinutes, setAutoLockMinutes] = useState(10);

  // Load auto-lock setting from settings
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await window.aura?.settings?.get?.();
        if (mounted && res?.ok && res.settings) {
          const mins = Number(res.settings.autoLockMinutes);
          if (Number.isFinite(mins) && mins >= 1) {
            setAutoLockMinutes(mins);
          }
        }
      } catch {
        // keep default
      }
    })();
    return () => { mounted = false; };
  }, []);

  const { isLocked, unlock } = useAutoLock(autoLockMinutes, true);

  return (
    <div className="aura-app-shell relative min-h-screen w-screen overflow-hidden bg-gradient-to-br from-[#020617] to-[#0f172a] text-white">
      <CursorDriftBackground />

      <div className="relative z-10 flex h-full w-full p-6 gap-6">
        <aside className="aura-panel w-[88px] shrink-0 flex-col items-center rounded-3xl border border-white/10 bg-white/5 shadow-2xl backdrop-blur-xl flex py-6 transition-all duration-300">
          <SidebarNav />
        </aside>

        <div className="flex flex-1 flex-col overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-2xl backdrop-blur-xl transition-all duration-300">
          <TopBar />
          <main className="flex-1 overflow-y-auto w-full">
            <div className="mx-auto w-full p-6 space-y-6 flex flex-col gap-6">{children}</div>
          </main>
        </div>
      </div>

      {/* Auto-lock overlay */}
      {isLocked && <VaultLockOverlay onUnlock={unlock} />}
    </div>
  );
}

export default AppLayout;
