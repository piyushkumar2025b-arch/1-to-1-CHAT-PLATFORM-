import React, { useState, useEffect, useRef } from 'react';
import { Eye, EyeOff, Copy, Check, Shield, Lock } from 'lucide-react';

interface ConfidentialVeilCardProps {
  label?: string;
  hiddenContent: string;
  accentColor?: string;
}

export const ConfidentialVeilCard: React.FC<ConfidentialVeilCardProps> = ({
  label = 'Confidential Data',
  hiddenContent,
  accentColor = '#f59e0b',
}) => {
  const [isRevealed, setIsRevealed] = useState(false);
  const [remaskTimer, setRemaskTimer] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<any>(null);

  const handleToggleReveal = () => {
    if (isRevealed) {
      conceal();
    } else {
      reveal();
    }
  };

  const reveal = () => {
    setIsRevealed(true);
    setRemaskTimer(8);

    if (timerRef.current) clearInterval(timerRef.current);
    let secondsLeft = 8;
    timerRef.current = setInterval(() => {
      secondsLeft -= 1;
      setRemaskTimer(secondsLeft);
      if (secondsLeft <= 0) {
        conceal();
      }
    }, 1000);
  };

  const conceal = () => {
    setIsRevealed(false);
    setRemaskTimer(null);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const handleBlindCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(hiddenContent).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="w-full max-w-sm rounded-2xl overflow-hidden border border-neutral-800 bg-neutral-950/90 shadow-lg my-1.5 text-left select-none">
      {/* Header */}
      <div className="px-3.5 py-2 bg-neutral-900/80 border-b border-neutral-800 flex items-center justify-between">
        <div className="flex items-center gap-2 overflow-hidden">
          <Shield className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span className="text-xs font-bold text-white truncate">{label}</span>
        </div>
        <span className="text-[9px] font-mono uppercase px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-400 border border-neutral-700">
          Veil Shield
        </span>
      </div>

      {/* Secret Viewing Port */}
      <div className="p-3.5 space-y-2.5">
        <div
          onClick={handleToggleReveal}
          className={`relative p-3 rounded-xl border transition-all cursor-pointer overflow-hidden ${
            isRevealed
              ? 'bg-neutral-900 border-amber-500/40 text-neutral-100 select-text'
              : 'bg-neutral-900/60 border-neutral-800 text-transparent hover:border-neutral-700 select-none'
          }`}
        >
          {/* Hidden text or blurred static overlay */}
          <div className={`font-mono text-xs break-all ${!isRevealed ? 'filter blur-md opacity-30 select-none' : ''}`}>
            {hiddenContent}
          </div>

          {!isRevealed && (
            <div className="absolute inset-0 bg-neutral-950/70 backdrop-blur-xs flex items-center justify-center gap-2 text-neutral-300 hover:text-white transition-colors">
              <Eye className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-bold">Tap to Reveal Veil</span>
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-between text-xs pt-0.5">
          {isRevealed ? (
            <span className="text-[10px] font-mono text-amber-400 flex items-center gap-1">
              <EyeOff className="w-3 h-3" />
              <span>Auto-conceals in {remaskTimer}s</span>
            </span>
          ) : (
            <span className="text-[10px] text-neutral-500">Shoulder-surfing protection</span>
          )}

          <button
            type="button"
            onClick={handleBlindCopy}
            title="Copy to clipboard without displaying on screen"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-800 transition-colors cursor-pointer text-[11px]"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-amber-400" />}
            <span>{copied ? 'Copied' : 'Blind Copy'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
