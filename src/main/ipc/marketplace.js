const { ipcMain } = require('electron');
const Channels = require('../../shared/ipcChannels.cjs');

const MARKETPLACE_CATALOG = Object.freeze([
  {
    id: 'redaction-ops-pack',
    title: 'Redaction Ops Pack',
    shortDescription: 'Policy-first redaction profiles for legal and compliance teams.',
    status: 'Ready',
    purpose: 'Compliance automation',
    actionLabel: 'View details',
    fullDescription:
      'Deploy a local-first redaction toolkit with reusable policy presets and review checklists for sensitive archives.',
    highlights: [
      'Includes starter templates for common data classes.',
      'Runs fully local with no external network dependency.',
      'Designed for faster audit-ready workflows.'
    ]
  },
  {
    id: 'forensic-timeline-lens',
    title: 'Forensic Timeline Lens',
    shortDescription: 'Build temporal views from vault activity for incident reconstruction.',
    status: 'Preview',
    purpose: 'Incident response',
    actionLabel: 'View details',
    fullDescription:
      'Correlate local vault changes into timeline narratives so teams can review sequence and impact during investigations.',
    highlights: [
      'Auto-groups events by timeframe and artifact.',
      'Supports analyst notes for each timeline step.',
      'Exports investigation snapshots for local review.'
    ]
  },
  {
    id: 'consent-analytics-board',
    title: 'Consent Analytics Board',
    shortDescription: 'Summarize consent posture and permission drift across modules.',
    status: 'Ready',
    purpose: 'Governance visibility',
    actionLabel: 'View details',
    fullDescription:
      'Track grant and revoke patterns over time to identify stale consent paths and improve governance decisions.',
    highlights: [
      'Highlights revocation trends by app scope.',
      'Surfaces expiring consent records for action.',
      'Maintains local-only reporting semantics.'
    ]
  },
  {
    id: 'vault-onboarding-kit',
    title: 'Vault Onboarding Kit',
    shortDescription: 'Starter flows and templates for new team rollout.',
    status: 'Beta',
    purpose: 'Team enablement',
    actionLabel: 'View details',
    fullDescription:
      'Speed up team onboarding with guided vault conventions, classification hints, and first-week setup templates.',
    highlights: [
      'Provides recommended folder and tag conventions.',
      'Includes role-based onboarding checklists.',
      'Keeps setup guidance local to the desktop app.'
    ]
  }
]);

function listMarketplaceItems() {
  return MARKETPLACE_CATALOG.map((item) => ({
    id: item.id,
    title: item.title,
    shortDescription: item.shortDescription,
    status: item.status,
    purpose: item.purpose,
    actionLabel: item.actionLabel
  }));
}

function getMarketplaceItemById(id) {
  return MARKETPLACE_CATALOG.find((item) => item.id === id) || null;
}

function registerMarketplaceIpc() {
  ipcMain.handle(Channels.MARKETPLACE_LIST_ITEMS, async () => {
    try {
      return { ok: true, items: listMarketplaceItems() };
    } catch {
      return { ok: false, error: 'Failed to list marketplace items' };
    }
  });

  ipcMain.handle(Channels.MARKETPLACE_GET_ITEM_DETAILS, async (_event, payload) => {
    if (!payload || typeof payload !== 'object') {
      return { ok: false, error: 'Invalid marketplace payload' };
    }

    const id = typeof payload.id === 'string' ? payload.id.trim() : '';
    if (!id) {
      return { ok: false, error: 'Invalid id' };
    }

    try {
      const item = getMarketplaceItemById(id);
      if (!item) {
        return { ok: false, error: 'Marketplace item not found' };
      }

      return { ok: true, item };
    } catch {
      return { ok: false, error: 'Failed to get marketplace item details' };
    }
  });
}

module.exports = { registerMarketplaceIpc };
