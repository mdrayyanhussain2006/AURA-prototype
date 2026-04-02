import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  Lock,
  ShieldCheck,
  BarChart3,
  Store,
  Settings,
  FileCheck2,
  LayoutDashboard
} from 'lucide-react';

const FEATURES = [
  { label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
  { label: 'Vault', to: '/vault', icon: Lock },
  { label: 'Consent', to: '/consent', icon: FileCheck2 },
  { label: 'Insights', to: '/insights', icon: BarChart3 },
  { label: 'Marketplace', to: '/marketplace', icon: Store },
  { label: 'Security', to: '/security', icon: ShieldCheck },
  { label: 'Settings', to: '/settings', icon: Settings }
];

export default function SidebarNav() {
  const location = useLocation();

  return (
    <nav className="flex h-full w-full flex-col items-center overflow-hidden">
      {/* Logo */}
      <div className="shrink-0 mb-6 flex justify-center w-full">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#fbe4d8] to-[#dfb6b2] shadow-lg shadow-black/30 transition-all duration-300 hover:scale-110 hover:shadow-xl">
          <span className="text-xl font-bold text-[#190019]">A</span>
        </div>
      </div>

      {/* Navigation */}
      <ul className="flex flex-col items-center gap-1 flex-1 w-full py-4">
        {FEATURES.map((f) => {
          const isActive = location.pathname === f.to;
          const Icon = f.icon;

          return (
            <li key={f.to} className="w-full flex justify-center relative group">
              {isActive && <div className="aura-nav-active-bar" />}
              <NavLink
                to={f.to}
                className={`relative flex h-11 w-11 items-center justify-center rounded-xl transition-all duration-200 ${
                  isActive
                    ? 'bg-white/10 text-white shadow-lg shadow-purple-500/20'
                    : 'text-slate-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                <Icon size={20} strokeWidth={isActive ? 2 : 1.5} />

                {/* Tooltip */}
                <span className="absolute left-full ml-3 rounded-lg bg-slate-900/95 border border-white/10 px-2.5 py-1.5 text-[11px] font-medium text-white shadow-xl opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-50">
                  {f.label}
                </span>
              </NavLink>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
