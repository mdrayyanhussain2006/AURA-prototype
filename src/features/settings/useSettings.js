import { useState, useEffect, useCallback } from 'react';
import * as settingsIpc from './settingsIpc';

const DEFAULT_SETTINGS = Object.freeze({
  theme: 'dark',
  reducedMotion: false,
  autoLockMinutes: 10,
  consentDefaults: Object.freeze({
    insights: false,
    marketplace: false
  }),
  developerMode: false
});

function asObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
}

function normalizeSettingsForUi(value) {
  const raw = asObject(value);
  const consentDefaults = asObject(raw.consentDefaults);

  return {
    theme: raw.theme === 'light' ? 'light' : 'dark',
    reducedMotion: typeof raw.reducedMotion === 'boolean' ? raw.reducedMotion : DEFAULT_SETTINGS.reducedMotion,
    autoLockMinutes: Number.isFinite(Number(raw.autoLockMinutes)) ? Math.max(1, Math.min(240, Math.round(Number(raw.autoLockMinutes)))) : DEFAULT_SETTINGS.autoLockMinutes,
    consentDefaults: {
      insights: typeof consentDefaults.insights === 'boolean' ? consentDefaults.insights : DEFAULT_SETTINGS.consentDefaults.insights,
      marketplace:
        typeof consentDefaults.marketplace === 'boolean'
          ? consentDefaults.marketplace
          : DEFAULT_SETTINGS.consentDefaults.marketplace
    },
    developerMode: typeof raw.developerMode === 'boolean' ? raw.developerMode : DEFAULT_SETTINGS.developerMode
  };
}

export function useSettings() {
  const [settings, setSettings] = useState(() => normalizeSettingsForUi(DEFAULT_SETTINGS));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await settingsIpc.getSettings();
      if (res.ok) {
        const normalized = normalizeSettingsForUi(res.settings);
        setSettings(normalized);
        return { ok: true, settings: normalized };
      }

      const message = res.error || 'Failed to load settings';
      setError(message);
      return { ok: false, error: message, settings: null };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load settings';
      setError(message);
      return { ok: false, error: message, settings: null };
    } finally {
      setLoading(false);
    }
  }, []);

  const update = useCallback(async (patch) => {
    setSaving(true);
    setError(null);

    try {
      const res = await settingsIpc.updateSettings(patch);
      if (res.ok) {
        const normalized = normalizeSettingsForUi(res.settings);
        setSettings(normalized);
        return { ok: true, settings: normalized };
      }

      const message = res.error || 'Failed to update settings';
      setError(message);
      return { ok: false, error: message, settings: null };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update settings';
      setError(message);
      return { ok: false, error: message, settings: null };
    } finally {
      setSaving(false);
    }
  }, []);

  const reset = useCallback(async () => {
    setSaving(true);
    setError(null);

    try {
      const res = await settingsIpc.resetSettings();
      if (res.ok) {
        const normalized = normalizeSettingsForUi(res.settings);
        setSettings(normalized);
        return { ok: true, settings: normalized };
      }

      const message = res.error || 'Failed to reset settings';
      setError(message);
      return { ok: false, error: message, settings: null };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to reset settings';
      setError(message);
      return { ok: false, error: message, settings: null };
    } finally {
      setSaving(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    settings,
    loading,
    saving,
    error,
    refresh,
    update,
    reset
  };
}
