import React, { useState, useEffect } from 'react';
import {
  X,
  Key,
  ShieldCheck,
  RefreshCw,
  Copy,
  Check,
  Send,
  Download,
  AlertTriangle,
  Lock,
  Unlock,
  Cpu,
  ArrowRight,
} from 'lucide-react';
import {
  generateRandomPad,
  encryptOtp,
  decryptOtp,
  calculatePadFingerprint,
  OtpResult,
} from '../lib/one-time-pad';

interface OneTimePadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSendCipherToChat?: (payload: string) => void;
  accentColor?: string;
}

export const OneTimePadModal: React.FC<OneTimePadModalProps> = ({
  isOpen,
  onClose,
  onSendCipherToChat,
  accentColor = '#f59e0b',
}) => {
  const [activeTab, setActiveTab] = useState<'encrypt' | 'decrypt'>('encrypt');
  const [mode, setMode] = useState<'xor_hex' | 'modular_alpha'>('xor_hex');
  const [label, setLabel] = useState('Top Secret Directive');

  // Encrypt state
  const [plaintext, setPlaintext] = useState('');
  const [pad, setPad] = useState('');
  const [otpResult, setOtpResult] = useState<OtpResult | null>(null);
  const [copiedPad, setCopiedPad] = useState(false);
  const [copiedCipher, setCopiedCipher] = useState(false);
  const [encryptError, setEncryptError] = useState<string | null>(null);

  // Decrypt state
  const [decryptCipher, setDecryptCipher] = useState('');
  const [decryptPad, setDecryptPad] = useState('');
  const [decryptedPlaintext, setDecryptedPlaintext] = useState<string | null>(null);
  const [decryptError, setDecryptError] = useState<string | null>(null);

  // Regenerate pad when plaintext or mode changes in encrypt mode
  const handleRegeneratePad = () => {
    const requiredLen = mode === 'modular_alpha' ? plaintext.length || 16 : (plaintext.length || 16);
    const newPad = generateRandomPad(Math.max(16, requiredLen), mode);
    setPad(newPad);
  };

  useEffect(() => {
    if (isOpen && !pad) {
      handleRegeneratePad();
    }
  }, [isOpen, mode]);

  // Execute encryption
  useEffect(() => {
    if (!plaintext.trim()) {
      setOtpResult(null);
      setEncryptError(null);
      return;
    }

    try {
      encryptOtp(plaintext, pad, mode)
        .then((res) => {
          setOtpResult(res);
          setEncryptError(null);
        })
        .catch((err) => {
          setOtpResult(null);
          setEncryptError(err.message);
        });
    } catch (err: any) {
      setEncryptError(err.message);
    }
  }, [plaintext, pad, mode]);

  // Handle Decrypt
  const handleDecrypt = () => {
    if (!decryptCipher.trim() || !decryptPad.trim()) return;
    try {
      const res = decryptOtp(decryptCipher.trim(), decryptPad.trim(), mode);
      setDecryptedPlaintext(res);
      setDecryptError(null);
    } catch (err: any) {
      setDecryptError(err.message || 'Decryption failed: Pad is incorrect or does not match.');
      setDecryptedPlaintext(null);
    }
  };

  if (!isOpen) return null;

  const handleSendToChat = () => {
    if (!otpResult || !onSendCipherToChat) return;
    // OTP_CIPHER::mode::padFingerprint::ciphertext::label
    const payload = `OTP_CIPHER::${mode}::${otpResult.fingerprint}::${otpResult.ciphertext}::${encodeURIComponent(
      label || 'OTP Encrypted Payload'
    )}`;
    onSendCipherToChat(payload);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-2xl rounded-2xl bg-neutral-925 border border-amber-500/30 shadow-2xl shadow-amber-950/30 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-amber-950/40 via-neutral-900 to-neutral-900 border-b border-amber-500/20">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-wide flex items-center gap-2">
                One-Time Pad (OTP) Studio
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono uppercase font-bold tracking-wider">
                  Shannon Perfect Secrecy
                </span>
              </h2>
              <p className="text-xs text-neutral-400">
                Mathematically unbreakable information-theoretic cryptographic cipher
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

        {/* Tab Selection */}
        <div className="flex items-center border-b border-neutral-800 bg-neutral-900/60 px-5 gap-4">
          <button
            type="button"
            onClick={() => setActiveTab('encrypt')}
            className={`py-3 text-xs font-semibold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'encrypt'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            Encrypt with New Pad
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('decrypt')}
            className={`py-3 text-xs font-semibold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'decrypt'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Unlock className="w-3.5 h-3.5" />
            Decrypt with Received Pad
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-sm text-neutral-300">
          {/* Mode Selector */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-neutral-900/80 border border-neutral-800">
            <div>
              <div className="text-xs font-semibold text-white">Cipher Operating Mode</div>
              <div className="text-[11px] text-neutral-400">
                {mode === 'xor_hex'
                  ? 'Binary XOR byte-by-byte (Full ASCII & Unicode support)'
                  : 'Polyalphabetic A-Z Modular 26 Arithmetic (Classic Vernam)'}
              </div>
            </div>
            <div className="flex items-center gap-1.5 bg-neutral-950 p-1 rounded-xl border border-neutral-800">
              <button
                type="button"
                onClick={() => setMode('xor_hex')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  mode === 'xor_hex'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                Binary XOR
              </button>
              <button
                type="button"
                onClick={() => setMode('modular_alpha')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  mode === 'modular_alpha'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                A-Z Mod 26
              </button>
            </div>
          </div>

          {activeTab === 'encrypt' ? (
            <>
              {/* Directive Label */}
              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1">
                  Directive Label / Subject
                </label>
                <input
                  type="text"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder="e.g. Operation Alpha Coordinates"
                  className="w-full px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-100 text-xs focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Plaintext Input */}
              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1">
                  Plaintext Message to Encrypt
                </label>
                <textarea
                  value={plaintext}
                  onChange={(e) => setPlaintext(e.target.value)}
                  rows={3}
                  placeholder="Type confidential message..."
                  className="w-full px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-100 text-xs focus:outline-none focus:border-amber-500 font-mono resize-none"
                />
              </div>

              {/* CSPRNG One-Time Pad Sheet */}
              <div className="p-3.5 rounded-xl bg-neutral-900/90 border border-amber-500/20 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-amber-300 flex items-center gap-1.5">
                    <Cpu className="w-4 h-4 text-amber-400" />
                    CSPRNG Generated One-Time Pad
                    {otpResult?.fingerprint && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono">
                        Pad ID: #{otpResult.fingerprint}
                      </span>
                    )}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={handleRegeneratePad}
                      className="px-2 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs flex items-center gap-1 transition-colors"
                    >
                      <RefreshCw className="w-3 h-3 text-amber-400" />
                      Reroll Pad
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(pad).then(() => {
                          setCopiedPad(true);
                          setTimeout(() => setCopiedPad(false), 2000);
                        });
                      }}
                      className="px-2 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs flex items-center gap-1 transition-colors"
                    >
                      {copiedPad ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedPad ? 'Copied' : 'Copy Pad'}</span>
                    </button>
                  </div>
                </div>
                <div className="p-2.5 rounded-lg bg-black/60 border border-neutral-800 text-xs font-mono text-amber-200/90 break-all select-all max-h-24 overflow-y-auto">
                  {pad || 'No pad generated'}
                </div>
                <p className="text-[11px] text-neutral-500 italic">
                  ⚠️ Send this pad to your peer via an out-of-band channel or securely. A pad must never be reused!
                </p>
              </div>

              {/* Error Message if pad is too short */}
              {encryptError && (
                <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{encryptError}</span>
                </div>
              )}

              {/* Ciphertext Output */}
              {otpResult && (
                <div className="p-3.5 rounded-xl bg-neutral-900/90 border border-neutral-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-neutral-200">
                      Unbreakable Ciphertext ({otpResult.ciphertext.length} characters)
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(otpResult.ciphertext).then(() => {
                          setCopiedCipher(true);
                          setTimeout(() => setCopiedCipher(false), 2000);
                        });
                      }}
                      className="px-2 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs flex items-center gap-1 transition-colors"
                    >
                      {copiedCipher ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedCipher ? 'Copied' : 'Copy Cipher'}</span>
                    </button>
                  </div>
                  <div className="p-2.5 rounded-lg bg-black/60 border border-neutral-800 text-xs font-mono text-emerald-400 break-all select-all">
                    {otpResult.ciphertext}
                  </div>
                </div>
              )}
            </>
          ) : (
            /* Decrypt Tab */
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1">
                  Ciphertext to Decrypt
                </label>
                <textarea
                  value={decryptCipher}
                  onChange={(e) => setDecryptCipher(e.target.value)}
                  rows={3}
                  placeholder="Paste hexadecimal or alphabetic OTP ciphertext..."
                  className="w-full px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-100 text-xs focus:outline-none focus:border-amber-500 font-mono resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1">
                  Matching One-Time Pad
                </label>
                <textarea
                  value={decryptPad}
                  onChange={(e) => setDecryptPad(e.target.value)}
                  rows={3}
                  placeholder="Paste the unique one-time pad shared with you..."
                  className="w-full px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-100 text-xs focus:outline-none focus:border-amber-500 font-mono resize-none"
                />
              </div>

              <button
                type="button"
                onClick={handleDecrypt}
                disabled={!decryptCipher.trim() || !decryptPad.trim()}
                className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <Unlock className="w-4 h-4" />
                Decrypt with One-Time Pad
              </button>

              {decryptError && (
                <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{decryptError}</span>
                </div>
              )}

              {decryptedPlaintext !== null && (
                <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-500/40 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      Decrypted Plaintext Verified
                    </span>
                  </div>
                  <div className="p-3 rounded-lg bg-black/60 border border-emerald-500/30 text-xs font-mono text-white select-all">
                    {decryptedPlaintext}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 bg-neutral-950 border-t border-neutral-800 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            Close
          </button>
          {activeTab === 'encrypt' && (
            <button
              type="button"
              onClick={handleSendToChat}
              disabled={!otpResult}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-neutral-950 bg-amber-400 hover:bg-amber-300 disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-amber-950/40 flex items-center gap-1.5 transition-all"
            >
              <Send className="w-3.5 h-3.5" />
              Dispatch OTP Capsule to Chat
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
