import React, { createContext, useCallback, useContext, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

const ToastContext = createContext(null);

const TOAST_LIMIT = 2;
const DEFAULT_DURATION = 3500;

const VARIANTS = {
  success: {
    border: 'border-emerald-500/40',
    bg: 'bg-emerald-500/15',
    text: 'text-emerald-200',
    icon: (
      <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    )
  },
  error: {
    border: 'border-rose-500/40',
    bg: 'bg-rose-500/15',
    text: 'text-rose-200',
    icon: (
      <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    )
  },
  info: {
    border: 'border-cyan-500/40',
    bg: 'bg-cyan-500/15',
    text: 'text-cyan-200',
    icon: (
      <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    )
  }
};

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

export default function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const idRef = useRef(0);
  const timersRef = useRef(new Map());

  const dismiss = useCallback((id) => {
    const timeoutHandle = timersRef.current.get(id);
    if (timeoutHandle) {
      clearTimeout(timeoutHandle);
      timersRef.current.delete(id);
    }
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback((message, variant = 'info', duration = DEFAULT_DURATION) => {
    const id = ++idRef.current;
    setToasts((prev) => {
      const next = [...prev, { id, message, variant }];
      const overflow = next.length - TOAST_LIMIT;
      if (overflow > 0) {
        const removed = next.slice(0, overflow);
        for (const item of removed) {
          const timeoutHandle = timersRef.current.get(item.id);
          if (timeoutHandle) {
            clearTimeout(timeoutHandle);
            timersRef.current.delete(item.id);
          }
        }
      }
      return next.length > TOAST_LIMIT ? next.slice(-TOAST_LIMIT) : next;
    });
    if (duration > 0) {
      const timeoutHandle = setTimeout(() => dismiss(id), duration);
      timersRef.current.set(id, timeoutHandle);
    }
    return id;
  }, [dismiss]);

  const success = useCallback((msg, dur) => toast(msg, 'success', dur), [toast]);
  const error = useCallback((msg, dur) => toast(msg, 'error', dur), [toast]);
  const info = useCallback((msg, dur) => toast(msg, 'info', dur), [toast]);

  React.useEffect(() => {
    return () => {
      for (const timeoutHandle of timersRef.current.values()) {
        clearTimeout(timeoutHandle);
      }
      timersRef.current.clear();
    };
  }, []);

  return (
    <ToastContext.Provider value={{ toast, success, error, info, dismiss }}>
      {children}
      <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2 pointer-events-none" style={{ maxWidth: 360 }}>
        <AnimatePresence mode="popLayout">
          {toasts.map((t) => {
            const v = VARIANTS[t.variant] || VARIANTS.info;
            return (
              <motion.div
                key={t.id}
                layout
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
                className={`pointer-events-auto flex items-center gap-3 rounded-xl border ${v.border} ${v.bg} px-4 py-3 backdrop-blur-xl shadow-[0_8px_30px_rgba(0,0,0,0.4)]`}
              >
                <span className={v.text}>{v.icon}</span>
                <span className={`text-xs font-medium ${v.text} flex-1`}>{t.message}</span>
                <button
                  type="button"
                  onClick={() => dismiss(t.id)}
                  className={`${v.text} opacity-60 hover:opacity-100 transition-opacity`}
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
