import { useState, useCallback } from 'react';
import * as demoIpc from './demoIpc';

export function useDemo() {
  const [info, setInfo] = useState(null);
  const [latency, setLatency] = useState(null);
  const [error, setError] = useState(null);

  const ping = useCallback(async () => {
    setError(null);
    const start = Date.now();
    const res = await demoIpc.ping();
    if (res.ok) setLatency(Date.now() - start);
    else setError(res.error ?? 'Ping failed');
    return res;
  }, []);

  const loadInfo = useCallback(async () => {
    setError(null);
    const res = await demoIpc.getInfo();
    if (res.ok) setInfo(res.info ?? null);
    else setError(res.error ?? 'Failed to get info');
    return res;
  }, []);

  return { info, latency, error, ping, loadInfo };
}
