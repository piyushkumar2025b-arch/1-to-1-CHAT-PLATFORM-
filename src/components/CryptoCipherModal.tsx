import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Lock,
  Unlock,
  KeyRound,
  Hash,
  Binary,
  Radio,
  Copy,
  Check,
  Send,
  Volume2,
  VolumeX,
  Sparkles,
  ShieldCheck,
  RefreshCw,
  Sliders,
} from 'lucide-react';
import {
  generateSha256,
  generateSha512,
  encryptAesGcm,
  decryptAesGcm,
  caesarCipher,
  textToBinary,
  binaryToText,
  textToMorse,
  morseToText,
  playMorseAudio,
} from '../lib/cipher-utils';

interface CryptoCipherModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertToChat?: (text: string) => void;
  accentColor?: string;
  initialText?: string;
}

type TabType = 'aes' | 'hash' | 'ciphers';

export const CryptoCipherModal: React.FC<CryptoCipherModalProps> = ({
  isOpen,
  onClose,
  onInsertToChat,
  accentColor = '#f59e0b',
  initialText = '',
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('aes');

  // AES tab states
  const [aesMode, setAesMode] = useState<'encrypt' | 'decrypt'>('encrypt');
  const [aesPlaintext, setAesPlaintext] = useState(initialText);
  const [aesPassword, setAesPassword] = useState('');
  const [aesResult, setAesResult] = useState('');
  const [aesError, setAesError] = useState<string | null>(null);
  const [aesLoading, setAesLoading] = useState(false);

  // Hash tab states
  const [hashInput, setHashInput] = useState(initialText || 'Confidential cryptographic message');
  const [sha256Hash, setSha256Hash] = useState('');
  const [sha512Hash, setSha512Hash] = useState('');

  // Classic Ciphers states
  const [cipherType, setCipherType] = useState<'caesar' | 'binary' | 'morse'>('caesar');
  const [cipherInput, setCipherInput] = useState(initialText || 'Hello World');
  const [caesarShift, setCaesarShift] = useState(13);
  const [cipherOutput, setCipherOutput] = useState('');
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const stopAudioRef = useRef<(() => void) | null>(null);

  // Copied feedback states
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  useEffect(() => {
    if (initialText) {
      setAesPlaintext(initialText);
      setHashInput(initialText);
      setCipherInput(initialText);
    }
  }, [initialText, isOpen]);

  // Compute Hashes
  useEffect(() => {
    let isSubscribed = true;
    if (hashInput) {
      generateSha256(hashInput).then((h) => {
        if (isSubscribed) setSha256Hash(h);
      });
      generateSha512(hashInput).then((h) => {
        if (isSubscribed) setSha512Hash(h);
      });
    } else {
      setSha256Hash('');
      setSha512Hash('');
    }
    return () => {
      isSubscribed = false;
    };
  }, [hashInput]);

  // Compute Classic Ciphers
  useEffect(() => {
    if (cipherType === 'caesar') {
      setCipherOutput(caesarCipher(cipherInput, caesarShift));
    } else if (cipherType === 'binary') {
      setCipherOutput(textToBinary(cipherInput));
    } else if (cipherType === 'morse') {
      setCipherOutput(textToMorse(cipherInput));
    }
  }, [cipherType, cipherInput, caesarShift]);

  // Handle AES Action
  const handleAesAction = async () => {
    setAesError(null);
    if (!aesPassword.trim()) {
      setAesError('Please enter a secret key / passphrase');
      return;
    }

    setAesLoading(true);
    try {
      if (aesMode === 'encrypt') {
        if (!aesPlaintext.trim()) {
          setAesError('Please enter text to encrypt');
          setAesLoading(false);
          return;
        }
        const res = await encryptAesGcm(aesPlaintext, aesPassword);
        setAesResult(res.payload);
      } else {
        if (!aesPlaintext.trim()) {
          setAesError('Please enter an encrypted payload (starting with CIPHER_AES::)');
          setAesLoading(false);
          return;
        }
        const res = await decryptAesGcm(aesPlaintext, aesPassword);
        setAesResult(res);
      }
    } catch (err: any) {
      setAesError(
        aesMode === 'decrypt'
          ? 'Decryption failed: Incorrect password or invalid cipher data'
          : err.message || 'Encryption failed'
      );
    } finally {
      setAesLoading(false);
    }
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    });
  };

  const handleInsert = (text: string) => {
    if (onInsertToChat && text) {
      onInsertToChat(text);
      onClose();
    }
  };

  const toggleMorseAudio = () => {
    if (isPlayingAudio) {
      if (stopAudioRef.current) stopAudioRef.current();
      setIsPlayingAudio(false);
    } else {
      setIsPlayingAudio(true);
      const stop = playMorseAudio(cipherOutput, () => {
        setIsPlayingAudio(false);
      });
      stopAudioRef.current = stop;
    }
  };

  useEffect(() => {
    return () => {
      if (stopAudioRef.current) stopAudioRef.current();
    };
  }, []);

  if (!isOpen) return null;

  return (
    <div
      id="crypto-cipher-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150 select-none"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
        style={{ borderColor: `${accentColor}35` }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-950/70 shrink-0">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center border shadow-sm"
              style={{
                backgroundColor: `${accentColor}20`,
                borderColor: `${accentColor}40`,
                color: accentColor,
              }}
            >
              <KeyRound className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-white">Cryptographic & Cipher Toolkit</h2>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-300">
                  WebCrypto 256-bit
                </span>
              </div>
              <p className="text-[11px] text-neutral-400">
                AES-GCM Password Lock, SHA Digests & Classic Cypherpunk Ciphers
              </p>
            </div>
          </div>

          <button
            type="button"
            id="crypto-cipher-close-btn"
            onClick={onClose}
            className="p-1 text-neutral-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-neutral-800 bg-neutral-950/40 p-1.5 gap-1 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('aes')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
              activeTab === 'aes'
                ? 'bg-neutral-800 text-white font-semibold shadow-xs border border-neutral-700/60'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-850'
            }`}
          >
            <Lock className="w-3.5 h-3.5 text-amber-400" />
            <span>AES-GCM Lock</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('hash')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
              activeTab === 'hash'
                ? 'bg-neutral-800 text-white font-semibold shadow-xs border border-neutral-700/60'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-850'
            }`}
          >
            <Hash className="w-3.5 h-3.5 text-cyan-400" />
            <span>SHA Hash Digests</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('ciphers')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
              activeTab === 'ciphers'
                ? 'bg-neutral-800 text-white font-semibold shadow-xs border border-neutral-700/60'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-850'
            }`}
          >
            <Binary className="w-3.5 h-3.5 text-emerald-400" />
            <span>Ciphers & Morse</span>
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {/* TAB 1: AES-GCM ENCRYPT / DECRYPT */}
          {activeTab === 'aes' && (
            <div className="space-y-4">
              {/* Mode Toggle */}
              <div className="flex rounded-xl bg-neutral-950 p-1 border border-neutral-800 max-w-xs">
                <button
                  type="button"
                  onClick={() => {
                    setAesMode('encrypt');
                    setAesResult('');
                    setAesError(null);
                  }}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                    aesMode === 'encrypt'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : 'text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Encrypt</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAesMode('decrypt');
                    setAesResult('');
                    setAesError(null);
                  }}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                    aesMode === 'decrypt'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  <Unlock className="w-3.5 h-3.5" />
                  <span>Decrypt</span>
                </button>
              </div>

              {/* Secret Key / Passphrase */}
              <div>
                <label className="block text-[11px] font-semibold text-neutral-300 mb-1">
                  Secret Passphrase (Known only to you and recipient)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={aesPassword}
                    onChange={(e) => setAesPassword(e.target.value)}
                    placeholder="Enter confidential password..."
                    className="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-neutral-200 placeholder-neutral-500 text-xs font-mono focus:outline-none focus:border-amber-500"
                  />
                  <KeyRound className="w-4 h-4 text-neutral-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              {/* Input Textarea */}
              <div>
                <label className="block text-[11px] font-semibold text-neutral-300 mb-1">
                  {aesMode === 'encrypt' ? 'Message to Encrypt' : 'Encrypted Cipher Payload'}
                </label>
                <textarea
                  value={aesPlaintext}
                  onChange={(e) => setAesPlaintext(e.target.value)}
                  rows={3}
                  placeholder={
                    aesMode === 'encrypt'
                      ? 'Enter confidential text to lock with AES-GCM...'
                      : 'Paste cipher payload (e.g. CIPHER_AES::...)...'
                  }
                  className="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-neutral-200 placeholder-neutral-500 text-xs font-mono focus:outline-none focus:border-amber-500 resize-none"
                />
              </div>

              {/* Action Button */}
              <button
                type="button"
                onClick={handleAesAction}
                disabled={aesLoading || !aesPassword.trim() || !aesPlaintext.trim()}
                className="w-full py-2.5 rounded-xl font-semibold text-xs text-neutral-950 transition-all cursor-pointer shadow-md disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                style={{ backgroundColor: accentColor }}
              >
                {aesMode === 'encrypt' ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                <span>
                  {aesLoading
                    ? 'Computing PBKDF2 Key...'
                    : aesMode === 'encrypt'
                    ? 'Encrypt Message with AES-GCM'
                    : 'Decrypt Payload'}
                </span>
              </button>

              {/* Error Message */}
              {aesError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                  {aesError}
                </div>
              )}

              {/* Result Box */}
              {aesResult && (
                <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 space-y-2 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between text-[11px] text-neutral-400">
                    <span className="font-semibold text-white flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{aesMode === 'encrypt' ? 'Encrypted Payload' : 'Decrypted Plaintext'}</span>
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => copyToClipboard(aesResult, 'aes-result')}
                        className="flex items-center gap-1 text-neutral-300 hover:text-white transition-colors cursor-pointer"
                      >
                        {copiedKey === 'aes-result' ? (
                          <Check className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                        <span>Copy</span>
                      </button>
                      {onInsertToChat && (
                        <button
                          type="button"
                          onClick={() => handleInsert(aesResult)}
                          className="flex items-center gap-1 text-amber-400 hover:text-amber-300 transition-colors cursor-pointer"
                        >
                          <Send className="w-3 h-3" />
                          <span>Insert to Chat</span>
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-neutral-900/90 border border-neutral-800 text-xs font-mono break-all text-neutral-200 select-text max-h-32 overflow-y-auto">
                    {aesResult}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: SHA HASH DIGESTS */}
          {activeTab === 'hash' && (
            <div className="space-y-4">
              <div>
                <label className="block text-[11px] font-semibold text-neutral-300 mb-1">
                  Source Text for Checksum Digest
                </label>
                <textarea
                  value={hashInput}
                  onChange={(e) => setHashInput(e.target.value)}
                  rows={2}
                  placeholder="Enter text to hash..."
                  className="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-neutral-200 placeholder-neutral-500 text-xs font-mono focus:outline-none focus:border-cyan-500 resize-none"
                />
              </div>

              {/* SHA-256 Card */}
              <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 space-y-2">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-cyan-400 font-mono">SHA-256 Digest (256-bit)</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => copyToClipboard(sha256Hash, 'sha256')}
                      className="flex items-center gap-1 text-neutral-400 hover:text-white transition-colors cursor-pointer"
                    >
                      {copiedKey === 'sha256' ? (
                        <Check className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                      <span>Copy</span>
                    </button>
                    {onInsertToChat && (
                      <button
                        type="button"
                        onClick={() => handleInsert(sha256Hash)}
                        className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300 transition-colors cursor-pointer"
                      >
                        <Send className="w-3 h-3" />
                        <span>Insert</span>
                      </button>
                    )}
                  </div>
                </div>
                <div className="p-2.5 rounded-lg bg-neutral-900 border border-neutral-800 text-xs font-mono break-all text-neutral-300 select-text">
                  {sha256Hash || '...'}
                </div>
              </div>

              {/* SHA-512 Card */}
              <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 space-y-2">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-teal-400 font-mono">SHA-512 Digest (512-bit)</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => copyToClipboard(sha512Hash, 'sha512')}
                      className="flex items-center gap-1 text-neutral-400 hover:text-white transition-colors cursor-pointer"
                    >
                      {copiedKey === 'sha512' ? (
                        <Check className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                      <span>Copy</span>
                    </button>
                    {onInsertToChat && (
                      <button
                        type="button"
                        onClick={() => handleInsert(sha512Hash)}
                        className="flex items-center gap-1 text-teal-400 hover:text-teal-300 transition-colors cursor-pointer"
                      >
                        <Send className="w-3 h-3" />
                        <span>Insert</span>
                      </button>
                    )}
                  </div>
                </div>
                <div className="p-2.5 rounded-lg bg-neutral-900 border border-neutral-800 text-[11px] font-mono break-all text-neutral-300 select-text max-h-24 overflow-y-auto">
                  {sha512Hash || '...'}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: CLASSIC CIPHERS & MORSE CODE */}
          {activeTab === 'ciphers' && (
            <div className="space-y-4">
              {/* Sub-selector */}
              <div className="flex rounded-xl bg-neutral-950 p-1 border border-neutral-800">
                <button
                  type="button"
                  onClick={() => setCipherType('caesar')}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                    cipherType === 'caesar'
                      ? 'bg-neutral-800 text-white shadow-xs'
                      : 'text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  Caesar / ROT-N
                </button>
                <button
                  type="button"
                  onClick={() => setCipherType('binary')}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                    cipherType === 'binary'
                      ? 'bg-neutral-800 text-white shadow-xs'
                      : 'text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  Binary (0101)
                </button>
                <button
                  type="button"
                  onClick={() => setCipherType('morse')}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                    cipherType === 'morse'
                      ? 'bg-neutral-800 text-white shadow-xs'
                      : 'text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  Morse Code
                </button>
              </div>

              {/* Input */}
              <div>
                <label className="block text-[11px] font-semibold text-neutral-300 mb-1">
                  Text Input
                </label>
                <input
                  type="text"
                  value={cipherInput}
                  onChange={(e) => setCipherInput(e.target.value)}
                  placeholder="Enter message..."
                  className="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-neutral-200 placeholder-neutral-500 text-xs font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Caesar Shift Slider */}
              {cipherType === 'caesar' && (
                <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 space-y-1.5">
                  <div className="flex items-center justify-between text-xs text-neutral-300">
                    <span className="flex items-center gap-1.5">
                      <Sliders className="w-3.5 h-3.5 text-amber-400" />
                      <span>Shift Offset (ROT-{caesarShift})</span>
                    </span>
                    <span className="font-mono text-amber-400 font-bold">+{caesarShift}</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="25"
                    value={caesarShift}
                    onChange={(e) => setCaesarShift(parseInt(e.target.value))}
                    className="w-full accent-amber-400 cursor-pointer"
                  />
                </div>
              )}

              {/* Output Card */}
              <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 space-y-2">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-emerald-400 font-mono">Encoded Output</span>
                  <div className="flex items-center gap-2">
                    {cipherType === 'morse' && (
                      <button
                        type="button"
                        onClick={toggleMorseAudio}
                        className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                          isPlayingAudio
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                            : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-300'
                        }`}
                        title="Play audio beeps for Morse code"
                      >
                        {isPlayingAudio ? (
                          <VolumeX className="w-3 h-3 text-rose-400 animate-pulse" />
                        ) : (
                          <Volume2 className="w-3 h-3 text-emerald-400" />
                        )}
                        <span>{isPlayingAudio ? 'Stop Audio' : 'Play Beeps'}</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => copyToClipboard(cipherOutput, 'cipher-out')}
                      className="flex items-center gap-1 text-neutral-400 hover:text-white transition-colors cursor-pointer"
                    >
                      {copiedKey === 'cipher-out' ? (
                        <Check className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                      <span>Copy</span>
                    </button>
                    {onInsertToChat && (
                      <button
                        type="button"
                        onClick={() => handleInsert(cipherOutput)}
                        className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer"
                      >
                        <Send className="w-3 h-3" />
                        <span>Insert</span>
                      </button>
                    )}
                  </div>
                </div>
                <div className="p-2.5 rounded-lg bg-neutral-900 border border-neutral-800 text-xs font-mono break-all text-neutral-200 select-text max-h-32 overflow-y-auto">
                  {cipherOutput || '...'}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Note */}
        <div className="px-5 py-3 border-t border-neutral-800 bg-neutral-950/60 flex items-center justify-between text-[11px] text-neutral-400 shrink-0">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>100% Client-Side zero-knowledge computation</span>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
