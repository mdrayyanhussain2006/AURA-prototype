import React, { useMemo, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import GlassCard from '../components/ui/GlassCard';
import SecurityScoreRing from '../components/ui/SecurityScoreRing';
import DonutChart from '../components/ui/DonutChart';
import AnimatedProgressBar from '../components/ui/AnimatedProgressBar';
import { useHealthPush } from '../hooks/useHealthPush';
import { THEME } from '../../shared/constants';

const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0 }
};

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } }
};

function formatTimeAgo(isoString) {
  if (!isoString) return 'Waiting...';
  const diff = Date.now() - new Date(isoString).getTime();
  if (diff < 5000) return 'Just now';
  if (diff < 60000) return `${Math.floor(diff / 1000)}s ago`;
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  return new Date(isoString).toLocaleTimeString();
}

function ActivityItem({ title, timestamp, level }) {
  const levelColor =
    level === 'high'
      ? 'text-rose-300 border-rose-500/30 bg-rose-500/5'
      : level === 'medium'
        ? 'text-amber-300 border-amber-500/30 bg-amber-500/5'
        : 'text-emerald-300 border-emerald-500/30 bg-emerald-500/5';

  const dotColor =
    level === 'high' ? 'bg-rose-400' : level === 'medium' ? 'bg-amber-400' : 'bg-emerald-400';

  return (
    <div className="flex items-center justify-between rounded-lg border border-slate-800/80 bg-slate-950/70 px-3 py-2 text-xs">
      <div className="flex items-center gap-2">
        <span className={`h-1.5 w-1.5 rounded-full ${dotColor}`} />
        <span className="text-slate-200">{title}</span>
      </div>
      <span className={`rounded-full px-2 py-0.5 ${levelColor}`}>{timestamp}</span>
    </div>
  );
}

// Donut chart color palette for vault categories
const CATEGORY_COLORS = [
  THEME.NEON_PURPLE,
  THEME.NEON_PINK,
  THEME.NEON_CYAN,
  THEME.NEON_EMERALD,
  THEME.NEON_AMBER,
  THEME.NEON_ROSE,
  '#818cf8', // indigo
  '#38bdf8'  // sky
];

function DashboardPage() {
  const { healthData, lastUpdated, isConnected } = useHealthPush();
  const [vaultStats, setVaultStats] = useState({ items: [], categories: {} });

  // Fetch vault items for category breakdown
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await window.aura?.vault?.listItems?.();
        if (mounted && res?.ok && res.items) {
          const cats = {};
          for (const item of res.items) {
            const key = item.type || 'note';
            cats[key] = (cats[key] || 0) + 1;
          }
          setVaultStats({ items: res.items, categories: cats });
        }
      } catch (err) {
        console.warn('[Dashboard] Vault stats fetch failed:', err?.message ?? err);
        // keep defaults
      }
    })();
    return () => { mounted = false; };
  }, [healthData]); // Re-fetch when healthData updates

  // Build donut segments from categories
  const donutSegments = useMemo(() => {
    return Object.entries(vaultStats.categories).map(([label, value], i) => ({
      label,
      value,
      color: CATEGORY_COLORS[i % CATEGORY_COLORS.length]
    }));
  }, [vaultStats.categories]);

  // Derive display values from health data
  const score = healthData?.score ?? 100;
  const level = healthData?.level ?? 'strong';
  const itemCount = healthData?.itemCount ?? vaultStats.items.length;
  const piiCount = healthData?.piiCount ?? 0;
  const weakCount = healthData?.weakCount ?? 0;
  const findings = healthData?.findings ?? [];

  // Progress bar metrics
  const encryptionCoverage = 100; // All items are always encrypted via safeStorage
  const redactionCoverage = itemCount > 0 ? Math.round(((itemCount - piiCount) / itemCount) * 100) : 100;
  const entropyCoverage = itemCount > 0 ? Math.round(((itemCount - weakCount) / itemCount) * 100) : 100;

  return (
    <motion.div
      className="space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      {/* Row 1: Key Metrics */}
      <motion.section variants={cardVariants} className="grid gap-4 md:grid-cols-3">
        {/* Security Score */}
        <GlassCard priority="primary" className="flex flex-col items-center justify-center p-6">
          <SecurityScoreRing score={score} level={level} size={130} strokeWidth={10} />
          <p className="mt-3 text-[10px] uppercase tracking-widest text-slate-400">
            Security Score
          </p>
          <div className="mt-1 flex items-center gap-1.5">
            <motion.span
              className="h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: isConnected ? THEME.NEON_EMERALD : THEME.SCORE_ATTENTION }}
              animate={{ opacity: [1, 0.4, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
            <span className="text-[10px] text-slate-500">
              {isConnected ? `Scanned ${formatTimeAgo(lastUpdated)}` : 'Connecting...'}
            </span>
          </div>
        </GlassCard>

        {/* Vault Items */}
        <GlassCard priority="secondary" className="flex flex-col p-5">
          <div className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
            Indexed Artifacts
          </div>
          <div className="mt-2 text-3xl font-bold text-slate-100">
            {itemCount.toLocaleString()}
          </div>
          <div className="mt-1 text-xs text-slate-400">
            Documents, credentials, and secrets tracked.
          </div>
          <div className="mt-auto pt-3">
            <AnimatedProgressBar
              value={encryptionCoverage}
              label="Encryption Coverage"
              color={THEME.NEON_EMERALD}
              height={6}
            />
          </div>
        </GlassCard>

        {/* AI Impact Radius */}
        <GlassCard priority="secondary" className="flex flex-col p-5">
          <div className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
            AI Impact Radius
          </div>
          <div className="mt-2 text-3xl font-bold text-slate-100">Local-first</div>
          <div className="mt-1 text-xs text-slate-400">
            AI analysis constrained to encrypted, local context.
          </div>
          <div className="mt-auto pt-3 space-y-2">
            <AnimatedProgressBar
              value={redactionCoverage}
              label="PII Redaction"
              color={THEME.NEON_CYAN}
              height={6}
            />
            <AnimatedProgressBar
              value={entropyCoverage}
              label="Entropy Quality"
              color={THEME.NEON_PURPLE}
              height={6}
            />
          </div>
        </GlassCard>
      </motion.section>

      {/* Row 2: Activity + Categories + Guardrails */}
      <motion.section variants={cardVariants} className="grid gap-6 md:grid-cols-3">
        {/* Vault Activity */}
        <GlassCard priority="primary" className="md:col-span-2 space-y-3 p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-100">Health Audit Findings</h2>
            <span className="rounded-full bg-white/[0.06] px-2.5 py-1 text-[10px] uppercase tracking-widest text-slate-400">
              {findings.length} finding{findings.length !== 1 ? 's' : ''}
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Autonomous health loop scanning every 30 seconds. Issues are detected and reported in real-time.
          </p>
          <div className="mt-3 space-y-2 max-h-52 overflow-y-auto">
            {findings.length === 0 ? (
              <ActivityItem
                title="All vault items pass security checks"
                timestamp={formatTimeAgo(lastUpdated)}
                level="ok"
              />
            ) : (
              findings.slice(0, 8).map((finding, i) => (
                <ActivityItem
                  key={`${finding.itemId || 'sys'}-${i}`}
                  title={finding.detail}
                  timestamp={finding.severity}
                  level={finding.severity}
                />
              ))
            )}
          </div>
        </GlassCard>

        {/* Data Categorization Donut */}
        <GlassCard priority="secondary" className="space-y-3 p-5">
          <h2 className="text-sm font-semibold text-slate-100">Data Categorization</h2>
          <p className="text-xs text-slate-400">
            Breakdown of vault items by type.
          </p>
          {donutSegments.length > 0 ? (
            <div className="flex justify-center pt-2">
              <DonutChart segments={donutSegments} size={140} strokeWidth={16} />
            </div>
          ) : (
            <div className="flex items-center justify-center py-8">
              <p className="text-xs text-slate-500">Add items to see categorization.</p>
            </div>
          )}
        </GlassCard>
      </motion.section>

      {/* Row 3: Guardrails */}
      <motion.section variants={cardVariants}>
        <GlassCard priority="secondary" className="space-y-3 p-5">
          <h2 className="text-sm font-semibold text-slate-100">Guardrails</h2>
          <p className="text-xs text-slate-400">
            High-level controls governing how AURA and connected AI systems interact with your data.
          </p>
          <ul className="mt-3 space-y-2 text-xs text-slate-300">
            <li className="flex items-start gap-2">
              <span className="mt-1 h-1.5 w-1.5 rounded-full bg-emerald-400 shrink-0" />
              <span>
                <span className="font-medium">Local-first storage</span> — data is written to local encrypted
                volumes by default. OS Keychain (DPAPI/Keychain) secures master keys.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1 h-1.5 w-1.5 rounded-full bg-cyan-400 shrink-0" />
              <span>
                <span className="font-medium">Server-side redaction gate</span> — PII is scrubbed in the Trusted
                Main Process before encryption, regardless of renderer behavior.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1 h-1.5 w-1.5 rounded-full bg-amber-300 shrink-0" />
              <span>
                <span className="font-medium">Explicit AI scopes</span> — every external model call is scoped to a
                user-approved context.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1 h-1.5 w-1.5 rounded-full bg-purple-400 shrink-0" />
              <span>
                <span className="font-medium">Autonomous health audit</span> — proactive 30-second loop scans for
                weak secrets, unredacted PII, and integrity violations.
              </span>
            </li>
          </ul>
        </GlassCard>
      </motion.section>
    </motion.div>
  );
}

export default DashboardPage;
