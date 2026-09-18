import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Pen,
  Highlighter,
  Eraser,
  Square,
  Circle,
  Triangle,
  Star,
  ArrowRight,
  Minus,
  Undo2,
  Redo2,
  Trash2,
  Download,
  Send,
  Maximize2,
  Minimize2,
  X,
  FileText,
  Palette,
  Check,
  Copy,
  SplitSquareHorizontal,
  Bold,
  Italic,
  Code,
  List,
  ListTodo,
  Heading1,
  Heading2,
  Sparkles,
  Cloud,
  Eye,
  Edit3,
  Type,
  StickyNote,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Search,
  Replace,
  Quote,
  Strikethrough,
  Table,
  HelpCircle,
  FileCode,
  CheckSquare,
  Grid,
  MousePointer,
  Hand,
  Diamond,
  MessageSquare,
  Zap,
  Magnet,
  Image as ImageIcon,
  Upload,
  ChevronsUp,
  ChevronsDown,
  ChevronDown,
  SlidersHorizontal,
  Move,
  FileJson,
  RotateCw,
  FlipHorizontal,
  FlipVertical,
  Lock,
  Unlock,
} from 'lucide-react';
import { doc, onSnapshot, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { sanitizeForFirestore } from '../lib/sanitize';
import { copyToClipboardSafe } from '../lib/security';
import { realTimeSocket } from '../lib/realtime-socket';
import {
  StrokePoint,
  CanvasTool,
  LineStyle,
  DrawingStroke,
  snapPoint,
  getStrokeBoundingBox,
  isPointNearStroke,
  generateSvgFromWhiteboard,
  rotateStroke,
  flipStroke,
  duplicateStroke,
  bringToFront,
  sendToBack,
  moveZOrder,
} from '../lib/whiteboard-utils';

export type { StrokePoint, CanvasTool, LineStyle, DrawingStroke };
export type GridType = 'grid' | 'dots' | 'blueprint' | 'blank';

export interface CollaborativeScratchpadModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomId: string;
  myUserId?: string;
  myUserName?: string;
  accentColor?: string;
  onSendMessageToChat?: (text: string) => void;
  onSendImageToChat?: (file: File, caption?: string) => void;
}

const COLOR_PALETTE = [
  { name: 'White', hex: '#f8fafc' },
  { name: 'Amber', hex: '#f59e0b' },
  { name: 'Emerald', hex: '#10b981' },
  { name: 'Sky', hex: '#0ea5e9' },
  { name: 'Rose', hex: '#f43f5e' },
  { name: 'Purple', hex: '#a855f7' },
  { name: 'Orange', hex: '#f97316' },
  { name: 'Cyan', hex: '#06b6d4' },
  { name: 'Yellow', hex: '#eab308' },
  { name: 'Slate', hex: '#64748b' },
];

const STROKE_WIDTHS = [
  { label: 'Fine', value: 2 },
  { label: 'Medium', value: 4 },
  { label: 'Thick', value: 8 },
  { label: 'Marker', value: 16 },
  { label: 'Jumbo', value: 28 },
];

const WHITEBOARD_STAMPS = [
  { id: 'confidential', label: 'CONFIDENTIAL', icon: '🛡️', color: '#ef4444' },
  { id: 'encrypted', label: 'E2EE ENCRYPTED', icon: '🔒', color: '#10b981' },
  { id: 'approved', label: 'APPROVED', icon: '✅', color: '#0ea5e9' },
  { id: 'review', label: 'SECURITY AUDIT', icon: '⚠️', color: '#f59e0b' },
  { id: 'cloud', label: 'CLOUD SERVICE', icon: '☁️', color: '#38bdf8' },
  { id: 'database', label: 'DATABASE CLUSTER', icon: '💾', color: '#8b5cf6' },
  { id: 'client', label: 'CLIENT ENCLAVE', icon: '🖥️', color: '#ec4899' },
  { id: 'api', label: 'API GATEWAY', icon: '🌐', color: '#14b8a6' },
];

const NOTE_TEMPLATES = [
  {
    id: 'meeting',
    name: '📋 Meeting Minutes',
    content: `# Meeting Minutes & Action Items
**Date:** ${new Date().toLocaleDateString()}
**Participants:** 

## 🎯 Key Decisions
1. 
2. 

## 📝 Discussion Topics
- **Topic A:** 
- **Topic B:** 

## ✅ Action Items
- [ ] Task 1 - @owner (Due: )
- [ ] Task 2 - @owner (Due: )
`,
  },
  {
    id: 'architecture',
    name: '🏗️ System Architecture',
    content: `# Cryptographic Architecture & Flow

## 🔐 Threat Model & Invariants
- Zero-knowledge ephemeral peer room
- Client-side AES-GCM-256 session enclave
- No server-side storage of plaintext keys

## 📡 Protocol Components
\`\`\`
[Alice Client] <--- AES-GCM Relay ---> [Bob Client]
        |                                    |
        +---- WebRTC Signaling / Audio ------+
\`\`\`

## 🛠️ Implementation Steps
- [x] Ephemeral handshake
- [ ] Peer-to-peer data channel fallback
`,
  },
  {
    id: 'bug',
    name: '🐞 Bug Report & Repro',
    content: `# Bug Triage & Repro Steps

**Severity:** Medium / High / Critical
**Reported At:** ${new Date().toLocaleTimeString()}

### 📌 Expected Behavior
Describe what should happen.

### ⚠️ Actual Behavior
Describe what actually occurred.

### 🔁 Repro Steps
1. Navigate to ...
2. Click on ...
3. Observe error in console:

\`\`\`
[Error stack trace or logs here]
\`\`\`

### 💡 Potential Fix
- Proposed patch or solution
`,
  },
  {
    id: 'audit',
    name: '🔒 E2EE Security Audit',
    content: `# E2EE Room Security Audit Checklist

- [x] Web Crypto AES-GCM 256-bit active
- [x] Anti-replay nonces verified (< 300s window)
- [x] Zero-width homograph attacks neutralized
- [x] CSP and CSWSH origin headers strictly validated
- [ ] Ephemeral burn-on-read timer active
- [ ] Volatile buffers wiped on room exit
`,
  },
];

export const CollaborativeScratchpadModal: React.FC<CollaborativeScratchpadModalProps> = ({
  isOpen,
  onClose,
  roomId,
  myUserId,
  myUserName,
  accentColor = '#f59e0b',
  onSendMessageToChat,
  onSendImageToChat,
}) => {
  const safeUserId = myUserId || 'anonymous_user';
  const safeUserName = myUserName || (myUserId ? `User ${myUserId.slice(-4)}` : 'Participant');

  const [activeTab, setActiveTab] = useState<'canvas' | 'notes' | 'split'>('canvas');
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Whiteboard Canvas State
  const [selectedTool, setSelectedTool] = useState<CanvasTool>('pen');
  const [selectedColor, setSelectedColor] = useState<string>('#f59e0b');
  const [selectedWidth, setSelectedWidth] = useState<number>(4);
  const [fillShape, setFillShape] = useState<boolean>(false);
  const [lineStyle, setLineStyle] = useState<LineStyle>('solid');
  const [strokeOpacity, setStrokeOpacity] = useState<number>(1.0);
  const [snapToGrid, setSnapToGrid] = useState<boolean>(false);
  const [gridType, setGridType] = useState<GridType>('grid');
  const [zoomLevel, setZoomLevel] = useState<number>(1.0);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [strokes, setStrokes] = useState<DrawingStroke[]>([]);
  const [undoStack, setUndoStack] = useState<DrawingStroke[][]>([]);
  const [redoStack, setRedoStack] = useState<DrawingStroke[][]>([]);

  // Selection & Transform State
  const [selectedStrokeId, setSelectedStrokeId] = useState<string | null>(null);
  const [canvasBgColor, setCanvasBgColor] = useState<string>('#090d16');
  const [isEditingExistingText, setIsEditingExistingText] = useState(false);

  // Menus & Dropdowns
  const [showShapesDropdown, setShowShapesDropdown] = useState(false);
  const [showStampsDropdown, setShowStampsDropdown] = useState(false);
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const [showCustomColorPicker, setShowCustomColorPicker] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [confirmClearWhiteboardOpen, setConfirmClearWhiteboardOpen] = useState(false);
  const [confirmClearNotesOpen, setConfirmClearNotesOpen] = useState(false);

  // Text, Speech & Sticky Note placement popup
  const [textPromptOpen, setTextPromptOpen] = useState(false);
  const [textPromptValue, setTextPromptValue] = useState('');
  const [pendingTextPoint, setPendingTextPoint] = useState<StrokePoint | null>(null);
  const [pendingToolType, setPendingToolType] = useState<'text' | 'sticky' | 'speech'>('text');

  // Notes State
  const [notesContent, setNotesContent] = useState<string>(
    '# Room Scratchpad\n\n- [ ] Real-time shared notes\n- [ ] Collaborative ideas & code snippets\n\n```ts\n// Feel free to draft notes together in real-time\n```'
  );
  const [notesPreviewMode, setNotesPreviewMode] = useState<'edit' | 'preview'>('edit');
  const [copiedNotes, setCopiedNotes] = useState(false);
  const [lastSyncBy, setLastSyncBy] = useState<string>('System');
  const [isSyncing, setIsSyncing] = useState(false);
  const [showTemplatesDropdown, setShowTemplatesDropdown] = useState(false);

  // Notes Find & Replace State
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [replaceQuery, setReplaceQuery] = useState('');
  const [searchMatchCount, setSearchMatchCount] = useState(0);

  // Canvas Refs & Internal State
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawingRef = useRef(false);
  const currentStrokeRef = useRef<DrawingStroke | null>(null);
  const isDraggingSelectionRef = useRef(false);
  const isPlacingTextDragRef = useRef(false);
  const dragStartPtRef = useRef<StrokePoint>({ x: 0, y: 0 });
  const strokesRef = useRef<DrawingStroke[]>(strokes);
  useEffect(() => {
    strokesRef.current = strokes;
  }, [strokes]);
  const isPanningRef = useRef(false);
  const panStartMouseRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const isSpacePressedRef = useRef(false);
  const [isSpacePressed, setIsSpacePressed] = useState(false);

  // Laser Pointer State
  const laserTrailRef = useRef<Array<{ x: number; y: number; time: number }>>([]);
  const laserAnimFrameRef = useRef<number | null>(null);

  // Image Cache for Canvas Rendering
  const imageCacheRef = useRef<Map<string, HTMLImageElement>>(new Map());

  // Hidden File Inputs
  const whiteboardImageInputRef = useRef<HTMLInputElement | null>(null);
  const whiteboardJsonInputRef = useRef<HTMLInputElement | null>(null);

  // Timers
  const notesDebounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const canvasSyncTimerRef = useRef<NodeJS.Timeout | null>(null);
  const remoteUpdateRef = useRef(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // -------------------------------------------------------------
  // Real-time Firestore Listeners for Canvas & Notes
  // -------------------------------------------------------------
  useEffect(() => {
    if (!isOpen || !roomId) return;

    // 1. Listen to Canvas document
    const canvasDocRef = doc(db, 'rooms', roomId, 'scratchpad', 'canvas');
    const unsubCanvas = onSnapshot(canvasDocRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (Array.isArray(data.strokes) && !isDrawingRef.current && !isDraggingSelectionRef.current) {
          remoteUpdateRef.current = true;
          setStrokes(data.strokes);
          if (data.lastUpdatedBy && data.lastUpdatedBy !== safeUserName) {
            setLastSyncBy(data.lastUpdatedBy);
          }
        }
      }
    });

    // 2. Listen to Notes document
    const notesDocRef = doc(db, 'rooms', roomId, 'scratchpad', 'notes');
    const unsubNotes = onSnapshot(notesDocRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (typeof data.content === 'string' && data.lastEditorId !== safeUserId) {
          setNotesContent(data.content);
          if (data.lastUpdatedBy) {
            setLastSyncBy(data.lastUpdatedBy);
          }
        }
      }
    });

    // 3. Ultra low-latency WebSocket tunnel sync (<10ms)
    const unsubSocket = realTimeSocket.onWhiteboard((payload) => {
      if (!payload) return;
      if (payload.action === 'stroke' && payload.stroke) {
        setStrokes((prev) => {
          if (prev.some((s) => s.id === payload.stroke.id)) return prev;
          return [...prev, payload.stroke];
        });
      } else if (payload.action === 'sync' && Array.isArray(payload.strokes)) {
        if (!isDrawingRef.current && !isDraggingSelectionRef.current) {
          setStrokes(payload.strokes);
        }
      } else if (payload.action === 'clear') {
        setStrokes([]);
        setSelectedStrokeId(null);
      }
    });

    return () => {
      unsubCanvas();
      unsubNotes();
      unsubSocket();
    };
  }, [isOpen, roomId, safeUserId, safeUserName]);

  // Sync canvas to Firestore with throttle
  const syncCanvasToFirestore = useCallback(
    (newStrokes: DrawingStroke[]) => {
      if (!roomId) return;
      setIsSyncing(true);
      if (canvasSyncTimerRef.current) clearTimeout(canvasSyncTimerRef.current);
      canvasSyncTimerRef.current = setTimeout(async () => {
        try {
          const cleanStrokes = (newStrokes || []).map((s) => ({
            id: s.id || `stroke_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            tool: s.tool || 'pen',
            color: s.color || '#f59e0b',
            width: Number(s.width) || 4,
            points: Array.isArray(s.points)
              ? s.points.map((p) => ({ x: Number(p.x) || 0, y: Number(p.y) || 0 }))
              : [],
            createdBy: s.createdBy || safeUserName,
            fill: Boolean(s.fill),
            text: typeof s.text === 'string' ? s.text : '',
            fontSize: Number(s.fontSize) || 16,
            lineStyle: s.lineStyle || 'solid',
            opacity: typeof s.opacity === 'number' ? s.opacity : 1.0,
            stampType: typeof s.stampType === 'string' ? s.stampType : '',
            imageUrl: typeof s.imageUrl === 'string' ? s.imageUrl : '',
            dimensions: s.dimensions ? { width: Number(s.dimensions.width), height: Number(s.dimensions.height) } : undefined,
            isLocked: Boolean(s.isLocked),
            rotation: Number(s.rotation) || 0,
          }));

          // Direct socket broadcast to peer (<10ms)
          realTimeSocket.sendWhiteboard({ action: 'sync', strokes: cleanStrokes });

          const canvasDocRef = doc(db, 'rooms', roomId, 'scratchpad', 'canvas');
          await setDoc(
            canvasDocRef,
            sanitizeForFirestore({
              strokes: cleanStrokes,
              lastEditorId: safeUserId,
              lastUpdatedBy: safeUserName,
              updatedAt: serverTimestamp(),
            }),
            { merge: true }
          );
        } catch (err) {
          console.error('[Scratchpad] Failed to sync canvas:', err);
        } finally {
          setIsSyncing(false);
        }
      }, 350);
    },
    [roomId, safeUserId, safeUserName]
  );

  // Sync notes to Firestore with debounce
  const syncNotesToFirestore = useCallback(
    (text: string) => {
      if (!roomId) return;
      setIsSyncing(true);
      if (notesDebounceTimerRef.current) clearTimeout(notesDebounceTimerRef.current);
      notesDebounceTimerRef.current = setTimeout(async () => {
        try {
          const notesDocRef = doc(db, 'rooms', roomId, 'scratchpad', 'notes');
          await setDoc(
            notesDocRef,
            sanitizeForFirestore({
              content: typeof text === 'string' ? text : '',
              lastEditorId: safeUserId,
              lastUpdatedBy: safeUserName,
              updatedAt: serverTimestamp(),
            }),
            { merge: true }
          );
        } catch (err) {
          console.error('[Scratchpad] Failed to sync notes:', err);
        } finally {
          setIsSyncing(false);
        }
      }, 500);
    },
    [roomId, safeUserId, safeUserName]
  );

  // -------------------------------------------------------------
  // Redraw Canvas (incorporating Zoom, Pan Offset, Grid, Strokes, Selection HUD, Laser)
  // -------------------------------------------------------------
  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Reset transform to identity then clear
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const dpr = window.devicePixelRatio || 1;
    // Apply DPR and user zoom level
    ctx.scale(dpr * zoomLevel, dpr * zoomLevel);
    // Apply Viewport Pan Offset
    ctx.translate(panOffset.x, panOffset.y);

    const effectiveWidth = canvas.width / (dpr * zoomLevel);
    const effectiveHeight = canvas.height / (dpr * zoomLevel);

    // Visible canvas bounding coordinates in world space
    const vLeft = -panOffset.x;
    const vTop = -panOffset.y;
    const vRight = effectiveWidth - panOffset.x;
    const vBottom = effectiveHeight - panOffset.y;

    // 1. Draw Canvas Background & Grid
    ctx.save();
    const bgFill = canvasBgColor || (gridType === 'blueprint' ? '#0a1026' : '#090d16');
    const isLightBg = bgFill === '#f8fafc' || bgFill === '#fefce8';
    ctx.fillStyle = bgFill;
    ctx.fillRect(vLeft, vTop, effectiveWidth, effectiveHeight);

    const gridSize = 24;
    const startX = Math.floor(vLeft / gridSize) * gridSize;
    const startY = Math.floor(vTop / gridSize) * gridSize;

    if (gridType === 'blueprint') {
      ctx.strokeStyle = isLightBg ? '#93c5fd55' : '#1e3a8a35';
      ctx.lineWidth = 1;
      for (let x = startX; x <= vRight; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, vTop);
        ctx.lineTo(x, vBottom);
        ctx.stroke();
      }
      for (let y = startY; y <= vBottom; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(vLeft, y);
        ctx.lineTo(vRight, y);
        ctx.stroke();
      }
    } else if (gridType === 'dots') {
      ctx.fillStyle = isLightBg ? '#cbd5e1' : '#334155';
      for (let x = startX; x <= vRight; x += gridSize) {
        for (let y = startY; y <= vBottom; y += gridSize) {
          ctx.beginPath();
          ctx.arc(x, y, 1.2, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    } else if (gridType === 'grid') {
      ctx.strokeStyle = isLightBg ? '#e2e8f0' : '#1e293b';
      ctx.lineWidth = 1;
      for (let x = startX; x <= vRight; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, vTop);
        ctx.lineTo(x, vBottom);
        ctx.stroke();
      }
      for (let y = startY; y <= vBottom; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(vLeft, y);
        ctx.lineTo(vRight, y);
        ctx.stroke();
      }
    }
    ctx.restore();

    // 2. Render all strokes
    strokes.forEach((stroke) => {
      if (!stroke.points || stroke.points.length === 0) return;
      ctx.save();
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      // Apply stroke rotation transform
      const bbox = getStrokeBoundingBox(stroke);
      if (stroke.rotation) {
        ctx.translate(bbox.centerX, bbox.centerY);
        ctx.rotate((stroke.rotation * Math.PI) / 180);
        ctx.translate(-bbox.centerX, -bbox.centerY);
      }

      // Line Dash Style
      if (stroke.lineStyle === 'dashed') {
        ctx.setLineDash([10, 6]);
      } else if (stroke.lineStyle === 'dotted') {
        ctx.setLineDash([3, 6]);
      } else {
        ctx.setLineDash([]);
      }

      // Opacity
      const alpha = typeof stroke.opacity === 'number' ? stroke.opacity : 1.0;
      if (stroke.tool === 'highlighter') {
        ctx.strokeStyle = stroke.color;
        ctx.globalAlpha = 0.35 * alpha;
        ctx.lineWidth = stroke.width * 2.5;
      } else if (stroke.tool === 'eraser') {
        ctx.strokeStyle = bgFill;
        ctx.lineWidth = stroke.width * 3;
        ctx.globalAlpha = 1.0;
      } else {
        ctx.strokeStyle = stroke.color;
        ctx.globalAlpha = alpha;
        ctx.lineWidth = stroke.width;
      }

      // Shape Fill setup
      if (stroke.fill) {
        ctx.fillStyle = `${stroke.color}33`; // 20% opacity fill
      }

      if (stroke.tool === 'rectangle' && stroke.points.length >= 2) {
        const start = stroke.points[0];
        const end = stroke.points[stroke.points.length - 1];
        const rw = end.x - start.x;
        const rh = end.y - start.y;
        if (stroke.fill) ctx.fillRect(start.x, start.y, rw, rh);
        ctx.strokeRect(start.x, start.y, rw, rh);
      } else if (stroke.tool === 'circle' && stroke.points.length >= 2) {
        const start = stroke.points[0];
        const end = stroke.points[stroke.points.length - 1];
        const rx = Math.abs(end.x - start.x) / 2;
        const ry = Math.abs(end.y - start.y) / 2;
        const cx = Math.min(start.x, end.x) + rx;
        const cy = Math.min(start.y, end.y) + ry;
        ctx.beginPath();
        ctx.ellipse(cx, cy, Math.max(1, rx), Math.max(1, ry), 0, 0, Math.PI * 2);
        if (stroke.fill) ctx.fill();
        ctx.stroke();
      } else if (stroke.tool === 'diamond' && stroke.points.length >= 2) {
        ctx.beginPath();
        ctx.moveTo(bbox.centerX, bbox.minY);
        ctx.lineTo(bbox.maxX, bbox.centerY);
        ctx.lineTo(bbox.centerX, bbox.maxY);
        ctx.lineTo(bbox.minX, bbox.centerY);
        ctx.closePath();
        if (stroke.fill) ctx.fill();
        ctx.stroke();
      } else if (stroke.tool === 'triangle' && stroke.points.length >= 2) {
        const start = stroke.points[0];
        const end = stroke.points[stroke.points.length - 1];
        ctx.beginPath();
        ctx.moveTo((start.x + end.x) / 2, start.y);
        ctx.lineTo(end.x, end.y);
        ctx.lineTo(start.x, end.y);
        ctx.closePath();
        if (stroke.fill) ctx.fill();
        ctx.stroke();
      } else if (stroke.tool === 'star' && stroke.points.length >= 2) {
        const start = stroke.points[0];
        const end = stroke.points[stroke.points.length - 1];
        const cx = (start.x + end.x) / 2;
        const cy = (start.y + end.y) / 2;
        const outerR = Math.max(10, Math.hypot(end.x - start.x, end.y - start.y) / 2);
        const innerR = outerR * 0.45;
        const spikes = 5;
        let rot = (Math.PI / 2) * 3;
        const step = Math.PI / spikes;

        ctx.beginPath();
        ctx.moveTo(cx, cy - outerR);
        for (let i = 0; i < spikes; i++) {
          let x = cx + Math.cos(rot) * outerR;
          let y = cy + Math.sin(rot) * outerR;
          ctx.lineTo(x, y);
          rot += step;

          x = cx + Math.cos(rot) * innerR;
          y = cy + Math.sin(rot) * innerR;
          ctx.lineTo(x, y);
          rot += step;
        }
        ctx.lineTo(cx, cy - outerR);
        ctx.closePath();
        if (stroke.fill) ctx.fill();
        ctx.stroke();
      } else if (stroke.tool === 'speech') {
        const x = bbox.minX;
        const y = bbox.minY;
        const w = bbox.width;
        const h = Math.max(32, bbox.height - 14);
        ctx.beginPath();
        ctx.roundRect(x, y, w, h, 10);
        ctx.moveTo(x + 20, y + h);
        ctx.lineTo(x + 12, y + h + 12);
        ctx.lineTo(x + 36, y + h);
        if (stroke.fill) ctx.fill();
        ctx.stroke();
        if (stroke.text) {
          ctx.font = `600 ${stroke.fontSize || 13}px system-ui, sans-serif`;
          ctx.fillStyle = stroke.color;
          ctx.fillText(stroke.text, x + 10, y + h / 2 + 5);
        }
      } else if (stroke.tool === 'line' && stroke.points.length >= 2) {
        const start = stroke.points[0];
        const end = stroke.points[stroke.points.length - 1];
        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
        ctx.stroke();
      } else if (stroke.tool === 'arrow' && stroke.points.length >= 2) {
        const start = stroke.points[0];
        const end = stroke.points[stroke.points.length - 1];
        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
        ctx.stroke();

        const angle = Math.atan2(end.y - start.y, end.x - start.x);
        const headLen = stroke.width * 3.5 + 8;
        ctx.beginPath();
        ctx.moveTo(end.x, end.y);
        ctx.lineTo(
          end.x - headLen * Math.cos(angle - Math.PI / 6),
          end.y - headLen * Math.sin(angle - Math.PI / 6)
        );
        ctx.moveTo(end.x, end.y);
        ctx.lineTo(
          end.x - headLen * Math.cos(angle + Math.PI / 6),
          end.y - headLen * Math.sin(angle + Math.PI / 6)
        );
        ctx.stroke();
      } else if (stroke.tool === 'text') {
        const pt = stroke.points[0];
        const fontSize = stroke.fontSize || 18;
        ctx.font = `600 ${fontSize}px system-ui, -apple-system, sans-serif`;
        ctx.fillStyle = stroke.color;
        const lines = (stroke.text || '').split('\n');
        const lineHeight = fontSize * 1.3;
        lines.forEach((line, idx) => {
          ctx.fillText(line, pt.x, pt.y + idx * lineHeight);
        });
      } else if (stroke.tool === 'sticky') {
        const pt = stroke.points[0];
        const noteWidth = 150;
        const noteHeight = 110;
        ctx.save();
        ctx.fillStyle = stroke.color || '#fef08a';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
        ctx.shadowBlur = 8;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 4;
        ctx.beginPath();
        ctx.roundRect(pt.x, pt.y, noteWidth, noteHeight, 6);
        ctx.fill();
        ctx.restore();

        // Pin icon
        ctx.fillStyle = '#dc2626';
        ctx.beginPath();
        ctx.arc(pt.x + noteWidth / 2, pt.y + 10, 4, 0, Math.PI * 2);
        ctx.fill();

        // Note content
        ctx.fillStyle = '#1e293b';
        ctx.font = '500 13px system-ui, -apple-system, sans-serif';
        const lines = (stroke.text || '').split('\n');
        lines.forEach((line, idx) => {
          if (idx < 4) {
            ctx.fillText(line.substring(0, 18), pt.x + 12, pt.y + 32 + idx * 18);
          }
        });
      } else if (stroke.tool === 'stamp') {
        const pt = stroke.points[0];
        const w = stroke.dimensions?.width || 160;
        const h = stroke.dimensions?.height || 42;
        ctx.save();
        ctx.fillStyle = '#0f172a';
        ctx.shadowColor = `${stroke.color}40`;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.roundRect(pt.x, pt.y, w, h, 8);
        ctx.fill();
        ctx.strokeStyle = stroke.color;
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = `${stroke.color}25`;
        ctx.fillRect(pt.x, pt.y, 36, h);

        const stampDef = WHITEBOARD_STAMPS.find((st) => st.id === stroke.stampType);
        const iconEmoji = stampDef?.icon || '📌';
        ctx.font = '16px system-ui, sans-serif';
        ctx.fillText(iconEmoji, pt.x + 8, pt.y + 27);

        ctx.font = 'bold 11px system-ui, sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.fillText(stroke.text || stampDef?.label || 'SECURITY BADGE', pt.x + 44, pt.y + 26);
        ctx.restore();
      } else if (stroke.tool === 'image' && stroke.imageUrl) {
        const pt = stroke.points[0];
        const w = stroke.dimensions?.width || 180;
        const h = stroke.dimensions?.height || 130;
        let img = imageCacheRef.current.get(stroke.imageUrl);
        if (!img) {
          img = new Image();
          img.src = stroke.imageUrl;
          img.onload = () => redrawCanvas();
          imageCacheRef.current.set(stroke.imageUrl, img);
        }
        if (img.complete && img.naturalWidth > 0) {
          ctx.save();
          ctx.beginPath();
          ctx.roundRect(pt.x, pt.y, w, h, 8);
          ctx.clip();
          ctx.drawImage(img, pt.x, pt.y, w, h);
          ctx.restore();
          ctx.strokeStyle = '#ffffff25';
          ctx.lineWidth = 1;
          ctx.strokeRect(pt.x, pt.y, w, h);
        }
      } else {
        // Freehand Pen / Highlighter / Eraser
        ctx.beginPath();
        ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
        for (let i = 1; i < stroke.points.length; i++) {
          ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
        }
        ctx.stroke();
      }
      ctx.restore();
    });

    // 3. Render Selection Bounding Box & Handles
    if (selectedStrokeId) {
      const selected = strokes.find((s) => s.id === selectedStrokeId);
      if (selected) {
        const bbox = getStrokeBoundingBox(selected);
        const pad = 6;
        ctx.save();
        if (selected.rotation) {
          ctx.translate(bbox.centerX, bbox.centerY);
          ctx.rotate((selected.rotation * Math.PI) / 180);
          ctx.translate(-bbox.centerX, -bbox.centerY);
        }

        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([5, 4]);
        ctx.strokeRect(bbox.minX - pad, bbox.minY - pad, bbox.width + pad * 2, bbox.height + pad * 2);

        // Corner handles
        ctx.fillStyle = '#38bdf8';
        ctx.setLineDash([]);
        const hs = 6;
        const corners = [
          { x: bbox.minX - pad, y: bbox.minY - pad },
          { x: bbox.maxX + pad, y: bbox.minY - pad },
          { x: bbox.maxX + pad, y: bbox.maxY + pad },
          { x: bbox.minX - pad, y: bbox.maxY + pad },
        ];
        corners.forEach((c) => {
          ctx.fillRect(c.x - hs / 2, c.y - hs / 2, hs, hs);
        });

        // Tool Badge Tag
        ctx.font = 'bold 10px system-ui, sans-serif';
        const tag = `${selected.tool.toUpperCase()}${selected.rotation ? ` (${selected.rotation}°)` : ''}`;
        const tagW = ctx.measureText(tag).width + 8;
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(bbox.minX - pad, bbox.minY - pad - 16, tagW, 14);
        ctx.fillStyle = '#090d16';
        ctx.fillText(tag, bbox.minX - pad + 4, bbox.minY - pad - 5);
        ctx.restore();
      }
    }

    // 3.5. Render Live Text / Sticky Note / Speech Placement Ghost Indicator
    if (textPromptOpen && pendingTextPoint) {
      ctx.save();
      const pt = pendingTextPoint;
      const strokeColor = pendingToolType === 'sticky' ? '#f59e0b' : pendingToolType === 'speech' ? '#10b981' : '#38bdf8';
      ctx.strokeStyle = strokeColor;
      ctx.fillStyle = pendingToolType === 'sticky' ? 'rgba(245, 158, 11, 0.18)' : pendingToolType === 'speech' ? 'rgba(16, 185, 129, 0.18)' : 'rgba(56, 189, 248, 0.18)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);

      const w = pendingToolType === 'sticky' ? 150 : pendingToolType === 'speech' ? 140 : Math.max(130, (textPromptValue.length || 8) * 10);
      const h = pendingToolType === 'sticky' ? 110 : pendingToolType === 'speech' ? 54 : 36;
      ctx.strokeRect(pt.x, pt.y, w, h);
      ctx.fillRect(pt.x, pt.y, w, h);

      // Drag badge
      ctx.setLineDash([]);
      ctx.fillStyle = strokeColor;
      ctx.fillRect(pt.x, pt.y - 18, 134, 16);
      ctx.fillStyle = '#090d16';
      ctx.font = 'bold 9px system-ui, sans-serif';
      ctx.fillText('✥ DRAG TO REPOSITION', pt.x + 4, pt.y - 6);

      if (textPromptValue) {
        ctx.fillStyle = '#ffffff';
        ctx.font = '12px system-ui, sans-serif';
        ctx.fillText(textPromptValue.slice(0, 22), pt.x + 8, pt.y + 20);
      }
      ctx.restore();
    }

    // 4. Render Laser Pointer Trail
    const now = Date.now();
    const activeLaser = laserTrailRef.current.filter((p) => now - p.time < 1100);
    if (activeLaser.length > 1) {
      ctx.save();
      for (let i = 1; i < activeLaser.length; i++) {
        const p1 = activeLaser[i - 1];
        const p2 = activeLaser[i];
        const progress = 1 - (now - p2.time) / 1100;
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.strokeStyle = `rgba(244, 63, 94, ${progress * 0.9})`;
        ctx.lineWidth = Math.max(2, 7 * progress);
        ctx.lineCap = 'round';
        ctx.shadowColor = '#f43f5e';
        ctx.shadowBlur = 12 * progress;
        ctx.stroke();
      }
      ctx.restore();
    }
  }, [strokes, gridType, zoomLevel, panOffset, selectedStrokeId]);

  useEffect(() => {
    redrawCanvas();
  }, [strokes, redrawCanvas]);

  // Handle Canvas Resize
  useEffect(() => {
    if (!isOpen) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const updateCanvasSize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const rect = parent.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      redrawCanvas();
    };

    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);
    return () => window.removeEventListener('resize', updateCanvasSize);
  }, [isOpen, activeTab, isFullscreen, redrawCanvas]);

  // Laser Pointer Animation Loop
  const animateLaser = useCallback(() => {
    const now = Date.now();
    laserTrailRef.current = laserTrailRef.current.filter((p) => now - p.time < 1100);
    redrawCanvas();
    if (laserTrailRef.current.length > 0) {
      laserAnimFrameRef.current = requestAnimationFrame(animateLaser);
    } else {
      laserAnimFrameRef.current = null;
    }
  }, [redrawCanvas]);

  // -------------------------------------------------------------
  // Keyboard Shortcuts (V, H, P, K, E, R, C, D, L, A, T, S, Z, Del, Ctrl+D, Ctrl+Z, Ctrl+Y, Space)
  // -------------------------------------------------------------
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA')) {
        return;
      }

      // Spacebar hold for temporary Pan
      if (e.code === 'Space' && !e.repeat) {
        e.preventDefault();
        isSpacePressedRef.current = true;
        setIsSpacePressed(true);
      }

      // Undo / Redo
      if ((e.ctrlKey || e.metaKey) && (e.key === 'z' || e.key === 'Z')) {
        e.preventDefault();
        if (e.shiftKey) handleRedo();
        else handleUndo();
        return;
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || e.key === 'Y')) {
        e.preventDefault();
        handleRedo();
        return;
      }

      // Duplicate Selected Object
      if ((e.ctrlKey || e.metaKey) && (e.key === 'd' || e.key === 'D')) {
        e.preventDefault();
        handleDuplicateSelected();
        return;
      }

      // Delete Selected Object
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedStrokeId) {
          e.preventDefault();
          handleDeleteSelected();
        }
        return;
      }

      // Escape to Deselect
      if (e.key === 'Escape') {
        setSelectedStrokeId(null);
        setShowShapesDropdown(false);
        setShowStampsDropdown(false);
        setShowExportDropdown(false);
        return;
      }

      // Tool Hotkeys
      switch (e.key.toLowerCase()) {
        case 'v':
          setSelectedTool('select');
          break;
        case 'h':
          setSelectedTool('hand');
          break;
        case 'p':
          setSelectedTool('pen');
          break;
        case 'k':
          setSelectedTool('highlighter');
          break;
        case 'e':
          setSelectedTool('eraser');
          break;
        case 'r':
          setSelectedTool('rectangle');
          break;
        case 'c':
          setSelectedTool('circle');
          break;
        case 'd':
          setSelectedTool('diamond');
          break;
        case 'l':
          setSelectedTool('line');
          break;
        case 'a':
          setSelectedTool('arrow');
          break;
        case 't':
          setSelectedTool('text');
          break;
        case 's':
          setSelectedTool('sticky');
          break;
        case 'z':
          setSelectedTool('laser');
          break;
        default:
          break;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        isSpacePressedRef.current = false;
        setIsSpacePressed(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isOpen, selectedStrokeId, strokes, undoStack, redoStack]);

  // -------------------------------------------------------------
  // Canvas Coordinate Mapping with Zoom, Pan & Grid Snap
  // -------------------------------------------------------------
  const getCanvasCoordinates = (e: React.PointerEvent<HTMLCanvasElement>): StrokePoint => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const rawX = (e.clientX - rect.left) / zoomLevel - panOffset.x;
    const rawY = (e.clientY - rect.top) / zoomLevel - panOffset.y;
    return snapToGrid ? snapPoint({ x: rawX, y: rawY }, 24, true) : { x: rawX, y: rawY };
  };

  // Pointer Down Handler
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const pt = getCanvasCoordinates(e);

    // 0. If Text / Sticky / Speech prompt modal is open, clicking or dragging on canvas updates placement position
    if (textPromptOpen) {
      setPendingTextPoint(pt);
      isPlacingTextDragRef.current = true;
      e.currentTarget.setPointerCapture(e.pointerId);
      return;
    }

    // 1. Pan Viewport with Hand Tool or Spacebar
    if (selectedTool === 'hand' || isSpacePressedRef.current) {
      e.currentTarget.setPointerCapture(e.pointerId);
      isPanningRef.current = true;
      panStartMouseRef.current = { x: e.clientX, y: e.clientY };
      return;
    }

    // 2. Selection & Transform Mode
    if (selectedTool === 'select') {
      // Check if clicking on an existing stroke (iterating backwards from top-most)
      let foundStroke: DrawingStroke | null = null;
      for (let i = strokes.length - 1; i >= 0; i--) {
        if (isPointNearStroke(pt, strokes[i])) {
          foundStroke = strokes[i];
          break;
        }
      }

      if (foundStroke) {
        setSelectedStrokeId(foundStroke.id);
        isDraggingSelectionRef.current = true;
        dragStartPtRef.current = pt;
        e.currentTarget.setPointerCapture(e.pointerId);
      } else {
        setSelectedStrokeId(null);
      }
      return;
    }

    // 3. Laser Pointer Mode
    if (selectedTool === 'laser') {
      isDrawingRef.current = true;
      laserTrailRef.current = [{ x: pt.x, y: pt.y, time: Date.now() }];
      if (!laserAnimFrameRef.current) {
        laserAnimFrameRef.current = requestAnimationFrame(animateLaser);
      }
      return;
    }

    // 4. Text, Sticky Note, or Speech Bubble modal prompt
    if (selectedTool === 'text' || selectedTool === 'sticky' || selectedTool === 'speech') {
      // Check if clicking on existing stroke to select or move it
      let foundStroke: DrawingStroke | null = null;
      for (let i = strokes.length - 1; i >= 0; i--) {
        if (isPointNearStroke(pt, strokes[i])) {
          foundStroke = strokes[i];
          break;
        }
      }

      if (foundStroke) {
        setSelectedStrokeId(foundStroke.id);
        isDraggingSelectionRef.current = true;
        dragStartPtRef.current = pt;
        e.currentTarget.setPointerCapture(e.pointerId);
        return;
      }

      setPendingTextPoint(pt);
      setPendingToolType(selectedTool);
      setTextPromptValue('');
      setIsEditingExistingText(false);
      setTextPromptOpen(true);
      isPlacingTextDragRef.current = true;
      e.currentTarget.setPointerCapture(e.pointerId);
      return;
    }

    // 5. Normal Drawing & Geometric Shapes
    e.currentTarget.setPointerCapture(e.pointerId);
    isDrawingRef.current = true;

    const newStroke: DrawingStroke = {
      id: `stroke_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      tool: selectedTool || 'pen',
      color: selectedColor || '#f59e0b',
      width: selectedWidth || 4,
      points: [pt],
      createdBy: safeUserName,
      fill: fillShape,
      lineStyle: lineStyle,
      opacity: strokeOpacity,
    };

    currentStrokeRef.current = newStroke;
    setUndoStack((prev) => [...prev, strokes]);
    setRedoStack([]);
    setStrokes((prev) => [...prev, newStroke]);
  };

  // Pointer Move Handler
  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    // 0. Dragging text / sticky / speech placement target
    if (isPlacingTextDragRef.current) {
      const pt = getCanvasCoordinates(e);
      setPendingTextPoint(pt);
      return;
    }

    // 1. Pan Viewport Move
    if (isPanningRef.current) {
      const dx = (e.clientX - panStartMouseRef.current.x) / zoomLevel;
      const dy = (e.clientY - panStartMouseRef.current.y) / zoomLevel;
      setPanOffset((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
      panStartMouseRef.current = { x: e.clientX, y: e.clientY };
      return;
    }

    const pt = getCanvasCoordinates(e);

    // 2. Dragging Selected Object
    if (isDraggingSelectionRef.current && selectedStrokeId) {
      const selectedObj = strokes.find((s) => s.id === selectedStrokeId);
      if (selectedObj?.isLocked) return;
      const dx = pt.x - dragStartPtRef.current.x;
      const dy = pt.y - dragStartPtRef.current.y;
      dragStartPtRef.current = pt;

      setStrokes((prev) =>
        prev.map((s) => {
          if (s.id !== selectedStrokeId) return s;
          return {
            ...s,
            points: s.points.map((p) => ({ x: p.x + dx, y: p.y + dy })),
          };
        })
      );
      return;
    }

    // 3. Laser Pointer Move
    if (selectedTool === 'laser' && isDrawingRef.current) {
      laserTrailRef.current.push({ x: pt.x, y: pt.y, time: Date.now() });
      if (!laserAnimFrameRef.current) {
        laserAnimFrameRef.current = requestAnimationFrame(animateLaser);
      }
      return;
    }

    // 4. Standard Drawing Move
    if (!isDrawingRef.current || !currentStrokeRef.current) return;

    const curr = currentStrokeRef.current;
    const isGeometric = [
      'rectangle',
      'circle',
      'diamond',
      'triangle',
      'star',
      'speech',
      'line',
      'arrow',
    ].includes(curr.tool);

    if (isGeometric) {
      curr.points = [curr.points[0], pt];
    } else {
      curr.points.push(pt);
    }

    setStrokes((prev) => {
      const copy = [...prev];
      copy[copy.length - 1] = { ...curr, points: [...curr.points] };
      return copy;
    });
  };

  // Pointer Up Handler
  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    // 0. End placing text drag
    if (isPlacingTextDragRef.current) {
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {}
      isPlacingTextDragRef.current = false;
      return;
    }

    // 1. End Pan
    if (isPanningRef.current) {
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {}
      isPanningRef.current = false;
      return;
    }

    // 2. End Dragging Selection
    if (isDraggingSelectionRef.current) {
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {}
      isDraggingSelectionRef.current = false;
      syncCanvasToFirestore(strokesRef.current);
      realTimeSocket.sendWhiteboard({ action: 'sync', strokes: strokesRef.current });
      return;
    }

    // 3. End Laser
    if (selectedTool === 'laser') {
      isDrawingRef.current = false;
      return;
    }

    // 4. End Drawing
    if (!isDrawingRef.current) return;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}
    isDrawingRef.current = false;
    if (currentStrokeRef.current) {
      realTimeSocket.sendWhiteboard({ action: 'stroke', stroke: currentStrokeRef.current });
    }
    currentStrokeRef.current = null;
    syncCanvasToFirestore(strokesRef.current);
  };

  // Submit Text or Sticky Note annotation
  const handleSubmitTextAnnotation = () => {
    if (!textPromptValue.trim()) {
      setTextPromptOpen(false);
      setIsEditingExistingText(false);
      return;
    }

    if (isEditingExistingText && selectedStrokeId) {
      setUndoStack((prev) => [...prev, strokes]);
      setRedoStack([]);
      const updated = strokes.map((s) =>
        s.id === selectedStrokeId ? { ...s, text: textPromptValue.trim() } : s
      );
      setStrokes(updated);
      syncCanvasToFirestore(updated);
      realTimeSocket.sendWhiteboard({ action: 'sync', strokes: updated });
      setTextPromptOpen(false);
      setIsEditingExistingText(false);
      setTextPromptValue('');
      showToast('Text updated');
      return;
    }

    if (!pendingTextPoint) {
      setTextPromptOpen(false);
      return;
    }

    const newStroke: DrawingStroke = {
      id: `stroke_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      tool: pendingToolType,
      color: pendingToolType === 'sticky' ? '#fef08a' : selectedColor,
      width: 2,
      points: [pendingTextPoint],
      createdBy: safeUserName,
      text: textPromptValue.trim(),
      fontSize: selectedWidth * 3 + 12,
      lineStyle: 'solid',
      opacity: 1.0,
      fill: pendingToolType === 'speech' || fillShape,
    };

    setUndoStack((prev) => [...prev, strokes]);
    setRedoStack([]);
    const updated = [...strokes, newStroke];
    setStrokes(updated);
    syncCanvasToFirestore(updated);
    realTimeSocket.sendWhiteboard({ action: 'stroke', stroke: newStroke });
    setTextPromptOpen(false);
    setTextPromptValue('');
    setPendingTextPoint(null);
  };

  // Place Architecture / Review Stamp
  const handlePlaceStamp = (stampDef: (typeof WHITEBOARD_STAMPS)[0]) => {
    const canvas = canvasRef.current;
    const dpr = window.devicePixelRatio || 1;
    const w = canvas ? canvas.width / (dpr * zoomLevel) : 800;
    const h = canvas ? canvas.height / (dpr * zoomLevel) : 600;
    // Place near center of visible viewport
    const pt: StrokePoint = {
      x: -panOffset.x + w / 2 - 80,
      y: -panOffset.y + h / 2 - 20,
    };

    const newStroke: DrawingStroke = {
      id: `stroke_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      tool: 'stamp',
      stampType: stampDef.id,
      color: stampDef.color,
      width: 2,
      points: [pt],
      createdBy: safeUserName,
      text: stampDef.label,
      dimensions: { width: 170, height: 44 },
    };

    setUndoStack((prev) => [...prev, strokes]);
    setRedoStack([]);
    const updated = [...strokes, newStroke];
    setStrokes(updated);
    setSelectedStrokeId(newStroke.id);
    syncCanvasToFirestore(updated);
    setShowStampsDropdown(false);
    showToast(`Placed ${stampDef.label} stamp`);
  };

  // Image Upload onto Whiteboard
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (!dataUrl) return;

      const img = new Image();
      img.onload = () => {
        const maxDim = 240;
        let iw = img.naturalWidth;
        let ih = img.naturalHeight;
        if (iw > maxDim || ih > maxDim) {
          const ratio = Math.min(maxDim / iw, maxDim / ih);
          iw = Math.round(iw * ratio);
          ih = Math.round(ih * ratio);
        }

        const canvas = canvasRef.current;
        const dpr = window.devicePixelRatio || 1;
        const cw = canvas ? canvas.width / (dpr * zoomLevel) : 800;
        const ch = canvas ? canvas.height / (dpr * zoomLevel) : 600;
        const pt: StrokePoint = {
          x: -panOffset.x + cw / 2 - iw / 2,
          y: -panOffset.y + ch / 2 - ih / 2,
        };

        const newStroke: DrawingStroke = {
          id: `stroke_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          tool: 'image',
          color: '#ffffff',
          width: 1,
          points: [pt],
          createdBy: safeUserName,
          imageUrl: dataUrl,
          dimensions: { width: iw, height: ih },
        };

        setUndoStack((prev) => [...prev, strokes]);
        setRedoStack([]);
        const updated = [...strokes, newStroke];
        setStrokes(updated);
        setSelectedStrokeId(newStroke.id);
        syncCanvasToFirestore(updated);
        showToast('Image added to whiteboard');
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // -------------------------------------------------------------
  // Selected Stroke Manipulation Actions (Inspector HUD)
  // -------------------------------------------------------------
  const handleUpdateSelectedStroke = (changes: Partial<DrawingStroke>) => {
    if (!selectedStrokeId) return;
    setUndoStack((prev) => [...prev, strokes]);
    setStrokes((prev) => {
      const updated = prev.map((s) => (s.id === selectedStrokeId ? { ...s, ...changes } : s));
      syncCanvasToFirestore(updated);
      realTimeSocket.sendWhiteboard({ action: 'sync', strokes: updated });
      return updated;
    });
  };

  const handleDuplicateSelected = () => {
    if (!selectedStrokeId) return;
    const target = strokes.find((s) => s.id === selectedStrokeId);
    if (!target) return;

    const dup: DrawingStroke = {
      ...target,
      id: `stroke_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      points: target.points.map((p) => ({ x: p.x + 20, y: p.y + 20 })),
    };

    setUndoStack((prev) => [...prev, strokes]);
    setRedoStack([]);
    const updated = [...strokes, dup];
    setStrokes(updated);
    setSelectedStrokeId(dup.id);
    syncCanvasToFirestore(updated);
    realTimeSocket.sendWhiteboard({ action: 'sync', strokes: updated });
    showToast('Duplicated object');
  };

  const handleDeleteSelected = () => {
    if (!selectedStrokeId) return;
    setUndoStack((prev) => [...prev, strokes]);
    setRedoStack([]);
    const updated = strokes.filter((s) => s.id !== selectedStrokeId);
    setStrokes(updated);
    setSelectedStrokeId(null);
    syncCanvasToFirestore(updated);
    realTimeSocket.sendWhiteboard({ action: 'sync', strokes: updated });
    showToast('Deleted object');
  };

  const handleBringToFront = () => {
    if (!selectedStrokeId) return;
    const idx = strokes.findIndex((s) => s.id === selectedStrokeId);
    if (idx === -1 || idx === strokes.length - 1) return;
    setUndoStack((prev) => [...prev, strokes]);
    const target = strokes[idx];
    const rest = strokes.filter((s) => s.id !== selectedStrokeId);
    const updated = [...rest, target];
    setStrokes(updated);
    syncCanvasToFirestore(updated);
    realTimeSocket.sendWhiteboard({ action: 'sync', strokes: updated });
  };

  const handleSendToBack = () => {
    if (!selectedStrokeId) return;
    const idx = strokes.findIndex((s) => s.id === selectedStrokeId);
    if (idx <= 0) return;
    setUndoStack((prev) => [...prev, strokes]);
    const target = strokes[idx];
    const rest = strokes.filter((s) => s.id !== selectedStrokeId);
    const updated = [target, ...rest];
    setStrokes(updated);
    syncCanvasToFirestore(updated);
    realTimeSocket.sendWhiteboard({ action: 'sync', strokes: updated });
  };

  const handleRotateSelected = (angle: number = 90) => {
    if (!selectedStrokeId) return;
    const target = strokes.find((s) => s.id === selectedStrokeId);
    if (!target) return;
    const rotated = rotateStroke(target, angle);
    setUndoStack((prev) => [...prev, strokes]);
    setRedoStack([]);
    const updated = strokes.map((s) => (s.id === selectedStrokeId ? rotated : s));
    setStrokes(updated);
    syncCanvasToFirestore(updated);
    realTimeSocket.sendWhiteboard({ action: 'sync', strokes: updated });
    showToast(`Rotated ${angle}°`);
  };

  const handleFlipSelected = (horizontal: boolean) => {
    if (!selectedStrokeId) return;
    const target = strokes.find((s) => s.id === selectedStrokeId);
    if (!target) return;
    const flipped = flipStroke(target, horizontal);
    setUndoStack((prev) => [...prev, strokes]);
    setRedoStack([]);
    const updated = strokes.map((s) => (s.id === selectedStrokeId ? flipped : s));
    setStrokes(updated);
    syncCanvasToFirestore(updated);
    realTimeSocket.sendWhiteboard({ action: 'sync', strokes: updated });
    showToast(horizontal ? 'Flipped Horizontally' : 'Flipped Vertically');
  };

  const handleToggleLockSelected = () => {
    if (!selectedStrokeId) return;
    const target = strokes.find((s) => s.id === selectedStrokeId);
    if (!target) return;
    const nextLocked = !target.isLocked;
    const updated = strokes.map((s) => (s.id === selectedStrokeId ? { ...s, isLocked: nextLocked } : s));
    setStrokes(updated);
    syncCanvasToFirestore(updated);
    realTimeSocket.sendWhiteboard({ action: 'sync', strokes: updated });
    showToast(nextLocked ? 'Locked Object' : 'Unlocked Object');
  };

  // Undo & Redo Handlers
  const handleUndo = () => {
    if (undoStack.length === 0) return;
    const previous = undoStack[undoStack.length - 1];
    setUndoStack((prev) => prev.slice(0, prev.length - 1));
    setRedoStack((prev) => [...prev, strokes]);
    setStrokes(previous);
    setSelectedStrokeId(null);
    syncCanvasToFirestore(previous);
    realTimeSocket.sendWhiteboard({ action: 'sync', strokes: previous });
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    setRedoStack((prev) => prev.slice(0, prev.length - 1));
    setUndoStack((prev) => [...prev, strokes]);
    setStrokes(next);
    setSelectedStrokeId(null);
    syncCanvasToFirestore(next);
    realTimeSocket.sendWhiteboard({ action: 'sync', strokes: next });
  };

  const handleClearCanvas = () => {
    if (strokes.length === 0) return;
    setConfirmClearWhiteboardOpen(true);
  };

  const handleExecuteClearCanvas = () => {
    setUndoStack((prev) => [...prev, strokes]);
    setStrokes([]);
    setSelectedStrokeId(null);
    syncCanvasToFirestore([]);
    realTimeSocket.sendWhiteboard({ action: 'clear' });
    setConfirmClearWhiteboardOpen(false);
    showToast('Whiteboard cleared');
  };

  const handleResetView = () => {
    setZoomLevel(1.0);
    setPanOffset({ x: 0, y: 0 });
    showToast('Reset view to 100%');
  };

  // -------------------------------------------------------------
  // Exports & Backup (PNG, SVG, JSON Archive, JSON Import)
  // -------------------------------------------------------------
  const handleExportPNG = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `whiteboard-${roomId}-${Date.now()}.png`;
    a.click();
    showToast('Downloaded PNG snapshot');
    setShowExportDropdown(false);
  };

  const handleExportSVG = () => {
    const canvas = canvasRef.current;
    const w = canvas ? canvas.width : 1920;
    const h = canvas ? canvas.height : 1080;
    const svgStr = generateSvgFromWhiteboard(strokes, w, h, gridType === 'blueprint' ? '#0a1026' : '#090d16');
    const blob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `whiteboard-${roomId}-${Date.now()}.svg`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Downloaded vector SVG');
    setShowExportDropdown(false);
  };

  const handleExportJSON = () => {
    const payload = {
      roomId,
      exportedAt: new Date().toISOString(),
      generator: 'E2EE Private Room Whiteboard',
      strokeCount: strokes.length,
      strokes,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `whiteboard-${roomId}-backup.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Downloaded JSON backup archive');
    setShowExportDropdown(false);
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);
        if (Array.isArray(parsed.strokes)) {
          setUndoStack((prev) => [...prev, strokes]);
          setStrokes(parsed.strokes);
          syncCanvasToFirestore(parsed.strokes);
          showToast(`Imported ${parsed.strokes.length} drawing elements!`);
        } else {
          showToast('Invalid whiteboard file format');
        }
      } catch (err) {
        console.error('Import failed:', err);
        showToast('Failed to parse JSON file');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
    setShowExportDropdown(false);
  };

  // Direct Send Canvas to Chat
  const handleSendCanvasToChat = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.toBlob((blob) => {
      if (!blob) return;
      const file = new File([blob], `whiteboard-drawing-${Date.now()}.png`, { type: 'image/png' });

      if (typeof onSendImageToChat === 'function') {
        onSendImageToChat(file, '🎨 Shared Whiteboard Drawing');
        onClose();
      } else if (typeof onSendMessageToChat === 'function') {
        onSendMessageToChat('🎨 *Exported Whiteboard Canvas Snapshot created in Room Scratchpad.*');
        onClose();
      }
    }, 'image/png');
  };

  // -------------------------------------------------------------
  // Notes Formatting & Actions
  // -------------------------------------------------------------
  const insertFormatting = (prefix: string, suffix: string = prefix) => {
    const textarea = document.getElementById('notes-textarea') as HTMLTextAreaElement | null;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = notesContent.substring(start, end);
    const replacement = `${prefix}${selected || 'text'}${suffix}`;
    const newText = notesContent.substring(0, start) + replacement + notesContent.substring(end);
    setNotesContent(newText);
    syncNotesToFirestore(newText);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length + (selected.length || 4));
    }, 50);
  };

  const handleApplyTemplate = (templateContent: string) => {
    setNotesContent(templateContent);
    syncNotesToFirestore(templateContent);
    setShowTemplatesDropdown(false);
  };

  // Find & Replace Handlers
  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    if (!val.trim()) {
      setSearchMatchCount(0);
      return;
    }
    const regex = new RegExp(val.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    const matches = notesContent.match(regex);
    setSearchMatchCount(matches ? matches.length : 0);
  };

  const handleReplaceOne = () => {
    if (!searchQuery) return;
    const idx = notesContent.toLowerCase().indexOf(searchQuery.toLowerCase());
    if (idx !== -1) {
      const updated =
        notesContent.substring(0, idx) +
        replaceQuery +
        notesContent.substring(idx + searchQuery.length);
      setNotesContent(updated);
      syncNotesToFirestore(updated);
    }
  };

  const handleReplaceAll = () => {
    if (!searchQuery) return;
    const regex = new RegExp(searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    const updated = notesContent.replace(regex, replaceQuery);
    setNotesContent(updated);
    syncNotesToFirestore(updated);
    setSearchMatchCount(0);
  };

  const handleCopyNotes = async () => {
    await copyToClipboardSafe(notesContent);
    setCopiedNotes(true);
    setTimeout(() => setCopiedNotes(false), 2000);
  };

  const handleDownloadNotes = (format: 'md' | 'txt' = 'md') => {
    const mime = format === 'md' ? 'text/markdown;charset=utf-8' : 'text/plain;charset=utf-8';
    const blob = new Blob([notesContent], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `scratchpad-${roomId}-${Date.now()}.${format}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSendNotesToChat = () => {
    if (!notesContent.trim()) return;
    const snippet = `📝 **Shared Scratchpad Notes:**\n\n${notesContent.trim()}`;
    if (typeof onSendMessageToChat === 'function') {
      onSendMessageToChat(snippet);
    }
    onClose();
  };

  const wordCount = notesContent.trim() ? notesContent.trim().split(/\s+/).length : 0;
  const lineCount = notesContent.split('\n').length;
  const charCount = notesContent.length;
  const readTimeMin = Math.max(1, Math.ceil(wordCount / 200));

  const currentlySelectedStroke = strokes.find((s) => s.id === selectedStrokeId);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-2 sm:p-4 animate-in fade-in duration-200">
      {/* Hidden File Inputs */}
      <input
        type="file"
        ref={whiteboardImageInputRef}
        accept="image/*"
        onChange={handleImageUpload}
        className="hidden"
      />
      <input
        type="file"
        ref={whiteboardJsonInputRef}
        accept=".json"
        onChange={handleImportJSON}
        className="hidden"
      />

      <div
        className={`relative flex flex-col bg-slate-950 border border-white/15 rounded-3xl shadow-2xl overflow-hidden transition-all duration-300 w-full ${
          isFullscreen ? 'h-full max-h-screen rounded-none' : 'max-w-7xl h-[90vh]'
        }`}
      >
        {/* Toast Notification */}
        {toastMessage && (
          <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-slate-900/95 border border-amber-400/40 text-amber-300 text-xs font-semibold rounded-full shadow-2xl flex items-center gap-2 backdrop-blur-md animate-in fade-in slide-in-from-top-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Top Header Bar */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-2.5 border-b border-white/10 bg-slate-900/90 select-none">
          <div className="flex items-center gap-3">
            <div
              style={{ backgroundColor: `${accentColor}20`, borderColor: `${accentColor}40` }}
              className="p-2 rounded-xl border flex items-center justify-center text-white"
            >
              <Sparkles style={{ color: accentColor }} className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold text-white tracking-tight">
                  Collaborative Whiteboard & Scratchpad
                </h2>
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Live Sync Active
                </span>
              </div>
              <p className="text-[11px] text-slate-400 flex items-center gap-1.5">
                <span>Room #{roomId}</span>
                <span>•</span>
                <span>Last updated by {lastSyncBy}</span>
                {isSyncing && <Cloud className="w-3 h-3 text-amber-400 animate-bounce inline ml-1" />}
              </p>
            </div>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex items-center gap-1 bg-black/50 p-1 rounded-xl border border-white/10 text-xs">
            <button
              type="button"
              onClick={() => setActiveTab('canvas')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                activeTab === 'canvas'
                  ? 'bg-amber-400 text-neutral-950 font-bold shadow-sm'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <Palette className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Whiteboard</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('notes')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                activeTab === 'notes'
                  ? 'bg-amber-400 text-neutral-950 font-bold shadow-sm'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Notes</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('split')}
              className={`hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                activeTab === 'split'
                  ? 'bg-amber-400 text-neutral-950 font-bold shadow-sm'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <SplitSquareHorizontal className="w-3.5 h-3.5" />
              <span>Split</span>
            </button>
          </div>

          {/* Top Window Actions */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsFullscreen((prev) => !prev)}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-rose-500/20 transition-colors cursor-pointer"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Body Area */}
        <div className="flex-1 flex overflow-hidden relative">
          {/* ========================================================= */}
          {/* CANVAS SECTION */}
          {/* ========================================================= */}
          {(activeTab === 'canvas' || activeTab === 'split') && (
            <div
              className={`flex flex-col relative h-full bg-[#090d16] ${
                activeTab === 'split' ? 'w-1/2 border-r border-white/10' : 'w-full'
              }`}
            >
              {/* Primary Whiteboard Floating Toolbar */}
              <div className="absolute top-3 left-3 right-3 z-20 flex flex-wrap items-center justify-between gap-1.5 bg-slate-900/95 backdrop-blur-md p-2 rounded-2xl border border-white/15 shadow-2xl select-none">
                {/* 1. Selection & Primary Tools */}
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedTool('select');
                      setShowShapesDropdown(false);
                      setShowStampsDropdown(false);
                    }}
                    className={`p-2 rounded-xl transition-all cursor-pointer ${
                      selectedTool === 'select'
                        ? 'bg-amber-400 text-neutral-950 font-bold shadow-sm'
                        : 'text-slate-300 hover:bg-white/10'
                    }`}
                    title="Select & Move Objects (V)"
                  >
                    <MousePointer className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedTool('hand');
                      setShowShapesDropdown(false);
                      setShowStampsDropdown(false);
                    }}
                    className={`p-2 rounded-xl transition-all cursor-pointer ${
                      selectedTool === 'hand' || isSpacePressed
                        ? 'bg-amber-400 text-neutral-950 font-bold shadow-sm'
                        : 'text-slate-300 hover:bg-white/10'
                    }`}
                    title="Pan Canvas Viewport (H / Hold Space)"
                  >
                    <Hand className="w-4 h-4" />
                  </button>

                  <div className="w-px h-5 bg-white/20 mx-0.5" />

                  <button
                    type="button"
                    onClick={() => setSelectedTool('pen')}
                    className={`p-2 rounded-xl transition-all cursor-pointer ${
                      selectedTool === 'pen'
                        ? 'bg-amber-400 text-neutral-950 font-bold shadow-sm'
                        : 'text-slate-300 hover:bg-white/10'
                    }`}
                    title="Freehand Pen (P)"
                  >
                    <Pen className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedTool('highlighter')}
                    className={`p-2 rounded-xl transition-all cursor-pointer ${
                      selectedTool === 'highlighter'
                        ? 'bg-amber-400 text-neutral-950 font-bold shadow-sm'
                        : 'text-slate-300 hover:bg-white/10'
                    }`}
                    title="Highlighter (K)"
                  >
                    <Highlighter className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedTool('eraser')}
                    className={`p-2 rounded-xl transition-all cursor-pointer ${
                      selectedTool === 'eraser'
                        ? 'bg-amber-400 text-neutral-950 font-bold shadow-sm'
                        : 'text-slate-300 hover:bg-white/10'
                    }`}
                    title="Eraser (E)"
                  >
                    <Eraser className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedTool('laser')}
                    className={`p-2 rounded-xl transition-all cursor-pointer ${
                      selectedTool === 'laser'
                        ? 'bg-rose-500 text-white font-bold shadow-sm ring-2 ring-rose-400/50'
                        : 'text-rose-400 hover:bg-rose-500/10'
                    }`}
                    title="Laser Pointer Trail (Z - Fades in 1s)"
                  >
                    <Zap className="w-4 h-4" />
                  </button>

                  <div className="w-px h-5 bg-white/20 mx-0.5" />

                  {/* Shapes Group & Dropdown */}
                  <div className="relative">
                    <div className="flex items-center bg-black/40 rounded-xl p-0.5 border border-white/10">
                      <button
                        type="button"
                        onClick={() => {
                          if (
                            !['rectangle', 'circle', 'diamond', 'triangle', 'star', 'line', 'arrow', 'speech'].includes(
                              selectedTool
                            )
                          ) {
                            setSelectedTool('rectangle');
                          }
                        }}
                        className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                          ['rectangle', 'circle', 'diamond', 'triangle', 'star', 'line', 'arrow', 'speech'].includes(
                            selectedTool
                          )
                            ? 'bg-amber-400 text-neutral-950 font-bold'
                            : 'text-slate-300 hover:text-white'
                        }`}
                        title="Active Shape"
                      >
                        {selectedTool === 'circle' ? (
                          <Circle className="w-4 h-4" />
                        ) : selectedTool === 'diamond' ? (
                          <Diamond className="w-4 h-4" />
                        ) : selectedTool === 'triangle' ? (
                          <Triangle className="w-4 h-4" />
                        ) : selectedTool === 'star' ? (
                          <Star className="w-4 h-4" />
                        ) : selectedTool === 'arrow' ? (
                          <ArrowRight className="w-4 h-4" />
                        ) : selectedTool === 'line' ? (
                          <Minus className="w-4 h-4" />
                        ) : selectedTool === 'speech' ? (
                          <MessageSquare className="w-4 h-4" />
                        ) : (
                          <Square className="w-4 h-4" />
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setShowShapesDropdown((prev) => !prev);
                          setShowStampsDropdown(false);
                          setShowExportDropdown(false);
                        }}
                        className="px-1 text-slate-400 hover:text-white cursor-pointer"
                        title="More Shapes & Connectors"
                      >
                        <ChevronDown className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {showShapesDropdown && (
                      <div className="absolute left-0 top-full mt-2 w-48 bg-slate-900 border border-white/20 rounded-2xl shadow-2xl p-1.5 z-30 grid grid-cols-2 gap-1 backdrop-blur-lg animate-in fade-in">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedTool('rectangle');
                            setShowShapesDropdown(false);
                          }}
                          className={`flex items-center gap-2 px-2.5 py-1.5 text-xs rounded-xl transition-colors cursor-pointer ${
                            selectedTool === 'rectangle' ? 'bg-amber-400 text-neutral-950 font-bold' : 'text-slate-200 hover:bg-white/10'
                          }`}
                        >
                          <Square className="w-3.5 h-3.5" />
                          <span>Rectangle</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedTool('circle');
                            setShowShapesDropdown(false);
                          }}
                          className={`flex items-center gap-2 px-2.5 py-1.5 text-xs rounded-xl transition-colors cursor-pointer ${
                            selectedTool === 'circle' ? 'bg-amber-400 text-neutral-950 font-bold' : 'text-slate-200 hover:bg-white/10'
                          }`}
                        >
                          <Circle className="w-3.5 h-3.5" />
                          <span>Circle</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedTool('diamond');
                            setShowShapesDropdown(false);
                          }}
                          className={`flex items-center gap-2 px-2.5 py-1.5 text-xs rounded-xl transition-colors cursor-pointer ${
                            selectedTool === 'diamond' ? 'bg-amber-400 text-neutral-950 font-bold' : 'text-slate-200 hover:bg-white/10'
                          }`}
                        >
                          <Diamond className="w-3.5 h-3.5" />
                          <span>Diamond</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedTool('triangle');
                            setShowShapesDropdown(false);
                          }}
                          className={`flex items-center gap-2 px-2.5 py-1.5 text-xs rounded-xl transition-colors cursor-pointer ${
                            selectedTool === 'triangle' ? 'bg-amber-400 text-neutral-950 font-bold' : 'text-slate-200 hover:bg-white/10'
                          }`}
                        >
                          <Triangle className="w-3.5 h-3.5" />
                          <span>Triangle</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedTool('star');
                            setShowShapesDropdown(false);
                          }}
                          className={`flex items-center gap-2 px-2.5 py-1.5 text-xs rounded-xl transition-colors cursor-pointer ${
                            selectedTool === 'star' ? 'bg-amber-400 text-neutral-950 font-bold' : 'text-slate-200 hover:bg-white/10'
                          }`}
                        >
                          <Star className="w-3.5 h-3.5" />
                          <span>Star</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedTool('arrow');
                            setShowShapesDropdown(false);
                          }}
                          className={`flex items-center gap-2 px-2.5 py-1.5 text-xs rounded-xl transition-colors cursor-pointer ${
                            selectedTool === 'arrow' ? 'bg-amber-400 text-neutral-950 font-bold' : 'text-slate-200 hover:bg-white/10'
                          }`}
                        >
                          <ArrowRight className="w-3.5 h-3.5" />
                          <span>Arrow</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedTool('line');
                            setShowShapesDropdown(false);
                          }}
                          className={`flex items-center gap-2 px-2.5 py-1.5 text-xs rounded-xl transition-colors cursor-pointer ${
                            selectedTool === 'line' ? 'bg-amber-400 text-neutral-950 font-bold' : 'text-slate-200 hover:bg-white/10'
                          }`}
                        >
                          <Minus className="w-3.5 h-3.5" />
                          <span>Line</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedTool('speech');
                            setShowShapesDropdown(false);
                          }}
                          className={`flex items-center gap-2 px-2.5 py-1.5 text-xs rounded-xl transition-colors cursor-pointer ${
                            selectedTool === 'speech' ? 'bg-amber-400 text-neutral-950 font-bold' : 'text-slate-200 hover:bg-white/10'
                          }`}
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>Speech</span>
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="w-px h-5 bg-white/20 mx-0.5" />

                  {/* Text, Sticky Note & Stamps */}
                  <button
                    type="button"
                    onClick={() => setSelectedTool('text')}
                    className={`p-2 rounded-xl transition-all cursor-pointer ${
                      selectedTool === 'text'
                        ? 'bg-amber-400 text-neutral-950 font-bold shadow-sm'
                        : 'text-slate-300 hover:bg-white/10'
                    }`}
                    title="Text Annotation (T)"
                  >
                    <Type className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedTool('sticky')}
                    className={`p-2 rounded-xl transition-all cursor-pointer ${
                      selectedTool === 'sticky'
                        ? 'bg-amber-400 text-neutral-950 font-bold shadow-sm'
                        : 'text-slate-300 hover:bg-white/10'
                    }`}
                    title="Sticky Note (S)"
                  >
                    <StickyNote className="w-4 h-4" />
                  </button>

                  {/* Stamps Dropdown */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => {
                        setShowStampsDropdown((prev) => !prev);
                        setShowShapesDropdown(false);
                        setShowExportDropdown(false);
                      }}
                      className="flex items-center gap-1 px-2 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-slate-300 hover:text-white cursor-pointer"
                      title="Architecture & Security Stamps"
                    >
                      <CheckSquare className="w-3.5 h-3.5 text-amber-400" />
                      <span className="hidden lg:inline text-[11px]">Stamps</span>
                    </button>

                    {showStampsDropdown && (
                      <div className="absolute left-0 top-full mt-2 w-64 bg-slate-900 border border-white/20 rounded-2xl shadow-2xl p-2 z-30 space-y-1 backdrop-blur-xl animate-in fade-in">
                        <div className="px-2 py-1 text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                          Architecture & Review Badges
                        </div>
                        {WHITEBOARD_STAMPS.map((st) => (
                          <button
                            key={st.id}
                            type="button"
                            onClick={() => handlePlaceStamp(st)}
                            className="w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-xs text-slate-200 hover:bg-white/10 transition-colors cursor-pointer"
                          >
                            <span className="flex items-center gap-2">
                              <span>{st.icon}</span>
                              <span className="font-semibold">{st.label}</span>
                            </span>
                            <span
                              className="w-2.5 h-2.5 rounded-full"
                              style={{ backgroundColor: st.color }}
                            />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Image Insert Button */}
                  <button
                    type="button"
                    onClick={() => whiteboardImageInputRef.current?.click()}
                    className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                    title="Upload Reference Image onto Whiteboard"
                  >
                    <ImageIcon className="w-4 h-4 text-sky-400" />
                  </button>
                </div>

                {/* 2. Color Palette & Custom Picker */}
                <div className="flex items-center gap-1.5">
                  <div className="flex items-center gap-1">
                    {COLOR_PALETTE.slice(0, 6).map((c) => (
                      <button
                        key={c.hex}
                        type="button"
                        onClick={() => {
                          setSelectedColor(c.hex);
                          if (selectedStrokeId) {
                            handleUpdateSelectedStroke({ color: c.hex });
                          }
                        }}
                        style={{ backgroundColor: c.hex }}
                        className={`w-4 h-4 rounded-full transition-transform cursor-pointer border border-black/30 ${
                          selectedColor === c.hex ? 'scale-125 ring-2 ring-amber-400' : 'hover:scale-110'
                        }`}
                        title={c.name}
                      />
                    ))}
                  </div>

                  {/* Native Custom Color Input */}
                  <div className="relative flex items-center">
                    <label
                      htmlFor="custom-whiteboard-color"
                      className="w-4 h-4 rounded-full border border-white/40 cursor-pointer overflow-hidden flex items-center justify-center"
                      title="Custom Color Picker"
                      style={{ backgroundColor: selectedColor }}
                    >
                      <input
                        id="custom-whiteboard-color"
                        type="color"
                        value={selectedColor}
                        onChange={(e) => {
                          setSelectedColor(e.target.value);
                          if (selectedStrokeId) {
                            handleUpdateSelectedStroke({ color: e.target.value });
                          }
                        }}
                        className="opacity-0 w-0 h-0 cursor-pointer"
                      />
                    </label>
                  </div>
                </div>

                {/* 3. Stroke Width Selector */}
                <div className="flex items-center gap-0.5 bg-black/40 p-0.5 rounded-xl border border-white/10">
                  {STROKE_WIDTHS.map((sw) => (
                    <button
                      key={sw.value}
                      type="button"
                      onClick={() => {
                        setSelectedWidth(sw.value);
                        if (selectedStrokeId) {
                          handleUpdateSelectedStroke({ width: sw.value });
                        }
                      }}
                      className={`px-1.5 py-0.5 rounded-lg text-[10px] font-mono transition-all cursor-pointer ${
                        selectedWidth === sw.value
                          ? 'bg-white text-neutral-950 font-bold'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {sw.label}
                    </button>
                  ))}
                </div>

                {/* 4. Stroke Style & Fill Modifiers */}
                <div className="flex items-center gap-1">
                  {/* Fill Toggle */}
                  <button
                    type="button"
                    onClick={() => {
                      const next = !fillShape;
                      setFillShape(next);
                      if (selectedStrokeId) {
                        handleUpdateSelectedStroke({ fill: next });
                      }
                    }}
                    className={`px-2 py-1 rounded-lg text-[11px] font-semibold border transition-colors cursor-pointer ${
                      fillShape
                        ? 'bg-amber-400/25 border-amber-400 text-amber-300'
                        : 'border-white/10 text-slate-400 hover:text-white'
                    }`}
                    title="Toggle shape fill (translucent color inside)"
                  >
                    Fill: {fillShape ? 'ON' : 'OFF'}
                  </button>

                  {/* Line Style Toggle (Solid / Dashed / Dotted) */}
                  <button
                    type="button"
                    onClick={() => {
                      const styles: LineStyle[] = ['solid', 'dashed', 'dotted'];
                      const nextIndex = (styles.indexOf(lineStyle) + 1) % styles.length;
                      const next = styles[nextIndex];
                      setLineStyle(next);
                      if (selectedStrokeId) {
                        handleUpdateSelectedStroke({ lineStyle: next });
                      }
                    }}
                    className="px-2 py-1 rounded-lg text-[11px] font-mono bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 transition-colors cursor-pointer"
                    title="Toggle line style: Solid, Dashed, or Dotted"
                  >
                    {lineStyle === 'solid' ? '— Solid' : lineStyle === 'dashed' ? '-- Dash' : '•• Dot'}
                  </button>

                  {/* Snap to Grid Toggle */}
                  <button
                    type="button"
                    onClick={() => {
                      setSnapToGrid((prev) => !prev);
                      showToast(`Snap to Grid: ${!snapToGrid ? 'ON' : 'OFF'}`);
                    }}
                    className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                      snapToGrid
                        ? 'bg-amber-400/25 border-amber-400 text-amber-300'
                        : 'border-white/10 text-slate-400 hover:text-white'
                    }`}
                    title="Snap to Grid (Align shapes to grid intersection)"
                  >
                    <Magnet className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* 5. Canvas Grid Mode Selector */}
                <div className="flex items-center gap-0.5 bg-black/40 p-0.5 rounded-lg border border-white/10 text-[10px]">
                  {(['grid', 'dots', 'blueprint', 'blank'] as const).map((gt) => (
                    <button
                      key={gt}
                      type="button"
                      onClick={() => setGridType(gt)}
                      className={`px-1.5 py-0.5 rounded capitalize cursor-pointer transition-colors ${
                        gridType === gt ? 'bg-amber-400 text-neutral-950 font-bold' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {gt}
                    </button>
                  ))}
                </div>

                {/* 5b. Canvas Background Theme Picker */}
                <div className="flex items-center gap-1 bg-black/40 px-1.5 py-0.5 rounded-lg border border-white/10 text-[10px]">
                  <span className="text-slate-400 font-mono text-[10px] hidden sm:inline">Theme:</span>
                  {[
                    { id: '#090d16', label: 'Dark', bg: '#090d16', text: '#fff' },
                    { id: '#0a1026', label: 'Navy', bg: '#0a1026', text: '#60a5fa' },
                    { id: '#0f172a', label: 'Slate', bg: '#0f172a', text: '#94a3b8' },
                    { id: '#f8fafc', label: 'Paper', bg: '#f8fafc', text: '#0f172a' },
                    { id: '#fefce8', label: 'Parchment', bg: '#fefce8', text: '#713f12' },
                  ].map((theme) => (
                    <button
                      key={theme.id}
                      type="button"
                      onClick={() => setCanvasBgColor(theme.id)}
                      className={`px-1.5 py-0.5 rounded text-[10px] font-medium border transition-all cursor-pointer ${
                        canvasBgColor === theme.id
                          ? 'border-amber-400 scale-105 font-bold shadow-sm'
                          : 'border-white/10 opacity-70 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: theme.bg, color: theme.text }}
                      title={`Whiteboard Theme: ${theme.label}`}
                    >
                      {theme.label}
                    </button>
                  ))}
                </div>

                {/* 6. Zoom & Pan Reset */}
                <div className="flex items-center gap-1 bg-black/40 px-1.5 py-0.5 rounded-lg border border-white/10">
                  <button
                    type="button"
                    onClick={() => setZoomLevel((z) => Math.max(0.4, Number((z - 0.2).toFixed(2))))}
                    className="p-1 text-slate-400 hover:text-white cursor-pointer"
                    title="Zoom Out"
                  >
                    <ZoomOut className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-[10px] font-mono text-slate-300 w-8 text-center">
                    {Math.round(zoomLevel * 100)}%
                  </span>
                  <button
                    type="button"
                    onClick={() => setZoomLevel((z) => Math.min(2.5, Number((z + 0.2).toFixed(2))))}
                    className="p-1 text-slate-400 hover:text-white cursor-pointer"
                    title="Zoom In"
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                  </button>
                  {(zoomLevel !== 1.0 || panOffset.x !== 0 || panOffset.y !== 0) && (
                    <button
                      type="button"
                      onClick={handleResetView}
                      className="p-1 text-slate-400 hover:text-amber-400 cursor-pointer"
                      title="Reset Pan & Zoom"
                    >
                      <RotateCcw className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {/* 7. Action Buttons (Undo, Redo, Clear, Export, Send to Chat) */}
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={handleUndo}
                    disabled={undoStack.length === 0}
                    className="p-1.5 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                    title="Undo (Ctrl+Z)"
                  >
                    <Undo2 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={handleRedo}
                    disabled={redoStack.length === 0}
                    className="p-1.5 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                    title="Redo (Ctrl+Y)"
                  >
                    <Redo2 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={handleClearCanvas}
                    className="p-1.5 rounded-xl text-slate-300 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                    title="Clear Whiteboard"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  {/* Export & Backup Dropdown */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => {
                        setShowExportDropdown((prev) => !prev);
                        setShowShapesDropdown(false);
                        setShowStampsDropdown(false);
                      }}
                      className="p-1.5 rounded-xl text-amber-400 hover:bg-amber-400/10 transition-colors cursor-pointer flex items-center gap-0.5"
                      title="Export & Backup Options"
                    >
                      <Download className="w-4 h-4" />
                      <ChevronDown className="w-3 h-3" />
                    </button>

                    {showExportDropdown && (
                      <div className="absolute right-0 top-full mt-2 w-52 bg-slate-900 border border-white/20 rounded-2xl shadow-2xl p-1.5 z-30 space-y-1 backdrop-blur-xl animate-in fade-in">
                        <button
                          type="button"
                          onClick={handleExportPNG}
                          className="w-full flex items-center gap-2.5 px-3 py-1.5 text-xs text-slate-200 hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5 text-amber-400" />
                          <span>Export as PNG Image</span>
                        </button>
                        <button
                          type="button"
                          onClick={handleExportSVG}
                          className="w-full flex items-center gap-2.5 px-3 py-1.5 text-xs text-slate-200 hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
                        >
                          <FileCode className="w-3.5 h-3.5 text-sky-400" />
                          <span>Export Vector SVG</span>
                        </button>
                        <button
                          type="button"
                          onClick={handleExportJSON}
                          className="w-full flex items-center gap-2.5 px-3 py-1.5 text-xs text-slate-200 hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
                        >
                          <FileJson className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Export Whiteboard JSON</span>
                        </button>
                        <div className="w-full h-px bg-white/10 my-1" />
                        <button
                          type="button"
                          onClick={() => whiteboardJsonInputRef.current?.click()}
                          className="w-full flex items-center gap-2.5 px-3 py-1.5 text-xs text-slate-200 hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
                        >
                          <Upload className="w-3.5 h-3.5 text-purple-400" />
                          <span>Import Whiteboard JSON</span>
                        </button>
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={handleSendCanvasToChat}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 text-xs font-bold transition-all cursor-pointer shadow-sm ml-1"
                    title="Send drawing snapshot to encrypted chat feed"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Send to Chat</span>
                  </button>
                </div>
              </div>

              {/* Whiteboard Canvas Stage */}
              <div
                className={`flex-1 w-full h-full relative overflow-hidden ${
                  selectedTool === 'hand' || isSpacePressed
                    ? 'cursor-grab active:cursor-grabbing'
                    : selectedTool === 'select'
                    ? 'cursor-default'
                    : 'cursor-crosshair'
                }`}
              >
                <canvas
                  ref={canvasRef}
                  onPointerDown={handlePointerDown}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                  className="absolute inset-0 touch-none w-full h-full"
                />
              </div>

              {/* Floating Object Inspector (HUD) when a stroke is selected */}
              {selectedStrokeId && currentlySelectedStroke && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 bg-slate-900/95 border border-sky-400/40 px-3.5 py-2 rounded-2xl shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-bottom-2 text-xs select-none">
                  <div className="flex items-center gap-1.5 text-sky-300 font-semibold pr-2 border-r border-white/10">
                    <MousePointer className="w-3.5 h-3.5" />
                    <span className="capitalize">{currentlySelectedStroke.tool}</span>
                  </div>

                  {/* Quick Color swatches */}
                  <div className="flex items-center gap-1">
                    {COLOR_PALETTE.slice(0, 5).map((c) => (
                      <button
                        key={c.hex}
                        type="button"
                        onClick={() => handleUpdateSelectedStroke({ color: c.hex })}
                        style={{ backgroundColor: c.hex }}
                        className={`w-3.5 h-3.5 rounded-full border border-black/40 transition-transform cursor-pointer ${
                          currentlySelectedStroke.color === c.hex ? 'scale-125 ring-2 ring-sky-400' : ''
                        }`}
                        title={c.name}
                      />
                    ))}
                  </div>

                  {/* Quick Width adjustment */}
                  <div className="flex items-center gap-1 px-1.5 border-x border-white/10">
                    <button
                      type="button"
                      onClick={() =>
                        handleUpdateSelectedStroke({
                          width: Math.max(1, currentlySelectedStroke.width - 2),
                        })
                      }
                      className="p-1 text-slate-300 hover:text-white cursor-pointer"
                      title="Decrease thickness"
                    >
                      -
                    </button>
                    <span className="font-mono text-[11px] text-slate-300 w-4 text-center">
                      {currentlySelectedStroke.width}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        handleUpdateSelectedStroke({
                          width: Math.min(32, currentlySelectedStroke.width + 2),
                        })
                      }
                      className="p-1 text-slate-300 hover:text-white cursor-pointer"
                      title="Increase thickness"
                    >
                      +
                    </button>
                  </div>

                  {/* Fill Toggle */}
                  <button
                    type="button"
                    onClick={() =>
                      handleUpdateSelectedStroke({
                        fill: !currentlySelectedStroke.fill,
                      })
                    }
                    className={`px-2 py-1 rounded-lg text-[10px] font-semibold border transition-colors cursor-pointer ${
                      currentlySelectedStroke.fill
                        ? 'bg-sky-400/25 border-sky-400 text-sky-300'
                        : 'border-white/10 text-slate-400 hover:text-white'
                    }`}
                  >
                    Fill: {currentlySelectedStroke.fill ? 'ON' : 'OFF'}
                  </button>

                  {/* Layer ordering */}
                  <div className="flex items-center gap-0.5">
                    <button
                      type="button"
                      onClick={handleBringToFront}
                      className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 cursor-pointer"
                      title="Bring to Front"
                    >
                      <ChevronsUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={handleSendToBack}
                      className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 cursor-pointer"
                      title="Send to Back"
                    >
                      <ChevronsDown className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Transformation: Rotate, Flip & Lock */}
                  <div className="flex items-center gap-0.5 border-l border-white/10 pl-1.5">
                    <button
                      type="button"
                      onClick={() => handleRotateSelected(90)}
                      className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 cursor-pointer"
                      title="Rotate 90° Clockwise"
                    >
                      <RotateCw className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleFlipSelected(true)}
                      className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 cursor-pointer"
                      title="Flip Horizontal"
                    >
                      <FlipHorizontal className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleFlipSelected(false)}
                      className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 cursor-pointer"
                      title="Flip Vertical"
                    >
                      <FlipVertical className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={handleToggleLockSelected}
                      className={`p-1.5 rounded-lg cursor-pointer transition-colors ${
                        currentlySelectedStroke.isLocked
                          ? 'text-amber-400 bg-amber-400/20'
                          : 'text-slate-300 hover:text-white hover:bg-white/10'
                      }`}
                      title={currentlySelectedStroke.isLocked ? 'Unlock Object' : 'Lock Object (prevent movement)'}
                    >
                      {currentlySelectedStroke.isLocked ? (
                        <Lock className="w-3.5 h-3.5" />
                      ) : (
                        <Unlock className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>

                  {/* Opacity Selector */}
                  <div className="flex items-center gap-1 border-l border-white/10 pl-1.5">
                    <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">Opacity</span>
                    <select
                      value={currentlySelectedStroke.opacity !== undefined ? currentlySelectedStroke.opacity : 1.0}
                      onChange={(e) => handleUpdateSelectedStroke({ opacity: parseFloat(e.target.value) })}
                      className="bg-slate-800 text-slate-200 border border-white/15 rounded px-1 py-0.5 text-[10px] cursor-pointer"
                      title="Adjust stroke opacity"
                    >
                      <option value="1">100%</option>
                      <option value="0.75">75%</option>
                      <option value="0.5">50%</option>
                      <option value="0.25">25%</option>
                    </select>
                  </div>

                  {/* Edit Text In-Place if Text/Sticky stroke */}
                  {currentlySelectedStroke.text !== undefined && (
                    <button
                      type="button"
                      onClick={() => {
                        setPendingToolType(
                          currentlySelectedStroke.tool === 'sticky'
                            ? 'sticky'
                            : currentlySelectedStroke.tool === 'speech'
                            ? 'speech'
                            : 'text'
                        );
                        setTextPromptValue(currentlySelectedStroke.text || '');
                        setPendingTextPoint(currentlySelectedStroke.points[0] || { x: 100, y: 100 });
                        setIsEditingExistingText(true);
                        setTextPromptOpen(true);
                      }}
                      className="flex items-center gap-1 px-2 py-1 rounded-lg bg-sky-500/25 text-sky-300 hover:bg-sky-500/40 text-[10px] font-semibold border border-sky-400/30 cursor-pointer"
                      title="Edit Text Content"
                    >
                      <Edit3 className="w-3 h-3" />
                      <span className="hidden sm:inline">Edit Text</span>
                    </button>
                  )}

                  {/* Duplicate & Delete */}
                  <div className="flex items-center gap-0.5 border-l border-white/10 pl-1.5">
                    <button
                      type="button"
                      onClick={handleDuplicateSelected}
                      className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 cursor-pointer"
                      title="Duplicate (Ctrl+D)"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={handleDeleteSelected}
                      className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/20 cursor-pointer"
                      title="Delete (Del / Backspace)"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedStrokeId(null)}
                    className="p-1 text-slate-400 hover:text-white cursor-pointer ml-1"
                    title="Deselect (Esc)"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Text / Sticky Note Prompt Floating Card */}
              {textPromptOpen && (
                <div className="absolute bottom-6 right-6 z-40 max-w-sm w-full p-2 pointer-events-none">
                  <div className="bg-slate-900/95 border border-white/20 p-4 rounded-2xl shadow-2xl space-y-3 pointer-events-auto backdrop-blur-md">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                        {pendingToolType === 'sticky' ? (
                          <StickyNote className="w-4 h-4 text-amber-400" />
                        ) : pendingToolType === 'speech' ? (
                          <MessageSquare className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <Type className="w-4 h-4 text-sky-400" />
                        )}
                        {isEditingExistingText
                          ? 'Edit Content'
                          : pendingToolType === 'sticky'
                          ? 'Place Sticky Note'
                          : pendingToolType === 'speech'
                          ? 'Place Speech Callout'
                          : 'Place Text Annotation'}
                      </h4>
                      <button
                        type="button"
                        onClick={() => {
                          setTextPromptOpen(false);
                          setIsEditingExistingText(false);
                        }}
                        className="text-slate-400 hover:text-white cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Coordinates & Placement Drag Hint */}
                    {pendingTextPoint && (
                      <div className="flex items-center justify-between text-[11px] bg-slate-800/80 border border-white/10 rounded-lg px-2.5 py-1.5 text-slate-300">
                        <span className="font-mono text-amber-400">
                          📍 X: {Math.round(pendingTextPoint.x)}, Y: {Math.round(pendingTextPoint.y)}
                        </span>
                        <span className="text-slate-400 text-[10px]">
                          Click or drag on board to reposition
                        </span>
                      </div>
                    )}

                    <textarea
                      autoFocus
                      rows={3}
                      value={textPromptValue}
                      onChange={(e) => setTextPromptValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey || !e.shiftKey)) {
                          e.preventDefault();
                          handleSubmitTextAnnotation();
                        }
                      }}
                      placeholder={
                        pendingToolType === 'sticky'
                          ? 'Write key notes or reminders... (Enter to place)'
                          : pendingToolType === 'speech'
                          ? 'Enter callout message... (Enter to place)'
                          : 'Type text annotation... (Enter to place)'
                      }
                      className="w-full bg-black/60 border border-white/15 rounded-xl p-2.5 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-amber-400 resize-none font-sans"
                    />
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-slate-500">Press Enter or click button</span>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setTextPromptOpen(false);
                            setIsEditingExistingText(false);
                          }}
                          className="px-3 py-1.5 rounded-xl text-xs text-slate-400 hover:bg-white/10 cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={handleSubmitTextAnnotation}
                          className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-amber-400 text-neutral-950 hover:bg-amber-300 cursor-pointer shadow-sm flex items-center gap-1.5"
                        >
                          <span>{isEditingExistingText ? 'Save Changes' : 'Place on Board'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========================================================= */}
          {/* NOTES SECTION */}
          {/* ========================================================= */}
          {(activeTab === 'notes' || activeTab === 'split') && (
            <div
              className={`flex flex-col relative h-full bg-slate-950 ${
                activeTab === 'split' ? 'w-1/2' : 'w-full'
              }`}
            >
              {/* Markdown & Format Toolbar */}
              <div className="flex flex-wrap items-center justify-between px-4 py-2 border-b border-white/10 bg-slate-900/60 select-none gap-2">
                <div className="flex items-center gap-1 flex-wrap">
                  <button
                    type="button"
                    onClick={() => insertFormatting('**', '**')}
                    className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 cursor-pointer"
                    title="Bold"
                  >
                    <Bold className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => insertFormatting('*', '*')}
                    className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 cursor-pointer"
                    title="Italic"
                  >
                    <Italic className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => insertFormatting('~~', '~~')}
                    className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 cursor-pointer"
                    title="Strikethrough"
                  >
                    <Strikethrough className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => insertFormatting('`', '`')}
                    className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 cursor-pointer"
                    title="Inline Code"
                  >
                    <Code className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => insertFormatting('```ts\n', '\n```')}
                    className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 cursor-pointer"
                    title="Code Block"
                  >
                    <FileCode className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => insertFormatting('> ', '')}
                    className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 cursor-pointer"
                    title="Blockquote"
                  >
                    <Quote className="w-4 h-4" />
                  </button>
                  <div className="w-px h-4 bg-white/20 mx-1" />
                  <button
                    type="button"
                    onClick={() => insertFormatting('# ', '')}
                    className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 cursor-pointer"
                    title="Heading 1"
                  >
                    <Heading1 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => insertFormatting('## ', '')}
                    className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 cursor-pointer"
                    title="Heading 2"
                  >
                    <Heading2 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => insertFormatting('- ', '')}
                    className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 cursor-pointer"
                    title="Bullet List"
                  >
                    <List className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => insertFormatting('- [ ] ', '')}
                    className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 cursor-pointer"
                    title="Task Item"
                  >
                    <ListTodo className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      insertFormatting(
                        '\n| Item | Status | Owner |\n| :--- | :---: | :--- |\n| Step 1 | ✅ Ready | Alice |\n| Step 2 | ⏳ Pending | Bob |\n',
                        ''
                      )
                    }
                    className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 cursor-pointer"
                    title="Insert Markdown Table"
                  >
                    <Table className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  {/* Template Picker Dropdown */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowTemplatesDropdown((prev) => !prev)}
                      className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs bg-white/5 hover:bg-white/10 text-slate-300 transition-colors cursor-pointer border border-white/10"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      <span>Templates</span>
                    </button>

                    {showTemplatesDropdown && (
                      <div className="absolute right-0 top-full mt-1.5 w-60 bg-slate-900 border border-white/20 rounded-xl shadow-2xl p-1.5 z-30 space-y-1">
                        <div className="px-2 py-1 text-[10px] font-semibold uppercase text-slate-500 tracking-wider">
                          Insert Note Template
                        </div>
                        {NOTE_TEMPLATES.map((tmpl) => (
                          <button
                            key={tmpl.id}
                            type="button"
                            onClick={() => handleApplyTemplate(tmpl.content)}
                            className="w-full text-left px-2.5 py-1.5 text-xs text-slate-200 hover:bg-amber-400/10 hover:text-amber-300 rounded-lg transition-colors cursor-pointer flex items-center justify-between"
                          >
                            <span>{tmpl.name}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Find & Replace Toggle */}
                  <button
                    type="button"
                    onClick={() => setSearchOpen((prev) => !prev)}
                    className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                      searchOpen ? 'bg-amber-400 text-neutral-950 font-bold' : 'text-slate-300 hover:bg-white/10'
                    }`}
                    title="Find & Replace"
                  >
                    <Search className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setNotesPreviewMode((prev) => (prev === 'edit' ? 'preview' : 'edit'))}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs bg-white/5 hover:bg-white/10 text-slate-300 transition-colors cursor-pointer"
                  >
                    {notesPreviewMode === 'edit' ? <Eye className="w-3.5 h-3.5" /> : <Edit3 className="w-3.5 h-3.5" />}
                    <span>{notesPreviewMode === 'edit' ? 'Preview' : 'Edit'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleCopyNotes}
                    className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 cursor-pointer"
                    title="Copy Markdown"
                  >
                    {copiedNotes ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>

                  {/* Download Options */}
                  <div className="flex items-center bg-white/5 rounded-lg border border-white/10 p-0.5">
                    <button
                      type="button"
                      onClick={() => handleDownloadNotes('md')}
                      className="px-1.5 py-0.5 text-[10px] text-slate-300 hover:text-white cursor-pointer"
                      title="Download as .md"
                    >
                      .MD
                    </button>
                    <div className="w-px h-3 bg-white/20" />
                    <button
                      type="button"
                      onClick={() => handleDownloadNotes('txt')}
                      className="px-1.5 py-0.5 text-[10px] text-slate-300 hover:text-white cursor-pointer"
                      title="Download as .txt"
                    >
                      .TXT
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={handleSendNotesToChat}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold text-neutral-950 bg-emerald-400 hover:bg-emerald-300 transition-all cursor-pointer shadow-sm ml-1"
                    title="Send current notes to encrypted chat feed"
                  >
                    <Send className="w-3 h-3 text-neutral-950" />
                    <span>Send to Chat</span>
                  </button>
                </div>
              </div>

              {/* Search & Replace Floating Bar */}
              {searchOpen && (
                <div className="flex items-center gap-2 px-4 py-2 bg-slate-900 border-b border-white/10 text-xs">
                  <div className="flex items-center gap-1 bg-black/40 px-2 py-1 rounded-lg border border-white/10 flex-1 max-w-xs">
                    <Search className="w-3.5 h-3.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Find..."
                      value={searchQuery}
                      onChange={(e) => handleSearchChange(e.target.value)}
                      className="bg-transparent border-none outline-none text-slate-200 text-xs w-full"
                    />
                    {searchMatchCount > 0 && (
                      <span className="text-[10px] text-amber-400 font-mono">
                        {searchMatchCount} found
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 bg-black/40 px-2 py-1 rounded-lg border border-white/10 flex-1 max-w-xs">
                    <Replace className="w-3.5 h-3.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Replace with..."
                      value={replaceQuery}
                      onChange={(e) => setReplaceQuery(e.target.value)}
                      className="bg-transparent border-none outline-none text-slate-200 text-xs w-full"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleReplaceOne}
                    disabled={!searchQuery}
                    className="px-2 py-1 bg-white/10 hover:bg-white/20 text-slate-200 rounded-md text-[11px] disabled:opacity-30 cursor-pointer"
                  >
                    Replace
                  </button>
                  <button
                    type="button"
                    onClick={handleReplaceAll}
                    disabled={!searchQuery}
                    className="px-2 py-1 bg-amber-400 text-neutral-950 font-bold hover:bg-amber-300 rounded-md text-[11px] disabled:opacity-30 cursor-pointer"
                  >
                    Replace All
                  </button>
                  <button
                    type="button"
                    onClick={() => setSearchOpen(false)}
                    className="text-slate-400 hover:text-white p-1 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Textarea or Preview */}
              <div className="flex-1 p-4 overflow-y-auto">
                {notesPreviewMode === 'edit' ? (
                  <textarea
                    id="notes-textarea"
                    value={notesContent}
                    onChange={(e) => {
                      setNotesContent(e.target.value);
                      syncNotesToFirestore(e.target.value);
                    }}
                    placeholder="Write shared thoughts, meeting notes, or paste code snippets..."
                    className="w-full h-full bg-transparent text-sm text-slate-200 font-mono resize-none focus:outline-none placeholder:text-slate-600 leading-relaxed"
                  />
                ) : (
                  <div className="prose prose-invert prose-sm max-w-none text-slate-300 whitespace-pre-wrap font-sans leading-relaxed">
                    {notesContent}
                  </div>
                )}
              </div>

              {/* Bottom Character, Line & Word Count */}
              <div className="px-4 py-2 border-t border-white/10 bg-slate-900/40 text-[11px] text-slate-400 flex items-center justify-between font-mono">
                <div className="flex items-center gap-3">
                  <span>{lineCount} lines</span>
                  <span>•</span>
                  <span>{wordCount} words</span>
                  <span>•</span>
                  <span>{charCount} chars</span>
                  <span>•</span>
                  <span className="text-amber-400">~{readTimeMin} min read</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (!notesContent.trim()) return;
                      setConfirmClearNotesOpen(true);
                    }}
                    className="text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
                  >
                    Clear Notes
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Confirmation Modal: Clear Whiteboard */}
        {confirmClearWhiteboardOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
            <div className="w-full max-w-sm rounded-2xl bg-neutral-900 border border-white/15 p-5 shadow-2xl space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center shrink-0">
                  <Trash2 className="w-5 h-5 text-rose-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Clear Shared Whiteboard?</h3>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    This will erase all {strokes.length} drawings and shapes for all participants in this room.
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setConfirmClearWhiteboardOpen(false)}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold text-neutral-300 hover:text-white bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleExecuteClearCanvas}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 transition-colors cursor-pointer shadow-md"
                >
                  Clear All Drawings
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Confirmation Modal: Clear Notes */}
        {confirmClearNotesOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
            <div className="w-full max-w-sm rounded-2xl bg-neutral-900 border border-white/15 p-5 shadow-2xl space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center shrink-0">
                  <Trash2 className="w-5 h-5 text-rose-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Clear Shared Notes?</h3>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    This will wipe all text and code from the shared notes editor for all participants.
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setConfirmClearNotesOpen(false)}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold text-neutral-300 hover:text-white bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setNotesContent('');
                    syncNotesToFirestore('');
                    setConfirmClearNotesOpen(false);
                    showToast('Scratchpad notes cleared');
                  }}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 transition-colors cursor-pointer shadow-md"
                >
                  Clear Notes
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CollaborativeScratchpadModal;
