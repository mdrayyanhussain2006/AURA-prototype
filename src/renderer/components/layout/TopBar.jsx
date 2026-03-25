import React from 'react';

function TopBar() {
  const [platform, setPlatform] = React.useState(() => {
    // Immediate local fallback — no IPC needed
    const raw = navigator?.platform || '';
    if (raw.startsWith('Win')) return 'Windows';
    if (raw.startsWith('Mac')) return 'macOS';
    if (raw.includes('Linux')) return 'Linux';
    return 'Desktop';
  });

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const p = await window.aura?.env?.getPlatform?.();
        if (mounted && p) setPlatform(p);
      } catch {
        // keep local fallback — already set
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <header className="flex h-16 items-center justify-between border-b border-white/10 bg-gradient-to-r from-[#2b124c]/95 via-[#522b5b]/90 to-[#2b124c]/95 px-6 backdrop-blur-xl">
      <div>
        <h1 className="text-base font-semibold text-slate-100">Vault Overview</h1>
        <p className="text-xs text-[#dfb6b2]">
          Monitor your autonomous archive activity and integrity at a glance.
        </p>
      </div>
      <div className="flex items-center gap-3 text-[11px] text-[#fbe4d8]">
        <div className="flex items-center gap-1 rounded-full border border-white/20 bg-white/10 px-3 py-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-[#fbe4d8] animate-pulse" />
          <span>Vault Engine</span>
          <span className="text-[#dfb6b2]">•</span>
          <span className="text-white">Idle</span>
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

