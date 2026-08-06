'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, CheckCircle2, Info, X, AlertTriangle } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);

    // Auto-remove after 4 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-emerald-600 stroke-[2] shrink-0" />,
    error: <AlertCircle className="w-5 h-5 text-red-600 stroke-[2] shrink-0" />,
    warning: <AlertTriangle className="w-5 h-5 text-amber-500 stroke-[2] shrink-0" />,
    info: <Info className="w-5 h-5 text-blue-500 stroke-[2] shrink-0" />,
  };

  const borders = {
    success: 'border-emerald-100 bg-[var(--surface)]',
    error: 'border-red-100 bg-[var(--surface)]',
    warning: 'border-amber-100 bg-[var(--surface)]',
    info: 'border-blue-100 bg-[var(--surface)]',
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      
      {/* Toast container floating in bottom-right corner */}
      <div className="fixed bottom-6 right-6 z-9999 flex flex-col gap-3 max-w-sm w-full pointer-events-none">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              layout
              initial={{ opacity: 0, y: 50, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.15 } }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className={`flex items-start gap-3 p-4 rounded-xl border shadow-soft pointer-events-auto select-none ${borders[toast.type]}`}
            >
              {icons[toast.type]}
              
              <div className="flex-1 text-xs font-semibold text-[var(--foreground)] pr-2 leading-relaxed">
                {toast.message}
              </div>

              <button
                onClick={() => removeToast(toast.id)}
                className="text-[var(--text-muted)] hover:text-[var(--foreground)] p-0.5 rounded transition-colors cursor-pointer"
                aria-label="Close notification"
              >
                <X className="w-4 h-4 stroke-[1.5]" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
}
