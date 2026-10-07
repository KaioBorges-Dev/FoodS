import React, { useEffect } from 'react';
import { CheckCircle2, XCircle, AlertCircle, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  title: string;
  message?: string;
}

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full font-sans text-xs">
      {toasts.map(t => (
        <ToastItem key={t.id} toast={t} onDismiss={() => onDismiss(t.id)} />
      ))}
    </div>
  );
};

const ToastItem: React.FC<{ toast: ToastMessage; onDismiss: () => void }> = ({ toast, onDismiss }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss();
    }, 4000);
    return () => clearTimeout(timer);
  }, [toast.id]);

  return (
    <div className={`p-4 rounded-2xl border shadow-lg flex items-start justify-between gap-3 animate-in slide-in-from-bottom-2 ${
      toast.type === 'success'
        ? 'bg-emerald-50 dark:bg-emerald-950/90 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-100'
        : toast.type === 'error'
        ? 'bg-red-50 dark:bg-red-950/90 border-red-200 dark:border-red-800 text-red-900 dark:text-red-100'
        : 'bg-amber-50 dark:bg-amber-950/90 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-100'
    }`}>
      <div className="flex items-start gap-2.5">
        {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />}
        {toast.type === 'error' && <XCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />}
        {toast.type === 'info' && <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />}

        <div>
          <p className="font-bold text-xs">{toast.title}</p>
          {toast.message && <p className="text-[11px] opacity-90 mt-0.5">{toast.message}</p>}
        </div>
      </div>

      <button onClick={onDismiss} className="p-0.5 opacity-60 hover:opacity-100 transition-opacity">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
