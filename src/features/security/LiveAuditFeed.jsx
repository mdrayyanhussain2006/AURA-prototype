import React, { useRef, useEffect, useState } from 'react';
import { useHealthPush } from '../../renderer/hooks/useHealthPush';

const SEVERITY_CONFIG = {
  critical: { icon: '🔴', color: '#fb7185' },
  high:     { icon: '🟠', color: '#fb923c' },
  medium:   { icon: '🟡', color: '#fbbf24' },
  ok:       { icon: '🟢', color: '#34d399' }
};

const MAX_ENTRIES = 50;

function formatTime(iso) { try { return new Date(iso).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }); } catch (err) { console.warn('[LiveAuditFeed] formatTime failed:', err?.message ?? err); return '--:--:--'; } }

function buildLogEntries(healthData) {
  if (!healthData) return [];
  const ts = healthData.auditedAt || new Date().toISOString();
  if (healthData.findings && healthData.findings.length > 0) {
    return healthData.findings.map((f) => ({ id: `${ts}-${f.itemId || 'sys'}-${f.type}`, timestamp: ts, severity: f.severity || 'medium', detail: f.detail || f.type, type: f.type }));
  }
  return [{ id: `${ts}-all-clear`, timestamp: ts, severity: 'ok', detail: `All clear — Score: ${healthData.score}/100 (${healthData.itemCount} items scanned)`, type: 'ALL_CLEAR' }];
}

export default function LiveAuditFeed() {
  const { healthData, isConnected } = useHealthPush();
  const [auditLog, setAuditLog] = useState([]);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (!healthData) return;
    const newEntries = buildLogEntries(healthData);
    setAuditLog((prev) => {
      const combined = [...newEntries, ...prev];
      const seen = new Set();
      return combined.filter((e) => { if (seen.has(e.id)) return false; seen.add(e.id); return true; }).slice(0, MAX_ENTRIES);
    });
  }, [healthData]);

  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = 0; }, [auditLog]);

  return (
    <div className="aura-glass" style={{ borderRadius: '16px', padding: '20px', marginTop: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: 'var(--text-primary, #f1f5f9)', letterSpacing: '0.01em' }}>Live Audit Feed</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: isConnected ? '#34d399' : '#fbbf24' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: isConnected ? '#34d399' : '#fbbf24', display: 'inline-block', animation: isConnected ? 'pulse-dot 2s ease-in-out infinite' : 'none' }} />
          {isConnected ? 'Live' : 'Connecting...'}
        </div>
      </div>
      <div ref={scrollRef} style={{ maxHeight: '240px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px', scrollbarWidth: 'thin', scrollbarColor: 'rgba(148,163,184,0.2) transparent' }}>
        {auditLog.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--text-secondary, #94a3b8)', fontSize: '13px', fontStyle: 'italic' }}>Waiting for first audit cycle...</div>
        ) : auditLog.map((entry) => {
          const cfg = SEVERITY_CONFIG[entry.severity] || SEVERITY_CONFIG.ok;
          return (
            <div key={entry.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '8px 12px', borderRadius: '10px', backgroundColor: 'rgba(15, 23, 42, 0.4)', borderLeft: `3px solid ${cfg.color}`, transition: 'background-color 0.2s ease' }}>
              <span style={{ fontSize: '14px', flexShrink: 0, marginTop: '1px' }}>{cfg.icon}</span>
              <div style={{ flex: 1, minWidth: 0 }}><span style={{ fontSize: '13px', color: 'var(--text-primary, #e2e8f0)', lineHeight: 1.4, wordBreak: 'break-word' }}>{entry.detail}</span></div>
              <span style={{ fontSize: '11px', color: 'var(--text-secondary, #64748b)', flexShrink: 0, fontFamily: 'monospace', marginTop: '2px' }}>{formatTime(entry.timestamp)}</span>
            </div>
          );
        })}
      </div>
      <style>{`@keyframes pulse-dot { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }`}</style>
    </div>
  );
}
