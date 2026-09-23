import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  KeyRound,
  RefreshCw,
  Copy,
  Check,
  Send,
  ShieldCheck,
  Eye,
  EyeOff,
  Sliders,
  Sparkles,
  Lock,
  Cpu,
  Hash,
} from 'lucide-react';
import {
  PasswordOptions,
  generateSecurePassword,
  analyzeEntropy,
} from '../lib/password-generator';

interface PasswordGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertToChat?: (password: string) => void;
  accentColor?: string;
}

export const PasswordGeneratorModal: React.FC<PasswordGeneratorModalProps> = ({
  isOpen,
  onClose,
  onInsertToChat,
  accentColor = '#f59e0b',
}) => {
  const [options, setOptions] = useState<PasswordOptions>({
    mode: 'password',
    length: 20,
    includeUppercase: true,
    includeLowercase: true,
    includeNumbers: true,
    includeSymbols: true,
    excludeAmbiguous: true,
    separator: '-',
    capitalizeWords: true,
  });

  const [generatedPassword, setGeneratedPassword] = useState('');
  const [copied, setCopied] = useState(false);
  const [showPassword, setShowPassword] = useState(true);

  // Generate on load or option change
  const handleGenerate = () => {
    const pwd = generateSecurePassword(options);
    setGeneratedPassword(pwd);
  };

  useEffect(() => {
    if (isOpen) {
      handleGenerate();
    }
  }, [isOpen, options.mode, options.length, options.includeUppercase, options.includeLowercase, options.includeNumbers, options.includeSymbols, options.excludeAmbiguous, options.separator, options.capitalizeWords]);

  const entropy = useMemo(() => {
    return analyzeEntropy(generatedPassword);
  }, [generatedPassword]);

  const handleCopy = () => {
    if (!generatedPassword) return;
    navigator.clipboard.writeText(generatedPassword).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleInsert = () => {
    if (onInsertToChat && generatedPassword) {
      onInsertToChat(generatedPassword);
      onClose();
    }
  };

  if (!isOpen) return null;

  const strengthColorMap = {
    very_weak: 'bg-rose-500 text-rose-300',
    weak: 'bg-orange-500 text-orange-300',
    moderate: 'bg-amber-500 text-amber-300',
    strong: 'bg-emerald-500 text-emerald-300',
    very_strong: 'bg-purple-500 text-purple-300',
  };

  const strengthLabelMap = {
    very_weak: 'Vulnerable / Weak',
    weak: 'Low Entropy',
    moderate: 'Moderate Protection',
    strong: 'High Security (Recommended)',
    very_strong: 'Military-Grade Quantum Resistant',
  };

  return (
    <div
      id="password-generator-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150 select-none"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
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
                <h2 className="text-sm font-bold text-white">Password & Passphrase Generator</h2>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300">
                  CSPRNG
                </span>
              </div>
              <p className="text-[11px] text-neutral-400">
                Generate high-entropy keys, Diceware phrases & PINs
              </p>
            </div>
          </div>

          <button
            type="button"
            id="password-gen-close-btn"
            onClick={onClose}
            className="p-1 text-neutral-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {/* Mode Selector */}
          <div className="flex rounded-xl bg-neutral-950 p-1 border border-neutral-800">
            <button
              type="button"
              onClick={() => setOptions((prev) => ({ ...prev, mode: 'password', length: 20 }))}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                options.mode === 'password'
                  ? 'bg-neutral-800 text-white shadow-xs'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              Password
            </button>
            <button
              type="button"
              onClick={() => setOptions((prev) => ({ ...prev, mode: 'passphrase', length: 5 }))}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                options.mode === 'passphrase'
                  ? 'bg-neutral-800 text-white shadow-xs'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              Diceware Phrase
            </button>
            <button
              type="button"
              onClick={() => setOptions((prev) => ({ ...prev, mode: 'hex', length: 32 }))}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                options.mode === 'hex'
                  ? 'bg-neutral-800 text-white shadow-xs'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              Hex Token
            </button>
            <button
              type="button"
              onClick={() => setOptions((prev) => ({ ...prev, mode: 'pin', length: 6 }))}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                options.mode === 'pin'
                  ? 'bg-neutral-800 text-white shadow-xs'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              PIN
            </button>
          </div>

          {/* Generated Secret Card */}
          <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-3">
            <div className="flex items-center justify-between text-[11px] text-neutral-400">
              <span className="font-mono text-neutral-400 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-amber-400" />
                <span>Generated Secret</span>
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="p-1 rounded text-neutral-400 hover:text-white transition-colors cursor-pointer"
                  title={showPassword ? 'Hide Secret' : 'Show Secret'}
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
                <button
                  type="button"
                  onClick={handleGenerate}
                  className="p-1 rounded text-neutral-400 hover:text-white hover:rotate-180 transition-all duration-300 cursor-pointer"
                  title="Generate New"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-neutral-900 border border-neutral-800 text-sm font-mono break-all text-neutral-100 select-text flex items-center justify-between min-h-[48px]">
              {showPassword ? (
                <span>{generatedPassword}</span>
              ) : (
                <span className="tracking-widest text-neutral-500">
                  {'•'.repeat(Math.min(32, generatedPassword.length))}
                </span>
              )}
            </div>

            {/* Entropy Meter */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-medium text-neutral-300 flex items-center gap-1.5">
                  <span>Entropy:</span>
                  <span className="font-mono font-bold text-white">{entropy.bits} bits</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded font-medium ${strengthColorMap[entropy.strength]}`}>
                    {strengthLabelMap[entropy.strength]}
                  </span>
                </span>
                <span className="text-[10px] text-neutral-400">
                  Crack time: <strong className="text-neutral-200">{entropy.crackTimeText}</strong>
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-1.5 rounded-full bg-neutral-800 overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    entropy.strength === 'very_weak'
                      ? 'bg-rose-500'
                      : entropy.strength === 'weak'
                      ? 'bg-orange-500'
                      : entropy.strength === 'moderate'
                      ? 'bg-amber-500'
                      : entropy.strength === 'strong'
                      ? 'bg-emerald-500'
                      : 'bg-purple-500'
                  }`}
                  style={{ width: `${Math.min(100, (entropy.bits / 128) * 100)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Configuration Controls */}
          <div className="space-y-3.5 p-4 rounded-xl bg-neutral-950/60 border border-neutral-800">
            {/* Length / Word Count Slider */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs text-neutral-300">
                <span className="flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-neutral-400" />
                  <span>
                    {options.mode === 'passphrase'
                      ? 'Word Count'
                      : options.mode === 'hex'
                      ? 'Bytes (Hex Length)'
                      : options.mode === 'pin'
                      ? 'PIN Digits'
                      : 'Password Length'}
                  </span>
                </span>
                <span className="font-mono font-bold text-amber-400">
                  {options.mode === 'hex'
                    ? `${options.length} bytes (${options.length * 2} chars)`
                    : options.length}
                </span>
              </div>
              <input
                type="range"
                min={
                  options.mode === 'passphrase'
                    ? 3
                    : options.mode === 'hex'
                    ? 8
                    : options.mode === 'pin'
                    ? 4
                    : 8
                }
                max={
                  options.mode === 'passphrase'
                    ? 8
                    : options.mode === 'hex'
                    ? 64
                    : options.mode === 'pin'
                    ? 12
                    : 64
                }
                value={options.length}
                onChange={(e) =>
                  setOptions((prev) => ({ ...prev, length: parseInt(e.target.value) }))
                }
                className="w-full accent-amber-400 cursor-pointer"
              />
            </div>

            {/* Mode-Specific Toggles */}
            {options.mode === 'password' && (
              <div className="grid grid-cols-2 gap-2 pt-1">
                <label className="flex items-center gap-2 text-xs text-neutral-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={options.includeUppercase}
                    onChange={(e) =>
                      setOptions((prev) => ({ ...prev, includeUppercase: e.target.checked }))
                    }
                    className="accent-amber-500 rounded"
                  />
                  <span>Uppercase (A-Z)</span>
                </label>

                <label className="flex items-center gap-2 text-xs text-neutral-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={options.includeLowercase}
                    onChange={(e) =>
                      setOptions((prev) => ({ ...prev, includeLowercase: e.target.checked }))
                    }
                    className="accent-amber-500 rounded"
                  />
                  <span>Lowercase (a-z)</span>
                </label>

                <label className="flex items-center gap-2 text-xs text-neutral-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={options.includeNumbers}
                    onChange={(e) =>
                      setOptions((prev) => ({ ...prev, includeNumbers: e.target.checked }))
                    }
                    className="accent-amber-500 rounded"
                  />
                  <span>Numbers (0-9)</span>
                </label>

                <label className="flex items-center gap-2 text-xs text-neutral-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={options.includeSymbols}
                    onChange={(e) =>
                      setOptions((prev) => ({ ...prev, includeSymbols: e.target.checked }))
                    }
                    className="accent-amber-500 rounded"
                  />
                  <span>Symbols (!@#$%)</span>
                </label>

                <label className="flex items-center gap-2 text-xs text-neutral-300 cursor-pointer col-span-2 pt-1 border-t border-neutral-800">
                  <input
                    type="checkbox"
                    checked={options.excludeAmbiguous}
                    onChange={(e) =>
                      setOptions((prev) => ({ ...prev, excludeAmbiguous: e.target.checked }))
                    }
                    className="accent-amber-500 rounded"
                  />
                  <span>Exclude Ambiguous Characters (0, O, 1, l, I)</span>
                </label>
              </div>
            )}

            {options.mode === 'passphrase' && (
              <div className="space-y-2 pt-1">
                <label className="flex items-center gap-2 text-xs text-neutral-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={options.capitalizeWords}
                    onChange={(e) =>
                      setOptions((prev) => ({ ...prev, capitalizeWords: e.target.checked }))
                    }
                    className="accent-amber-500 rounded"
                  />
                  <span>Capitalize each word</span>
                </label>

                <div className="flex items-center gap-2 text-xs text-neutral-300 pt-1">
                  <span>Separator:</span>
                  {['-', '.', '_', ' '].map((sep) => (
                    <button
                      key={sep}
                      type="button"
                      onClick={() => setOptions((prev) => ({ ...prev, separator: sep }))}
                      className={`px-2.5 py-1 rounded text-xs font-mono font-bold transition-colors cursor-pointer ${
                        options.separator === sep
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : 'bg-neutral-850 hover:bg-neutral-800 text-neutral-400'
                      }`}
                    >
                      {sep === ' ' ? 'Space' : sep}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              id="password-gen-copy-btn"
              onClick={handleCopy}
              className="flex-1 py-2.5 rounded-xl font-semibold text-xs text-neutral-200 bg-neutral-800 hover:bg-neutral-700 transition-all cursor-pointer flex items-center justify-center gap-2 border border-neutral-700"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Copied to Clipboard!' : 'Copy Password'}</span>
            </button>

            {onInsertToChat && (
              <button
                type="button"
                id="password-gen-insert-btn"
                onClick={handleInsert}
                className="flex-1 py-2.5 rounded-xl font-semibold text-xs text-neutral-950 transition-all cursor-pointer shadow-md flex items-center justify-center gap-2"
                style={{ backgroundColor: accentColor }}
              >
                <Send className="w-4 h-4" />
                <span>Insert to Chat</span>
              </button>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-neutral-800 bg-neutral-950/60 flex items-center justify-between text-[11px] text-neutral-400 shrink-0">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Zero-Knowledge: Generated locally in memory</span>
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
