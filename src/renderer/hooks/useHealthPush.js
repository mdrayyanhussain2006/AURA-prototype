import { useState, useEffect, useCallback } from 'react';

/**
 * useHealthPush — React hook that subscribes to the Main Process health audit push.
 *
 * The Main Process runs a security audit every 30 seconds and pushes results
 * via webContents.send(). This hook listens for those pushes and provides
 * the latest audit data to the component tree.
 *
 * Returns:
 *   healthData: object | null — Latest audit result from healthAuditor
 *   lastUpdated: string | null — ISO timestamp of the last received update
 *   isConnected: boolean — Whether the push listener is active
 */
export function useHealthPush() {
  const [healthData, setHealthData] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  const handleUpdate = useCallback((data) => {
    if (data && typeof data === 'object') {
      setHealthData(data);
      setLastUpdated(data.auditedAt || new Date().toISOString());
      setIsConnected(true);
    }
  }, []);

  useEffect(() => {
    // Subscribe to the push channel
    if (window.aura?.insights?.onHealthUpdate) {
      window.aura.insights.onHealthUpdate(handleUpdate);
      setIsConnected(true);
    }

    // Cleanup on unmount
    return () => {
      if (window.aura?.insights?.removeHealthListener) {
        window.aura.insights.removeHealthListener();
      }
      setIsConnected(false);
    };
  }, [handleUpdate]);

  return { healthData, lastUpdated, isConnected };
}
