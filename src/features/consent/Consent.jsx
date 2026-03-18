import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useConsent } from './useConsent';

/* ── Default consent categories ── */
const DEFAULT_CATEGORIES = [
  {
    scope: 'data_collection',
    label: 'Data Collection',
    description: 'Allow AURA to collect usage analytics for improving the experience.',
    icon: '📊',
  },
  {
    scope: 'ai_processing',
    label: 'AI Processing',
    description: 'Permit on-device AI models to process your archived data.',
    icon: '🤖',
  },
  {
    scope: 'cloud_sync',
    label: 'Cloud Sync',
    description: 'Enable encrypted backup and synchronization to the cloud.',
    icon: '☁️',
  },
  {
    scope: 'third_party_sharing',
    label: 'Third-Party Sharing',
    description: 'Allow anonymized data to be shared with trusted partners.',
    icon: '🔗',
  },
  {
    scope: 'biometric_auth',
    label: 'Biometric Auth',
    description: 'Use fingerprint or face recognition for vault access.',
    icon: '🔐',
  },
];

/* ── Animation variants ── */
const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
};

/* ── Single consent card ── */
function ConsentCard({ scope, label, description, icon, status, onToggle, disabled }) {
  // status: 'pending' | 'granted' | 'denied'
  const [toggling, setToggling] = useState(false);
  const isPending = status === 'pending';
  const isGranted = status === 'granted';

  const handleAction = async (granted) => {
    if (disabled || toggling) return;
    setToggling(true);
    await onToggle(scope, granted);
    setToggling(false);
  };

  return (
    <motion.div
      variants={cardVariants}
      whileHover={{ y: -4 }}
      className="group rounded-2xl bg-white/[0.04] p-5 shadow-[0_10px_30px_rgba(0,0,0,0.25)] backdrop-blur-[12px] transition-all duration-300 hover:ring-1 hover:ring-white/10"
    >
      <div className="flex items-start justify-between gap-4">
        {/* Left: icon + text */}
        <div className="flex items-start gap-3">
          <span className="mt-0.5 text-2xl">{icon}</span>
          <div>
            <h4 className="text-sm font-bold text-slate-100">{label}</h4>
            <p className="mt-1 text-xs leading-relaxed text-slate-400">{description}</p>
          </div>
        </div>

        {/* Right: actions */}
        {isPending ? null : (
          <button
            type="button"
            onClick={() => handleAction(!isGranted)}
            disabled={disabled || toggling}
            aria-label={`${isGranted ? 'Revoke' : 'Grant'} ${label}`}
            className="relative mt-1 flex h-7 w-12 flex-shrink-0 items-center rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-aura-accent/50 disabled:cursor-not-allowed disabled:opacity-40"
            style={{ backgroundColor: isGranted ? 'rgba(52,211,153,0.35)' : 'rgba(255,255,255,0.08)' }}
          >
            <motion.span
              className="absolute h-5 w-5 rounded-full shadow-md"
              style={{ backgroundColor: isGranted ? '#34d399' : '#64748b' }}
              animate={{ x: isGranted ? 22 : 4 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            />
          </button>
        )}
      </div>

      {/* Pending: Accept / Deny buttons */}
      {isPending && (
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={() => handleAction(true)}
            disabled={disabled || toggling}
            className="flex-1 rounded-full bg-emerald-500/20 px-4 py-2 text-xs font-semibold text-emerald-300 transition-all duration-200 hover:scale-[1.03] hover:bg-emerald-500/30 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {toggling ? 'Saving…' : 'Accept'}
          </button>
          <button
            type="button"
            onClick={() => handleAction(false)}
            disabled={disabled || toggling}
            className="flex-1 rounded-full bg-red-500/15 px-4 py-2 text-xs font-semibold text-red-400 transition-all duration-200 hover:scale-[1.03] hover:bg-red-500/25 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {toggling ? 'Saving…' : 'Deny'}
          </button>
        </div>
      )}

      {/* Status pill */}
      <div className="mt-3 flex items-center gap-2">
        <span
          className={`inline-block h-1.5 w-1.5 rounded-full ${
            isPending ? 'bg-amber-400' : isGranted ? 'bg-emerald-400' : 'bg-red-400'
          }`}
        />
        <span
          className={`text-[10px] uppercase tracking-widest ${
            isPending ? 'text-amber-300' : isGranted ? 'text-emerald-300' : 'text-red-400'
          }`}
        >
          {toggling ? 'Updating…' : isPending ? 'Awaiting Decision' : isGranted ? 'Accepted' : 'Denied'}
        </span>
      </div>
    </motion.div>
  );
}

/* ── Main Consent component ── */
function Consent() {
  const { consents, loading, error, updateConsent } = useConsent();
  const consentOnline = Boolean(window.aura?.consent);

  /*
   * Merge backend consents with default categories.
   * If a scope is NOT present in the backend response → status is 'pending'.
   * If present and true → 'granted'.  If present and false → 'denied'.
   */
  const categories = DEFAULT_CATEGORIES.map((cat) => {
    const hasRecord = Object.prototype.hasOwnProperty.call(consents, cat.scope);
    let status = 'pending';
    if (hasRecord) status = consents[cat.scope] ? 'granted' : 'denied';
    return { ...cat, status };
  });

  /* Also include any backend-only scopes not in our defaults */
  const extraScopes = Object.keys(consents).filter(
    (scope) => !DEFAULT_CATEGORIES.some((c) => c.scope === scope)
  );

  const pendingCount = categories.filter((c) => c.status === 'pending').length;
  const grantedCount = categories.filter((c) => c.status === 'granted').length
    + extraScopes.filter((s) => consents[s]).length;
  const deniedCount = categories.filter((c) => c.status === 'denied').length
    + extraScopes.filter((s) => !consents[s]).length;

  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      {/* ── Header ── */}
      <header className="rounded-2xl bg-white/[0.04] p-5 shadow-[0_10px_30px_rgba(0,0,0,0.25)] backdrop-blur-[12px]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-extrabold text-slate-100">Consent Manager</h2>
            <p className="mt-1 text-xs text-slate-300">
              Control how AURA handles your data. Every permission is transparent and revocable.
            </p>
          </div>
          <div className="rounded-2xl bg-white/[0.04] px-4 py-3 shadow-[0_10px_30px_rgba(0,0,0,0.25)] backdrop-blur-[12px]">
            <p className="text-[10px] uppercase tracking-widest text-slate-400">Consent Engine</p>
            <motion.span
              className={`mt-1 inline-flex text-xs font-semibold ${consentOnline ? 'text-emerald-300' : 'text-amber-300'}`}
              animate={{ opacity: [0.6, 1, 0.6] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
            >
              {consentOnline ? 'Online' : 'Offline'}
            </motion.span>
          </div>
        </div>
      </header>

      {/* ── Offline banner ── */}
      {!consentOnline && (
        <div className="rounded-2xl bg-amber-500/10 px-4 py-3 text-xs text-amber-200 shadow-[0_10px_30px_rgba(0,0,0,0.25)] backdrop-blur-[12px]">
          Consent Engine Offline — actions are disabled until the service reconnects.
        </div>
      )}

      {/* ── Stats row ── */}
      <motion.div
        className="grid gap-4 sm:grid-cols-3"
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        <motion.div
          variants={cardVariants}
          whileHover={{ y: -4 }}
          className="rounded-2xl bg-white/[0.04] p-4 text-center shadow-[0_10px_30px_rgba(0,0,0,0.25)] backdrop-blur-[12px] transition-all duration-300"
        >
          <p className="text-[10px] uppercase tracking-widest text-slate-400">Pending</p>
          <p className="mt-2 text-2xl font-bold text-amber-300">{pendingCount}</p>
        </motion.div>

        <motion.div
          variants={cardVariants}
          whileHover={{ y: -4 }}
          className="rounded-2xl bg-white/[0.04] p-4 text-center shadow-[0_10px_30px_rgba(0,0,0,0.25)] backdrop-blur-[12px] transition-all duration-300"
        >
          <p className="text-[10px] uppercase tracking-widest text-slate-400">Accepted</p>
          <p className="mt-2 text-2xl font-bold text-emerald-300">{grantedCount}</p>
        </motion.div>

        <motion.div
          variants={cardVariants}
          whileHover={{ y: -4 }}
          className="rounded-2xl bg-white/[0.04] p-4 text-center shadow-[0_10px_30px_rgba(0,0,0,0.25)] backdrop-blur-[12px] transition-all duration-300"
        >
          <p className="text-[10px] uppercase tracking-widest text-slate-400">Denied</p>
          <p className="mt-2 text-2xl font-bold text-red-400">{deniedCount}</p>
        </motion.div>
      </motion.div>

      {/* ── Error ── */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="rounded-2xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-xs text-amber-200"
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Consent cards ── */}
      {loading ? (
        <div className="flex items-center justify-center rounded-2xl bg-white/[0.04] p-10 shadow-[0_10px_30px_rgba(0,0,0,0.25)] backdrop-blur-[12px]">
          <motion.p
            className="text-xs text-slate-400"
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 1.4, repeat: Infinity }}
          >
            Loading consent records…
          </motion.p>
        </div>
      ) : (
        <motion.div
          className="grid gap-4 md:grid-cols-2"
          variants={containerVariants}
          initial="hidden"
          animate="show"
        >
          {categories.map((cat) => (
            <ConsentCard
              key={cat.scope}
              {...cat}
              onToggle={updateConsent}
              disabled={!consentOnline}
            />
          ))}

          {/* Extra backend-only scopes (always decided, never pending) */}
          {extraScopes.map((scope) => (
            <ConsentCard
              key={scope}
              scope={scope}
              label={scope.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
              description="Custom permission scope registered by the backend."
              icon="⚙️"
              status={consents[scope] ? 'granted' : 'denied'}
              onToggle={updateConsent}
              disabled={!consentOnline}
            />
          ))}
        </motion.div>
      )}

      {/* ── Privacy note ── */}
      <motion.footer
        className="rounded-2xl bg-white/[0.03] px-5 py-4 shadow-[0_10px_30px_rgba(0,0,0,0.25)] backdrop-blur-[12px]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <p className="text-[10px] uppercase tracking-widest text-slate-400">Privacy First</p>
        <p className="mt-2 text-xs leading-relaxed text-slate-400">
          All consent decisions are stored locally on your device. AURA never transmits permission
          states externally. You can change any setting at any time — changes take effect immediately.
        </p>
      </motion.footer>
    </motion.div>
  );
}

export default Consent;
