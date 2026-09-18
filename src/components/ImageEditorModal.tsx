import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Crop,
  EyeOff,
  Square,
  ArrowUpRight,
  PenTool,
  Type,
  Undo,
  RotateCcw,
  Check,
  X,
  Sliders,
  Maximize2,
  ZoomIn,
  RotateCw,
  FlipHorizontal,
  Sparkles,
  Shield,
  Tag,
} from 'lucide-react';

export type EditorTool = 'crop' | 'blur' | 'blackout' | 'arrow' | 'pen' | 'text';

interface ImageEditorModalProps {
  isOpen: boolean;
  imageFile: File | null;
  imageUrl?: string | null;
  previewUrl?: string | null;
  onClose: () => void;
  onApply?: (editedFile: File, newPreviewUrl: string) => void;
  onSave?: (editedFile: File, newPreviewUrl?: string) => void;
  accentColor?: string;
}

export const ImageEditorModal: React.FC<ImageEditorModalProps> = ({
  isOpen,
  imageFile,
  imageUrl,
  previewUrl,
  onClose,
  onApply,
  onSave,
  accentColor = '#f59e0b',
}) => {
  const effectiveImageUrl = imageUrl || previewUrl || null;
  const handleSaveCallback = onApply || onSave;

  const [activeTool, setActiveTool] = useState<EditorTool>('blur');
  const [selectedColor, setSelectedColor] = useState<string>('#f59e0b');
  const [brushSize, setBrushSize] = useState<number>(4);
  const [cropAspect, setCropAspect] = useState<'free' | '1:1' | '4:3' | '16:9'>('free');
  const [canUndo, setCanUndo] = useState<boolean>(false);
  const [textInputOpen, setTextInputOpen] = useState<boolean>(false);
  const [textValue, setTextValue] = useState<string>('');
  const [textCoords, setTextCoords] = useState<{ x: number; y: number } | null>(null);
  const [showStampMenu, setShowStampMenu] = useState<boolean>(false);
  const [showFilterMenu, setShowFilterMenu] = useState<boolean>(false);

  // Crop overlay state (percentages [0..1] of canvas width/height)
  const [cropBox, setCropBox] = useState<{ x: number; y: number; w: number; h: number }>({
    x: 0.1,
    y: 0.1,
    w: 0.8,
    h: 0.8,
  });

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const originalImageRef = useRef<HTMLImageElement | null>(null);
  const undoStackRef = useRef<ImageData[]>([]);

  // Dragging / drawing on canvas state
  const isDrawingRef = useRef<boolean>(false);
  const startPointRef = useRef<{ x: number; y: number } | null>(null);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);
  const previewSnapshotRef = useRef<ImageData | null>(null);

  // Initialize canvas with the loaded image
  useEffect(() => {
    if (!isOpen || !effectiveImageUrl) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = effectiveImageUrl;
    img.onload = () => {
      originalImageRef.current = img;
      const canvas = canvasRef.current;
      if (!canvas) return;

      canvas.width = img.naturalWidth || img.width;
      canvas.height = img.naturalHeight || img.height;

      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);

      // Save initial state in undo stack
      const initialSnapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);
      undoStackRef.current = [initialSnapshot];
      setCanUndo(false);
    };
    img.onerror = () => {
      console.error('Failed to load image into editor');
    };
  }, [isOpen, effectiveImageUrl]);

  // Push current canvas state to undo stack
  const saveSnapshot = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const snapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);
    undoStackRef.current.push(snapshot);
    // Keep up to 20 snapshots
    if (undoStackRef.current.length > 20) {
      undoStackRef.current.shift();
    }
    setCanUndo(undoStackRef.current.length > 1);
  }, []);

  // Undo last modification
  const handleUndo = useCallback(() => {
    if (undoStackRef.current.length <= 1) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    // Pop the current state
    undoStackRef.current.pop();
    // Get previous state
    const prevState = undoStackRef.current[undoStackRef.current.length - 1];
    if (prevState) {
      canvas.width = prevState.width;
      canvas.height = prevState.height;
      ctx.putImageData(prevState, 0, 0);
    }
    setCanUndo(undoStackRef.current.length > 1);
  }, []);

  // Keyboard shortcut listener for Esc (close) and Ctrl/Cmd+Z (undo)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        if (textInputOpen) {
          setTextInputOpen(false);
        } else {
          onClose();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        handleUndo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, textInputOpen, onClose, handleUndo]);

  // Reset to original image
  const handleReset = () => {
    if (!originalImageRef.current || !canvasRef.current) return;
    const img = originalImageRef.current;
    const canvas = canvasRef.current;
    canvas.width = img.naturalWidth || img.width;
    canvas.height = img.naturalHeight || img.height;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0);
    const initialSnapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);
    undoStackRef.current = [initialSnapshot];
    setCanUndo(false);
  };

  // Convert mouse/touch event coordinates to canvas space
  const getCanvasCoords = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = rect.width > 0 ? canvas.width / rect.width : 1;
    const scaleY = rect.height > 0 ? canvas.height / rect.height : 1;
    return {
      x: Math.max(0, Math.min(canvas.width, (clientX - rect.left) * scaleX)),
      y: Math.max(0, Math.min(canvas.height, (clientY - rect.top) * scaleY)),
    };
  };

  // Pixelation / Blur algorithm on a specific bounding box
  const applyPixelationBlur = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    pixelSize = 12
  ) => {
    const startX = Math.max(0, Math.floor(Math.min(x, x + w)));
    const startY = Math.max(0, Math.floor(Math.min(y, y + h)));
    const boxW = Math.min(ctx.canvas.width - startX, Math.abs(Math.floor(w)));
    const boxH = Math.min(ctx.canvas.height - startY, Math.abs(Math.floor(h)));

    if (boxW <= 0 || boxH <= 0) return;

    const imgData = ctx.getImageData(startX, startY, boxW, boxH);
    const data = imgData.data;

    for (let py = 0; py < boxH; py += pixelSize) {
      for (let px = 0; px < boxW; px += pixelSize) {
        let r = 0,
          g = 0,
          b = 0,
          count = 0;

        for (let dy = 0; dy < pixelSize && py + dy < boxH; dy++) {
          for (let dx = 0; dx < pixelSize && px + dx < boxW; dx++) {
            const idx = ((py + dy) * boxW + (px + dx)) * 4;
            r += data[idx];
            g += data[idx + 1];
            b += data[idx + 2];
            count++;
          }
        }

        r = Math.floor(r / count);
        g = Math.floor(g / count);
        b = Math.floor(b / count);

        for (let dy = 0; dy < pixelSize && py + dy < boxH; dy++) {
          for (let dx = 0; dx < pixelSize && px + dx < boxW; dx++) {
            const idx = ((py + dy) * boxW + (px + dx)) * 4;
            data[idx] = r;
            data[idx + 1] = g;
            data[idx + 2] = b;
          }
        }
      }
    }

    ctx.putImageData(imgData, startX, startY);
  };

  // Draw arrow with crisp arrowhead
  const drawArrow = (
    ctx: CanvasRenderingContext2D,
    fromX: number,
    fromY: number,
    toX: number,
    toY: number,
    color: string,
    width: number
  ) => {
    const headlen = Math.max(14, width * 3.5);
    const angle = Math.atan2(toY - fromY, toX - fromX);

    ctx.save();
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = width;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(toX, toY);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(toX, toY);
    ctx.lineTo(toX - headlen * Math.cos(angle - Math.PI / 6), toY - headlen * Math.sin(angle - Math.PI / 6));
    ctx.lineTo(toX - headlen * Math.cos(angle + Math.PI / 6), toY - headlen * Math.sin(angle + Math.PI / 6));
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  };

  const handleStartInteraction = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const coords = getCanvasCoords(clientX, clientY);
    isDrawingRef.current = true;
    startPointRef.current = coords;
    lastPointRef.current = coords;

    if (activeTool === 'crop') {
      return;
    }

    previewSnapshotRef.current = ctx.getImageData(0, 0, canvas.width, canvas.height);

    if (activeTool === 'text') {
      setTextCoords(coords);
      setTextInputOpen(true);
      isDrawingRef.current = false;
      return;
    }

    if (activeTool === 'pen') {
      ctx.beginPath();
      ctx.moveTo(coords.x, coords.y);
      ctx.strokeStyle = selectedColor;
      ctx.lineWidth = brushSize;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    }
  };

  const handleMoveInteraction = (clientX: number, clientY: number) => {
    if (!isDrawingRef.current || !startPointRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const coords = getCanvasCoords(clientX, clientY);
    lastPointRef.current = coords;
    const start = startPointRef.current;

    if (activeTool === 'crop') {
      const minX = Math.min(start.x, coords.x);
      const minY = Math.min(start.y, coords.y);
      let w = Math.abs(coords.x - start.x);
      let h = Math.abs(coords.y - start.y);

      if (cropAspect === '1:1') {
        const side = Math.min(w, h);
        w = side;
        h = side;
      } else if (cropAspect === '4:3') {
        h = w * (3 / 4);
      } else if (cropAspect === '16:9') {
        h = w * (9 / 16);
      }

      setCropBox({
        x: Math.max(0, Math.min(0.95, minX / canvas.width)),
        y: Math.max(0, Math.min(0.95, minY / canvas.height)),
        w: Math.max(0.05, Math.min(1 - minX / canvas.width, w / canvas.width)),
        h: Math.max(0.05, Math.min(1 - minY / canvas.height, h / canvas.height)),
      });
      return;
    }

    if (activeTool === 'pen') {
      ctx.lineTo(coords.x, coords.y);
      ctx.stroke();
    } else {
      // Restore snapshot for live dragging preview
      if (previewSnapshotRef.current) {
        ctx.putImageData(previewSnapshotRef.current, 0, 0);
      }

      if (activeTool === 'arrow') {
        drawArrow(ctx, start.x, start.y, coords.x, coords.y, selectedColor, brushSize);
      } else if (activeTool === 'blur') {
        // Show live selection box preview
        ctx.save();
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 6]);
        ctx.strokeRect(start.x, start.y, coords.x - start.x, coords.y - start.y);
        ctx.restore();
      } else if (activeTool === 'blackout') {
        ctx.save();
        ctx.fillStyle = '#000000';
        ctx.fillRect(start.x, start.y, coords.x - start.x, coords.y - start.y);
        ctx.restore();
      }
    }
  };

  const handleEndInteraction = (clientX?: number, clientY?: number) => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;

    if (activeTool === 'crop') {
      startPointRef.current = null;
      lastPointRef.current = null;
      return;
    }

    if (!startPointRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const coords =
      clientX !== undefined && clientY !== undefined
        ? getCanvasCoords(clientX, clientY)
        : (lastPointRef.current || startPointRef.current);
    const start = startPointRef.current;

    if (activeTool === 'blur') {
      if (previewSnapshotRef.current) {
        ctx.putImageData(previewSnapshotRef.current, 0, 0);
      }
      applyPixelationBlur(ctx, start.x, start.y, coords.x - start.x, coords.y - start.y, 14);
    } else if (activeTool === 'blackout') {
      if (previewSnapshotRef.current) {
        ctx.putImageData(previewSnapshotRef.current, 0, 0);
      }
      ctx.fillStyle = '#000000';
      ctx.fillRect(start.x, start.y, coords.x - start.x, coords.y - start.y);
    } else if (activeTool === 'arrow') {
      if (previewSnapshotRef.current) {
        ctx.putImageData(previewSnapshotRef.current, 0, 0);
      }
      drawArrow(ctx, start.x, start.y, coords.x, coords.y, selectedColor, brushSize);
    }

    startPointRef.current = null;
    lastPointRef.current = null;
    previewSnapshotRef.current = null;
    saveSnapshot();
  };

  // Canvas Mouse & Touch Events
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    handleStartInteraction(e.clientX, e.clientY);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    handleMoveInteraction(e.clientX, e.clientY);
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    handleEndInteraction(e.clientX, e.clientY);
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (e.touches.length > 0) {
      handleStartInteraction(e.touches[0].clientX, e.touches[0].clientY);
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (e.touches.length > 0) {
      handleMoveInteraction(e.touches[0].clientX, e.touches[0].clientY);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (e.changedTouches && e.changedTouches.length > 0) {
      handleEndInteraction(e.changedTouches[0].clientX, e.changedTouches[0].clientY);
    } else {
      handleEndInteraction();
    }
  };

  const handleTouchCancel = () => {
    isDrawingRef.current = false;
    startPointRef.current = null;
    lastPointRef.current = null;
    if (previewSnapshotRef.current && canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d', { willReadFrequently: true });
      if (ctx) ctx.putImageData(previewSnapshotRef.current, 0, 0);
    }
    previewSnapshotRef.current = null;
  };

  // Add typed text label to canvas
  const handleApplyText = () => {
    if (!textValue.trim() || !textCoords || !canvasRef.current) {
      setTextInputOpen(false);
      return;
    }
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    ctx.save();
    const fontSize = Math.max(16, brushSize * 4);
    ctx.font = `bold ${fontSize}px sans-serif`;

    const metrics = ctx.measureText(textValue);
    const textW = metrics.width;
    const textH = fontSize;

    // Draw background badge pill
    ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
    ctx.beginPath();
    if (typeof (ctx as any).roundRect === 'function') {
      (ctx as any).roundRect(textCoords.x - 6, textCoords.y - textH, textW + 12, textH + 8, 6);
    } else {
      ctx.rect(textCoords.x - 6, textCoords.y - textH, textW + 12, textH + 8);
    }
    ctx.fill();

    // Draw text
    ctx.fillStyle = selectedColor;
    ctx.fillText(textValue, textCoords.x, textCoords.y - 2);
    ctx.restore();

    setTextValue('');
    setTextCoords(null);
    setTextInputOpen(false);
    saveSnapshot();
  };

  // Execute Crop operation on canvas
  const handleApplyCrop = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const cropX = Math.max(0, Math.min(canvas.width - 10, Math.round(cropBox.x * canvas.width)));
    const cropY = Math.max(0, Math.min(canvas.height - 10, Math.round(cropBox.y * canvas.height)));
    const cropW = Math.min(canvas.width - cropX, Math.max(10, Math.round(cropBox.w * canvas.width)));
    const cropH = Math.min(canvas.height - cropY, Math.max(10, Math.round(cropBox.h * canvas.height)));

    if (cropW <= 10 || cropH <= 10) return;

    const croppedData = ctx.getImageData(cropX, cropY, cropW, cropH);

    canvas.width = cropW;
    canvas.height = cropH;
    ctx.putImageData(croppedData, 0, 0);

    // Reset crop box for next time
    setCropBox({ x: 0.05, y: 0.05, w: 0.9, h: 0.9 });
    saveSnapshot();
    setActiveTool('blur');
  };

  // Rotate image 90 degrees clockwise
  const handleRotateClockwise = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) return;
    tempCtx.drawImage(canvas, 0, 0);

    const prevWidth = canvas.width;
    const prevHeight = canvas.height;
    canvas.width = prevHeight;
    canvas.height = prevWidth;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate(Math.PI / 2);
    ctx.drawImage(tempCanvas, -prevWidth / 2, -prevHeight / 2);
    ctx.restore();

    saveSnapshot();
  };

  // Flip image horizontally
  const handleFlipHorizontal = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) return;
    tempCtx.drawImage(canvas, 0, 0);

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(tempCanvas, 0, 0);
    ctx.restore();

    saveSnapshot();
  };

  // Apply visual filter presets
  const handleApplyFilter = (type: 'grayscale' | 'invert' | 'sepia') => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imgData.data;

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      if (type === 'grayscale') {
        const gray = 0.299 * r + 0.587 * g + 0.114 * b;
        data[i] = gray;
        data[i + 1] = gray;
        data[i + 2] = gray;
      } else if (type === 'invert') {
        data[i] = 255 - r;
        data[i + 1] = 255 - g;
        data[i + 2] = 255 - b;
      } else if (type === 'sepia') {
        data[i] = Math.min(255, r * 0.393 + g * 0.769 + b * 0.189);
        data[i + 1] = Math.min(255, r * 0.349 + g * 0.686 + b * 0.168);
        data[i + 2] = Math.min(255, r * 0.272 + g * 0.534 + b * 0.131);
      }
    }

    ctx.putImageData(imgData, 0, 0);
    saveSnapshot();
  };

  // Apply security/redaction watermark stamp
  const handleApplySecurityStamp = (label: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    ctx.save();
    const fontSize = Math.max(22, Math.floor(Math.min(canvas.width, canvas.height) / 14));
    ctx.font = `900 ${fontSize}px system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const cx = canvas.width / 2;
    const cy = canvas.height / 2;

    ctx.translate(cx, cy);
    ctx.rotate(-Math.PI / 8);

    const metrics = ctx.measureText(label);
    const boxW = metrics.width + 48;
    const boxH = fontSize * 1.8;

    // Outer border & fill
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = Math.max(4, Math.floor(fontSize / 6));
    ctx.fillStyle = 'rgba(239, 68, 68, 0.18)';
    ctx.beginPath();
    if (typeof (ctx as any).roundRect === 'function') {
      (ctx as any).roundRect(-boxW / 2, -boxH / 2, boxW, boxH, 8);
    } else {
      ctx.rect(-boxW / 2, -boxH / 2, boxW, boxH);
    }
    ctx.fill();
    ctx.stroke();

    // Redacted text label
    ctx.fillStyle = '#ef4444';
    ctx.fillText(label, 0, 0);
    ctx.restore();

    saveSnapshot();
  };

  // Export edited canvas as new File and close
  const handleSaveAndAttach = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const newFileName = (imageFile?.name || 'edited-image.png').replace(/\.[^/.]+$/, '') + '-edited.png';
        const editedFile = new File([blob], newFileName, { type: 'image/png' });
        const newUrl = URL.createObjectURL(blob);
        if (handleSaveCallback) {
          handleSaveCallback(editedFile, newUrl);
        }
        onClose();
      },
      'image/png',
      0.95
    );
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-2 sm:p-4 animate-in fade-in duration-200 select-none"
      onClick={onClose}
    >
      <div
        className="relative max-w-4xl w-full h-[90vh] flex flex-col bg-neutral-900 border border-neutral-750 rounded-2xl overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Toolbar */}
        <div className="flex items-center justify-between px-4 py-3 bg-neutral-950 border-b border-neutral-800 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-neutral-100 uppercase tracking-wider">
              Image Redaction & Annotator
            </span>
            <span className="text-[10px] text-neutral-400 font-mono hidden sm:inline">
              • Client-side Zero-Knowledge Editor
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Undo Button */}
            <button
              type="button"
              onClick={handleUndo}
              disabled={!canUndo}
              className={`p-1.5 rounded-lg flex items-center gap-1 text-xs transition-colors cursor-pointer ${
                canUndo ? 'text-neutral-200 hover:bg-neutral-800' : 'text-neutral-600 cursor-not-allowed'
              }`}
              title="Undo last edit (Ctrl+Z)"
            >
              <Undo className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Undo</span>
            </button>

            {/* Reset to Original */}
            <button
              type="button"
              onClick={handleReset}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 text-xs transition-colors cursor-pointer"
              title="Reset all changes"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            <div className="h-4 w-px bg-neutral-800 mx-1" />

            {/* Cancel Button */}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
              title="Cancel"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Apply & Save Button */}
            <button
              type="button"
              onClick={handleSaveAndAttach}
              className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-md"
            >
              <Check className="w-3.5 h-3.5 stroke-[3]" />
              <span>Apply & Attach</span>
            </button>
          </div>
        </div>

        {/* Tools Selector Bar */}
        <div className="flex items-center justify-between px-4 py-2 bg-neutral-900/90 border-b border-neutral-800 flex-wrap gap-2 text-xs shrink-0">
          <div className="flex items-center gap-1 overflow-x-auto">
            {/* Blur / Pixelate Tool */}
            <button
              type="button"
              onClick={() => setActiveTool('blur')}
              className={`px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 font-medium transition-all cursor-pointer ${
                activeTool === 'blur'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                  : 'text-neutral-300 hover:bg-neutral-800'
              }`}
              title="Blur sensitive information (Drag rectangle)"
            >
              <EyeOff className="w-3.5 h-3.5 text-amber-400" />
              <span>Blur / Redact</span>
            </button>

            {/* Blackout Box */}
            <button
              type="button"
              onClick={() => setActiveTool('blackout')}
              className={`px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 font-medium transition-all cursor-pointer ${
                activeTool === 'blackout'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                  : 'text-neutral-300 hover:bg-neutral-800'
              }`}
              title="Solid Blackout bar"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
              <span>Blackout</span>
            </button>

            {/* Arrow Tool */}
            <button
              type="button"
              onClick={() => setActiveTool('arrow')}
              className={`px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 font-medium transition-all cursor-pointer ${
                activeTool === 'arrow'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                  : 'text-neutral-300 hover:bg-neutral-800'
              }`}
              title="Draw callout arrow"
            >
              <ArrowUpRight className="w-3.5 h-3.5 text-cyan-400" />
              <span>Arrow</span>
            </button>

            {/* Pen Tool */}
            <button
              type="button"
              onClick={() => setActiveTool('pen')}
              className={`px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 font-medium transition-all cursor-pointer ${
                activeTool === 'pen'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                  : 'text-neutral-300 hover:bg-neutral-800'
              }`}
              title="Freehand drawing"
            >
              <PenTool className="w-3.5 h-3.5 text-emerald-400" />
              <span>Draw</span>
            </button>

            {/* Text Tool */}
            <button
              type="button"
              onClick={() => setActiveTool('text')}
              className={`px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 font-medium transition-all cursor-pointer ${
                activeTool === 'text'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                  : 'text-neutral-300 hover:bg-neutral-800'
              }`}
              title="Add text label"
            >
              <Type className="w-3.5 h-3.5 text-violet-400" />
              <span>Text</span>
            </button>

            {/* Crop Tool */}
            <button
              type="button"
              onClick={() => setActiveTool('crop')}
              className={`px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 font-medium transition-all cursor-pointer ${
                activeTool === 'crop'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                  : 'text-neutral-300 hover:bg-neutral-800'
              }`}
              title="Crop image frame"
            >
              <Crop className="w-3.5 h-3.5 text-orange-400" />
              <span>Crop</span>
            </button>

            <div className="h-4 w-px bg-neutral-800 mx-1 shrink-0" />

            {/* Rotate 90° Clockwise */}
            <button
              type="button"
              onClick={handleRotateClockwise}
              className="px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 font-medium text-neutral-300 hover:bg-neutral-800 transition-all cursor-pointer"
              title="Rotate 90° Clockwise"
            >
              <RotateCw className="w-3.5 h-3.5 text-sky-400" />
              <span>Rotate</span>
            </button>

            {/* Flip Horizontal */}
            <button
              type="button"
              onClick={handleFlipHorizontal}
              className="px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 font-medium text-neutral-300 hover:bg-neutral-800 transition-all cursor-pointer"
              title="Flip Horizontally (Mirror)"
            >
              <FlipHorizontal className="w-3.5 h-3.5 text-indigo-400" />
              <span>Flip</span>
            </button>

            {/* Security Stamp Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setShowStampMenu(!showStampMenu);
                  setShowFilterMenu(false);
                }}
                className={`px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 font-medium transition-all cursor-pointer ${
                  showStampMenu ? 'bg-red-500/20 text-red-300 border border-red-500/40 shadow-sm' : 'text-neutral-300 hover:bg-neutral-800'
                }`}
                title="Stamp Security / Redaction Watermark"
              >
                <Shield className="w-3.5 h-3.5 text-red-400" />
                <span>Stamp</span>
              </button>

              {showStampMenu && (
                <div className="absolute top-full left-0 mt-1.5 bg-neutral-900 border border-neutral-700 rounded-xl p-1.5 shadow-2xl z-40 w-44 flex flex-col gap-1">
                  <span className="text-[10px] uppercase font-bold text-neutral-400 px-2 py-1">
                    Security Watermark
                  </span>
                  {[
                    { label: 'CONFIDENTIAL', desc: 'Protected information' },
                    { label: 'TOP SECRET', desc: 'Strict classification' },
                    { label: 'REDACTED', desc: 'Sanitized document' },
                    { label: 'ENCRYPTED', desc: 'End-to-End Encrypted' },
                    { label: 'VERIFIED', desc: 'Signature authentic' },
                  ].map((stamp) => (
                    <button
                      key={stamp.label}
                      type="button"
                      onClick={() => {
                        handleApplySecurityStamp(stamp.label);
                        setShowStampMenu(false);
                      }}
                      className="text-left px-2 py-1.5 rounded-lg hover:bg-red-950/40 text-neutral-200 hover:text-red-300 transition-colors flex flex-col cursor-pointer"
                    >
                      <span className="text-xs font-bold text-red-400">{stamp.label}</span>
                      <span className="text-[10px] text-neutral-400">{stamp.desc}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Visual Filters Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setShowFilterMenu(!showFilterMenu);
                  setShowStampMenu(false);
                }}
                className={`px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 font-medium transition-all cursor-pointer ${
                  showFilterMenu ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm' : 'text-neutral-300 hover:bg-neutral-800'
                }`}
                title="Apply photo filters"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Filter</span>
              </button>

              {showFilterMenu && (
                <div className="absolute top-full left-0 mt-1.5 bg-neutral-900 border border-neutral-700 rounded-xl p-1.5 shadow-2xl z-40 w-36 flex flex-col gap-1">
                  <span className="text-[10px] uppercase font-bold text-neutral-400 px-2 py-1">
                    Photo Filters
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      handleApplyFilter('grayscale');
                      setShowFilterMenu(false);
                    }}
                    className="text-left px-2 py-1.5 rounded-lg hover:bg-neutral-800 text-xs text-neutral-200 cursor-pointer"
                  >
                    B&W Grayscale
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      handleApplyFilter('invert');
                      setShowFilterMenu(false);
                    }}
                    className="text-left px-2 py-1.5 rounded-lg hover:bg-neutral-800 text-xs text-neutral-200 cursor-pointer"
                  >
                    Negative / Invert
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      handleApplyFilter('sepia');
                      setShowFilterMenu(false);
                    }}
                    className="text-left px-2 py-1.5 rounded-lg hover:bg-neutral-800 text-xs text-neutral-200 cursor-pointer"
                  >
                    Warm Sepia
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Color palette and brush thickness controls */}
          <div className="flex items-center gap-3">
            {['arrow', 'pen', 'text'].includes(activeTool) && (
              <>
                <div className="flex items-center gap-1.5">
                  {['#f59e0b', '#06b6d4', '#10b981', '#f43f5e', '#ffffff', '#000000'].map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setSelectedColor(color)}
                      style={{ backgroundColor: color }}
                      className={`w-5 h-5 rounded-full border cursor-pointer transition-transform ${
                        selectedColor === color ? 'scale-125 ring-2 ring-white border-white' : 'border-neutral-700'
                      }`}
                      title={color}
                    />
                  ))}
                </div>

                <div className="flex items-center gap-1 text-[11px] text-neutral-400">
                  <span>Size:</span>
                  <input
                    type="range"
                    min={2}
                    max={16}
                    value={brushSize}
                    onChange={(e) => setBrushSize(parseInt(e.target.value))}
                    className="w-16 h-1 bg-neutral-700 rounded appearance-none cursor-pointer accent-amber-400"
                  />
                </div>
              </>
            )}

            {activeTool === 'crop' && (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 bg-neutral-800 p-0.5 rounded-lg text-[10px]">
                  {(['free', '1:1', '4:3', '16:9'] as const).map((asp) => (
                    <button
                      key={asp}
                      type="button"
                      onClick={() => setCropAspect(asp)}
                      className={`px-2 py-0.5 rounded font-mono ${
                        cropAspect === asp ? 'bg-amber-500 text-neutral-950 font-bold' : 'text-neutral-400 hover:text-white'
                      }`}
                    >
                      {asp}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={handleApplyCrop}
                  className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-colors cursor-pointer"
                >
                  Confirm Crop
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Working Canvas Workspace */}
        <div className="flex-1 bg-neutral-950 p-4 flex items-center justify-center overflow-auto relative touch-none">
          <div className="relative inline-block max-w-full max-h-full">
            <canvas
              ref={canvasRef}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              onTouchCancel={handleTouchCancel}
              className={`max-w-full max-h-[70vh] object-contain rounded-lg shadow-xl cursor-crosshair`}
            />

            {/* Crop Draggable Overlay */}
            {activeTool === 'crop' && (
              <div
                style={{
                  left: `${cropBox.x * 100}%`,
                  top: `${cropBox.y * 100}%`,
                  width: `${cropBox.w * 100}%`,
                  height: `${cropBox.h * 100}%`,
                }}
                className="absolute border-2 border-dashed border-amber-400 bg-amber-400/10 pointer-events-none rounded"
              >
                <div className="absolute -top-6 left-0 px-2 py-0.5 bg-amber-500 text-neutral-950 text-[10px] font-bold rounded">
                  Drag to set crop area
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Text Annotation Prompt Overlay */}
        {textInputOpen && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-30 animate-in fade-in duration-150">
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 max-w-md w-full shadow-2xl flex flex-col gap-3">
              <span className="text-xs font-semibold text-neutral-200">
                Type text label to stamp on image:
              </span>
              <input
                type="text"
                autoFocus
                value={textValue}
                onChange={(e) => setTextValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleApplyText();
                  if (e.key === 'Escape') setTextInputOpen(false);
                }}
                placeholder="e.g. Confidential, Sensitive, Check here..."
                className="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-700 text-neutral-100 text-sm focus:outline-hidden focus:border-amber-400"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setTextInputOpen(false)}
                  className="px-3 py-1.5 rounded-lg text-xs text-neutral-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleApplyText}
                  className="px-3.5 py-1.5 rounded-lg bg-amber-500 text-neutral-950 font-bold text-xs hover:bg-amber-400"
                >
                  Stamp Text
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
export default ImageEditorModal;
