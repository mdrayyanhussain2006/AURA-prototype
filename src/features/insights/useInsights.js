import { useState, useEffect, useCallback } from 'react';
import * as insightsIpc from './insightsIpc';

export function useInsights(activityLimit = 10) {
  const [summary, setSummary] = useState(null);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    const [summaryRes, activityRes] = await Promise.all([
      insightsIpc.getSummary(),
      insightsIpc.getActivity(activityLimit)
    ]);
    if (summaryRes.ok) setSummary(summaryRes.summary ?? null);
    if (activityRes.ok) setActivity(activityRes.activity ?? []);
    if (!summaryRes.ok) setError(summaryRes.error ?? 'Failed to load insights');
    setLoading(false);
  }, [activityLimit]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { summary, activity, loading, error, refresh };
}
