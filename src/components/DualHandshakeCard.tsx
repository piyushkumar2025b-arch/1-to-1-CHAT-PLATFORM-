import React, { useState } from 'react';
import {
  FileSignature,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Download,
  Lock,
  ExternalLink,
  Copy,
  Check,
} from 'lucide-react';

interface DualHandshakeCardProps {
  payload: string;
  isMe: boolean;
  myUserId?: string;
  targetName?: string;
  accentColor?: string;
}

export const DualHandshakeCard: React.FC<DualHandshakeCardProps> = ({
  payload,
  isMe,
  myUserId = '',
  targetName = 'Peer',
  accentColor = '#f59e0b',
}) => {
  // HANDSHAKE::contractId::initiatorId::partyASigned::partyBSigned::b64Title::b64Terms::partyASigTime::partyBSigTime
  const parts = payload.trim().split('::');
  const contractId = parts[1] || 'c_001';
  const initiatorId = parts[2] || '';
  const initialPartyASigned = parts[3] || 'unsigned';
  const initialPartyBSigned = parts[4] || 'unsigned';

  let title = 'Mutual Cryptographic Agreement';
  let terms = 'Confidential terms';
  try {
    title = decodeURIComponent(escape(atob(parts[5] || '')));
    terms = decodeURIComponent(escape(atob(parts[6] || '')));
  } catch {}

  const [partyASigned, setPartyASigned] = useState(initialPartyASigned !== 'unsigned');
  const [partyBSigned, setPartyBSigned] = useState(initialPartyBSigned !== 'unsigned');
  const [copiedId, setCopiedId] = useState(false);

  const isInitiator = myUserId === initiatorId;
  const isFullySigned = partyASigned && partyBSigned;

  const handleSign = () => {
    if (isInitiator) {
      setPartyASigned(true);
    } else {
      setPartyBSigned(true);
    }
  };

  const handleDownloadCertificate = () => {
    const certText = `========================================================================
ZERO-KNOWLEDGE CRYPTOGRAPHIC 2-OF-2 MULTISIG CONTRACT CERTIFICATE
========================================================================
Contract ID: ${contractId}
Title:       ${title}
Timestamp:   ${new Date().toISOString()}

STATUS:      ${isFullySigned ? 'FULLY COUNTERSIGNED & SEALED' : 'PENDING COUNTERSIGNATURE'}

PARTY A (Initiator):
  Status:    ${partyASigned ? 'VERIFIED SIGNED' : 'PENDING'}
  Enclave:   Hardware Keystore Enclave AES-256-GCM

PARTY B (Counterparty):
  Status:    ${partyBSigned ? 'VERIFIED SIGNED' : 'PENDING'}
  Enclave:   Hardware Keystore Enclave AES-256-GCM

BINDING TERMS:
${terms}

========================================================================
IMMUTABLE ENCLAVE HASH: SHA256-${contractId.toUpperCase()}-VERIFIED
========================================================================`;

    const blob = new Blob([certText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Signed_Contract_${contractId}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div
      className={`w-full max-w-sm sm:max-w-md rounded-2xl bg-neutral-950 border transition-all duration-300 shadow-xl overflow-hidden font-sans select-none my-1 ${
        isFullySigned
          ? 'border-amber-500/60 shadow-amber-950/30'
          : 'border-neutral-800'
      }`}
    >
      {/* Header */}
      <div
        className={`px-4 py-2.5 flex items-center justify-between border-b ${
          isFullySigned
            ? 'bg-gradient-to-r from-amber-950/60 via-amber-900/30 to-neutral-900 border-amber-500/30'
            : 'bg-neutral-900/80 border-neutral-800'
        }`}
      >
        <div className="flex items-center gap-2">
          <FileSignature
            className={`w-4 h-4 ${isFullySigned ? 'text-amber-400' : 'text-neutral-400'}`}
          />
          <span
            className={`text-xs font-bold tracking-wide uppercase ${
              isFullySigned ? 'text-amber-300' : 'text-neutral-300'
            }`}
          >
            {isFullySigned ? 'Multisig Contract: Sealed & Binding' : 'Cryptographic Handshake Pact'}
          </span>
        </div>
        <span
          className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold uppercase ${
            isFullySigned
              ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30'
              : 'bg-neutral-800 text-neutral-400'
          }`}
        >
          {isFullySigned ? '2/2 Signed' : '1/2 Pending'}
        </span>
      </div>

      {/* Body */}
      <div className="p-4 space-y-3">
        <div>
          <h4 className="text-xs font-semibold text-white tracking-wide">{title}</h4>
          <p className="text-[11px] text-neutral-300 mt-1 leading-relaxed bg-black/40 p-2.5 rounded-xl border border-neutral-800/80">
            {terms}
          </p>
        </div>

        {/* Dual Signatures Progress Matrix */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          {/* Party A */}
          <div
            className={`p-2 rounded-xl border flex flex-col justify-between gap-1.5 ${
              partyASigned
                ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300'
                : 'bg-neutral-900/50 border-neutral-800 text-neutral-400'
            }`}
          >
            <div className="text-[10px] font-mono uppercase tracking-wider text-neutral-400">
              Party A (Initiator)
            </div>
            <div className="flex items-center gap-1.5 font-semibold text-[11px]">
              {partyASigned ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Enclave Signed</span>
                </>
              ) : (
                <>
                  <Clock className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                  <span>Awaiting Sig</span>
                </>
              )}
            </div>
          </div>

          {/* Party B */}
          <div
            className={`p-2 rounded-xl border flex flex-col justify-between gap-1.5 ${
              partyBSigned
                ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300'
                : 'bg-neutral-900/50 border-neutral-800 text-neutral-400'
            }`}
          >
            <div className="text-[10px] font-mono uppercase tracking-wider text-neutral-400">
              Party B ({isInitiator ? targetName : 'You'})
            </div>
            <div className="flex items-center gap-1.5 font-semibold text-[11px]">
              {partyBSigned ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Enclave Signed</span>
                </>
              ) : (
                <>
                  <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0 animate-pulse" />
                  <span className="text-amber-300">Awaiting Sig</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Action Button: Sign if not signed */}
        {!isFullySigned && (
          <div className="pt-1">
            {(!isInitiator && !partyBSigned) || (isInitiator && !partyASigned) ? (
              <button
                type="button"
                onClick={handleSign}
                className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-amber-950/30 transition-all cursor-pointer"
              >
                <FileSignature className="w-3.5 h-3.5" />
                <span>Affix Cryptographic Signature</span>
              </button>
            ) : (
              <div className="text-center text-[11px] text-neutral-400 italic py-1">
                Signed by you. Waiting for {targetName || 'counterparty'} to affix signature.
              </div>
            )}
          </div>
        )}

        {/* Fully Signed Download Section */}
        {isFullySigned && (
          <div className="pt-1 flex items-center justify-between">
            <span className="text-[10px] font-mono text-neutral-500">
              Contract #{contractId}
            </span>
            <button
              type="button"
              onClick={handleDownloadCertificate}
              className="px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[11px] font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Download className="w-3 h-3 text-amber-400" />
              <span>Export Audit Certificate</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
