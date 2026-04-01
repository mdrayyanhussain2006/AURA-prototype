import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Auto-lock hook — tracks user activity and locks after inactivity.
 * @param {number} timeoutMinutes - Minutes of inactivity before lock.
 * @param {boolean} enabled - Whether auto-lock is active.
 */
export function useAutoLock(timeoutMinutes = 10, enabled = true) {
  const [isLocked, setIsLocked] = useState(false);
  const timerRef = useRef(null);

  const resetTimer = useCallback(() => {
    if (!enabled) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setIsLocked(true);
    }, timeoutMinutes * 60 * 1000);
  }, [timeoutMinutes, enabled]);

  const unlock = useCallback(() => {
    setIsLocked(false);
    resetTimer();
  }, [resetTimer]);

  useEffect(() => {
    if (!enabled) {
      setIsLocked(false);
      if (timerRef.current) clearTimeout(timerRef.current);
      return;
    }

    resetTimer();

    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'];
    const handleActivity = () => {
      if (!isLocked) resetTimer();
    };

    events.forEach((ev) => window.addEventListener(ev, handleActivity, { passive: true }));

    return () => {
      events.forEach((ev) => window.removeEventListener(ev, handleActivity));
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [enabled, resetTimer, isLocked]);

  return { isLocked, unlock };
}
