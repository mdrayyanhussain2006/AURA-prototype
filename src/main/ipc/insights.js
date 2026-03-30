const { ipcMain } = require('electron');
const Channels = require('../../shared/ipcChannels.cjs');
const { readVaultItems } = require('../services/storage');
const { getRecentActivity, appendActivityEvent } = require('../services/activityLog');
const { readConsents, touchConsentUsageByApp } = require('../services/consentStorage');

function hasInsightsConsent() {
  const consents = readConsents();
  return consents.some((consent) => consent.app === 'Insights Engine' && consent.granted);
}

function toDateOrNull(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function buildCategoryCounts(items) {
  return items.reduce((result, item) => {
    const key = typeof item.type === 'string' && item.type.trim() ? item.type.trim() : 'uncategorized';
    result[key] = (result[key] || 0) + 1;
    return result;
  }, {});
}

function getTopCategory(categories) {
  const entries = Object.entries(categories || {});
  if (entries.length === 0) return { name: 'uncategorized', count: 0 };
  const [name, count] = entries.sort((a, b) => b[1] - a[1])[0];
  return { name, count };
}

function countItemsInWindow(items, startDate, endDate) {
  return items.filter((item) => {
    const updated = toDateOrNull(item.updatedAt);
    if (!updated) return false;
    return updated >= startDate && updated < endDate;
  }).length;
}

function buildLocalAiHighlights({ totalItems, categories, recentAdds, previousAdds }) {
  const categoryCount = Object.keys(categories).length;
  const topCategory = getTopCategory(categories);
  const trendLine =
    recentAdds > previousAdds
      ? 'Your vault activity increased this week.'
      : recentAdds < previousAdds
        ? 'Your vault activity slowed down this week.'
        : 'Your vault activity is steady this week.';

  return [
    `Vault contains ${totalItems} items across ${categoryCount || 1} categories.`,
    `Most used category: ${topCategory.name}.`,
    trendLine,
    `You added ${recentAdds} item${recentAdds === 1 ? '' : 's'} recently.`
  ];
}

function registerInsightsIpc() {
  ipcMain.handle(Channels.INSIGHTS_GET_SUMMARY, async () => {
    if (!hasInsightsConsent()) {
      return { ok: false, error: 'CONSENT_REQUIRED' };
    }

    try {
      const items = readVaultItems();
      const sortedByUpdatedAt = [...items].sort((a, b) => {
        const aDate = toDateOrNull(a.updatedAt);
        const bDate = toDateOrNull(b.updatedAt);
        return (bDate ? bDate.getTime() : 0) - (aDate ? aDate.getTime() : 0);
      });

      const categories = buildCategoryCounts(items);
      const topCategory = getTopCategory(categories);
      const recentActivity = sortedByUpdatedAt.slice(0, 3).map((item) => ({
        id: item.id,
        type: item.type || 'uncategorized',
        updatedAt: item.updatedAt
      }));

      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
      const recentAdds = countItemsInWindow(items, sevenDaysAgo, now);
      const previousAdds = countItemsInWindow(items, fourteenDaysAgo, sevenDaysAgo);

      const smartInsightText = `You have ${items.length} items. Most are ${topCategory.name}.`;
      const aiHighlights = buildLocalAiHighlights({
        totalItems: items.length,
        categories,
        recentAdds,
        previousAdds
      });

      touchConsentUsageByApp('Insights Engine', 'Insights');
      appendActivityEvent({
        feature: 'Insights',
        action: 'summary',
        target: 'vault',
        meta: {
          totalItems: items.length,
          topCategory: topCategory.name
        }
      });

      return {
        ok: true,
        summary: {
          totalItems: items.length,
          categories,
          recentActivity,
          smartInsightText,
          aiHighlights,
          recentAdds,
          previousAdds,
          generatedAt: now.toISOString()
        }
      };
    } catch {
      return { ok: false, error: 'Insights failed' };
    }
  });

  ipcMain.handle(Channels.INSIGHTS_GET_ACTIVITY, async (_event, { limit }) => {
    if (!hasInsightsConsent()) {
      return { ok: false, error: 'CONSENT_REQUIRED' };
    }

    const max = Math.min(Number(limit) || 10, 50);
    touchConsentUsageByApp('Insights Engine', 'Insights');
    appendActivityEvent({
      feature: 'Insights',
      action: 'activity_view',
      target: 'audit_log',
      meta: { limit: max }
    });

    return {
      ok: true,
      activity: getRecentActivity(max)
    };
  });
}

module.exports = { registerInsightsIpc };
