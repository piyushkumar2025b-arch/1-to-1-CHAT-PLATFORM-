import React, { useState, useEffect } from 'react';
import {
  X,
  Eye,
  EyeOff,
  Copy,
  Check,
  Send,
  Sparkles,
  Shield,
  Search,
  FileText,
  Lock,
  HelpCircle,
} from 'lucide-react';
import {
  embedSteganography,
  extractSteganography,
  hasSteganography,
  sanitizeZeroWidth,
} from '../lib/steganography';

interface SteganographyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertToChat?: (text: string) => void;
  initialText?: string;
  accentColor?: string;
}

export const SteganographyModal: React.FC<SteganographyModalProps> = ({
  isOpen,
  onClose,
  onInsertToChat,
  initialText = '',
  accentColor = '#f59e0b',
}) => {
  const [tab, setTab] = useState<'embed' | 'extract'>('embed');

  // Embed Tab State
  const [coverText, setCoverText] = useState('Hey, just following up on our project plans for this week.');
  const [secretText, setSecretText] = useState('');
  const [embeddedResult, setEmbeddedResult] = useState('');

  // Extract Tab State
  const [inputTextToExtract, setInputTextToExtract] = useState('');
  const [extractedSecret, setExtractedSecret] = useState<string | null>(null);
  const [cleanVisibleText, setCleanVisibleText] = useState('');

  const [copied, setCopied] = useState(false);

  // If initial text is passed and has stego, automatically switch to extract tab
  useEffect(() => {
    if (isOpen && initialText) {
      if (hasSteganography(initialText)) {
        setTab('extract');
        setInputTextToExtract(initialText);
        const secret = extractSteganography(initialText);
        setExtractedSecret(secret);
        setCleanVisibleText(sanitizeZeroWidth(initialText));
      } else {
        setCoverText(initialText);
      }
    }
  }, [isOpen, initialText]);

  // Compute embed automatically when inputs change
  useEffect(() => {
    if (!secretText.trim()) {
      setEmbeddedResult(coverText);
      return;
    }
    const result = embedSteganography(coverText, secretText.trim());
    setEmbeddedResult(result);
  }, [coverText, secretText]);

  const handleExtract = () => {
    if (!inputTextToExtract.trim()) {
      setExtractedSecret(null);
      setCleanVisibleText('');
      return;
    }
    const secret = extractSteganography(inputTextToExtract);
    setExtractedSecret(secret);
    setCleanVisibleText(sanitizeZeroWidth(inputTextToExtract));
  };

  const handleCopy = (text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleInsert = (text: string) => {
    if (onInsertToChat && text) {
      onInsertToChat(text);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      id="steganography-modal"
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
              <EyeOff className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-white">Steganography Concealer</h2>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-300">
                  Zero-Width Ink
                </span>
              </div>
              <p className="text-[11px] text-neutral-400">
                Hide invisible secrets inside ordinary, innocent messages
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1 text-neutral-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="p-3 bg-neutral-950/50 border-b border-neutral-800 flex gap-2">
          <button
            type="button"
            onClick={() => setTab('embed')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-2 ${
              tab === 'embed'
                ? 'bg-neutral-800 text-white shadow-xs'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Hide Secret (Embed)</span>
          </button>
          <button
            type="button"
            onClick={() => setTab('extract')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-2 ${
              tab === 'extract'
                ? 'bg-neutral-800 text-white shadow-xs'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            <span>Reveal Secret (Extract)</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {tab === 'embed' ? (
            <>
              {/* Cover text */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-neutral-300 flex items-center justify-between">
                  <span>Cover Message (Visible to everyone)</span>
                  <span className="text-[10px] text-neutral-500">Normal conversational text</span>
                </label>
                <textarea
                  rows={2}
                  value={coverText}
                  onChange={(e) => setCoverText(e.target.value)}
                  placeholder="Type an innocuous message like: 'Great seeing you today!'"
                  className="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-neutral-100 text-xs focus:outline-none focus:border-amber-500 resize-none font-sans"
                />
              </div>

              {/* Secret text */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-neutral-300 flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-amber-400">
                    <Lock className="w-3.5 h-3.5" />
                    <span>Secret Payload (Hidden Invisibly)</span>
                  </span>
                  <span className="text-[10px] text-neutral-500">Only decodable by recipient</span>
                </label>
                <textarea
                  rows={3}
                  value={secretText}
                  onChange={(e) => setSecretText(e.target.value)}
                  placeholder="Enter the secret (passwords, bitcoin addresses, coordinates, confidential notes)..."
                  className="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-neutral-100 text-xs font-mono focus:outline-none focus:border-amber-500 resize-none"
                />
              </div>

              {/* Preview Box */}
              <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 space-y-2">
                <div className="flex items-center justify-between text-[11px] text-neutral-400">
                  <span className="font-mono flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5 text-emerald-400" />
                    <span>How it looks to onlookers:</span>
                  </span>
                  {secretText.trim() && (
                    <span className="text-[10px] text-amber-300 font-mono">
                      ✨ {secretText.length * 8} invisible bits embedded
                    </span>
                  )}
                </div>

                <div className="p-3 rounded-lg bg-neutral-900 border border-neutral-800 text-xs text-neutral-200 select-text leading-relaxed">
                  {coverText}
                </div>

                <p className="text-[10px] text-neutral-500 italic">
                  To any bystander, this looks like pure plain text. The recipient can click &quot;Extract&quot; or the in-chat inspector badge to reveal the payload.
                </p>
              </div>

              {/* Buttons */}
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => handleCopy(embeddedResult)}
                  className="flex-1 py-2.5 rounded-xl font-semibold text-xs text-neutral-200 bg-neutral-800 hover:bg-neutral-700 transition-all cursor-pointer flex items-center justify-center gap-2 border border-neutral-700"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  <span>{copied ? 'Copied with Secret!' : 'Copy Stego Message'}</span>
                </button>

                {onInsertToChat && (
                  <button
                    type="button"
                    onClick={() => handleInsert(embeddedResult)}
                    className="flex-1 py-2.5 rounded-xl font-semibold text-xs text-neutral-950 transition-all cursor-pointer shadow-md flex items-center justify-center gap-2"
                    style={{ backgroundColor: accentColor }}
                  >
                    <Send className="w-4 h-4" />
                    <span>Insert to Chat</span>
                  </button>
                )}
              </div>
            </>
          ) : (
            <>
              {/* Extract Tab */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-neutral-300 flex items-center justify-between">
                  <span>Suspect Message (Paste to scan)</span>
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        const clip = await navigator.clipboard.readText();
                        if (clip) {
                          setInputTextToExtract(clip);
                          const s = extractSteganography(clip);
                          setExtractedSecret(s);
                          setCleanVisibleText(sanitizeZeroWidth(clip));
                        }
                      } catch {
                        // clipboard read not permitted
                      }
                    }}
                    className="text-[11px] text-cyan-400 hover:underline cursor-pointer"
                  >
                    Paste from Clipboard
                  </button>
                </label>
                <textarea
                  rows={3}
                  value={inputTextToExtract}
                  onChange={(e) => {
                    setInputTextToExtract(e.target.value);
                    const s = extractSteganography(e.target.value);
                    setExtractedSecret(s);
                    setCleanVisibleText(sanitizeZeroWidth(e.target.value));
                  }}
                  placeholder="Paste text here to detect hidden zero-width steganographic payloads..."
                  className="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-neutral-100 text-xs font-sans focus:outline-none focus:border-cyan-500 resize-none"
                />
              </div>

              {/* Extraction result */}
              {extractedSecret ? (
                <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/40 space-y-2.5 animate-in fade-in zoom-in-95">
                  <div className="flex items-center justify-between text-xs font-bold text-emerald-400">
                    <span className="flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4" />
                      <span>Hidden Secret Found & Extracted!</span>
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                      SUCCESS
                    </span>
                  </div>

                  <div className="p-3 rounded-lg bg-neutral-900 border border-emerald-500/30 text-emerald-200 text-xs font-mono break-all select-text whitespace-pre-wrap leading-relaxed">
                    {extractedSecret}
                  </div>

                  <div className="flex items-center justify-between pt-1 text-xs">
                    <button
                      type="button"
                      onClick={() => handleCopy(extractedSecret)}
                      className="flex items-center gap-1.5 text-emerald-400 hover:text-emerald-300 font-semibold cursor-pointer"
                    >
                      {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copied ? 'Secret Copied' : 'Copy Secret'}</span>
                    </button>

                    {onInsertToChat && (
                      <button
                        type="button"
                        onClick={() => handleInsert(extractedSecret)}
                        className="flex items-center gap-1.5 text-amber-400 hover:text-amber-300 font-semibold cursor-pointer"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Insert Secret to Chat</span>
                      </button>
                    )}
                  </div>
                </div>
              ) : inputTextToExtract.trim() ? (
                <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 text-center space-y-1">
                  <p className="text-xs text-neutral-400">
                    No zero-width steganographic characters detected in this message.
                  </p>
                  <p className="text-[10px] text-neutral-500">
                    This message appears to be standard plain text.
                  </p>
                </div>
              ) : null}
            </>
          )}
        </div>

        {/* Footer info */}
        <div className="px-5 py-3 border-t border-neutral-800 bg-neutral-950/60 flex items-center justify-between text-[11px] text-neutral-400 shrink-0">
          <span className="flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-cyan-400" />
            <span>Zero-Width Unicode Encoding (Invisible Ink)</span>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
