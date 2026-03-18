import React from 'react';
import { motion } from 'framer-motion';

export default function VaultHero({ onEnter }) {
  return (
    <motion.section
      className="aura-hero-sheen relative min-h-[calc(100vh-8rem)] overflow-hidden rounded-2xl bg-gradient-to-br from-[#130a24] via-[#2b124c] to-[#b27aa7]/80 p-8 md:p-12"
      initial={{ opacity: 0, scale: 1.03, filter: 'blur(6px)' }}
      animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
      exit={{ opacity: 0, scale: 0.98, filter: 'blur(4px)' }}
      transition={{ duration: 0.65, ease: 'easeOut' }}
    >
      <motion.div
        className="pointer-events-none absolute -left-14 top-20 h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(252,189,221,0.55)_0%,rgba(252,189,221,0)_70%)] blur-3xl"
        animate={{ x: [-20, 20, -20], y: [-10, 10, -10] }}
        transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut' }}
      />

      <motion.div
        className="pointer-events-none absolute right-[-120px] top-[-60px] h-96 w-96 rounded-full bg-[radial-gradient(circle,rgba(187,134,252,0.45)_0%,rgba(187,134,252,0)_70%)] blur-3xl"
        animate={{ x: [20, -20, 20], y: [10, -10, 10] }}
        transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
      />

      <div className="relative z-10 flex min-h-[calc(100vh-12rem)] items-center">
        <div className="max-w-3xl">
          <motion.h1
            className="text-4xl font-extrabold leading-tight text-white md:text-6xl"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.12, ease: 'easeOut' }}
          >
            Secure. Intelligent. Local.
          </motion.h1>

          <motion.p
            className="mt-4 max-w-xl text-base text-white/75 md:text-lg"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.22, ease: 'easeOut' }}
          >
            Your private AI-powered vault
          </motion.p>

          <motion.button
            type="button"
            onClick={onEnter}
            className="mt-8 rounded-xl bg-white/90 px-6 py-3 text-sm font-semibold text-[#1c1030] shadow-[0_12px_30px_rgba(0,0,0,0.35)] transition-all duration-300 hover:scale-105 hover:bg-white"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.32, ease: 'easeOut' }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
          >
            Enter Vault
          </motion.button>
        </div>
      </div>
    </motion.section>
  );
}
