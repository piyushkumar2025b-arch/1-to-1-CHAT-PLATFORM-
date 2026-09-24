import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  X,
  Shield,
  Square,
  Brush,
  Undo,
  RotateCcw,
  Sparkles,
  Download,
  Send,
  Upload,
  Layers,
  Check,
  EyeOff,
} from 'lucide-react';

interface PhotoObfuscatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSendProcessedImage: (dataUrl: string, isScratchReveal: boolean, caption?: string) => void;
  initialImageFile?: File | null;
  accentColor?: string;
}

type ObfuscationTool = 'pixelate' | 'blackout' | 'brush' | 'blur';

export const PhotoObfuscatorModal: React.FC<PhotoObfuscatorModalProps> = ({
  isOpen,
  onClose,
  onSendProcessedImage,
  initialImageFile = null,
  accentColor = '#f59e0b',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [activeTool, setActiveTool] = useState<ObfuscationTool>('pixelate');
  const [brushSize, setBrushSize] = useState(24);
  const [isScratchReveal, setIsScratchReveal] = useState(false);
  const [caption, setCaption] = useState('');
  const [loadedImage, setLoadedImage] = useState<HTMLImageElement | null>(null);
  const [history, setHistory] = useState<ImageData[]>([]);
  const [isInteracting, setIsInteracting] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);

  // Load image from File
  const loadImageFromFile = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        setLoadedImage(img);
        setHistory([]);
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }, []);

  useEffect(() => {
    if (initialImageFile) {
      loadImageFromFile(initialImageFile);
    }
  }, [initialImageFile, loadImageFromFile]);

  // Render base image to canvas when loaded
  useEffect(() => {
    if (!loadedImage || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Constrain max canvas dimensions to 1200x900 for fast mobile/desktop performance
    const maxW = 1000;
    const maxH = 750;
    let w = loadedImage.width;
    let h = loadedImage.height;

    if (w > maxW || h > maxH) {
      const ratio = Math.min(maxW / w, maxH / h);
      w = Math.round(w * ratio);
      h = Math.round(h * ratio);
    }

    canvas.width = w;
    canvas.height = h;
    ctx.drawImage(loadedImage, 0, 0, w, h);

    // Save initial state to history
    const initialData = ctx.getImageData(0, 0, w, h);
    setHistory([initialData]);
  }, [loadedImage]);

  if (!isOpen) return null;

  const saveCanvasState = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
    setHistory((prev) => [...prev.slice(-15), data]);
  };

  const handleUndo = () => {
    if (history.length <= 1) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const newHistory = history.slice(0, -1);
    const prevState = newHistory[newHistory.length - 1];
    ctx.putImageData(prevState, 0, 0);
    setHistory(newHistory);
  };

  const handleReset = () => {
    if (history.length === 0) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const original = history[0];
    ctx.putImageData(original, 0, 0);
    setHistory([original]);
  };

  // Pixelate specific bounding box
  const applyPixelateRect = (x: number, y: number, w: number, h: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const blockSize = Math.max(8, Math.round(brushSize / 2));
    const rx = Math.max(0, Math.min(x, x + w));
    const ry = Math.max(0, Math.min(y, y + h));
    const rw = Math.min(canvas.width - rx, Math.abs(w));
    const rh = Math.min(canvas.height - ry, Math.abs(h));

    if (rw <= 2 || rh <= 2) return;

    // Downscale and upscale to achieve permanent non-reversible pixelation
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) return;

    const scaledW = Math.max(1, Math.floor(rw / blockSize));
    const scaledH = Math.max(1, Math.floor(rh / blockSize));

    tempCanvas.width = scaledW;
    tempCanvas.height = scaledH;

    // Draw region scaled down
    tempCtx.drawImage(canvas, rx, ry, rw, rh, 0, 0, scaledW, scaledH);

    // Draw back scaled up without smoothing
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(tempCanvas, 0, 0, scaledW, scaledH, rx, ry, rw, rh);
    ctx.imageSmoothingEnabled = true;

    saveCanvasState();
  };

  // Blackout specific bounding box
  const applyBlackoutRect = (x: number, y: number, w: number, h: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rx = Math.min(x, x + w);
    const ry = Math.min(y, y + h);
    const rw = Math.abs(w);
    const rh = Math.abs(h);

    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(rx, ry, rw, rh);

    saveCanvasState();
  };

  // Blur specific bounding box
  const applyBlurRect = (x: number, y: number, w: number, h: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rx = Math.max(0, Math.min(x, x + w));
    const ry = Math.max(0, Math.min(y, y + h));
    const rw = Math.min(canvas.width - rx, Math.abs(w));
    const rh = Math.min(canvas.height - ry, Math.abs(h));

    if (rw <= 2 || rh <= 2) return;

    ctx.save();
    ctx.filter = `blur(${Math.max(6, Math.round(brushSize / 3))}px)`;
    ctx.drawImage(canvas, rx, ry, rw, rh, rx, ry, rw, rh);
    ctx.restore();

    saveCanvasState();
  };

  // Mouse / Touch handlers for Canvas
  const getCanvasCoords = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  };

  const handlePointerDown = (clientX: number, clientY: number) => {
    setIsInteracting(true);
    const coords = getCanvasCoords(clientX, clientY);
    setDragStart(coords);

    if (activeTool === 'brush') {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (ctx) {
        ctx.beginPath();
        ctx.arc(coords.x, coords.y, brushSize / 2, 0, Math.PI * 2);
        ctx.fillStyle = '#0a0a0a';
        ctx.fill();
      }
    }
  };

  const handlePointerMove = (clientX: number, clientY: number) => {
    if (!isInteracting || !dragStart) return;
    const coords = getCanvasCoords(clientX, clientY);

    if (activeTool === 'brush') {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (ctx) {
        ctx.strokeStyle = '#0a0a0a';
        ctx.lineWidth = brushSize;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.lineTo(coords.x, coords.y);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(coords.x, coords.y);
      }
    }
  };

  const handlePointerUp = (clientX: number, clientY: number) => {
    if (!isInteracting || !dragStart) return;
    setIsInteracting(false);
    const coords = getCanvasCoords(clientX, clientY);
    const w = coords.x - dragStart.x;
    const h = coords.y - dragStart.y;

    if (activeTool === 'pixelate') {
      applyPixelateRect(dragStart.x, dragStart.y, w, h);
    } else if (activeTool === 'blackout') {
      applyBlackoutRect(dragStart.x, dragStart.y, w, h);
    } else if (activeTool === 'blur') {
      applyBlurRect(dragStart.x, dragStart.y, w, h);
    } else if (activeTool === 'brush') {
      saveCanvasState();
    }

    setDragStart(null);
  };

  const handleSend = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
    onSendProcessedImage(dataUrl, isScratchReveal, caption.trim() || undefined);
    onClose();
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `redacted_photo_${Date.now()}.png`;
    a.click();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-4xl rounded-3xl bg-neutral-950 border border-neutral-700 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-neutral-900/70">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-inner">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Photo Redaction & Privacy Studio
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono border border-emerald-500/30">
                  Client-Side E2EE
                </span>
              </h2>
              <p className="text-xs text-neutral-400">
                Irreversibly mosaic, blackout, or foil-scratch photos before encrypted chat dispatch
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

        {/* Toolbar */}
        <div className="px-6 py-3 border-b border-neutral-800 bg-neutral-900/40 flex flex-wrap items-center justify-between gap-3">
          {/* Tool selector */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setActiveTool('pixelate')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTool === 'pixelate'
                  ? 'bg-amber-500 text-black shadow-md'
                  : 'bg-neutral-900 text-neutral-300 hover:bg-neutral-800'
              }`}
            >
              <Square className="w-3.5 h-3.5" />
              <span>Pixelate Area</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTool('blackout')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTool === 'blackout'
                  ? 'bg-amber-500 text-black shadow-md'
                  : 'bg-neutral-900 text-neutral-300 hover:bg-neutral-800'
              }`}
            >
              <EyeOff className="w-3.5 h-3.5" />
              <span>Blackout Box</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTool('brush')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTool === 'brush'
                  ? 'bg-amber-500 text-black shadow-md'
                  : 'bg-neutral-900 text-neutral-300 hover:bg-neutral-800'
              }`}
            >
              <Brush className="w-3.5 h-3.5" />
              <span>Redact Pen</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTool('blur')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTool === 'blur'
                  ? 'bg-amber-500 text-black shadow-md'
                  : 'bg-neutral-900 text-neutral-300 hover:bg-neutral-800'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Soft Blur</span>
            </button>
          </div>

          {/* Tool adjustments & History */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-neutral-400 font-mono">Size:</span>
              <input
                type="range"
                min="12"
                max="64"
                value={brushSize}
                onChange={(e) => setBrushSize(parseInt(e.target.value, 10))}
                className="w-20 sm:w-24 accent-amber-500 cursor-pointer"
              />
            </div>

            <button
              type="button"
              onClick={handleUndo}
              disabled={history.length <= 1}
              className={`p-1.5 rounded-xl transition-colors cursor-pointer ${
                history.length > 1
                  ? 'bg-neutral-800 text-neutral-200 hover:bg-neutral-700'
                  : 'bg-neutral-900 text-neutral-600 cursor-not-allowed'
              }`}
              title="Undo step"
            >
              <Undo className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={handleReset}
              disabled={history.length <= 1}
              className={`p-1.5 rounded-xl transition-colors cursor-pointer ${
                history.length > 1
                  ? 'bg-neutral-800 text-neutral-200 hover:bg-neutral-700'
                  : 'bg-neutral-900 text-neutral-600 cursor-not-allowed'
              }`}
              title="Reset all redactions"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Canvas / Image workspace */}
        <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-black/70 min-h-[340px]">
          {loadedImage ? (
            <div className="relative border border-neutral-800 rounded-2xl overflow-hidden shadow-2xl max-w-full max-h-full">
              <canvas
                ref={canvasRef}
                onMouseDown={(e) => handlePointerDown(e.clientX, e.clientY)}
                onMouseMove={(e) => handlePointerMove(e.clientX, e.clientY)}
                onMouseUp={(e) => handlePointerUp(e.clientX, e.clientY)}
                onTouchStart={(e) =>
                  e.touches[0] && handlePointerDown(e.touches[0].clientX, e.touches[0].clientY)
                }
                onTouchMove={(e) =>
                  e.touches[0] && handlePointerMove(e.touches[0].clientX, e.touches[0].clientY)
                }
                onTouchEnd={(e) =>
                  e.changedTouches[0] &&
                  handlePointerUp(e.changedTouches[0].clientX, e.changedTouches[0].clientY)
                }
                className="max-w-full max-h-[50vh] sm:max-h-[56vh] object-contain cursor-crosshair touch-none"
              />
            </div>
          ) : (
            <div className="text-center p-8 border-2 border-dashed border-neutral-800 rounded-3xl max-w-md w-full">
              <Upload className="w-10 h-10 text-neutral-500 mx-auto mb-3" />
              <h3 className="text-sm font-semibold text-white mb-1">Choose Photo to Redact</h3>
              <p className="text-xs text-neutral-400 mb-4">
                Select an ID card, screenshot, receipt, or photo with sensitive information
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) loadImageFromFile(file);
                }}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs cursor-pointer transition-all"
              >
                Browse Image File
              </button>
            </div>
          )}
        </div>

        {/* Footer Options & Send */}
        <div className="px-6 py-4 border-t border-neutral-800 bg-neutral-900/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Scratch cover toggle and caption */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-1">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isScratchReveal}
                onChange={(e) => setIsScratchReveal(e.target.checked)}
                className="w-4 h-4 rounded text-amber-500 accent-amber-500 cursor-pointer"
              />
              <span className="text-xs font-semibold text-amber-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                Cover in Scratch-to-Reveal Foil
              </span>
            </label>

            <input
              type="text"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Add optional caption..."
              className="px-3 py-1.5 rounded-xl bg-neutral-900 border border-neutral-700 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400 sm:max-w-xs"
            />
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {loadedImage && (
              <button
                type="button"
                onClick={handleDownload}
                className="p-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white transition-colors cursor-pointer"
                title="Download redacted copy"
              >
                <Download className="w-4 h-4" />
              </button>
            )}

            <button
              type="button"
              onClick={handleSend}
              disabled={!loadedImage}
              className={`px-5 py-2.5 rounded-2xl font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg transition-all active:scale-[0.98] cursor-pointer ${
                loadedImage
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black'
                  : 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
              }`}
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send Redacted to Chat</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
