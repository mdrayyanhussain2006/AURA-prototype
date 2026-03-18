import React from 'react';

function ArchivesPage() {
  return (
    <div className="space-y-4">
      <header>
        <h2 className="text-sm font-semibold text-slate-100">Archives</h2>
        <p className="text-xs text-slate-400">
          Organize, query, and refine the long-term memory of your personal systems.
        </p>
      </header>

      <div className="rounded-xl border border-aura-border bg-slate-950/80 p-4 text-xs text-slate-300">
        <p className="mb-2 text-slate-400">
          This is a placeholder for the core AURA archive management UI. The layout is designed to host:
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Hierarchical collections and lenses over your data.</li>
          <li>Encrypted local indexes and vector search controls.</li>
          <li>AI-assisted curation tools within strict, user-defined boundaries.</li>
        </ul>
      </div>
    </div>
  );
}

export default ArchivesPage;

