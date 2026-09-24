import React, { useState } from 'react';
import {
  Key,
  Unlock,
  ShieldCheck,
  AlertTriangle,
  Copy,
  Check,
  Cpu,
} from 'lucide-react';
import { decryptOtp } from '../lib/one-time-pad';

interface OneTimePadCardProps {
  payload: string;
  isMe: boolean;
  accentColor?: string;
}

export const OneTimePadCard: React.FC<OneTimePadCardProps> = ({
  payload,
  isMe,
  accentColor = '#f59e0b',
}) => {
  // OTP_CIPHER::mode::padFingerprint::ciphertext::label
  const parts = payload.trim().split('::');
  const mode = (parts[1] as 'xor_hex' | 'modular_alpha') || 'xor_hex';
  const padFingerprint = parts[2] || '';
  const ciphertext = parts[3] || '';
  let label = 'OTP Encrypted Payload';
  try {
    label = decodeURIComponent(parts[4] || label);
  } catch {}

  const [inputPad, setInputPad] = useState('');
  const [decryptedText, setDecryptedText] = useState<string | null>(null);
  const [decryptError, setDecryptError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleDecrypt = () => {
    if (!inputPad.trim()) return;
    try {
      const res = decryptOtp(ciphertext, inputPad.trim(), mode);
      setDecryptedText(res);
      setDecryptError(null);
    } catch (err: any) {
      setDecryptError('Invalid Pad: Decryption yielded invalid UTF-8 or mismatched length.');
      setDecryptedText(null);
    }
  };

  const handleCopyCipher = () => {
    navigator.clipboard.writeText(ciphertext).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="w-full max-w-sm sm:max-w-md rounded-2xl bg-neutral-950 border border-amber-500/30 shadow-xl overflow-hidden font-sans select-none my-1">
      {/* Header */}
      <div className="px-4 py-2.5 bg-gradient-to-r from-amber-950/50 to-neutral-900 border-b border-amber-500/20 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Key className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-bold text-amber-300 tracking-wide">
            ONE-TIME PAD CIPHER
          </span>
        </div>
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono font-bold">
          Pad ID: #{padFingerprint}
        </span>
      </div>

      {/* Body */}
      <div className="p-4 space-y-3">
        <div>
          <div className="text-xs font-semibold text-white tracking-wide">{label}</div>
          <div className="text-[11px] text-neutral-400">
            {mode === 'xor_hex' ? 'Binary XOR Shannon Secrecy' : 'A-Z Modular Vernam Secrecy'}
          </div>
        </div>

        {/* Ciphertext Display */}
        <div className="p-2.5 rounded-xl bg-neutral-900/90 border border-neutral-800 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-neutral-400 uppercase font-mono tracking-wider">
              Opaque Ciphertext
            </span>
            <button
              type="button"
              onClick={handleCopyCipher}
              className="text-[10px] text-amber-400 hover:text-amber-300 flex items-center gap-1 transition-colors"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
          <div className="text-xs font-mono text-neutral-300 break-all select-all max-h-16 overflow-y-auto">
            {ciphertext}
          </div>
        </div>

        {/* Decrypted Output if already decrypted */}
        {decryptedText !== null ? (
          <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/50 space-y-1.5 animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Decrypted Plaintext
            </div>
            <div className="text-xs font-mono text-white break-words select-text">
              {decryptedText}
            </div>
          </div>
        ) : (
          /* Pad Input and Decrypt Button */
          <div className="space-y-2 pt-1">
            <div className="flex items-center gap-1.5">
              <input
                type="text"
                value={inputPad}
                onChange={(e) => setInputPad(e.target.value)}
                placeholder={`Enter Matching Pad (#${padFingerprint})...`}
                className="flex-1 px-3 py-1.5 rounded-xl bg-neutral-900 border border-neutral-800 text-xs text-neutral-100 font-mono placeholder:text-neutral-500 focus:outline-none focus:border-amber-400"
              />
              <button
                type="button"
                onClick={handleDecrypt}
                disabled={!inputPad.trim()}
                className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs flex items-center gap-1 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <Unlock className="w-3.5 h-3.5" />
                Unseal
              </button>
            </div>

            {decryptError && (
              <div className="text-[11px] text-rose-400 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                <span>{decryptError}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
