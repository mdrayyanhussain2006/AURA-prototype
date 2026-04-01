import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock } from 'lucide-react';

export default function VaultLockOverlay({ onUnlock }) {
  return (
    <AnimatePresence>
      <motion.div
        key="lock-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xl"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.3, ease: 'easeOut' }}
          className="flex flex-col items-center text-center px-8"
        >
          {/* Lock icon */}
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-white/10 shadow-[0_0_40px_rgba(168,85,247,0.15)]">
            <Lock size={36} className="text-purple-300" strokeWidth={1.5} />
          </div>

          <h2 className="text-xl font-bold text-white mb-2">Vault Locked</h2>
          <p className="text-sm text-slate-400 mb-8 max-w-xs">
            Locked due to inactivity. Click below to resume your session.
          </p>

          <button
            type="button"
            onClick={onUnlock}
            className="rounded-full bg-gradient-to-r from-purple-500 to-pink-500 px-8 py-3 text-sm font-semibold text-white shadow-[0_0_25px_rgba(168,85,247,0.4)] transition-all duration-200 hover:scale-105 hover:shadow-[0_0_40px_rgba(168,85,247,0.6)]"
          >
            Unlock Vault
          </button>

          <p className="mt-6 text-[11px] text-slate-500">
            Your data remains encrypted and secure.
          </p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
