import React from 'react';
import GlassCard from '../components/ui/GlassCard';

function StatCard({ label, value, hint }) {
  return (
    <GlassCard priority="secondary" className="flex flex-col p-4">
      <div className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
        {label}
      </div>
      <div className="mt-2 text-2xl font-semibold text-slate-100">{value}</div>
      <div className="mt-1 text-xs text-slate-400">{hint}</div>
    </GlassCard>
  );
}

function ActivityItem({ title, timestamp, level }) {
  const levelColor =
    level === 'warning'
      ? 'text-amber-300 border-amber-500/30 bg-amber-500/5'
      : 'text-emerald-300 border-emerald-500/30 bg-emerald-500/5';

  return (
    <div className="flex items-center justify-between rounded-lg border border-slate-800/80 bg-slate-950/70 px-3 py-2 text-xs">
      <div className="flex items-center gap-2">
        <span className={`h-1.5 w-1.5 rounded-full ${level === 'warning' ? 'bg-amber-400' : 'bg-emerald-400'}`} />
        <span className="text-slate-200">{title}</span>
      </div>
      <span className={`rounded-full px-2 py-0.5 ${levelColor}`}>{timestamp}</span>
    </div>
  );
}

function DashboardPage() {
  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-3">
        <StatCard
          label="Indexed Artifacts"
          value="1,248"
          hint="Documents, conversations, and knowledge fragments currently tracked."
        />
        <StatCard
          label="Integrity Score"
          value="99.7%"
          hint="Consistency and redundancy across your local vault."
        />
        <StatCard
          label="AI Impact Radius"
          value="Local-first"
          hint="AI suggestions are constrained to your encrypted, local context."
        />
      </section>

      <section className="grid gap-6 md:grid-cols-3">
        <GlassCard priority="primary" className="md:col-span-2 space-y-3 p-5">
          <h2 className="text-sm font-semibold text-slate-100">Vault Activity</h2>
          <p className="text-xs text-slate-400">
            AURA continuously maintains your personal archive while respecting explicit user controls.
          </p>
          <div className="mt-3 space-y-2">
            <ActivityItem
              title="New note cluster created: &quot;Research / Autonomous Systems&quot;"
              timestamp="2 min ago"
              level="ok"
            />
            <ActivityItem
              title="Archive reconciliation completed for &quot;Design Journal&quot;"
              timestamp="18 min ago"
              level="ok"
            />
            <ActivityItem
              title="AI assistant requested access to &quot;Private / Finance&quot; (blocked)"
              timestamp="42 min ago"
              level="warning"
            />
          </div>
        </GlassCard>
        <GlassCard priority="secondary" className="space-y-3 p-5">
          <h2 className="text-sm font-semibold text-slate-100">Guardrails</h2>
          <p className="text-xs text-slate-400">
            High-level controls governing how AURA and connected AI systems can interact with your data.
          </p>
          <ul className="mt-3 space-y-2 text-xs text-slate-300">
            <li className="flex items-start gap-2">
              <span className="mt-1 h-1.5 w-1.5 rounded-full bg-emerald-400" />
              <span>
                <span className="font-medium">Local-first storage</span> — data is written to local encrypted
                volumes by default.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1 h-1.5 w-1.5 rounded-full bg-amber-300" />
              <span>
                <span className="font-medium">Explicit AI scopes</span> — every external model call is scoped to a
                user-approved context.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1 h-1.5 w-1.5 rounded-full bg-sky-400" />
              <span>
                <span className="font-medium">Transparent flows</span> — upcoming integration points will surface
                clear, inspectable plans.
              </span>
            </li>
          </ul>
        </GlassCard>
      </section>
    </div>
  );
}

export default DashboardPage;

