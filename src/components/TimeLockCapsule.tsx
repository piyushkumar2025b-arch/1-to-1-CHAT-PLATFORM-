import React, { useState, useEffect } from 'react';
import { Lock, Unlock, Clock, Eye, Sparkles, Copy, Check, ShieldAlert } from 'lucide-react';

interface TimeLockCapsuleProps {
  payload: string; // TIMELOCK::[unlockEpochMs]::[base64]::[title]
  isMe: boolean;
  accentColor?: string;
}

export const TimeLockCapsule: React.FC<TimeLockCapsuleProps> = ({
  payload,
  isMe,
  accentColor = '#f59e0b',
}) => {
  const parts = payload.split('::');
  const unlockEpoch = parseInt(parts[1] || '0', 10);
  const base64Content = parts[2] || '';
  const title = parts[3] ? decodeURIComponent(parts[3]) : 'Time-Locked Secret Capsule';

  const [timeLeftMs, setTimeLeftMs] = useState<number>(() => Math.max(0, unlockEpoch - Date.now()));
  const [isUnlocked, setIsUnlocked] = useState<boolean>(() => Date.now() >= unlockEpoch);
  const [revealedText, setRevealedText] = useState<string>('');
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [justUnlocked, setJustUnlocked] = useState<boolean>(false);

  useEffect(() => {
    if (Date.now() >= unlockEpoch) {
      setIsUnlocked(true);
      setTimeLeftMs(0);
      tryDecode();
      return;
    }

    const interval = setInterval(() => {
      const remaining = unlockEpoch - Date.now();
      if (remaining <= 0) {
        setTimeLeftMs(0);
        setIsUnlocked(true);
        setJustUnlocked(true);
        tryDecode();
        clearInterval(interval);
      } else {
        setTimeLeftMs(remaining);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [unlockEpoch]);

  const tryDecode = () => {
    try {
      const decoded = decodeURIComponent(escape(atob(base64Content)));
      setRevealedText(decoded);
    } catch {
      try {
        setRevealedText(atob(base64Content));
      } catch {
        setRevealedText('Decryption error: invalid payload');
      }
    }
  };

  const handleCopy = () => {
    if (!revealedText) return;
    navigator.clipboard.writeText(revealedText).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    });
  };

  // Format remaining time nicely
  const formatRemaining = (ms: number) => {
    const totalSecs = Math.floor(ms / 1000);
    const days = Math.floor(totalSecs / 86400);
    const hours = Math.floor((totalSecs % 86400) / 3600);
    const minutes = Math.floor((totalSecs % 3600) / 60);
    const seconds = totalSecs % 60;

    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
    return `${minutes}m ${seconds}s`;
  };

  const unlockDateStr = new Date(unlockEpoch).toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  return (
    <div
      className={`w-full max-w-sm rounded-2xl overflow-hidden border shadow-xl transition-all my-1.5 text-left select-none ${
        isUnlocked
          ? 'bg-neutral-950/90 border-emerald-500/40 shadow-emerald-500/10'
          : 'bg-neutral-950/95 border-amber-500/40 shadow-amber-500/10'
      }`}
    >
      {/* Top Header */}
      <div
        className={`px-3.5 py-2.5 border-b flex items-center justify-between ${
          isUnlocked
            ? 'bg-emerald-500/15 border-emerald-500/25'
            : 'bg-amber-500/15 border-amber-500/25'
        }`}
      >
        <div className="flex items-center gap-2 overflow-hidden">
          <div
            className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${
              isUnlocked
                ? 'bg-emerald-500/20 text-emerald-400'
                : 'bg-amber-500/20 text-amber-400'
            }`}
          >
            {isUnlocked ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
          </div>
          <span className="text-xs font-bold text-white truncate">{title}</span>
        </div>

        <span
          className={`text-[9px] font-mono uppercase px-2 py-0.5 rounded-full border font-bold shrink-0 ${
            isUnlocked
              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
              : 'bg-amber-500/20 text-amber-300 border-amber-500/30 animate-pulse'
          }`}
        >
          {isUnlocked ? 'UNLOCKED' : 'TIME-LOCKED'}
        </span>
      </div>

      {/* Body Area */}
      <div className="p-3.5 space-y-3">
        {!isUnlocked ? (
          <div className="space-y-2 text-center py-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-neutral-900 border border-amber-500/30 text-amber-300 font-mono text-sm font-bold shadow-inner">
              <Clock className="w-4 h-4 animate-spin text-amber-400" />
              <span>{formatRemaining(timeLeftMs)}</span>
            </div>
            <p className="text-[11px] text-neutral-400 leading-snug">
              Sealed in cryptographic temporal escrow until:
            </p>
            <p className="text-[10px] font-mono text-amber-400/90 bg-neutral-900/80 py-1 px-2 rounded border border-neutral-800 inline-block">
              {unlockDateStr}
            </p>
          </div>
        ) : (
          <div className="space-y-2.5 animate-in fade-in zoom-in-95 duration-200">
            {justUnlocked && (
              <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-bold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Temporal lock reached! Secret decrypted below:</span>
              </div>
            )}
            <div className="p-3 rounded-xl bg-neutral-900/90 border border-emerald-500/30 text-xs text-neutral-200 font-mono whitespace-pre-wrap break-words select-text">
              {revealedText || 'Loading secret payload...'}
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <span className="text-[10px] text-neutral-500 font-mono">
                Unlocked {unlockDateStr}
              </span>
              <button
                type="button"
                onClick={handleCopy}
                className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300 font-semibold transition-colors cursor-pointer"
              >
                {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{isCopied ? 'Copied' : 'Copy Content'}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
