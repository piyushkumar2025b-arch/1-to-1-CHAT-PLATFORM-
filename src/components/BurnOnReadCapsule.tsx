import React, { useState, useEffect, useRef } from 'react';
import { Flame, Eye, EyeOff, Lock, AlertTriangle, Check, Copy, Sparkles, Skull } from 'lucide-react';

interface BurnOnReadCapsuleProps {
  payload: string; // "BURN_SECRET::[seconds]::[base64]"
  isMe: boolean;
  accentColor?: string;
}

export const BurnOnReadCapsule: React.FC<BurnOnReadCapsuleProps> = ({
  payload,
  isMe,
  accentColor = '#f59e0b',
}) => {
  // Parse payload
  const parts = payload.split('::');
  const timerSeconds = parseInt(parts[1], 10) || 15;
  const encodedText = parts[2] || '';

  const [isRevealed, setIsRevealed] = useState(false);
  const [isBurnt, setIsBurnt] = useState(false);
  const [remainingTime, setRemainingTime] = useState(timerSeconds);
  const [revealedText, setRevealedText] = useState('');
  const [copied, setCopied] = useState(false);

  // Decode secret
  const handleReveal = () => {
    if (isBurnt) return;
    try {
      const decoded = decodeURIComponent(escape(atob(encodedText)));
      setRevealedText(decoded);
      setIsRevealed(true);
      setRemainingTime(timerSeconds);
    } catch {
      setRevealedText('Error: Secret damaged or malformed payload.');
      setIsRevealed(true);
    }
  };

  // Countdown timer once revealed
  useEffect(() => {
    let interval: any = null;
    if (isRevealed && !isBurnt && remainingTime > 0) {
      interval = setInterval(() => {
        setRemainingTime((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            setIsBurnt(true);
            setRevealedText(''); // purge from memory!
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRevealed, isBurnt, remainingTime]);

  const handleCopy = () => {
    if (!revealedText) return;
    navigator.clipboard.writeText(revealedText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleBurnNow = () => {
    setIsBurnt(true);
    setRevealedText('');
    setRemainingTime(0);
  };

  if (isBurnt) {
    return (
      <div className="w-full max-w-sm rounded-xl overflow-hidden border border-rose-900/40 bg-neutral-950/90 shadow-md my-1 select-none p-3.5 flex items-center gap-3 text-left">
        <div className="w-9 h-9 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center shrink-0">
          <Skull className="w-4 h-4 text-rose-400" />
        </div>
        <div>
          <div className="text-xs font-bold text-rose-400 flex items-center gap-1.5 font-mono uppercase">
            <span>🔥 Burned & Purged</span>
          </div>
          <p className="text-[11px] text-neutral-500">
            This confidential message was read and permanently erased from device memory.
          </p>
        </div>
      </div>
    );
  }

  if (isRevealed) {
    const percentLeft = (remainingTime / timerSeconds) * 100;
    return (
      <div className="w-full max-w-sm rounded-xl overflow-hidden border border-orange-500/40 bg-neutral-950 shadow-lg my-1 select-none text-left animate-in fade-in zoom-in-95 duration-150">
        {/* Burning Header */}
        <div className="px-3 py-2 bg-gradient-to-r from-orange-950/60 to-rose-950/60 border-b border-orange-500/30 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Flame className="w-4 h-4 text-orange-400 animate-bounce" />
            <span className="text-[11px] font-bold text-orange-300 uppercase font-mono tracking-wider">
              Self-Destruct Active
            </span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-xs font-mono font-bold text-rose-400">
              {remainingTime}s
            </span>
            <span className="text-[10px] text-neutral-400">left</span>
          </div>
        </div>

        {/* Burn progress bar */}
        <div className="w-full h-1 bg-neutral-800 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-orange-500 to-rose-500 transition-all duration-1000"
            style={{ width: `${percentLeft}%` }}
          />
        </div>

        {/* Secret Content */}
        <div className="p-3 space-y-2.5">
          <div className="p-3 rounded-lg bg-orange-950/20 border border-orange-500/30 text-amber-100 text-xs font-mono break-words whitespace-pre-wrap select-text leading-relaxed">
            {revealedText}
          </div>

          <div className="flex items-center justify-between text-[11px] pt-0.5">
            <button
              type="button"
              onClick={handleCopy}
              className="flex items-center gap-1 text-amber-400 hover:text-amber-300 font-medium cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied!' : 'Copy Secret'}</span>
            </button>

            <button
              type="button"
              onClick={handleBurnNow}
              className="flex items-center gap-1 text-rose-400 hover:text-rose-300 font-semibold cursor-pointer"
            >
              <Flame className="w-3.5 h-3.5" />
              <span>Burn Now</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Unrevealed state (Sealed capsule)
  return (
    <div className="w-full max-w-sm rounded-xl overflow-hidden border border-orange-500/30 bg-neutral-950/80 shadow-md my-1 select-none text-left">
      <div className="px-3 py-2 bg-orange-500/15 border-b border-orange-500/20 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Flame className="w-4 h-4 text-orange-400 animate-pulse" />
          <span className="text-[11px] font-bold tracking-wide uppercase font-mono text-orange-300">
            Burn-After-Reading Secret
          </span>
        </div>
        <span className="text-[9px] px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-200 font-mono">
          ⏱️ {timerSeconds}s timer
        </span>
      </div>

      <div className="p-3 space-y-2">
        <p className="text-[11px] text-neutral-300 leading-relaxed">
          This message is confidential. Opening it starts a <strong>{timerSeconds}-second</strong> self-destruct timer, after which it will be permanently purged.
        </p>

        <button
          type="button"
          onClick={handleReveal}
          className="w-full py-2 rounded-xl text-xs font-bold text-neutral-950 bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 transition-all cursor-pointer shadow-md flex items-center justify-center gap-2 active:scale-98"
        >
          <Eye className="w-4 h-4" />
          <span>Reveal Confidential Secret</span>
        </button>
      </div>
    </div>
  );
};
