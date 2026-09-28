import React, { useState, useEffect } from 'react';
import { X, Download, ZoomIn, ZoomOut, RotateCw, Copy, Check, FlipHorizontal } from 'lucide-react';
import { formatBytes } from '../lib/file-compression';

interface ImageLightboxModalProps {
  isOpen: boolean;
  imageUrl: string;
  fileName: string;
  fileSize?: number;
  onClose: () => void;
  onDownload: () => void;
  accentColor?: string;
}

export default function ImageLightboxModal({
  isOpen,
  imageUrl,
  fileName,
  fileSize,
  onClose,
  onDownload,
  accentColor = '#f59e0b',
}: ImageLightboxModalProps) {
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [flipH, setFlipH] = useState(false);
  const [copied, setCopied] = useState(false);

  // Reset transform when opened or image changes
  useEffect(() => {
    if (isOpen) {
      setScale(1);
      setRotation(0);
      setFlipH(false);
      setCopied(false);
    }
  }, [isOpen, imageUrl]);

  // Keyboard controls (Esc to close, + to zoom in, - to zoom out, 0 to reset, r to rotate, f to flip)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === '+' || e.key === '=') {
        setScale((s) => Math.min(4, s + 0.25));
      } else if (e.key === '-' || e.key === '_') {
        setScale((s) => Math.max(0.4, s - 0.25));
      } else if (e.key === '0') {
        setScale(1);
        setRotation(0);
        setFlipH(false);
      } else if (e.key.toLowerCase() === 'r') {
        setRotation((r) => (r + 90) % 360);
      } else if (e.key.toLowerCase() === 'f') {
        setFlipH((f) => !f);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleCopyImage = async () => {
    try {
      const res = await fetch(imageUrl);
      const blob = await res.blob();
      // Ensure standard png/jpeg clipboard format
      if (navigator.clipboard && window.ClipboardItem) {
        await navigator.clipboard.write([
          new ClipboardItem({ [blob.type || 'image/png']: blob }),
        ]);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      // Fallback: copy image url
      navigator.clipboard?.writeText(imageUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.stopPropagation();
    if (e.deltaY < 0) {
      setScale((s) => Math.min(4, s + 0.2));
    } else {
      setScale((s) => Math.max(0.4, s - 0.2));
    }
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setScale((prev) => (prev > 1.2 ? 1 : 2));
  };

  if (!isOpen || !imageUrl) return null;

  return (
    <div
      id="image-lightbox-modal"
      className="fixed inset-0 z-50 flex flex-col bg-black/95 backdrop-blur-md animate-in fade-in duration-150 select-none"
      onClick={onClose}
    >
      {/* Top Bar */}
      <div
        className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-neutral-800/80 bg-neutral-950/60 backdrop-blur-md z-10 shrink-0"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 overflow-hidden max-w-sm sm:max-w-md">
          <span className="text-xs sm:text-sm font-semibold text-neutral-200 truncate">
            {fileName}
          </span>
          {fileSize !== undefined && (
            <span className="text-[11px] font-mono text-neutral-400 shrink-0">
              ({formatBytes(fileSize)})
            </span>
          )}
        </div>

        {/* Toolbar Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Zoom Out */}
          <button
            type="button"
            onClick={() => setScale((s) => Math.max(0.4, s - 0.25))}
            title="Zoom Out (-)"
            className="p-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <ZoomOut className="w-4 h-4" />
          </button>

          {/* Zoom Level Reset */}
          <button
            type="button"
            onClick={() => {
              setScale(1);
              setRotation(0);
              setFlipH(false);
            }}
            title="Reset Zoom (0)"
            className="px-2 py-1 rounded-lg bg-neutral-900 border border-neutral-800 text-[11px] font-mono text-neutral-300 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            {Math.round(scale * 100)}%
          </button>

          {/* Zoom In */}
          <button
            type="button"
            onClick={() => setScale((s) => Math.min(4, s + 0.25))}
            title="Zoom In (+)"
            className="p-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <ZoomIn className="w-4 h-4" />
          </button>

          {/* Rotate */}
          <button
            type="button"
            onClick={() => setRotation((r) => (r + 90) % 360)}
            title="Rotate 90° (R)"
            className="p-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <RotateCw className="w-4 h-4" />
          </button>

          {/* Flip Horizontal */}
          <button
            type="button"
            onClick={() => setFlipH((f) => !f)}
            title="Flip Horizontal (F)"
            className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
              flipH
                ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                : 'bg-neutral-900 border-neutral-800 text-neutral-300 hover:text-white hover:bg-neutral-800'
            }`}
          >
            <FlipHorizontal className="w-4 h-4" />
          </button>

          {/* Copy Image */}
          <button
            type="button"
            onClick={handleCopyImage}
            title="Copy image to clipboard"
            className="p-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
          </button>

          {/* Download */}
          <button
            type="button"
            onClick={onDownload}
            style={{ backgroundColor: accentColor }}
            title="Download Original File"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-neutral-950 font-bold text-xs hover:opacity-90 transition-opacity cursor-pointer ml-1"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Save</span>
          </button>

          {/* Close */}
          <button
            type="button"
            onClick={onClose}
            title="Close (Esc)"
            className="p-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer ml-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Image Stage */}
      <div
        className="flex-1 flex items-center justify-center p-4 sm:p-8 overflow-hidden relative cursor-zoom-in"
        onClick={onClose}
        onWheel={handleWheel}
      >
        <div
          className="relative transition-transform duration-150 ease-out max-h-[82vh] max-w-[92vw] flex items-center justify-center cursor-default"
          style={{
            transform: `scale(${scale}) rotate(${rotation}deg) scaleX(${flipH ? -1 : 1})`,
          }}
          onClick={(e) => e.stopPropagation()}
          onDoubleClick={handleDoubleClick}
        >
          <img
            src={imageUrl}
            alt={fileName}
            className="max-h-[82vh] max-w-[92vw] rounded-xl object-contain shadow-2xl border border-white/10 select-none"
            referrerPolicy="no-referrer"
          />
        </div>
      </div>

      {/* Bottom Hint */}
      <div className="text-center pb-3 text-[11px] text-neutral-500 font-mono select-none flex items-center justify-center gap-2">
        <span>Double-click to toggle zoom</span>
        <span>•</span>
        <span>Scroll wheel to zoom</span>
        <span>•</span>
        <span>Press <kbd className="px-1 py-0.5 rounded bg-neutral-800 text-neutral-400 border border-neutral-700">Esc</kbd> to exit</span>
      </div>
    </div>
  );
}
