import React, { useState } from 'react';
import { Lock, Unlock, KeyRound, ShieldAlert, Check, Copy, Eye, EyeOff } from 'lucide-react';
import { decryptAesGcm } from '../lib/cipher-utils';

interface EncryptedMessageCapsuleProps {
  payload: string;
  isMe: boolean;
  accentColor?: string;
}

export const EncryptedMessageCapsule: React.FC<EncryptedMessageCapsuleProps> = ({
  payload,
  isMe,
  accentColor = '#f59e0b',
}) => {
  const [passphrase, setPassphrase] = useState('');
  const [decryptedText, setDecryptedText] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showPassphrase, setShowPassphrase] = useState(false);

  const handleDecrypt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passphrase.trim()) {
      setError('Please enter the secret passphrase');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const plaintext = await decryptAesGcm(payload.trim(), passphrase.trim());
      setDecryptedText(plaintext);
    } catch (err: any) {
      setError('Decryption failed: Incorrect passphrase or damaged cipher');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyDecrypted = () => {
    if (!decryptedText) return;
    navigator.clipboard.writeText(decryptedText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleRelock = () => {
    setDecryptedText(null);
    setPassphrase('');
    setError(null);
  };

  return (
    <div className="w-full max-w-sm rounded-xl overflow-hidden border border-amber-500/30 bg-neutral-950/80 shadow-md my-1 text-left select-none">
      {/* Capsule Header */}
      <div className="px-3 py-2 bg-amber-500/15 border-b border-amber-500/20 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {decryptedText ? (
            <Unlock className="w-4 h-4 text-emerald-400" />
          ) : (
            <Lock className="w-4 h-4 text-amber-400 animate-pulse" />
          )}
          <span className="text-[11px] font-bold tracking-wide uppercase font-mono text-amber-300">
            {decryptedText ? 'Secret Unlocked (AES-256)' : 'AES-256 Encrypted Capsule'}
          </span>
        </div>
        <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-200 font-mono">
          E2EE
        </span>
      </div>

      {/* Capsule Content */}
      <div className="p-3 space-y-2.5">
        {decryptedText ? (
          <div className="space-y-2 animate-in fade-in zoom-in-95 duration-150">
            <div className="p-2.5 rounded-lg bg-emerald-950/30 border border-emerald-500/30 text-emerald-100 text-xs font-mono break-words whitespace-pre-wrap select-text leading-relaxed">
              {decryptedText}
            </div>

            <div className="flex items-center justify-between text-[11px] pt-1">
              <button
                type="button"
                onClick={handleCopyDecrypted}
                className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy Plaintext'}</span>
              </button>

              <button
                type="button"
                onClick={handleRelock}
                className="flex items-center gap-1 text-neutral-400 hover:text-neutral-200 transition-colors cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Relock Capsule</span>
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleDecrypt} className="space-y-2">
            <p className="text-[11px] text-neutral-300">
              This message is protected with client-side AES-GCM encryption. Enter the passphrase to unlock.
            </p>

            <div className="relative flex items-center">
              <input
                type={showPassphrase ? 'text' : 'password'}
                value={passphrase}
                onChange={(e) => setPassphrase(e.target.value)}
                placeholder="Enter secret passphrase..."
                className="w-full px-2.5 py-1.5 pr-14 rounded-lg bg-neutral-900 border border-neutral-750 text-neutral-100 placeholder-neutral-500 text-xs font-mono focus:outline-none focus:border-amber-500"
              />
              <button
                type="button"
                onClick={() => setShowPassphrase(!showPassphrase)}
                className="absolute right-2 text-neutral-500 hover:text-neutral-300 p-1"
                title={showPassphrase ? 'Hide' : 'Show'}
              >
                {showPassphrase ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>

            {error && (
              <div className="flex items-center gap-1.5 text-[10px] text-rose-400 bg-rose-500/10 px-2 py-1 rounded border border-rose-500/20">
                <ShieldAlert className="w-3 h-3 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !passphrase.trim()}
              className="w-full py-1.5 rounded-lg text-xs font-semibold text-neutral-950 transition-all cursor-pointer shadow-xs disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
              style={{ backgroundColor: accentColor }}
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>{loading ? 'Decrypting...' : 'Unlock Message'}</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
