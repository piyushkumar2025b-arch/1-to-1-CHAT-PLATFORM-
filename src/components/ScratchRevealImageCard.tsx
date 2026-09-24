import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Eye, EyeOff, Sparkles, Download, Maximize2, ShieldAlert } from 'lucide-react';

interface ScratchRevealImageCardProps {
  imageSrc: string;
  caption?: string;
  isMe?: boolean;
  accentColor?: string;
  onOpenLightbox?: (src: string) => void;
}

export const ScratchRevealImageCard: React.FC<ScratchRevealImageCardProps> = ({
  imageSrc,
  caption,
  isMe,
  accentColor = '#f59e0b',
  onOpenLightbox,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isScratchedOff, setIsScratchedOff] = useState(false);
  const [percentScratched, setPercentScratched] = useState(0);
  const [isDrawing, setIsDrawing] = useState(false);

  // Initialize scratch canvas with silver metallic holographic texture
  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Background gradient: dark metallic silver with cybersecurity circuit hints
    const grad = ctx.createLinearGradient(0, 0, width, height);
    grad.addColorStop(0, '#262626');
    grad.addColorStop(0.3, '#404040');
    grad.addColorStop(0.5, '#525252');
    grad.addColorStop(0.7, '#262626');
    grad.addColorStop(1, '#171717');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // Decorative lattice / scratch pattern
    ctx.strokeStyle = 'rgba(245, 158, 11, 0.25)';
    ctx.lineWidth = 1;
    for (let i = -width; i < width * 2; i += 24) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i + height, height);
      ctx.stroke();
    }

    // Badge text on canvas
    ctx.fillStyle = '#f59e0b';
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🔒 SCRATCH TO REVEAL CONFIDENTIAL IMAGE', width / 2, height / 2 - 10);

    ctx.fillStyle = '#a3a3a3';
    ctx.font = '10px sans-serif';
    ctx.fillText('Drag or touch to scrape off zero-knowledge veil', width / 2, height / 2 + 12);
  }, []);

  useEffect(() => {
    if (!isScratchedOff) {
      initCanvas();
    }
  }, [initCanvas, isScratchedOff]);

  // Scratch action
  const scratchAt = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas || isScratchedOff) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * canvas.width;
    const y = ((clientY - rect.top) / rect.height) * canvas.height;

    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(x, y, 28, 0, Math.PI * 2);
    ctx.fill();

    // Periodically sample pixels to compute scratched percentage
    try {
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      let transparentCount = 0;
      const step = 32; // sampling step for speed
      for (let i = 3; i < data.length; i += 4 * step) {
        if (data[i] === 0) {
          transparentCount++;
        }
      }
      const totalSampled = data.length / (4 * step);
      const pct = Math.round((transparentCount / totalSampled) * 100);
      setPercentScratched(pct);

      if (pct > 45) {
        setIsScratchedOff(true);
      }
    } catch {
      // Ignored if cross-origin
    }
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    scratchAt(e.clientX, e.clientY);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    scratchAt(e.clientX, e.clientY);
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    if (e.touches[0]) {
      scratchAt(e.touches[0].clientX, e.touches[0].clientY);
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    if (e.touches[0]) {
      scratchAt(e.touches[0].clientX, e.touches[0].clientY);
    }
  };

  const handleRevealAll = () => {
    setIsScratchedOff(true);
    setPercentScratched(100);
  };

  const handleCoverAgain = () => {
    setIsScratchedOff(false);
    setPercentScratched(0);
  };

  return (
    <div className="my-2.5 rounded-2xl border border-amber-500/30 bg-neutral-950/90 shadow-xl overflow-hidden backdrop-blur-md max-w-md w-full">
      {/* Header bar */}
      <div className="px-3.5 py-2.5 bg-neutral-900/90 border-b border-neutral-800 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span className="font-bold text-white tracking-wide">Scratch-to-Reveal Media</span>
          <span className="text-[10px] px-2 py-0.2 rounded-full bg-amber-500/20 text-amber-300 font-mono">
            {isScratchedOff ? '100% Revealed' : `${percentScratched}% Scratched`}
          </span>
        </div>

        <div className="flex items-center gap-1">
          {isScratchedOff ? (
            <button
              type="button"
              onClick={handleCoverAgain}
              className="p-1 text-neutral-400 hover:text-white rounded hover:bg-neutral-800 transition-colors"
              title="Cover again"
            >
              <EyeOff className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleRevealAll}
              className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 text-[10px] font-medium transition-colors"
            >
              Reveal All
            </button>
          )}

          {onOpenLightbox && (
            <button
              type="button"
              onClick={() => onOpenLightbox(imageSrc)}
              className="p-1 text-neutral-400 hover:text-white rounded hover:bg-neutral-800 transition-colors"
              title="Fullscreen"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Interactive scratch container */}
      <div
        ref={containerRef}
        className="relative w-full aspect-video sm:aspect-4/3 bg-black flex items-center justify-center overflow-hidden select-none"
      >
        {/* Hidden underlying image */}
        <img
          src={imageSrc}
          alt={caption || 'Confidential media'}
          className="w-full h-full object-contain pointer-events-none"
        />

        {/* Scratchable foil canvas */}
        {!isScratchedOff && (
          <canvas
            ref={canvasRef}
            width={480}
            height={320}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleMouseUp}
            className="absolute inset-0 w-full h-full cursor-crosshair touch-none"
          />
        )}
      </div>

      {/* Caption if present */}
      {caption && (
        <div className="px-3.5 py-2 bg-neutral-900/60 border-t border-neutral-800 text-xs text-neutral-300">
          {caption}
        </div>
      )}
    </div>
  );
};

export function parseScratchImage(text: string): { imageSrc: string; caption?: string } | null {
  const trimmed = text.trim();
  // SCRATCH_IMAGE::caption::dataUrl
  if (trimmed.startsWith('SCRATCH_IMAGE::')) {
    const parts = trimmed.split('::');
    const caption = parts[1] ? decodeURIComponent(parts[1]) : undefined;
    const imageSrc = parts.slice(2).join('::');
    if (imageSrc) {
      return { imageSrc, caption };
    }
  }
  return null;
}
