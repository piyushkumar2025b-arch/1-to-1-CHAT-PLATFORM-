import React, { useState, useRef, ChangeEvent } from 'react';
import {
  X,
  FileBadge,
  ShieldCheck,
  UploadCloud,
  Send,
  Sparkles,
  FileText,
  Hash,
} from 'lucide-react';
import { notarizeData, NotaryCertificate } from '../lib/notary-engine';

interface NotaryAttestationModalProps {
  isOpen: boolean;
  onClose: () => void;
  myUserId: string;
  onSendNotarySeal: (payload: string) => void;
  accentColor?: string;
}

export const NotaryAttestationModal: React.FC<NotaryAttestationModalProps> = ({
  isOpen,
  onClose,
  myUserId,
  onSendNotarySeal,
  accentColor = '#f59e0b',
}) => {
  const [mode, setMode] = useState<'text' | 'file'>('text');
  const [title, setTitle] = useState('Confidential Legal Attestation');
  const [statementText, setStatementText] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [notaryCert, setNotaryCert] = useState<NotaryCertificate | null>(null);
  const [isComputing, setIsComputing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const handleComputeNotarization = async () => {
    setIsComputing(true);
    try {
      let cert: NotaryCertificate;
      if (mode === 'text') {
        cert = await notarizeData(statementText, title, myUserId);
      } else {
        if (!selectedFile) return;
        const buffer = await selectedFile.arrayBuffer();
        cert = await notarizeData(buffer, title, myUserId, selectedFile.name);
      }
      setNotaryCert(cert);
    } catch (err) {
      console.error('Notarization computation error:', err);
    } finally {
      setIsComputing(false);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setTitle(file.name);
      setNotaryCert(null);
    }
  };

  const handleSendToChat = () => {
    if (!notaryCert) return;
    const b64Title = btoa(unescape(encodeURIComponent(notaryCert.documentTitle)));
    const b64File = notaryCert.fileName ? btoa(unescape(encodeURIComponent(notaryCert.fileName))) : 'none';

    // NOTARY_SEAL::certId::b64Title::sha256::sha512Prefix::timestamp::signerId::b64File::fileSize
    const payload = `NOTARY_SEAL::${notaryCert.certificateId}::${b64Title}::${notaryCert.sha256}::${notaryCert.sha512Prefix}::${notaryCert.timestamp}::${notaryCert.signerId}::${b64File}::${notaryCert.fileSize || 0}`;

    onSendNotarySeal(payload);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-xl rounded-2xl bg-neutral-925 border border-emerald-500/30 shadow-2xl shadow-emerald-950/30 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-emerald-950/40 via-neutral-900 to-neutral-900 border-b border-emerald-500/20">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <FileBadge className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-wide flex items-center gap-2">
                Cryptographic Notary & Attestation
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono uppercase font-bold tracking-wider">
                  NIST Dual-Digest
                </span>
              </h2>
              <p className="text-xs text-neutral-400">
                Timestamped tamper-evident SHA-256 & SHA-512 enclave notarization
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
            onClick={() => {
              setMode('text');
              setNotaryCert(null);
            }}
            className={`py-3 text-xs font-semibold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              mode === 'text'
                ? 'border-emerald-400 text-emerald-400'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            Notarize Text Statement
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('file');
              setNotaryCert(null);
            }}
            className={`py-3 text-xs font-semibold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              mode === 'file'
                ? 'border-emerald-400 text-emerald-400'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <UploadCloud className="w-3.5 h-3.5" />
            Notarize File / Document
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4 text-sm text-neutral-300">
          <div>
            <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-1">
              Document / Attestation Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-100 text-xs focus:outline-none focus:border-emerald-400"
            />
          </div>

          {mode === 'text' ? (
            <div>
              <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-1">
                Statement Content to Notarize
              </label>
              <textarea
                value={statementText}
                onChange={(e) => {
                  setStatementText(e.target.value);
                  setNotaryCert(null);
                }}
                rows={4}
                placeholder="Type the exact statement, contract excerpt, or forensic report to seal..."
                className="w-full px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-100 text-xs focus:outline-none focus:border-emerald-400 font-mono resize-none leading-relaxed"
              />
            </div>
          ) : (
            <div>
              <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-1">
                Select File to Hash & Seal
              </label>
              <div
                onClick={() => fileInputRef.current?.click()}
                className="p-6 border-2 border-dashed border-neutral-700 hover:border-emerald-500/60 rounded-xl bg-neutral-900/60 text-center cursor-pointer transition-colors"
              >
                <UploadCloud className="w-6 h-6 mx-auto text-emerald-400 mb-2" />
                <div className="text-xs font-semibold text-neutral-200">
                  {selectedFile ? selectedFile.name : 'Click to select document or binary'}
                </div>
                <div className="text-[11px] text-neutral-500 mt-1">
                  {selectedFile
                    ? `${(selectedFile.size / 1024).toFixed(1)} KB`
                    : 'Any format: PDF, images, source code, archives'}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>
            </div>
          )}

          {/* Compute Button if not computed */}
          {!notaryCert && (
            <button
              type="button"
              onClick={handleComputeNotarization}
              disabled={
                isComputing || (mode === 'text' ? !statementText.trim() : !selectedFile)
              }
              className="w-full py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-neutral-200 font-semibold text-xs flex items-center justify-center gap-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <Hash className="w-4 h-4 text-emerald-400" />
              <span>{isComputing ? 'Generating Dual Hashes...' : 'Calculate Cryptographic Attestation'}</span>
            </button>
          )}

          {/* Notary Seal Result */}
          {notaryCert && (
            <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-500/40 space-y-2 text-xs font-mono animate-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between text-emerald-400 font-bold font-sans">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4" />
                  Notary Attestation Certificate Ready
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20">
                  ID: #{notaryCert.certificateId.slice(-8)}
                </span>
              </div>
              <div className="space-y-1 text-[11px] text-neutral-300 bg-black/40 p-2.5 rounded-lg border border-neutral-800">
                <div className="truncate">
                  <span className="text-neutral-500">SHA-256: </span>
                  <span className="text-emerald-300 font-bold">{notaryCert.sha256}</span>
                </div>
                <div className="truncate">
                  <span className="text-neutral-500">SHA-512: </span>
                  <span className="text-neutral-400">{notaryCert.sha512Prefix}</span>
                </div>
                <div>
                  <span className="text-neutral-500">Timestamp: </span>
                  <span>{notaryCert.formattedDate}</span>
                </div>
              </div>
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
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSendToChat}
            disabled={!notaryCert}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-neutral-950 bg-emerald-400 hover:bg-emerald-300 disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-emerald-950/40 flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            Dispatch Seal to Chat Enclave
          </button>
        </div>
      </div>
    </div>
  );
};
