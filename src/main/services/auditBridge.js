/**
 * AURA Audit Bridge — Event-driven health audit trigger.
 *
 * Replaces the 30-second timer loop. Any module (vault, auth) can call
 * triggerHealthAudit() after a mutation to get an immediate security scan.
 * Prevents concurrent audits via the _auditRunning guard.
 */

const Channels = require('../../shared/ipcChannels.cjs');

let _mainWindowRef = null;
let _auditRunning = false;

function setWindow(win) {
  _mainWindowRef = win;
}

async function triggerHealthAudit() {
  if (_auditRunning || !_mainWindowRef || _mainWindowRef.isDestroyed()) return;
  _auditRunning = true;
  try {
    const { runHealthAudit } = require('./healthAuditor');
    const auditData = await runHealthAudit();
    _mainWindowRef.webContents.send(Channels.INSIGHTS_GET_SUMMARY, auditData);
    try {
      const { appendScore } = require('./scoreHistory');
      await appendScore(auditData);
    } catch (err) {
      console.error('[auditBridge] Score append failed:', err?.message ?? err);
    }
    console.log(`[HealthAudit] Event-driven scan — score: ${auditData.score}/100 (${auditData.level})`);
  } catch (err) {
    console.error('[HealthAudit] Audit error:', err?.message ?? err);
  } finally {
    _auditRunning = false;
  }
}

module.exports = { setWindow, triggerHealthAudit };
