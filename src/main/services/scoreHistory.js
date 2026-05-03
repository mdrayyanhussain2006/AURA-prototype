/**
 * AURA Score History — daily score tracking for trend charts.
 * Schema: [{ date: 'YYYY-MM-DD', score, level, itemCount, piiCount }]
 * 90-entry rolling window. Async from inception.
 */
const { app } = require('electron');
const fs = require('node:fs/promises');
const path = require('node:path');

const BASE_PATH = typeof app?.getPath === 'function' ? app.getPath('userData') : process.env.APPDATA || __dirname;
const HISTORY_FILE_PATH = path.join(BASE_PATH, 'aura-score-history.json');
const MAX_ENTRIES = 90;

function getTodayString() { return new Date().toISOString().slice(0, 10); }

async function readHistory() {
  try { await fs.access(HISTORY_FILE_PATH); const raw = await fs.readFile(HISTORY_FILE_PATH, 'utf8'); if (!raw || !raw.trim()) return []; const p = JSON.parse(raw); return Array.isArray(p) ? p : []; }
  catch (err) { console.warn('[scoreHistory] Read failed:', err?.message ?? err); return []; }
}

async function writeHistory(entries) {
  try { await fs.mkdir(path.dirname(HISTORY_FILE_PATH), { recursive: true }); await fs.writeFile(HISTORY_FILE_PATH, JSON.stringify(entries, null, 2), 'utf8'); return true; }
  catch (err) { console.error('[scoreHistory] Write failed:', err.message); return false; }
}

async function appendScore(auditResult) {
  if (!auditResult || typeof auditResult.score !== 'number') return false;
  const today = getTodayString();
  const entry = { date: today, score: auditResult.score, level: auditResult.level || 'unknown', itemCount: auditResult.itemCount || 0, piiCount: auditResult.piiCount || 0 };
  const history = await readHistory();
  const idx = history.findIndex((e) => e.date === today);
  if (idx > -1) history[idx] = entry; else history.push(entry);
  if (history.length > MAX_ENTRIES) history.splice(0, history.length - MAX_ENTRIES);
  return writeHistory(history);
}

async function getScoreHistory(days = 7) {
  const max = Math.min(Math.max(Number(days) || 7, 1), MAX_ENTRIES);
  const history = await readHistory();
  const historyMap = new Map(history.map((e) => [e.date, e]));
  const result = [];
  const now = new Date();
  for (let i = max - 1; i >= 0; i--) {
    const d = new Date(now); d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    result.push(historyMap.get(dateStr) || { date: dateStr, score: null, level: null, itemCount: null, piiCount: null });
  }
  return result;
}

module.exports = { HISTORY_FILE_PATH, appendScore, getScoreHistory };
