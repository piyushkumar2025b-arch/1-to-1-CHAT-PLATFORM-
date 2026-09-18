import React, { useEffect, useState } from 'react';
import { Shield, Eye, EyeOff, Lock, AlertTriangle, Sparkles } from 'lucide-react';

interface BlurGuardShieldProps {
  isShieldActive: boolean;
  onDismiss: () => void;
  roomId: string;
  triggerReason?: string;
}

export function BlurGuardShield({
  isShieldActive,
  onDismiss,
  roomId,
  triggerReason = 'Window inactive or tab switched away',
}: BlurGuardShieldProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isShieldActive) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onDismiss();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isShieldActive, onDismiss]);

  if (!isShieldActive || !mounted) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      id="blur-guard-overlay"
      onClick={onDismiss}
      className="fixed inset-0 z-[140] bg-neutral-950/80 backdrop-blur-2xl flex flex-col items-center justify-center p-4 text-white select-none cursor-pointer animate-in fade-in duration-150"
    >
      {/* Ambient background security glows */}
      <div className="absolute -top-32 -left-32 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      <div
        onClick={(e) => e.stopPropagation()}
        className="relative max-w-md w-full bg-neutral-900/90 border border-emerald-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col items-center text-center gap-4 cursor-default animate-in zoom-in-95 duration-150"
      >
        {/* Animated Shield Icon */}
        <div className="relative">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-inner">
            <EyeOff className="w-8 h-8 animate-pulse" />
          </div>
          <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
            <Shield className="w-3.5 h-3.5" />
          </div>
        </div>

        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold mb-2 font-mono">
            <Lock className="w-3 h-3" />
            <span>Screenshot & Inactivity Guard</span>
          </div>

          <h3 className="text-xl font-bold tracking-tight text-white">
            Chat Obscured for Privacy
          </h3>

          <p className="text-xs text-neutral-400 mt-2 leading-relaxed">
            {triggerReason}. Message contents and media attachments have been veiled with frosted cryptography to prevent shoulder-surfing and background screen captures.
          </p>

          <div className="mt-3 inline-block px-3 py-1 rounded-xl bg-black/40 border border-white/10 text-[11px] font-mono text-emerald-300">
            Room: #{roomId} • End-to-End Encrypted
          </div>
        </div>

        <div className="w-full flex flex-col gap-2 pt-2">
          <button
            type="button"
            onClick={onDismiss}
            className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-emerald-600/30 active:scale-95"
          >
            <Eye className="w-4 h-4" />
            <span>Click to Reveal Chat</span>
          </button>

          <p className="text-[10px] text-neutral-500">
            Press <kbd className="px-1 py-0.5 rounded bg-neutral-800 border border-white/10 text-neutral-400 font-mono">Esc</kbd> or click anywhere to dismiss
          </p>
        </div>
      </div>
    </div>
  );
}
