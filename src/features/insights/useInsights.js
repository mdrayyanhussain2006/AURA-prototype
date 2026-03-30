import { useState, useEffect, useCallback } from 'react';
import * as insightsIpc from './insightsIpc';
import * as consentIpc from '../consent/consentIpc';

const INSIGHTS_APP_NAME = 'Insights Engine';
const INSIGHTS_PURPOSE = 'Analyze vault for smart suggestions';

async function hasInsightsConsent() {
  const res = await consentIpc.getAll();
  if (!res.ok) return { allowed: false, consents: [] };

  const consents = Array.isArray(res.consents) ? res.consents : [];
  const allowed = consents.some((consent) => consent.app === INSIGHTS_APP_NAME && consent.granted);
  return { allowed, consents };
}

export function useInsights() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [consentRequired, setConsentRequired] = useState(false);

  const loadInsights = useCallback(async () => {
    setLoading(true);
    setError(null);

    const { allowed } = await hasInsightsConsent();
    if (!allowed) {
      setData(null);
      setConsentRequired(true);
      setError('Enable consent to use Insights');
      if (typeof window !== 'undefined' && typeof window.alert === 'function') {
        window.alert('Enable consent to use Insights');
      }
      setLoading(false);
      return { ok: false, error: 'CONSENT_REQUIRED' };
    }

    setConsentRequired(false);
    const res = await insightsIpc.getSummary();

    if (res.ok) {
      setData(res.summary ?? null);
      setError(null);
      setLoading(false);
      return res;
    } else {
      setData(null);
      if (res.error === 'CONSENT_REQUIRED') {
        setError('Enable consent to use Insights');
        setConsentRequired(true);
      } else {
        setError(res.error ?? 'Failed to load insights');
      }
      setLoading(false);
      return res;
    }
  }, []);

  const requestInsightsConsent = useCallback(async () => {
    const res = await consentIpc.update({
      app: INSIGHTS_APP_NAME,
      purpose: INSIGHTS_PURPOSE,
      granted: true,
      riskLevel: 'moderate'
    });

    if (res.ok) {
      setConsentRequired(false);
      setError(null);
      await loadInsights();
    }

    return res;
  }, [loadInsights]);

  useEffect(() => {
    loadInsights();
  }, [loadInsights]);

  return {
    data,
    loading,
    error,
    consentRequired,
    loadInsights,
    requestInsightsConsent
  };
}
