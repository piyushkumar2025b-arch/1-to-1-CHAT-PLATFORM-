import React, { useState } from 'react';
import { KeyRound, Copy, Check, ExternalLink, ShieldCheck, Cpu } from 'lucide-react';
import { parseShareFromString } from '../lib/shamir-secret';

interface ShamirShareCardProps {
  payload: string;
  isMe: boolean;
  accentColor?: string;
  onOpenReconstructor?: (initialShare: string) => void;
}

export const ShamirShareCard: React.FC<ShamirShareCardProps> = ({
  payload,
  isMe,
  accentColor = '#f59e0b',
  onOpenReconstructor,
}) => {
  const [copied, setCopied] = useState(false);
  const parsed = parseShareFromString(payload);

  if (!parsed) {
    return (
      <div className="p-3 rounded-xl bg-neutral-900 border border-neutral-800 text-xs text-neutral-400 font-mono">
        Invalid Shamir Secret Share format
      </div>
    );
  }

  const { share, threshold, total, label } = parsed;

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(payload).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // Truncated preview of hex data
  let hexPreview = '';
  for (let i = 0; i < Math.min(16, share.data.length); i++) {
    hexPreview += share.data[i].toString(16).padStart(2, '0');
  }
  if (share.data.length > 16) {
    hexPreview += `... (${share.data.length} bytes)`;
  }

  return (
    <div className="my-2 rounded-2xl border border-amber-500/30 bg-gradient-to-b from-neutral-900/95 via-neutral-950/95 to-black/95 p-4 shadow-xl backdrop-blur-md max-w-md w-full select-text transition-all hover:border-amber-500/50">
      {/* Header Badge */}
      <div className="flex items-center justify-between gap-2 pb-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 ring-1 ring-amber-500/30">
            <KeyRound className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                Shamir Secret Share
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono font-bold border border-amber-500/30">
                #{share.x} of {total}
              </span>
            </div>
            <p className="text-[11px] text-neutral-300 font-medium truncate max-w-[220px]">
              {label || 'Master Key Escrow'}
            </p>
          </div>
        </div>

        <div className="text-right">
          <span className="text-[10px] font-mono uppercase text-neutral-400 block">Threshold</span>
          <span className="text-xs font-bold text-amber-300 font-mono">
            {threshold} of {total}
          </span>
        </div>
      </div>

      {/* Threshold Explanation */}
      <div className="my-3 p-2.5 rounded-xl bg-neutral-900/80 border border-white/5 flex items-center gap-2.5">
        <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
        <p className="text-[11px] text-neutral-300 leading-snug">
          Zero-knowledge cryptographic piece. Combine any{' '}
          <strong className="text-amber-300">{threshold} shares</strong> to reconstruct the secret
          via GF(256) Lagrange interpolation.
        </p>
      </div>

      {/* Hex Data snippet */}
      <div className="mb-3 px-3 py-2 rounded-xl bg-black/70 border border-neutral-800 font-mono text-[11px] text-neutral-400 flex items-center justify-between">
        <div className="flex items-center gap-2 overflow-hidden">
          <Cpu className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
          <span className="text-amber-200/80 truncate">{hexPreview}</span>
        </div>
        <span className="text-[10px] text-neutral-500 shrink-0 ml-2">x = {share.x}</span>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2 pt-1">
        <button
          type="button"
          onClick={handleCopy}
          className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-medium transition-all active:scale-[0.98] cursor-pointer"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-300">Share Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5 text-neutral-400" />
              <span>Copy Share Token</span>
            </>
          )}
        </button>

        {onOpenReconstructor && (
          <button
            type="button"
            onClick={() => onOpenReconstructor(payload)}
            className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-medium transition-all active:scale-[0.98] cursor-pointer"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Reconstruct</span>
          </button>
        )}
      </div>
    </div>
  );
};
