import React, { useState, useEffect } from 'react';
import {
  X,
  KeyRound,
  ShieldCheck,
  Split,
  Layers,
  Copy,
  Check,
  Send,
  Download,
  AlertCircle,
  Eye,
  EyeOff,
  RefreshCw,
  Plus,
  Trash2,
  Lock,
  Unlock,
} from 'lucide-react';
import {
  splitSecret,
  reconstructSecret,
  encodeShareToString,
  parseShareFromString,
  ShamirShare,
} from '../lib/shamir-secret';

interface ShamirSecretModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSendShareToChat?: (shareString: string) => void;
  initialShareToReconstruct?: string;
  accentColor?: string;
}

export const ShamirSecretModal: React.FC<ShamirSecretModalProps> = ({
  isOpen,
  onClose,
  onSendShareToChat,
  initialShareToReconstruct = '',
  accentColor = '#f59e0b',
}) => {
  const [activeTab, setActiveTab] = useState<'split' | 'reconstruct'>('split');

  // Split tab state
  const [secretToSplit, setSecretToSplit] = useState('');
  const [shareLabel, setShareLabel] = useState('Master Security Key');
  const [totalShares, setTotalShares] = useState(3);
  const [threshold, setThreshold] = useState(2);
  const [generatedShares, setGeneratedShares] = useState<{
    share: ShamirShare;
    tokenString: string;
    copied: boolean;
  }[]>([]);
  const [splitError, setSplitError] = useState<string | null>(null);

  // Reconstruct tab state
  const [shareInputText, setShareInputText] = useState('');
  const [addedShareTokens, setAddedShareTokens] = useState<string[]>([]);
  const [reconstructedSecret, setReconstructedSecret] = useState<string | null>(null);
  const [reconstructError, setReconstructError] = useState<string | null>(null);
  const [secretRevealed, setSecretRevealed] = useState(true);
  const [reconstructedCopied, setReconstructedCopied] = useState(false);

  // If initialShareToReconstruct provided, switch to reconstruct tab and add it
  useEffect(() => {
    if (initialShareToReconstruct) {
      setActiveTab('reconstruct');
      if (!addedShareTokens.includes(initialShareToReconstruct)) {
        setAddedShareTokens((prev) => [...prev, initialShareToReconstruct]);
      }
    }
  }, [initialShareToReconstruct]);

  // Adjust threshold if total shares drops below it
  useEffect(() => {
    if (threshold > totalShares) {
      setThreshold(totalShares);
    }
  }, [totalShares]);

  if (!isOpen) return null;

  const handleGenerateShares = () => {
    setSplitError(null);
    if (!secretToSplit.trim()) {
      setSplitError('Please enter a secret string to split.');
      return;
    }

    try {
      const shares = splitSecret(secretToSplit.trim(), totalShares, threshold);
      const encodedList = shares.map((s) => ({
        share: s,
        tokenString: encodeShareToString(s, threshold, totalShares, shareLabel.trim()),
        copied: false,
      }));
      setGeneratedShares(encodedList);
    } catch (err: any) {
      setSplitError(err?.message || 'Failed to split secret');
    }
  };

  const handleCopyShare = (idx: number, token: string) => {
    navigator.clipboard.writeText(token).then(() => {
      setGeneratedShares((prev) =>
        prev.map((item, i) => (i === idx ? { ...item, copied: true } : item))
      );
      setTimeout(() => {
        setGeneratedShares((prev) =>
          prev.map((item, i) => (i === idx ? { ...item, copied: false } : item))
        );
      }, 2000);
    });
  };

  const handleDownloadAllShares = () => {
    if (generatedShares.length === 0) return;
    const report = {
      label: shareLabel,
      totalShares,
      threshold,
      createdAt: new Date().toISOString(),
      shares: generatedShares.map((item) => ({
        index: item.share.x,
        token: item.tokenString,
      })),
      instructions: `This secret was split using Shamir's Secret Sharing over GF(256). Any ${threshold} out of ${totalShares} shares are required to reconstruct the original secret.`,
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `shamir-shares-${shareLabel.replace(/\s+/g, '-').toLowerCase() || 'secret'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Reconstruct workflow
  const handleAddShareFromInput = () => {
    setReconstructError(null);
    const raw = shareInputText.trim();
    if (!raw) return;

    // Could be one or multiple shares pasted (e.g. separated by newlines)
    const matches = raw.match(/SHAMIR_SHARE::[^\s]+/g);
    if (!matches || matches.length === 0) {
      setReconstructError('No valid SHAMIR_SHARE tokens detected in the input.');
      return;
    }

    const uniqueNew: string[] = [];
    matches.forEach((token) => {
      const parsed = parseShareFromString(token);
      if (parsed && !addedShareTokens.includes(token) && !uniqueNew.includes(token)) {
        uniqueNew.push(token);
      }
    });

    if (uniqueNew.length === 0) {
      setReconstructError('Token(s) already added or invalid.');
      return;
    }

    setAddedShareTokens((prev) => [...prev, ...uniqueNew]);
    setShareInputText('');
  };

  const handleRemoveShare = (token: string) => {
    setAddedShareTokens((prev) => prev.filter((t) => t !== token));
    setReconstructedSecret(null);
  };

  // Check if we can reconstruct
  const parsedAddedShares = addedShareTokens
    .map((t) => parseShareFromString(t))
    .filter((p): p is NonNullable<typeof p> => p !== null);

  // Group by first share's threshold or label
  const primaryParsed = parsedAddedShares[0];
  const requiredThreshold = primaryParsed?.threshold || 2;
  const currentCount = parsedAddedShares.length;

  const handlePerformReconstruction = () => {
    setReconstructError(null);
    if (parsedAddedShares.length < requiredThreshold) {
      setReconstructError(`Need at least ${requiredThreshold} shares to reconstruct. Currently have ${parsedAddedShares.length}.`);
      return;
    }

    try {
      // Pick unique x shares
      const uniqueByX = new Map<number, ShamirShare>();
      for (const p of parsedAddedShares) {
        if (!uniqueByX.has(p.share.x)) {
          uniqueByX.set(p.share.x, p.share);
        }
      }

      if (uniqueByX.size < requiredThreshold) {
        setReconstructError('Duplicate share indices detected. You need unique share indices.');
        return;
      }

      const sharesToUse = Array.from(uniqueByX.values()).slice(0, requiredThreshold);
      const secret = reconstructSecret(sharesToUse);
      setReconstructedSecret(secret);
    } catch (err: any) {
      setReconstructError(err?.message || 'Failed to reconstruct secret.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-2xl rounded-3xl bg-neutral-950 border border-amber-500/30 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-neutral-900/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-inner">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Shamir's Secret Sharing
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono border border-amber-500/30">
                  GF(256)
                </span>
              </h2>
              <p className="text-xs text-neutral-400">
                Split master secrets into threshold shares or reconstruct with Lagrange polynomials
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-neutral-800 bg-black/40 px-6 pt-3 gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('split')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-semibold transition-all cursor-pointer border-b-2 ${
              activeTab === 'split'
                ? 'border-amber-400 text-amber-300 bg-neutral-900/80'
                : 'border-transparent text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900/40'
            }`}
          >
            <Split className="w-4 h-4" />
            <span>Split Secret into Shares</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('reconstruct')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-semibold transition-all cursor-pointer border-b-2 ${
              activeTab === 'reconstruct'
                ? 'border-amber-400 text-amber-300 bg-neutral-900/80'
                : 'border-transparent text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900/40'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Reconstruct Secret</span>
            {addedShareTokens.length > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full bg-amber-500/30 text-amber-300 text-[10px] font-mono">
                {addedShareTokens.length}
              </span>
            )}
          </button>
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar">
          {activeTab === 'split' ? (
            <div className="space-y-5">
              {/* Secret Input */}
              <div>
                <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-2">
                  Master Secret / Passphrase / Key
                </label>
                <textarea
                  value={secretToSplit}
                  onChange={(e) => setSecretToSplit(e.target.value)}
                  placeholder="Paste your sensitive password, seed phrase, private key, or confidential message..."
                  rows={3}
                  className="w-full px-4 py-3 rounded-2xl bg-neutral-900/90 border border-neutral-700 text-white placeholder-neutral-500 text-xs font-mono focus:outline-none focus:border-amber-400/80 transition-all resize-none shadow-inner"
                />
              </div>

              {/* Label & Share Config */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-neutral-400 mb-1.5">
                    Identifier / Label
                  </label>
                  <input
                    type="text"
                    value={shareLabel}
                    onChange={(e) => setShareLabel(e.target.value)}
                    placeholder="e.g. Master Backup Key"
                    className="w-full px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-700 text-white text-xs focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-400 mb-1.5 flex justify-between">
                    <span>Total Shares (N)</span>
                    <span className="text-amber-300 font-bold font-mono">{totalShares}</span>
                  </label>
                  <input
                    type="range"
                    min="2"
                    max="10"
                    value={totalShares}
                    onChange={(e) => setTotalShares(parseInt(e.target.value, 10))}
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-neutral-500 mt-1 font-mono">
                    <span>2 shares</span>
                    <span>10 shares</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-400 mb-1.5 flex justify-between">
                    <span>Threshold (K)</span>
                    <span className="text-amber-300 font-bold font-mono">
                      {threshold} of {totalShares}
                    </span>
                  </label>
                  <input
                    type="range"
                    min="2"
                    max={totalShares}
                    value={threshold}
                    onChange={(e) => setThreshold(parseInt(e.target.value, 10))}
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-neutral-500 mt-1 font-mono">
                    <span>min 2</span>
                    <span>max {totalShares}</span>
                  </div>
                </div>
              </div>

              {/* Info banner */}
              <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-2.5 text-xs text-amber-200/90 leading-relaxed">
                <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <p>
                  <strong>Information-Theoretic Security:</strong> Any group of{' '}
                  <span className="text-white font-bold">{threshold} or more</span> shares can
                  recover the secret. Any group of fewer than {threshold} shares possesses zero
                  mathematical knowledge of the secret.
                </p>
              </div>

              {splitError && (
                <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{splitError}</span>
                </div>
              )}

              {/* Action Button */}
              <button
                type="button"
                onClick={handleGenerateShares}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition-all active:scale-[0.99] cursor-pointer"
              >
                <Split className="w-4 h-4" />
                <span>Split Secret into {totalShares} Shares (Threshold: {threshold})</span>
              </button>

              {/* Generated Shares Output */}
              {generatedShares.length > 0 && (
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                      Generated Shares ({generatedShares.length})
                    </h3>
                    <button
                      type="button"
                      onClick={handleDownloadAllShares}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-medium cursor-pointer transition-all"
                    >
                      <Download className="w-3.5 h-3.5 text-amber-400" />
                      <span>Export All (JSON)</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 gap-2.5">
                    {generatedShares.map((item, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 rounded-2xl bg-neutral-900 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-amber-500/40 transition-colors"
                      >
                        <div className="flex items-center gap-2.5 overflow-hidden">
                          <span className="w-7 h-7 rounded-xl bg-amber-500/20 text-amber-300 font-bold font-mono text-xs flex items-center justify-center shrink-0 border border-amber-500/30">
                            #{item.share.x}
                          </span>
                          <div className="overflow-hidden">
                            <span className="text-xs font-semibold text-white block truncate">
                              Share #{item.share.x} of {totalShares}
                            </span>
                            <span className="text-[10px] text-neutral-400 font-mono truncate block max-w-sm">
                              {item.tokenString.substring(0, 42)}...
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleCopyShare(idx, item.tokenString)}
                            className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-medium flex items-center gap-1 cursor-pointer transition-all active:scale-95"
                          >
                            {item.copied ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                                <span className="text-emerald-300">Copied</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5 text-neutral-400" />
                                <span>Copy</span>
                              </>
                            )}
                          </button>

                          {onSendShareToChat && (
                            <button
                              type="button"
                              onClick={() => onSendShareToChat(item.tokenString)}
                              className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-xs font-medium flex items-center gap-1 cursor-pointer transition-all active:scale-95"
                              title="Send this specific share to chat"
                            >
                              <Send className="w-3.5 h-3.5" />
                              <span>Send to Chat</span>
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-5">
              {/* Reconstruct input */}
              <div>
                <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-2">
                  Paste Share Token(s)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={shareInputText}
                    onChange={(e) => setShareInputText(e.target.value)}
                    placeholder="Paste SHAMIR_SHARE::... token string"
                    className="flex-1 px-4 py-2.5 rounded-xl bg-neutral-900 border border-neutral-700 text-white text-xs font-mono focus:outline-none focus:border-amber-400"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddShareFromInput();
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleAddShareFromInput}
                    className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-all shrink-0"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Share</span>
                  </button>
                </div>
              </div>

              {/* Status & Progress */}
              <div className="p-4 rounded-2xl bg-neutral-900/80 border border-white/10 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-neutral-400 font-medium">Reconstruction Progress:</span>
                  <span className="font-mono font-bold text-amber-300">
                    {currentCount} of {requiredThreshold} shares entered
                  </span>
                </div>

                <div className="w-full h-2.5 bg-neutral-800 rounded-full overflow-hidden p-0.5 border border-white/5">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      currentCount >= requiredThreshold
                        ? 'bg-gradient-to-r from-emerald-500 to-emerald-400'
                        : 'bg-gradient-to-r from-amber-500 to-amber-400'
                    }`}
                    style={{
                      width: `${Math.min(100, (currentCount / requiredThreshold) * 100)}%`,
                    }}
                  />
                </div>

                {primaryParsed && (
                  <p className="text-[11px] text-neutral-400">
                    Key Label: <strong className="text-neutral-200">{primaryParsed.label}</strong> (
                    Requires any {primaryParsed.threshold} of {primaryParsed.total} total shares)
                  </p>
                )}
              </div>

              {/* List of currently added shares */}
              {addedShareTokens.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-neutral-300 uppercase tracking-wider">
                      Collected Shares ({addedShareTokens.length})
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setAddedShareTokens([]);
                        setReconstructedSecret(null);
                      }}
                      className="text-[11px] text-neutral-500 hover:text-rose-400 transition-colors cursor-pointer"
                    >
                      Clear All
                    </button>
                  </div>

                  <div className="space-y-2">
                    {addedShareTokens.map((token, i) => {
                      const parsed = parseShareFromString(token);
                      return (
                        <div
                          key={i}
                          className="px-3 py-2 rounded-xl bg-neutral-900/90 border border-neutral-800 flex items-center justify-between gap-2"
                        >
                          <div className="flex items-center gap-2 overflow-hidden">
                            <span className="w-5 h-5 rounded-lg bg-amber-500/20 text-amber-300 font-bold font-mono text-[10px] flex items-center justify-center shrink-0">
                              #{parsed?.share.x ?? '?'}
                            </span>
                            <span className="text-xs text-neutral-300 font-mono truncate max-w-sm">
                              {token}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveShare(token)}
                            className="p-1 rounded-lg text-neutral-500 hover:text-rose-400 hover:bg-neutral-800 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {reconstructError && (
                <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{reconstructError}</span>
                </div>
              )}

              {/* Reconstruct Button */}
              <button
                type="button"
                onClick={handlePerformReconstruction}
                disabled={currentCount < requiredThreshold}
                className={`w-full py-3 rounded-2xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition-all active:scale-[0.99] cursor-pointer ${
                  currentCount >= requiredThreshold
                    ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-black hover:from-emerald-400 hover:to-emerald-500'
                    : 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
                }`}
              >
                <Unlock className="w-4 h-4" />
                <span>Reconstruct Secret via Lagrange Interpolation</span>
              </button>

              {/* Reconstructed Secret Result */}
              {reconstructedSecret !== null && (
                <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 shadow-xl space-y-3 animate-fadeIn">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5 text-emerald-400" />
                      <span className="text-xs font-bold uppercase tracking-wider text-emerald-300">
                        Secret Reconstructed Successfully
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setSecretRevealed((prev) => !prev)}
                        className="p-1.5 rounded-lg text-neutral-400 hover:text-white transition-colors cursor-pointer"
                        title={secretRevealed ? 'Mask secret' : 'Reveal secret'}
                      >
                        {secretRevealed ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(reconstructedSecret).then(() => {
                            setReconstructedCopied(true);
                            setTimeout(() => setReconstructedCopied(false), 2000);
                          });
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/15 text-white text-xs cursor-pointer transition-all"
                      >
                        {reconstructedCopied ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-emerald-300">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-black/70 border border-emerald-500/20 font-mono text-sm text-emerald-200 select-all break-all whitespace-pre-wrap">
                    {secretRevealed
                      ? reconstructedSecret
                      : '•'.repeat(Math.min(48, reconstructedSecret.length || 16))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
