import React, { useState } from 'react';
import {
  Bird,
  ShieldCheck,
  Calendar,
  AlertTriangle,
  Copy,
  Check,
  Clock,
} from 'lucide-react';

interface WarrantCanaryCardProps {
  payload: string;
  isMe: boolean;
  accentColor?: string;
}

export const WarrantCanaryCard: React.FC<WarrantCanaryCardProps> = ({
  payload,
  isMe,
  accentColor = '#f59e0b',
}) => {
  // CANARY::myUserId::timestamp::expiryTimestamp::hashHex::b64Statement
  const parts = payload.trim().split('::');
  const publisherId = parts[1] || '';
  const timestamp = parseInt(parts[2] || '0', 10);
  const expiryTimestamp = parseInt(parts[3] || '0', 10);
  const hashHex = parts[4] || 'VERIFIED';

  let statement = '';
  try {
    statement = decodeURIComponent(escape(atob(parts[5] || '')));
  } catch {
    statement = parts[5] || '';
  }

  const [copied, setCopied] = useState(false);
  const isExpired = Date.now() > expiryTimestamp;

  const handleCopy = () => {
    navigator.clipboard.writeText(statement).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div
      className={`w-full max-w-sm sm:max-w-md rounded-2xl bg-neutral-950 border transition-all shadow-xl overflow-hidden font-sans select-none my-1 ${
        isExpired ? 'border-rose-500/40' : 'border-emerald-500/40'
      }`}
    >
      {/* Header */}
      <div
        className={`px-4 py-2.5 flex items-center justify-between border-b ${
          isExpired
            ? 'bg-rose-950/40 border-rose-500/30'
            : 'bg-gradient-to-r from-emerald-950/50 to-neutral-900 border-emerald-500/20'
        }`}
      >
        <div className="flex items-center gap-2">
          <Bird className={`w-4 h-4 ${isExpired ? 'text-rose-400' : 'text-emerald-400'}`} />
          <span
            className={`text-xs font-bold tracking-wide uppercase ${
              isExpired ? 'text-rose-300' : 'text-emerald-300'
            }`}
          >
            {isExpired ? 'WARRANT CANARY EXPIRED' : 'ACTIVE WARRANT CANARY'}
          </span>
        </div>
        <span
          className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
            isExpired
              ? 'bg-rose-500/20 text-rose-300 animate-pulse'
              : 'bg-emerald-500/20 text-emerald-300'
          }`}
        >
          #{hashHex}
        </span>
      </div>

      {/* Body */}
      <div className="p-4 space-y-3">
        <p className="text-xs text-neutral-200 leading-relaxed bg-black/40 p-3 rounded-xl border border-neutral-800/80 font-serif italic">
          "{statement}"
        </p>

        {/* Timestamps */}
        <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-neutral-400 bg-neutral-900/60 p-2.5 rounded-xl border border-neutral-800">
          <div>
            <span className="text-neutral-500 block">Affidavit Signed:</span>
            <span>{new Date(timestamp).toLocaleDateString()}</span>
          </div>
          <div>
            <span className="text-neutral-500 block">Valid Until:</span>
            <span className={isExpired ? 'text-rose-400 font-bold' : 'text-emerald-400 font-bold'}>
              {new Date(expiryTimestamp).toLocaleDateString()}
            </span>
          </div>
        </div>

        {/* Footer info */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-1.5 text-[11px] text-neutral-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Entropy-Verified Integrity</span>
          </div>
          <button
            type="button"
            onClick={handleCopy}
            className="text-[11px] text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition-colors"
          >
            {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
            <span>{copied ? 'Copied' : 'Copy Text'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
