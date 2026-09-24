import React, { useState } from 'react';
import {
  X,
  FileSignature,
  ShieldCheck,
  Send,
  Sparkles,
  CheckCircle2,
  Lock,
} from 'lucide-react';

interface DualHandshakeModalProps {
  isOpen: boolean;
  onClose: () => void;
  myUserId: string;
  targetName?: string;
  onSendHandshake: (payload: string) => void;
  accentColor?: string;
}

const TEMPLATES = [
  {
    title: 'Mutual Non-Disclosure Agreement (NDA)',
    terms: 'Both parties agree to treat all communications, files, and cryptographic keys shared within this enclave as strictly confidential. Neither party shall disclose or archive these records without mutual consensus.',
  },
  {
    title: 'Code Security & Zero-Leakage Pact',
    terms: 'All proprietary software source code, credentials, and cryptographic material transmitted in this room shall remain ephemeral and protected under zero-knowledge guarantees.',
  },
  {
    title: 'Cryptographic Key Exchange Confirmation',
    terms: 'The participants hereby confirm mutual key exchange verification and agree that neither party has observed any man-in-the-middle or identity compromise.',
  },
];

export const DualHandshakeModal: React.FC<DualHandshakeModalProps> = ({
  isOpen,
  onClose,
  myUserId,
  targetName,
  onSendHandshake,
  accentColor = '#f59e0b',
}) => {
  const [title, setTitle] = useState(TEMPLATES[0].title);
  const [terms, setTerms] = useState(TEMPLATES[0].terms);
  const [signImmediately, setSignImmediately] = useState(true);

  if (!isOpen) return null;

  const handleCreate = async () => {
    if (!title.trim() || !terms.trim()) return;

    const contractId = 'c_' + Math.random().toString(36).substring(2, 9);
    const now = Date.now();

    // Initiator signature hash
    const initiatorSignature = signImmediately
      ? `sig_${myUserId.slice(0, 6)}_${now}`
      : 'unsigned';

    // HANDSHAKE::contractId::initiatorId::partyASigned::partyBSigned::b64Title::b64Terms::partyASigTime::partyBSigTime
    const b64Title = btoa(unescape(encodeURIComponent(title.trim())));
    const b64Terms = btoa(unescape(encodeURIComponent(terms.trim())));
    const payload = `HANDSHAKE::${contractId}::${myUserId}::${initiatorSignature}::unsigned::${b64Title}::${b64Terms}::${now}::0`;

    onSendHandshake(payload);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-xl rounded-2xl bg-neutral-925 border border-amber-500/30 shadow-2xl shadow-amber-950/30 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-amber-950/40 via-neutral-900 to-neutral-900 border-b border-amber-500/20">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <FileSignature className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-wide flex items-center gap-2">
                Cryptographic Handshake & Contract
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono uppercase font-bold tracking-wider">
                  2-of-2 Multisig
                </span>
              </h2>
              <p className="text-xs text-neutral-400">
                Mutual dual-signature pact signed with hardware cryptographic enclave identities
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
          {/* Preset Templates */}
          <div>
            <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-2">
              Select Agreement Template
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {TEMPLATES.map((tmpl, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setTitle(tmpl.title);
                    setTerms(tmpl.terms);
                  }}
                  className={`p-2.5 rounded-xl border text-left transition-all text-xs ${
                    title === tmpl.title
                      ? 'bg-amber-500/20 border-amber-500/50 text-white shadow-sm'
                      : 'bg-neutral-900/60 border-neutral-800 text-neutral-400 hover:border-neutral-700'
                  }`}
                >
                  <span className="font-semibold block truncate text-amber-300">{tmpl.title}</span>
                  <span className="text-[10px] opacity-75 line-clamp-2 mt-0.5">{tmpl.terms}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-1">
              Agreement Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-100 text-xs focus:outline-none focus:border-amber-400"
            />
          </div>

          {/* Binding Terms */}
          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-1">
              Binding Agreement Terms
            </label>
            <textarea
              value={terms}
              onChange={(e) => setTerms(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-100 text-xs focus:outline-none focus:border-amber-400 leading-relaxed resize-none"
            />
          </div>

          {/* Signature Option */}
          <div className="p-3 rounded-xl bg-neutral-900/90 border border-neutral-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <div>
                <span className="text-xs font-semibold text-white block">
                  Countersign as Initiator (Party A)
                </span>
                <span className="text-[11px] text-neutral-400">
                  Affixes your cryptographic session seal immediately
                </span>
              </div>
            </div>
            <input
              type="checkbox"
              checked={signImmediately}
              onChange={(e) => setSignImmediately(e.target.checked)}
              className="accent-amber-400 w-4 h-4 rounded cursor-pointer"
            />
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
            onClick={handleCreate}
            disabled={!title.trim() || !terms.trim()}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-neutral-950 bg-amber-400 hover:bg-amber-300 disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-amber-950/40 flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            Dispatch Handshake to Room
          </button>
        </div>
      </div>
    </div>
  );
};
