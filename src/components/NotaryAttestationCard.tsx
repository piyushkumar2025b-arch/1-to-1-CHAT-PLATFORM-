import React, { useState, useRef, ChangeEvent } from 'react';
import {
  FileBadge,
  ShieldCheck,
  Hash,
  Copy,
  Check,
  Upload,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { verifyHashMatch } from '../lib/notary-engine';

interface NotaryAttestationCardProps {
  payload: string;
  isMe: boolean;
  accentColor?: string;
}

export const NotaryAttestationCard: React.FC<NotaryAttestationCardProps> = ({
  payload,
  isMe,
  accentColor = '#f59e0b',
}) => {
  // NOTARY_SEAL::certId::b64Title::sha256::sha512Prefix::timestamp::signerId::b64File::fileSize
  const parts = payload.trim().split('::');
  const certId = parts[1] || 'notary_001';
  const sha256 = parts[3] || '';
  const sha512Prefix = parts[4] || '';
  const timestamp = parseInt(parts[5] || '0', 10);
  const signerId = parts[6] || '';
  const fileSize = parseInt(parts[8] || '0', 10);

  let title = 'Cryptographic Attestation';
  let fileName = 'none';
  try {
    title = decodeURIComponent(escape(atob(parts[2] || '')));
    fileName = parts[7] !== 'none' ? decodeURIComponent(escape(atob(parts[7] || ''))) : 'none';
  } catch {
    title = parts[2] || title;
  }

  const [copiedSha, setCopiedSha] = useState(false);
  const [verifyStatus, setVerifyStatus] = useState<'idle' | 'matching' | 'mismatch'>('idle');
  const fileCheckRef = useRef<HTMLInputElement | null>(null);

  const handleCopyHash = () => {
    navigator.clipboard.writeText(sha256).then(() => {
      setCopiedSha(true);
      setTimeout(() => setCopiedSha(false), 2000);
    });
  };

  const handleCheckFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const buffer = await file.arrayBuffer();
      const isMatch = await verifyHashMatch(buffer, sha256);
      setVerifyStatus(isMatch ? 'matching' : 'mismatch');
    } catch {
      setVerifyStatus('mismatch');
    }
  };

  return (
    <div className="w-full max-w-sm sm:max-w-md rounded-2xl bg-neutral-950 border border-emerald-500/40 shadow-xl overflow-hidden font-sans select-none my-1">
      {/* Header */}
      <div className="px-4 py-2.5 bg-gradient-to-r from-emerald-950/60 to-neutral-900 border-b border-emerald-500/20 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileBadge className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-bold text-emerald-300 tracking-wide uppercase">
            CRYPTOGRAPHIC NOTARY SEAL
          </span>
        </div>
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono font-bold">
          NIST SHA-256
        </span>
      </div>

      {/* Body */}
      <div className="p-4 space-y-3">
        <div>
          <h4 className="text-xs font-semibold text-white tracking-wide">{title}</h4>
          {fileName !== 'none' && (
            <p className="text-[11px] text-neutral-400 mt-0.5">
              File: {fileName} {fileSize > 0 ? `(${(fileSize / 1024).toFixed(1)} KB)` : ''}
            </p>
          )}
        </div>

        {/* SHA-256 Hash Box */}
        <div className="p-2.5 rounded-xl bg-neutral-900/90 border border-neutral-800 space-y-1">
          <div className="flex items-center justify-between text-[10px] font-mono text-neutral-400">
            <span>IMMUTABLE DIGEST:</span>
            <button
              type="button"
              onClick={handleCopyHash}
              className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition-colors cursor-pointer"
            >
              {copiedSha ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{copiedSha ? 'Copied' : 'Copy Hash'}</span>
            </button>
          </div>
          <div className="text-[11px] font-mono text-emerald-300 break-all select-all font-bold">
            {sha256}
          </div>
        </div>

        {/* Attestation Timestamp */}
        <div className="text-[10px] font-mono text-neutral-500 flex items-center justify-between">
          <span>Sealed: {new Date(timestamp).toLocaleString()}</span>
          <span>ID: #{certId.slice(-8)}</span>
        </div>

        {/* Verification Checker */}
        <div className="pt-1 border-t border-neutral-900 flex items-center justify-between">
          <button
            type="button"
            onClick={() => fileCheckRef.current?.click()}
            className="text-[11px] text-neutral-400 hover:text-emerald-300 flex items-center gap-1 transition-colors cursor-pointer"
          >
            <Upload className="w-3 h-3" />
            <span>Verify Local File Integrity</span>
          </button>
          <input
            ref={fileCheckRef}
            type="file"
            onChange={handleCheckFile}
            className="hidden"
          />

          {verifyStatus === 'matching' && (
            <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-bold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              100% Hash Match
            </span>
          )}

          {verifyStatus === 'mismatch' && (
            <span className="text-[10px] text-rose-400 flex items-center gap-1 font-bold">
              <XCircle className="w-3.5 h-3.5" />
              Tamper Detected / No Match
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
