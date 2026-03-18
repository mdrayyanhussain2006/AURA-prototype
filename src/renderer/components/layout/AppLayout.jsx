import React from 'react';
import SidebarNav from './SidebarNav';
import TopBar from './TopBar';
import CursorDriftBackground from './CursorDriftBackground';

function AppLayout({ children }) {
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
    </div>
  );
}

export default AppLayout;

