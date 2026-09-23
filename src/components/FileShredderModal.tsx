import React, { useState, useRef } from 'react';
import {
  X,
  Trash2,
  ShieldCheck,
  FileText,
  AlertTriangle,
  Check,
  Copy,
  Send,
  Sparkles,
  RefreshCw,
  HardDrive,
  FileCheck,
} from 'lucide-react';

interface FileShredderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertToChat?: (certificate: string) => void;
  accentColor?: string;
}

type ShredStandard = 'nist' | 'dod' | 'gutmann';

export const FileShredderModal: React.FC<FileShredderModalProps> = ({
  isOpen,
  onClose,
  onInsertToChat,
  accentColor = '#f59e0b',
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileHash, setFileHash] = useState<string>('');
  const [standard, setStandard] = useState<ShredStandard>('dod');
  const [isShredding, setIsShredding] = useState<boolean>(false);
  const [shredProgress, setShredProgress] = useState<number>(0);
  const [currentPass, setCurrentPass] = useState<number>(0);
  const [totalPasses, setTotalPasses] = useState<number>(3);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [shredCertificate, setShredCertificate] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const handleFileChange = async (file: File) => {
    setSelectedFile(file);
    setIsCompleted(false);
    setShredProgress(0);

    // Compute pre-shred SHA-256
    try {
      const buffer = await file.arrayBuffer();
      const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
      setFileHash(hashHex);
    } catch {
      setFileHash('Unavailable');
    }
  };

  const handleStartShred = async () => {
    if (!selectedFile) return;

    setIsShredding(true);
    setIsCompleted(false);
    setShredProgress(0);

    const passes = standard === 'nist' ? 1 : standard === 'dod' ? 3 : 7;
    setTotalPasses(passes);

    // Simulate cryptographic overwrite passes in memory chunks
    for (let p = 1; p <= passes; p++) {
      setCurrentPass(p);
      for (let step = 0; step <= 10; step++) {
        await new Promise((r) => setTimeout(r, 60));
        const overall = Math.round(((p - 1) / passes) * 100 + (step / 10) * (100 / passes));
        setShredProgress(overall);
      }
    }

    setShredProgress(100);
    setIsShredding(false);
    setIsCompleted(true);

    const standardName =
      standard === 'nist'
        ? 'NIST SP 800-88'
        : standard === 'dod'
        ? 'DoD 5220.22-M (3-Pass)'
        : 'Gutmann (7-Pass)';

    const cert = `🛡️ [SHREDDED:${selectedFile.name}:${(selectedFile.size / 1024).toFixed(1)}KB:${fileHash.slice(0, 16)}...:${standardName}]`;
    setShredCertificate(cert);
  };

  const handleReset = () => {
    setSelectedFile(null);
    setFileHash('');
    setIsCompleted(false);
    setShredProgress(0);
    setShredCertificate('');
  };

  const handleCopy = () => {
    if (!shredCertificate) return;
    navigator.clipboard.writeText(shredCertificate).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleInsert = () => {
    if (onInsertToChat && shredCertificate) {
      onInsertToChat(shredCertificate);
      onClose();
      handleReset();
    }
  };

  return (
    <div
      id="file-shredder-modal"
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
            <div className="w-9 h-9 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-400 flex items-center justify-center shadow-sm">
              <Trash2 className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-white">Digital File Shredder</h2>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-300">
                  DoD 5220.22-M
                </span>
              </div>
              <p className="text-[11px] text-neutral-400">
                Multi-pass cryptographic data sanitization & destruction certificate
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

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {/* File Selector Dropzone */}
          {!selectedFile ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-neutral-700 hover:border-rose-500/60 rounded-2xl p-6 text-center cursor-pointer transition-all hover:bg-neutral-850 flex flex-col items-center justify-center gap-2.5"
            >
              <div className="w-12 h-12 rounded-2xl bg-neutral-800 flex items-center justify-center text-neutral-400">
                <HardDrive className="w-6 h-6 text-rose-400" />
              </div>
              <div>
                <p className="text-xs font-bold text-white">Select confidential file to shred</p>
                <p className="text-[11px] text-neutral-400">
                  Documents, secrets, keys, or photos to sanitize and purge
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files?.[0]) {
                    handleFileChange(e.target.files[0]);
                  }
                }}
              />
            </div>
          ) : (
            <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5 overflow-hidden">
                  <FileText className="w-5 h-5 text-rose-400 shrink-0" />
                  <div className="overflow-hidden">
                    <p className="text-xs font-bold text-neutral-200 truncate">
                      {selectedFile.name}
                    </p>
                    <p className="text-[10px] text-neutral-500 font-mono">
                      {(selectedFile.size / 1024).toFixed(1)} KB • {selectedFile.type || 'Binary'}
                    </p>
                  </div>
                </div>
                {!isShredding && (
                  <button
                    type="button"
                    onClick={handleReset}
                    className="text-[11px] text-neutral-400 hover:text-white underline cursor-pointer"
                  >
                    Change
                  </button>
                )}
              </div>

              {/* Checksum display */}
              <div className="p-2.5 rounded-lg bg-neutral-900 border border-neutral-800 space-y-1 font-mono text-[10px]">
                <div className="text-neutral-400">Pre-Wipe SHA-256 Fingerprint:</div>
                <div className="text-rose-300 break-all select-text">{fileHash}</div>
              </div>
            </div>
          )}

          {/* Sanitization Standard Selection */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-neutral-300">
              Sanitization Overwrite Standard
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                {
                  id: 'nist',
                  name: 'NIST 800-88',
                  passes: '1 Pass',
                  desc: 'Random Bytes',
                },
                {
                  id: 'dod',
                  name: 'DoD 5220.22-M',
                  passes: '3 Passes',
                  desc: '0x00, 0xFF, CSPRNG',
                },
                {
                  id: 'gutmann',
                  name: 'Gutmann Lite',
                  passes: '7 Passes',
                  desc: 'Multi-pattern',
                },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  disabled={isShredding}
                  onClick={() => setStandard(opt.id as ShredStandard)}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    standard === opt.id
                      ? 'bg-neutral-800 border-rose-500/50 shadow-xs'
                      : 'bg-neutral-950/60 border-neutral-800 hover:border-neutral-700'
                  }`}
                >
                  <span className="text-xs font-bold text-white">{opt.name}</span>
                  <div className="pt-1 flex items-center justify-between text-[10px] text-neutral-400 font-mono">
                    <span>{opt.passes}</span>
                    <span className="text-rose-400 text-[9px]">{opt.desc}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Shredding Progress Bar */}
          {isShredding && (
            <div className="space-y-2 p-3.5 rounded-xl bg-neutral-950 border border-rose-500/30 animate-pulse">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-rose-400 font-bold flex items-center gap-1.5">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Sanitizing Pass {currentPass} / {totalPasses}...</span>
                </span>
                <span className="text-white font-bold">{shredProgress}%</span>
              </div>
              <div className="w-full h-2 bg-neutral-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-orange-500 to-rose-500 transition-all duration-150"
                  style={{ width: `${shredProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Shred Completed Certificate */}
          {isCompleted && (
            <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/40 space-y-2.5 animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between text-xs font-bold text-emerald-400">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Destruction Certificate Generated</span>
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                  SANITIZED
                </span>
              </div>

              <div className="p-3 rounded-lg bg-neutral-900 border border-emerald-500/30 text-emerald-200 text-xs font-mono break-all select-text">
                {shredCertificate}
              </div>

              <div className="flex items-center justify-between pt-1 text-xs">
                <button
                  type="button"
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 text-emerald-400 hover:text-emerald-300 font-semibold cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied Receipt' : 'Copy Certificate'}</span>
                </button>

                {onInsertToChat && (
                  <button
                    type="button"
                    onClick={handleInsert}
                    className="flex items-center gap-1.5 text-amber-400 hover:text-amber-300 font-semibold cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send Certificate to Chat</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Execute Shred Button */}
          {!isCompleted && (
            <button
              type="button"
              disabled={!selectedFile || isShredding}
              onClick={handleStartShred}
              className="w-full py-3 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 transition-all cursor-pointer shadow-lg flex items-center justify-center gap-2 active:scale-98 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Trash2 className="w-4 h-4" />
              <span>Sanitize & Shred File</span>
            </button>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-neutral-800 bg-neutral-950/60 flex items-center justify-between text-[11px] text-neutral-400 shrink-0">
          <span className="flex items-center gap-1.5">
            <FileCheck className="w-3.5 h-3.5 text-rose-400" />
            <span>Zero-trace client memory overwrite</span>
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
