import React, { useState } from 'react';
import {
  ShieldCheck,
  KeyRound,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  Lock,
  Unlock,
} from 'lucide-react';
import { verifyZkpCandidate } from '../lib/zkp-engine';

interface ZkpChallengeCardProps {
  payload: string;
  isMe: boolean;
  myUserId?: string;
  accentColor?: string;
}

export const ZkpChallengeCard: React.FC<ZkpChallengeCardProps> = ({
  payload,
  isMe,
  myUserId,
  accentColor = '#f59e0b',
}) => {
  // ZKP_CHALLENGE::challengeId::creatorId::b64Prompt::commitmentHash::salt::createdAt
  const parts = payload.trim().split('::');
  const challengeId = parts[1] || 'zkp_001';
  const creatorId = parts[2] || '';
  const commitmentHash = parts[4] || '';
  const salt = parts[5] || '';
  const createdAt = parseInt(parts[6] || '0', 10);

  let prompt = 'Zero-Knowledge Challenge';
  try {
    prompt = decodeURIComponent(escape(atob(parts[3] || '')));
  } catch {
    prompt = parts[3] || prompt;
  }

  const [inputAnswer, setInputAnswer] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);

  const isOwner = myUserId ? myUserId === creatorId : isMe;

  const handleVerify = async () => {
    if (!inputAnswer.trim()) return;
    setIsVerifying(true);
    setErrorStatus(null);

    try {
      const match = await verifyZkpCandidate(inputAnswer, commitmentHash, salt);
      if (match) {
        setIsVerified(true);
      } else {
        setErrorStatus('Proof Invalid: Candidate does not satisfy the cryptographic commitment.');
      }
    } catch (err) {
      setErrorStatus('Verification error occurred.');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div
      className={`w-full max-w-sm sm:max-w-md rounded-2xl bg-neutral-950 border transition-all duration-300 shadow-xl overflow-hidden font-sans select-none my-1 ${
        isVerified ? 'border-emerald-500/60 shadow-emerald-950/30' : 'border-cyan-500/30'
      }`}
    >
      {/* Header */}
      <div
        className={`px-4 py-2.5 flex items-center justify-between border-b ${
          isVerified
            ? 'bg-gradient-to-r from-emerald-950/60 to-neutral-900 border-emerald-500/30'
            : 'bg-gradient-to-r from-cyan-950/50 to-neutral-900 border-cyan-500/20'
        }`}
      >
        <div className="flex items-center gap-2">
          <ShieldCheck
            className={`w-4 h-4 ${isVerified ? 'text-emerald-400' : 'text-cyan-400'}`}
          />
          <span
            className={`text-xs font-bold tracking-wide uppercase ${
              isVerified ? 'text-emerald-300' : 'text-cyan-300'
            }`}
          >
            {isVerified ? 'ZKP VERIFIED (KNOWLEDGE PROVEN)' : 'ZERO-KNOWLEDGE PROOF CHALLENGE'}
          </span>
        </div>
        <span
          className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
            isVerified ? 'bg-emerald-500/20 text-emerald-300' : 'bg-cyan-500/20 text-cyan-300'
          }`}
        >
          #{challengeId.slice(0, 7)}
        </span>
      </div>

      {/* Body */}
      <div className="p-4 space-y-3">
        <div>
          <h4 className="text-xs font-semibold text-white tracking-wide">{prompt}</h4>
          <p className="text-[11px] text-neutral-400 mt-0.5">
            Prove you know the answer without exposing the secret to the network.
          </p>
        </div>

        {/* Commitment Hash Preview */}
        <div className="p-2 rounded-xl bg-neutral-900/80 border border-neutral-800 text-[10px] font-mono text-neutral-400 space-y-0.5">
          <div className="text-neutral-500">Salted Commitment:</div>
          <div className="truncate text-cyan-400/90 select-all font-mono">{commitmentHash}</div>
        </div>

        {/* Verified State */}
        {isVerified && (
          <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/40 space-y-1 animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
              Cryptographic Proof Accepted
            </div>
            <p className="text-[11px] text-emerald-200/90 leading-relaxed">
              Knowledge of the secret was mathematically proven without revealing a single character of the plaintext.
            </p>
          </div>
        )}

        {/* Input & Prove Section */}
        {!isVerified && (
          <div className="space-y-2 pt-1">
            <div className="flex items-center gap-1.5">
              <input
                type="password"
                value={inputAnswer}
                onChange={(e) => {
                  setInputAnswer(e.target.value);
                  setErrorStatus(null);
                }}
                placeholder="Enter secret answer to prove..."
                className="flex-1 px-3 py-1.5 rounded-xl bg-neutral-900 border border-neutral-800 text-xs text-neutral-100 font-mono focus:outline-none focus:border-cyan-400"
              />
              <button
                type="button"
                onClick={handleVerify}
                disabled={!inputAnswer.trim() || isVerifying}
                className="px-3 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-neutral-950 font-bold text-xs flex items-center gap-1 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shrink-0"
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>{isVerifying ? 'Checking...' : 'Prove'}</span>
              </button>
            </div>

            {errorStatus && (
              <div className="text-[11px] text-rose-400 flex items-center gap-1">
                <XCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{errorStatus}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
