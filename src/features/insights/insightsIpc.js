/**
 * Insights IPC service — renderer-side only.
 */

export async function getSummary() {
  if (!window.aura?.insights?.getSummary) return { ok: false, error: 'Insights API not available', summary: null };
  return window.aura.insights.getSummary();
}

export async function getActivity(limit = 10) {
  if (!window.aura?.insights?.getActivity) return { ok: false, error: 'Insights API not available', activity: [] };
  return window.aura.insights.getActivity({ limit });
}
