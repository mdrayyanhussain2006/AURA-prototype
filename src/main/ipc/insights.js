const { ipcMain } = require('electron');
const Channels = require('../../shared/ipcChannels.cjs');
const { generateInsights } = require('../services/insightEngine');
const { readVaultItems } = require('../services/storage');
const { getRecentActivity, appendActivityEvent } = require('../services/activityLog');
const { readConsents, touchConsentUsageByApp } = require('../services/consentStorage');

async function hasInsightsConsent() {
  const consents = await readConsents();
  return consents.some((c) => c.app === 'Insights Engine' && c.granted);
}

function toDateOrNull(v) { const d = new Date(v); return Number.isNaN(d.getTime()) ? null : d; }

function buildCategoryCounts(items) {
  return items.reduce((r, item) => { const k = typeof item.type === 'string' && item.type.trim() ? item.type.trim() : 'uncategorized'; r[k] = (r[k] || 0) + 1; return r; }, {});
}

function getTopCategory(categories) {
  const entries = Object.entries(categories || {});
  if (entries.length === 0) return { name: 'uncategorized', count: 0 };
  const [name, count] = entries.sort((a, b) => b[1] - a[1])[0];
  return { name, count };
}

function countItemsInWindow(items, start, end) {
  return items.filter((item) => { const u = toDateOrNull(item.updatedAt); return u && u >= start && u < end; }).length;
}

function buildLocalAiHighlights({ totalItems, categories, recentAdds, previousAdds }) {
  const cc = Object.keys(categories).length;
  const top = getTopCategory(categories);
  const trend = recentAdds > previousAdds ? 'Your vault activity increased this week.' : recentAdds < previousAdds ? 'Your vault activity slowed down this week.' : 'Your vault activity is steady this week.';
  return [
    `Vault contains ${totalItems} items across ${cc || 1} categories.`,
    `Most used category: ${top.name}.`, trend,
    `You added ${recentAdds} item${recentAdds === 1 ? '' : 's'} recently.`
  ];
}

function registerInsightsIpc() {
  ipcMain.handle(Channels.INSIGHTS_GET_SUMMARY, async () => {
    if (!(await hasInsightsConsent())) return { ok: false, error: 'CONSENT_REQUIRED' };
    try {
      const items = await readVaultItems();
      const sorted = [...items].sort((a, b) => { const aD = toDateOrNull(a.updatedAt); const bD = toDateOrNull(b.updatedAt); return (bD ? bD.getTime() : 0) - (aD ? aD.getTime() : 0); });
      const categories = buildCategoryCounts(items);
      const topCategory = getTopCategory(categories);
      const recentActivity = sorted.slice(0, 3).map((item) => ({ id: item.id, type: item.type || 'uncategorized', updatedAt: item.updatedAt }));
      const now = new Date();
      const sevenAgo = new Date(now.getTime() - 7 * 86400000);
      const fourteenAgo = new Date(now.getTime() - 14 * 86400000);
      const recentAdds = countItemsInWindow(items, sevenAgo, now);
      const previousAdds = countItemsInWindow(items, fourteenAgo, sevenAgo);
      const smartInsightText = `You have ${items.length} items. Most are ${topCategory.name}.`;
      const aiHighlights = buildLocalAiHighlights({ totalItems: items.length, categories, recentAdds, previousAdds });
      await touchConsentUsageByApp('Insights Engine', 'Insights');
      await appendActivityEvent({ feature: 'Insights', action: 'summary', target: 'vault', meta: { totalItems: items.length, topCategory: topCategory.name } });
      const insights = generateInsights(items);
      return { ok: true, summary: { totalItems: items.length, categories, recentActivity, smartInsightText, aiHighlights, recentAdds, previousAdds, generatedAt: now.toISOString() }, data: insights };
    } catch (err) { console.error('[Insights] getSummary failed:', err?.message ?? err); return { ok: false, error: 'Insights failed' }; }
  });

  ipcMain.handle(Channels.INSIGHTS_GET_ACTIVITY, async (_event, { limit }) => {
    if (!(await hasInsightsConsent())) return { ok: false, error: 'CONSENT_REQUIRED' };
    const max = Math.min(Number(limit) || 10, 50);
    await touchConsentUsageByApp('Insights Engine', 'Insights');
    await appendActivityEvent({ feature: 'Insights', action: 'activity_view', target: 'audit_log', meta: { limit: max } });
    return { ok: true, activity: await getRecentActivity(max) };
  });

  // ── INSIGHTS_GET_SCORE_HISTORY (WS-2) ──
  ipcMain.handle(Channels.INSIGHTS_GET_SCORE_HISTORY, async (_event, rawPayload) => {
    try {
      const { getScoreHistory } = require('../services/scoreHistory');
      const days = rawPayload?.days || 7;
      const history = await getScoreHistory(Math.min(Math.max(Number(days) || 7, 1), 90));
      return { ok: true, history };
    } catch (err) {
      return { ok: false, error: 'Failed to load score history' };
    }
  });
}

module.exports = { registerInsightsIpc };
