import React, { useState } from 'react';
import {
  X,
  HelpCircle,
  ShieldCheck,
  Send,
  Sparkles,
  Lock,
  KeyRound,
  CheckCircle2,
} from 'lucide-react';
import { createZkpCommitment } from '../lib/zkp-engine';

interface ZkpChallengeModalProps {
  isOpen: boolean;
  onClose: () => void;
  myUserId: string;
  onSendChallenge: (payload: string) => void;
  accentColor?: string;
}

export const ZkpChallengeModal: React.FC<ZkpChallengeModalProps> = ({
  isOpen,
  onClose,
  myUserId,
  onSendChallenge,
  accentColor = '#f59e0b',
}) => {
  const [prompt, setPrompt] = useState('Prove you know the confidential operation passphrase');
  const [secret, setSecret] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleGenerateAndSend = async () => {
    if (!prompt.trim() || !secret.trim()) return;
    setIsSubmitting(true);

    try {
      const commitment = await createZkpCommitment(secret, prompt, myUserId);
      const b64Prompt = btoa(unescape(encodeURIComponent(commitment.prompt)));

      // ZKP_CHALLENGE::challengeId::creatorId::b64Prompt::commitmentHash::salt::createdAt
      const payload = `ZKP_CHALLENGE::${commitment.challengeId}::${commitment.creatorId}::${b64Prompt}::${commitment.commitmentHash}::${commitment.salt}::${commitment.createdAt}`;

      onSendChallenge(payload);
      onClose();
    } catch (err) {
      console.error('Failed to create ZKP commitment:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-2xl bg-neutral-925 border border-cyan-500/30 shadow-2xl shadow-cyan-950/30 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-cyan-950/40 via-neutral-900 to-neutral-900 border-b border-cyan-500/20">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-wide flex items-center gap-2">
                Zero-Knowledge Proof (ZKP)
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono uppercase font-bold tracking-wider">
                  Zero Disclosure
                </span>
              </h2>
              <p className="text-xs text-neutral-400">
                Prove knowledge of a secret without ever revealing the secret itself
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
              Challenge Question / Prompt (Visible to Peer)
            </label>
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g. Prove you know the safe lock passcode"
              className="w-full px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-100 text-xs focus:outline-none focus:border-cyan-400"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-1">
              Secret Passphrase (Never Transmitted or Leaked)
            </label>
            <input
              type="password"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              placeholder="Enter the secret that only the authorized party knows..."
              className="w-full px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-100 text-xs font-mono focus:outline-none focus:border-cyan-400"
            />
            <p className="text-[11px] text-neutral-500 mt-1">
              Only a one-way mathematical SHA-256 salted commitment hash is transmitted. Your plaintext secret never leaves your device.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-cyan-950/20 border border-cyan-500/20 space-y-1.5 text-[11px] text-cyan-200/90 leading-relaxed">
            <div className="font-semibold flex items-center gap-1.5 text-cyan-300">
              <CheckCircle2 className="w-3.5 h-3.5" />
              How Zero-Knowledge Authentication Works:
            </div>
            <p>
              When your peer enters the candidate response, their browser computes the identical cryptographic commitment hash and checks for mathematical equality. If it matches, authentication succeeds with 0% data exposure.
            </p>
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
            onClick={handleGenerateAndSend}
            disabled={!prompt.trim() || !secret.trim() || isSubmitting}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-neutral-950 bg-cyan-400 hover:bg-cyan-300 disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-cyan-950/40 flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{isSubmitting ? 'Computing Commitment...' : 'Dispatch ZKP Challenge'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
