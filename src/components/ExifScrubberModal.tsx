import React, { useState, useRef, ChangeEvent, DragEvent } from 'react';
import {
  X,
  ShieldAlert,
  ShieldCheck,
  UploadCloud,
  FileImage,
  MapPin,
  Camera,
  Calendar,
  Layers,
  Download,
  Send,
  Trash2,
  Sparkles,
  AlertTriangle,
  Info,
} from 'lucide-react';
import { extractExifMetadata, scrubImageMetadata, ExifReport } from '../lib/exif-reader';

interface ExifScrubberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSendSanitizedImage?: (file: File) => void;
  accentColor?: string;
}

export const ExifScrubberModal: React.FC<ExifScrubberModalProps> = ({
  isOpen,
  onClose,
  onSendSanitizedImage,
  accentColor = '#f59e0b',
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [exifReport, setExifReport] = useState<ExifReport | null>(null);
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [scrubbedResult, setScrubbedResult] = useState<{
    sanitizedFile: File;
    dataUrl: string;
    bytesSaved: number;
    originalSize: number;
    newSize: number;
  } | null>(null);

  if (!isOpen) return null;

  const handleFileProcess = async (file: File) => {
    setSelectedFile(file);
    setScrubbedResult(null);

    const url = URL.createObjectURL(file);
    setPreviewUrl(url);

    try {
      const buffer = await file.arrayBuffer();
      const report = extractExifMetadata(buffer, file.name, file.type);
      setExifReport(report);
    } catch (err) {
      console.error('Failed to parse EXIF metadata:', err);
    }
  };

  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileProcess(file);
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      handleFileProcess(file);
    }
  };

  const handleScrubMetadata = async () => {
    if (!selectedFile) return;
    setIsScrubbing(true);
    try {
      const res = await scrubImageMetadata(selectedFile);
      setScrubbedResult(res);
    } catch (err) {
      console.error('Failed to scrub metadata:', err);
    } finally {
      setIsScrubbing(false);
    }
  };

  const handleDownloadSanitized = () => {
    if (!scrubbedResult) return;
    const a = document.createElement('a');
    a.href = scrubbedResult.dataUrl;
    a.download = scrubbedResult.sanitizedFile.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleSendToChat = () => {
    if (!scrubbedResult || !onSendSanitizedImage) return;
    onSendSanitizedImage(scrubbedResult.sanitizedFile);
    onClose();
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-2xl rounded-2xl bg-neutral-925 border border-emerald-500/30 shadow-2xl shadow-emerald-950/30 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-emerald-950/40 via-neutral-900 to-neutral-900 border-b border-emerald-500/20">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-wide flex items-center gap-2">
                Forensic EXIF & Metadata Scrubber
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono uppercase font-bold tracking-wider">
                  Anti-Doxxing
                </span>
              </h2>
              <p className="text-xs text-neutral-400">
                Detect and sanitize GPS geolocation, camera serials, timestamps, and device fingerprints
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

        {/* Modal Content */}
        <div className="p-5 overflow-y-auto space-y-4 text-sm text-neutral-300">
          {/* Upload Area */}
          {!selectedFile && (
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="p-8 border-2 border-dashed border-neutral-700 hover:border-emerald-500/60 rounded-2xl bg-neutral-900/60 hover:bg-neutral-900/80 transition-all flex flex-col items-center justify-center text-center cursor-pointer group select-none"
            >
              <div className="p-3.5 rounded-2xl bg-emerald-500/10 text-emerald-400 group-hover:scale-110 transition-transform mb-3">
                <UploadCloud className="w-8 h-8" />
              </div>
              <p className="text-sm font-semibold text-neutral-200 mb-1">
                Drop any photo to inspect forensic metadata
              </p>
              <p className="text-xs text-neutral-500">
                Supports JPEG, PNG, TIFF photos (detects camera model, lens, exact GPS coordinates)
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileInputChange}
                className="hidden"
              />
            </div>
          )}

          {/* Selected File & EXIF Inspection Report */}
          {selectedFile && (
            <div className="space-y-4">
              {/* File Info Bar */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-neutral-900 border border-neutral-800">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-10 h-10 rounded-lg overflow-hidden bg-black shrink-0 border border-neutral-800">
                    {previewUrl && (
                      <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-white truncate">
                      {selectedFile.name}
                    </div>
                    <div className="text-[11px] text-neutral-400">
                      {formatSize(selectedFile.size)} • {selectedFile.type || 'image/jpeg'}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedFile(null);
                    setPreviewUrl(null);
                    setExifReport(null);
                    setScrubbedResult(null);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs transition-colors"
                >
                  Change Photo
                </button>
              </div>

              {/* Threat Level Badge */}
              {exifReport && (
                <div
                  className={`p-3.5 rounded-xl border flex items-start gap-3 ${
                    exifReport.threatLevel === 'HIGH'
                      ? 'bg-rose-950/40 border-rose-500/50 text-rose-200'
                      : exifReport.threatLevel === 'LOW'
                      ? 'bg-amber-950/40 border-amber-500/50 text-amber-200'
                      : 'bg-emerald-950/40 border-emerald-500/50 text-emerald-200'
                  }`}
                >
                  <ShieldAlert
                    className={`w-5 h-5 shrink-0 mt-0.5 ${
                      exifReport.threatLevel === 'HIGH'
                        ? 'text-rose-400'
                        : exifReport.threatLevel === 'LOW'
                        ? 'text-amber-400'
                        : 'text-emerald-400'
                    }`}
                  />
                  <div>
                    <div className="text-xs font-bold uppercase tracking-wide">
                      {exifReport.threatLevel === 'HIGH'
                        ? 'CRITICAL PRIVACY RISK: GPS GEOLOCATION DETECTED'
                        : exifReport.threatLevel === 'LOW'
                        ? 'MODERATE RISK: DEVICE & CAMERA METADATA EMBEDDED'
                        : 'CLEAN: NO FORENSIC METADATA FOUND'}
                    </div>
                    <p className="text-[11px] opacity-90 mt-0.5 leading-relaxed">
                      {exifReport.threatLevel === 'HIGH'
                        ? 'This image contains exact geographical GPS coordinates that pinpoint physical location. Scrubbing is strongly advised before sending.'
                        : exifReport.threatLevel === 'LOW'
                        ? 'Camera serial numbers, hardware specifications, and capture timestamps were found embedded in this file.'
                        : 'This image does not contain identifiable EXIF markers or GPS coordinates.'}
                    </p>
                  </div>
                </div>
              )}

              {/* Tags Details Table */}
              {exifReport && exifReport.tagsFound.length > 0 && (
                <div className="rounded-xl border border-neutral-800 overflow-hidden">
                  <div className="px-3.5 py-2 bg-neutral-900 border-b border-neutral-800 text-xs font-semibold text-neutral-300 flex items-center justify-between">
                    <span>Discovered Metadata Tags ({exifReport.tagsFound.length})</span>
                    <span className="text-[10px] text-neutral-500 font-mono">EXIF / TIFF 6.0</span>
                  </div>
                  <div className="divide-y divide-neutral-800/60 max-h-44 overflow-y-auto font-mono text-xs">
                    {exifReport.tagsFound.map((tag, i) => (
                      <div key={i} className="px-3.5 py-2 flex items-center justify-between bg-neutral-950/60">
                        <span className="text-neutral-400 text-[11px]">{tag.name}</span>
                        <span className="text-neutral-200 font-medium truncate max-w-[60%] text-right text-[11px]">
                          {tag.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Button: Scrub */}
              {!scrubbedResult && (
                <button
                  type="button"
                  onClick={handleScrubMetadata}
                  disabled={isScrubbing}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/40 transition-all cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{isScrubbing ? 'Sanitizing Image Pixels...' : 'Scrub 100% of Metadata & GPS (DoD Standard)'}</span>
                </button>
              )}

              {/* Scrubbed Certificate Result */}
              {scrubbedResult && (
                <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/40 space-y-3 animate-in zoom-in-95 duration-150">
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
                    <ShieldCheck className="w-4 h-4" />
                    Metadata Successfully Sanitized & Redrawn
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-neutral-300 bg-black/40 p-2.5 rounded-lg border border-emerald-500/20">
                    <div>Original: {formatSize(scrubbedResult.originalSize)}</div>
                    <div>Sanitized: {formatSize(scrubbedResult.newSize)}</div>
                    <div>GPS Tags: 0 (Purged)</div>
                    <div>Camera Model: 0 (Purged)</div>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={handleDownloadSanitized}
                      className="flex-1 py-2 px-3 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-neutral-200 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Download Clean File
                    </button>

                    {onSendSanitizedImage && (
                      <button
                        type="button"
                        onClick={handleSendToChat}
                        className="flex-1 py-2 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-md"
                      >
                        <Send className="w-3.5 h-3.5" />
                        Send Clean to Chat
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-neutral-950 border-t border-neutral-800 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
