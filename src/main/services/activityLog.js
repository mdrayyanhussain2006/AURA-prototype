const { app } = require('electron');
const fs = require('node:fs/promises');
const path = require('node:path');

const BASE_PATH = typeof app?.getPath === 'function' ? app.getPath('userData') : process.env.APPDATA || __dirname;
const ACTIVITY_LOG_PATH = path.join(BASE_PATH, 'aura-activity-log.json');

async function readActivityLog() {
  try {
    await fs.access(ACTIVITY_LOG_PATH);
    const raw = await fs.readFile(ACTIVITY_LOG_PATH, 'utf8');
    if (!raw || !raw.trim()) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch { return []; }
}

async function writeActivityLog(entries) {
  try {
    await fs.mkdir(path.dirname(ACTIVITY_LOG_PATH), { recursive: true });
    await fs.writeFile(ACTIVITY_LOG_PATH, JSON.stringify(entries, null, 2), 'utf8');
    return true;
  } catch { return false; }
}

async function appendActivityEvent(event) {
  const list = await readActivityLog();
  const now = new Date().toISOString();
  const nextEvent = {
    id: event && typeof event.id === 'string' ? event.id : `activity_${Date.now()}`,
    feature: event && typeof event.feature === 'string' ? event.feature : 'Unknown Feature',
    action: event && typeof event.action === 'string' ? event.action : 'access',
    target: event && typeof event.target === 'string' ? event.target : 'vault',
    at: now,
    meta: event && event.meta && typeof event.meta === 'object' ? event.meta : {}
  };
  list.push(nextEvent);
  if (list.length > 500) list.splice(0, list.length - 500);
  await writeActivityLog(list);
  return nextEvent;
}

async function getRecentActivity(limit = 10) {
  const max = Math.min(Math.max(Number(limit) || 10, 1), 100);
  const list = await readActivityLog();
  return list.slice(-max).reverse();
}

module.exports = { ACTIVITY_LOG_PATH, appendActivityEvent, getRecentActivity, readActivityLog, writeActivityLog };
