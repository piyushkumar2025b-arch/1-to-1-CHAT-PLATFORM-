import { useEffect } from 'react';
import { ShieldAlert, CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'info' | 'success' | 'warning' | 'error';

export interface SecurityToastProps {
  message: string | null;
  type?: ToastType;
  duration?: number;
  onDismiss: () => void;
}

export function SecurityToast({
  message,
  type = 'info',
  duration = 4000,
  onDismiss,
}: SecurityToastProps) {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => {
      onDismiss();
    }, duration);
    return () => clearTimeout(timer);
  }, [message, duration, onDismiss]);

  if (!message) return null;

  const config = {
    info: {
      border: 'border-cyan-500/40',
      iconBg: 'bg-cyan-500/20 text-cyan-400',
      icon: <Info className="w-4 h-4" />,
    },
    success: {
      border: 'border-emerald-500/40',
      iconBg: 'bg-emerald-500/20 text-emerald-400',
      icon: <CheckCircle2 className="w-4 h-4" />,
    },
    warning: {
      border: 'border-amber-500/40',
      iconBg: 'bg-amber-500/20 text-amber-400',
      icon: <AlertTriangle className="w-4 h-4" />,
    },
    error: {
      border: 'border-rose-500/40',
      iconBg: 'bg-rose-500/20 text-rose-400',
      icon: <AlertCircle className="w-4 h-4" />,
    },
  }[type] || {
    border: 'border-emerald-500/40',
    iconBg: 'bg-emerald-500/20 text-emerald-400',
    icon: <ShieldAlert className="w-4 h-4" />,
  };

  return (
    <div
      role="status"
      aria-live="polite"
      id="security-alert-toast"
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] max-w-md w-[92vw] sm:w-auto bg-neutral-950/95 text-white backdrop-blur-xl border ${config.border} px-4 py-3 rounded-2xl shadow-2xl flex items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom-4 duration-200 select-none`}
    >
      <div className="flex items-center gap-2.5">
        <div className={`p-1.5 rounded-xl ${config.iconBg} shrink-0`}>
          {config.icon}
        </div>
        <span className="text-xs sm:text-sm font-medium text-neutral-200">
          {message}
        </span>
      </div>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss notice"
        className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer shrink-0 ml-2"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

