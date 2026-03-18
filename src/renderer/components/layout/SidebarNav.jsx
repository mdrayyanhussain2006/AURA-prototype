import React from 'react';
import { NavLink } from 'react-router-dom';
import * as Constants from '../../../shared/constants';

const FEATURES = [
  { key: Constants.FEATURES.VAULT, label: 'Vault', to: '/vault', emoji: '🔐' },
  { key: Constants.FEATURES.CONSENT, label: 'Consent', to: '/consent', emoji: '✅' },
  { key: Constants.FEATURES.INSIGHTS, label: 'Insights', to: '/insights', emoji: '📊' },
  { key: Constants.FEATURES.MARKETPLACE, label: 'Marketplace', to: '/marketplace', emoji: '🛒' },
  { key: Constants.FEATURES.SECURITY, label: 'Security', to: '/security', emoji: '🛡️' },
  { key: Constants.FEATURES.DEMO, label: 'Demo', to: '/demo', emoji: '⚙️' }
];

export default function SidebarNav() {
  return (
    <nav className="flex h-full w-full flex-col items-center overflow-hidden">
      <div className="shrink-0 mb-6 flex justify-center w-full">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#fbe4d8] to-[#dfb6b2] shadow-lg shadow-black/30 group transition-all duration-300 hover:scale-110 hover:shadow-xl">
          <span className="text-xl font-bold text-[#190019]">A</span>
        </div>
      </div>

      <ul className="flex flex-col items-center gap-4 flex-1 w-full py-4">
        {FEATURES.map((f) => (
          <li key={f.key} className="w-full flex justify-center group transition-all duration-300">
            <NavLink
              to={f.to}
              title={f.label}
              className={({ isActive }) =>
                `flex h-12 w-12 items-center justify-center rounded-full text-xl transition-all duration-300 hover:scale-[1.02] hover:shadow-xl group-hover:scale-110 ${
                  isActive 
                    ? 'bg-white/10 text-white shadow-lg' 
                    : 'text-slate-400 hover:bg-white/5 hover:text-white'
                }`
              }
              aria-current={({ isActive }) => (isActive ? 'page' : undefined)}
            >
              <span className="group-hover:scale-110 transition-transform duration-300">{f.emoji}</span>
            </NavLink>
          </li>
        ))}
      </ul>

      <div className="mt-auto shrink-0 py-4 opacity-50 hover:opacity-100 transition-opacity">
        <div className="text-[10px] text-white">dev</div>
      </div>
    </nav>
  );
}

