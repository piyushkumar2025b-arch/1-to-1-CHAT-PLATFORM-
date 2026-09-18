import React, { useRef, useState, useEffect } from 'react';
import {
  PenTool,
  X,
  RotateCcw,
  Trash2,
  Send,
  Highlighter,
  Eraser,
  Palette,
} from 'lucide-react';

interface QuickDrawModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSendDoodle: (file: File) => void;
  accentColor?: string;
}

type ToolType = 'pen' | 'highlighter' | 'eraser';

const COLOR_PALETTE = [
  '#f59e0b', // Amber
  '#06b6d4', // Cyan
  '#10b981', // Emerald
  '#f43f5e', // Rose
  '#a855f7', // Purple
  '#ffffff', // White
  '#3b82f6', // Blue
  '#eab308', // Yellow
];

const BRUSH_SIZES = [
  { label: 'Fine', size: 3 },
  { label: 'Medium', size: 6 },
  { label: 'Bold', size: 14 },
  { label: 'Marker', size: 26 },
];

export const QuickDrawModal: React.FC<QuickDrawModalProps> = ({
  isOpen,
  onClose,
  onSendDoodle,
  accentColor = '#f59e0b',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [selectedColor, setSelectedColor] = useState('#f59e0b');
  const [selectedTool, setSelectedTool] = useState<ToolType>('pen');
  const [brushSize, setBrushSize] = useState(6);
  const [isDrawing, setIsDrawing] = useState(false);
  const [history, setHistory] = useState<ImageData[]>([]);

  // Setup canvas background
  const initCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set dark background
    ctx.fillStyle = '#171717';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Subtle dark dot grid
    ctx.fillStyle = '#262626';
    for (let x = 20; x < canvas.width; x += 24) {
      for (let y = 20; y < canvas.height; y += 24) {
        ctx.beginPath();
        ctx.arc(x, y, 1, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Save initial state
    const initial = ctx.getImageData(0, 0, canvas.width, canvas.height);
    setHistory([initial]);
  };

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        initCanvas();
      }, 50);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const saveHistoryState = () => {
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

    const newHistory = [...history];
    newHistory.pop(); // remove current state
    const prevState = newHistory[newHistory.length - 1];
    ctx.putImageData(prevState, 0, 0);
    setHistory(newHistory);
  };

  const handleClear = () => {
    initCanvas();
  };

  const getCoordinates = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.setPointerCapture(e.pointerId);
    setIsDrawing(true);

    const { x, y } = getCoordinates(e);

    ctx.beginPath();
    ctx.moveTo(x, y);

    if (selectedTool === 'eraser') {
      ctx.strokeStyle = '#171717';
      ctx.globalAlpha = 1.0;
      ctx.lineWidth = brushSize * 2.5;
    } else if (selectedTool === 'highlighter') {
      ctx.strokeStyle = selectedColor;
      ctx.globalAlpha = 0.35;
      ctx.lineWidth = brushSize * 3;
    } else {
      ctx.strokeStyle = selectedColor;
      ctx.globalAlpha = 1.0;
      ctx.lineWidth = brushSize;
    }

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.releasePointerCapture(e.pointerId);
    ctx.closePath();
    ctx.globalAlpha = 1.0;
    setIsDrawing(false);
    saveHistoryState();
  };

  const handleSendDoodle = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.toBlob((blob) => {
      if (!blob) return;
      const file = new File([blob], `doodle-${Date.now()}.png`, { type: 'image/png' });
      onSendDoodle(file);
      onClose();
    }, 'image/png');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-neutral-800 bg-neutral-950/60">
          <div className="flex items-center gap-2.5">
            <div
              style={{ backgroundColor: `${accentColor}20`, color: accentColor }}
              className="w-8 h-8 rounded-lg border border-white/10 flex items-center justify-center"
            >
              <PenTool className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Quick Sketch & Notes</h3>
              <p className="text-[11px] text-neutral-400">
                Draw hand-crafted doodles, flowcharts, or signatures
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Toolbar */}
        <div className="px-4 py-2 bg-neutral-950 border-b border-neutral-800 flex flex-wrap items-center justify-between gap-2 text-xs">
          {/* Tool Selector */}
          <div className="flex items-center gap-1 bg-neutral-900 p-1 rounded-xl border border-neutral-800">
            <button
              type="button"
              onClick={() => setSelectedTool('pen')}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1 ${
                selectedTool === 'pen'
                  ? 'bg-neutral-800 text-amber-400 font-semibold shadow-xs'
                  : 'text-neutral-400 hover:text-white'
              }`}
              title="Pen (solid)"
            >
              <PenTool className="w-3.5 h-3.5" />
              <span className="hidden sm:inline text-[11px]">Pen</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedTool('highlighter')}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1 ${
                selectedTool === 'highlighter'
                  ? 'bg-neutral-800 text-amber-400 font-semibold shadow-xs'
                  : 'text-neutral-400 hover:text-white'
              }`}
              title="Highlighter (semi-transparent)"
            >
              <Highlighter className="w-3.5 h-3.5" />
              <span className="hidden sm:inline text-[11px]">Highlight</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedTool('eraser')}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1 ${
                selectedTool === 'eraser'
                  ? 'bg-neutral-800 text-amber-400 font-semibold shadow-xs'
                  : 'text-neutral-400 hover:text-white'
              }`}
              title="Eraser"
            >
              <Eraser className="w-3.5 h-3.5" />
              <span className="hidden sm:inline text-[11px]">Eraser</span>
            </button>
          </div>

          {/* Brush Sizes */}
          <div className="flex items-center gap-1 bg-neutral-900 p-1 rounded-xl border border-neutral-800">
            {BRUSH_SIZES.map((b) => (
              <button
                key={b.label}
                type="button"
                onClick={() => setBrushSize(b.size)}
                className={`px-2 py-1 rounded-lg text-[10px] font-medium transition-colors cursor-pointer ${
                  brushSize === b.size
                    ? 'bg-neutral-800 text-white font-bold'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                {b.label}
              </button>
            ))}
          </div>

          {/* Color Palette */}
          {selectedTool !== 'eraser' && (
            <div className="flex items-center gap-1.5 bg-neutral-900 px-2 py-1 rounded-xl border border-neutral-800">
              {COLOR_PALETTE.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setSelectedColor(c)}
                  style={{ backgroundColor: c }}
                  className={`w-5 h-5 rounded-full transition-transform cursor-pointer ${
                    selectedColor === c ? 'scale-125 ring-2 ring-white shadow-xs' : 'opacity-80 hover:opacity-100'
                  }`}
                  title={c}
                />
              ))}
            </div>
          )}

          {/* Undo & Clear */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleUndo}
              disabled={history.length <= 1}
              className="p-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-300 disabled:opacity-40 transition-colors cursor-pointer"
              title="Undo last stroke"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleClear}
              className="p-1.5 rounded-lg bg-neutral-900 hover:bg-rose-500/20 text-neutral-300 hover:text-rose-300 transition-colors cursor-pointer"
              title="Clear Canvas"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Drawing Surface */}
        <div className="p-3 bg-neutral-950 flex items-center justify-center overflow-hidden">
          <canvas
            ref={canvasRef}
            width={720}
            height={440}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            className="w-full max-h-[50vh] aspect-[16/10] rounded-xl border border-neutral-800 touch-none shadow-inner cursor-crosshair bg-neutral-900"
          />
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3 border-t border-neutral-800 bg-neutral-950/70 flex items-center justify-between text-xs">
          <span className="text-neutral-500 text-[11px] hidden sm:inline">
            Encrypted zero-knowledge canvas transmission
          </span>
          <div className="flex items-center gap-2.5 ml-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSendDoodle}
              style={{ backgroundColor: accentColor }}
              className="px-4 py-1.5 rounded-xl text-neutral-950 font-bold hover:opacity-90 active:scale-95 transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send Sketch</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
export default QuickDrawModal;
