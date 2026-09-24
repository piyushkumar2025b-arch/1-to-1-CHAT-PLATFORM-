import React, { useState } from 'react';
import {
  X,
  Bird,
  ShieldCheck,
  Send,
  Calendar,
  KeyRound,
  CheckCircle,
  FileCheck,
} from 'lucide-react';

interface WarrantCanaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  myUserId: string;
  onSendCanary: (payload: string) => void;
  accentColor?: string;
}

export const WarrantCanaryModal: React.FC<WarrantCanaryModalProps> = ({
  isOpen,
  onClose,
  myUserId,
  onSendCanary,
  accentColor = '#f59e0b',
}) => {
  const [statement, setStatement] = useState(
    'As of the timestamp below, no search warrants, National Security Letters, gag orders, or court mandates demanding access to keys or decrypted content have been received or served. Zero surveillance backdoors exist.'
  );
  const [validUntilDays, setValidUntilDays] = useState(30);

  if (!isOpen) return null;

  const handlePublish = async () => {
    const timestamp = Date.now();
    const expiryTimestamp = timestamp + validUntilDays * 86400 * 1000;
    
    // Calculate entropy verification hash
    const textToHash = `${myUserId}::${timestamp}::${statement}`;
    const enc = new TextEncoder();
    const hashBuf = await crypto.subtle.digest('SHA-256', enc.encode(textToHash));
    const hashHex = Array.from(new Uint8Array(hashBuf))
      .slice(0, 8)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')
      .toUpperCase();

    const b64Statement = btoa(unescape(encodeURIComponent(statement.trim())));
    // CANARY::myUserId::timestamp::expiryTimestamp::hashHex::b64Statement
    const payload = `CANARY::${myUserId}::${timestamp}::${expiryTimestamp}::${hashHex}::${b64Statement}`;

    onSendCanary(payload);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-2xl bg-neutral-925 border border-amber-500/30 shadow-2xl shadow-amber-950/30 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-amber-950/40 via-neutral-900 to-neutral-900 border-b border-amber-500/20">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <Bird className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-wide flex items-center gap-2">
                Cryptographic Warrant Canary
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono uppercase font-bold tracking-wider">
                  Integrity Proof
                </span>
              </h2>
              <p className="text-xs text-neutral-400">
                Tamper-evident anti-gag-order attestation sealed with cryptographic entropy
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4 text-sm text-neutral-300">
          <div>
            <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-1">
              Affidavit & Transparency Declaration
            </label>
            <textarea
              value={statement}
              onChange={(e) => setStatement(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-100 text-xs focus:outline-none focus:border-amber-400 leading-relaxed resize-none"
            />
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-neutral-900/80 border border-neutral-800">
            <div>
              <div className="text-xs font-semibold text-white">Canary Validity Period</div>
              <div className="text-[11px] text-neutral-400">
                Recommended re-certification cycle
              </div>
            </div>
            <select
              value={validUntilDays}
              onChange={(e) => setValidUntilDays(parseInt(e.target.value, 10))}
              className="px-3 py-1.5 rounded-xl bg-neutral-950 border border-neutral-800 text-neutral-200 text-xs font-mono focus:outline-none focus:border-amber-400"
            >
              <option value={7}>7 Days</option>
              <option value={14}>14 Days</option>
              <option value={30}>30 Days (Standard)</option>
              <option value={90}>90 Days (Quarterly)</option>
            </select>
          </div>

          <div className="p-3 rounded-xl bg-amber-950/20 border border-amber-500/20 text-[11px] text-amber-200/80 leading-relaxed">
            ℹ️ If this canary ever fails to be refreshed before its expiration date or is retracted, it indicates potential outside legal compromise or surveillance interference.
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 bg-neutral-950 border-t border-neutral-800 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handlePublish}
            disabled={!statement.trim()}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-neutral-950 bg-amber-400 hover:bg-amber-300 disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-amber-950/40 flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            Publish Sealed Canary to Room
          </button>
        </div>
      </div>
    </div>
  );
};
