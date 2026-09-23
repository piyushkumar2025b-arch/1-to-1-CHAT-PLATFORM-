import React, { useState } from 'react';
import { Trash2, ShieldCheck, Check, Copy, FileText, AlertCircle } from 'lucide-react';

interface ShreddedFileReceiptCardProps {
  fileName: string;
  fileSize: string;
  originalHash: string;
  wipeStandard: string;
  accentColor?: string;
}

export const ShreddedFileReceiptCard: React.FC<ShreddedFileReceiptCardProps> = ({
  fileName,
  fileSize,
  originalHash,
  wipeStandard,
  accentColor = '#f59e0b',
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const text = `Certified Cryptographic Destruction Receipt:\nFile: ${fileName} (${fileSize})\nStandard: ${wipeStandard}\nOriginal SHA-256: ${originalHash}\nStatus: Sanitized & Purged from Client RAM`;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="w-full max-w-sm rounded-xl overflow-hidden border border-rose-500/30 bg-neutral-950/85 shadow-md my-1 text-left select-none">
      {/* Header */}
      <div className="px-3 py-2 bg-rose-500/15 border-b border-rose-500/20 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Trash2 className="w-4 h-4 text-rose-400" />
          <span className="text-[11px] font-bold uppercase tracking-wider font-mono text-rose-300">
            Certified File Shred Receipt
          </span>
        </div>
        <span className="text-[9px] font-mono text-emerald-400 bg-emerald-500/20 px-1.5 py-0.5 rounded font-bold">
          PURGED
        </span>
      </div>

      {/* Body */}
      <div className="p-3 space-y-2">
        <div className="flex items-center gap-2.5">
          <FileText className="w-5 h-5 text-neutral-400 shrink-0" />
          <div className="overflow-hidden">
            <p className="text-xs font-bold text-neutral-200 truncate">{fileName}</p>
            <p className="text-[10px] text-neutral-500 font-mono">
              {fileSize} • Standard: {wipeStandard}
            </p>
          </div>
        </div>

        <div className="p-2 rounded-lg bg-neutral-900 border border-neutral-800 text-[10px] font-mono text-neutral-400 break-all space-y-0.5">
          <div className="text-neutral-500">Original SHA-256 Fingerprint:</div>
          <div className="text-rose-300">{originalHash}</div>
        </div>

        <div className="flex items-center justify-between pt-1 text-[11px]">
          <span className="text-neutral-500 flex items-center gap-1 text-[10px]">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>DoD / NIST Sanitized</span>
          </span>

          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1 text-neutral-400 hover:text-white transition-colors cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy Proof'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
