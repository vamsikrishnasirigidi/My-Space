import React from 'react';
import { useToastStore } from '../../store/toastStore';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';
import { cn } from '../../utils/cn';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-3 max-w-md w-full pointer-events-none px-4 md:px-0">
      {toasts.map((toast) => {
        const isSuccess = toast.type === 'success';
        const isError = toast.type === 'error';
        const isInfo = toast.type === 'info';

        return (
          <div
            key={toast.id}
            className={cn(
              "pointer-events-auto flex items-center justify-between gap-3 p-4 rounded-2xl border backdrop-blur-md shadow-premium animate-slide-up w-full",
              isSuccess && "bg-emerald-50/90 dark:bg-emerald-950/80 border-emerald-200/50 dark:border-emerald-900/40 text-emerald-800 dark:text-emerald-200",
              isError && "bg-rose-50/90 dark:bg-rose-950/80 border-rose-200/50 dark:border-rose-900/40 text-rose-800 dark:text-rose-200",
              isInfo && "bg-indigo-50/90 dark:bg-indigo-950/80 border-indigo-200/50 dark:border-indigo-900/40 text-indigo-800 dark:text-indigo-200"
            )}
            role="alert"
          >
            <div className="flex items-center gap-3">
              {isSuccess && <CheckCircle className="h-5 w-5 shrink-0 text-emerald-500" />}
              {isError && <AlertCircle className="h-5 w-5 shrink-0 text-rose-500" />}
              {isInfo && <Info className="h-5 w-5 shrink-0 text-indigo-500" />}
              
              <span className="text-sm font-medium leading-relaxed">
                {toast.message}
              </span>
            </div>
            
            <button
              onClick={() => removeToast(toast.id)}
              className="p-1 rounded-lg opacity-60 hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/5 transition-all"
              aria-label="Dismiss notification"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
