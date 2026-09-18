export interface StrokePoint {
  x: number;
  y: number;
}

export type CanvasTool =
  | 'select'
  | 'hand'
  | 'pen'
  | 'highlighter'
  | 'eraser'
  | 'rectangle'
  | 'circle'
  | 'triangle'
  | 'star'
  | 'diamond'
  | 'speech'
  | 'arrow'
  | 'line'
  | 'text'
  | 'sticky'
  | 'stamp'
  | 'image'
  | 'laser';

export type LineStyle = 'solid' | 'dashed' | 'dotted';

export interface DrawingStroke {
  id: string;
  tool: CanvasTool;
  color: string;
  width: number;
  points: StrokePoint[];
  createdBy: string;
  fill?: boolean;
  text?: string;
  fontSize?: number;
  lineStyle?: LineStyle;
  opacity?: number;
  stampType?: string;
  imageUrl?: string;
  dimensions?: { width: number; height: number };
  isLocked?: boolean;
  rotation?: number;
}

export interface BoundingBox {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  width: number;
  height: number;
  centerX: number;
  centerY: number;
}

/**
 * Snap point to grid if enabled
 */
export function snapPoint(pt: StrokePoint, gridSize: number, enabled: boolean): StrokePoint {
  if (!enabled || gridSize <= 0) return pt;
  return {
    x: Math.round(pt.x / gridSize) * gridSize,
    y: Math.round(pt.y / gridSize) * gridSize,
  };
}

/**
 * Compute the bounding box of any stroke
 */
export function getStrokeBoundingBox(stroke: DrawingStroke): BoundingBox {
  if (!stroke.points || stroke.points.length === 0) {
    return { minX: 0, minY: 0, maxX: 0, maxY: 0, width: 0, height: 0, centerX: 0, centerY: 0 };
  }

  if (stroke.tool === 'sticky') {
    const pt = stroke.points[0];
    const w = 150;
    const h = 110;
    return {
      minX: pt.x,
      minY: pt.y,
      maxX: pt.x + w,
      maxY: pt.y + h,
      width: w,
      height: h,
      centerX: pt.x + w / 2,
      centerY: pt.y + h / 2,
    };
  }

  if (stroke.tool === 'speech') {
    if (stroke.points.length >= 2) {
      const start = stroke.points[0];
      const end = stroke.points[stroke.points.length - 1];
      const minX = Math.min(start.x, end.x);
      const minY = Math.min(start.y, end.y);
      const maxX = Math.max(start.x, end.x);
      const maxY = Math.max(start.y, end.y);
      const w = Math.max(80, maxX - minX);
      const h = Math.max(48, maxY - minY);
      return {
        minX,
        minY,
        maxX: minX + w,
        maxY: minY + h,
        width: w,
        height: h,
        centerX: minX + w / 2,
        centerY: minY + h / 2,
      };
    }
    const pt = stroke.points[0];
    const textLen = (stroke.text || '').length;
    const w = stroke.dimensions?.width || Math.max(130, textLen * 9 + 40);
    const h = stroke.dimensions?.height || 54;
    return {
      minX: pt.x,
      minY: pt.y,
      maxX: pt.x + w,
      maxY: pt.y + h,
      width: w,
      height: h,
      centerX: pt.x + w / 2,
      centerY: pt.y + h / 2,
    };
  }

  if (stroke.tool === 'stamp') {
    const pt = stroke.points[0];
    const w = stroke.dimensions?.width || 140;
    const h = stroke.dimensions?.height || 48;
    return {
      minX: pt.x,
      minY: pt.y,
      maxX: pt.x + w,
      maxY: pt.y + h,
      width: w,
      height: h,
      centerX: pt.x + w / 2,
      centerY: pt.y + h / 2,
    };
  }

  if (stroke.tool === 'image') {
    const pt = stroke.points[0];
    const w = stroke.dimensions?.width || 180;
    const h = stroke.dimensions?.height || 140;
    return {
      minX: pt.x,
      minY: pt.y,
      maxX: pt.x + w,
      maxY: pt.y + h,
      width: w,
      height: h,
      centerX: pt.x + w / 2,
      centerY: pt.y + h / 2,
    };
  }

  if (stroke.tool === 'text') {
    const pt = stroke.points[0];
    const fontSize = stroke.fontSize || 18;
    const lines = (stroke.text || '').split('\n');
    const maxLineLen = Math.max(1, ...lines.map((l) => l.length));
    const approxWidth = Math.max(40, maxLineLen * (fontSize * 0.62));
    const lineHeight = fontSize * 1.3;
    const approxHeight = Math.max(fontSize, lines.length * lineHeight);
    return {
      minX: pt.x,
      minY: pt.y - fontSize * 0.9,
      maxX: pt.x + approxWidth,
      maxY: pt.y + approxHeight - fontSize * 0.9,
      width: approxWidth,
      height: approxHeight,
      centerX: pt.x + approxWidth / 2,
      centerY: pt.y + approxHeight / 2 - fontSize * 0.9,
    };
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const p of stroke.points) {
    if (p.x < minX) minX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.x > maxX) maxX = p.x;
    if (p.y > maxY) maxY = p.y;
  }

  const width = Math.max(1, maxX - minX);
  const height = Math.max(1, maxY - minY);

  return {
    minX,
    minY,
    maxX,
    maxY,
    width,
    height,
    centerX: minX + width / 2,
    centerY: minY + height / 2,
  };
}

/**
 * Check distance from point to line segment
 */
function distToSegmentSquared(p: StrokePoint, v: StrokePoint, w: StrokePoint): number {
  const l2 = (v.x - w.x) * (v.x - w.x) + (v.y - w.y) * (v.y - w.y);
  if (l2 === 0) return (p.x - v.x) * (p.x - v.x) + (p.y - v.y) * (p.y - v.y);
  let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
  t = Math.max(0, Math.min(1, t));
  const projX = v.x + t * (w.x - v.x);
  const projY = v.y + t * (w.y - v.y);
  return (p.x - projX) * (p.x - projX) + (p.y - projY) * (p.y - projY);
}

/**
 * Hit testing: determines whether a click at `pt` falls on or very close to `stroke`
 */
export function isPointNearStroke(pt: StrokePoint, stroke: DrawingStroke, threshold: number = 10): boolean {
  if (!stroke.points || stroke.points.length === 0) return false;

  const bbox = getStrokeBoundingBox(stroke);
  const margin = Math.max(threshold, (stroke.width || 4) + 6);

  // If stroke has rotation, transform hit test point into unrotated space
  let testPt = pt;
  if (stroke.rotation) {
    const rad = (-stroke.rotation * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    const dx = pt.x - bbox.centerX;
    const dy = pt.y - bbox.centerY;
    testPt = {
      x: bbox.centerX + (dx * cos - dy * sin),
      y: bbox.centerY + (dx * sin + dy * cos),
    };
  }

  // Quick reject outside bounding box + margin
  if (
    testPt.x < bbox.minX - margin ||
    testPt.x > bbox.maxX + margin ||
    testPt.y < bbox.minY - margin ||
    testPt.y > bbox.maxY + margin
  ) {
    return false;
  }

  // Bounding box shapes (if clicked inside or within margin)
  const isBoxShape = ['rectangle', 'sticky', 'stamp', 'image', 'text', 'speech'].includes(stroke.tool);
  if (isBoxShape) {
    return (
      testPt.x >= bbox.minX - margin &&
      testPt.x <= bbox.maxX + margin &&
      testPt.y >= bbox.minY - margin &&
      testPt.y <= bbox.maxY + margin
    );
  }

  if (stroke.tool === 'circle') {
    const rx = bbox.width / 2;
    const ry = bbox.height / 2;
    const dx = (testPt.x - bbox.centerX) / Math.max(1, rx);
    const dy = (testPt.y - bbox.centerY) / Math.max(1, ry);
    const distNorm = Math.sqrt(dx * dx + dy * dy);
    if (stroke.fill) {
      return distNorm <= 1.1;
    }
    return Math.abs(distNorm - 1.0) <= (margin / Math.min(rx, ry));
  }

  if (stroke.tool === 'diamond' || stroke.tool === 'triangle' || stroke.tool === 'star') {
    if (stroke.fill) {
      return (
        testPt.x >= bbox.minX - 4 &&
        testPt.x <= bbox.maxX + 4 &&
        testPt.y >= bbox.minY - 4 &&
        testPt.y <= bbox.maxY + 4
      );
    }
  }

  // For path, line, arrow, or outline shapes, check segment distance
  const threshSq = margin * margin;
  for (let i = 0; i < stroke.points.length - 1; i++) {
    const d2 = distToSegmentSquared(testPt, stroke.points[i], stroke.points[i + 1]);
    if (d2 <= threshSq) return true;
  }

  // Single point check
  if (stroke.points.length === 1) {
    const d2 = (testPt.x - stroke.points[0].x) ** 2 + (testPt.y - stroke.points[0].y) ** 2;
    return d2 <= threshSq;
  }

  return false;
}

/**
 * Generate clean Scalable Vector Graphics (SVG) string representing all strokes
 */
export function generateSvgFromWhiteboard(
  strokes: DrawingStroke[],
  width: number = 1920,
  height: number = 1080,
  backgroundColor: string = '#090d16'
): string {
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">\n`;
  svg += `  <rect width="100%" height="100%" fill="${backgroundColor}" />\n`;

  strokes.forEach((s) => {
    if (!s.points || s.points.length === 0) return;
    const strokeColor = s.color || '#f59e0b';
    const strokeWidth = s.width || 4;
    const opacity = typeof s.opacity === 'number' ? s.opacity : (s.tool === 'highlighter' ? 0.35 : 1.0);
    const strokeDash =
      s.lineStyle === 'dashed' ? 'stroke-dasharray="10,6"' : s.lineStyle === 'dotted' ? 'stroke-dasharray="3,6"' : '';
    const fillStr = s.fill ? `fill="${strokeColor}33"` : 'fill="none"';

    const bbox = getStrokeBoundingBox(s);
    const rotAttr = s.rotation ? `transform="rotate(${s.rotation} ${bbox.centerX} ${bbox.centerY})"` : '';

    if (s.tool === 'rectangle' && s.points.length >= 2) {
      const start = s.points[0];
      const end = s.points[s.points.length - 1];
      const x = Math.min(start.x, end.x);
      const y = Math.min(start.y, end.y);
      const w = Math.abs(end.x - start.x);
      const h = Math.abs(end.y - start.y);
      svg += `  <rect x="${x}" y="${y}" width="${w}" height="${h}" stroke="${strokeColor}" stroke-width="${strokeWidth}" ${fillStr} opacity="${opacity}" ${strokeDash} rx="6" ${rotAttr} />\n`;
    } else if (s.tool === 'circle' && s.points.length >= 2) {
      svg += `  <ellipse cx="${bbox.centerX}" cy="${bbox.centerY}" rx="${bbox.width / 2}" ry="${bbox.height / 2}" stroke="${strokeColor}" stroke-width="${strokeWidth}" ${fillStr} opacity="${opacity}" ${strokeDash} ${rotAttr} />\n`;
    } else if (s.tool === 'diamond' && s.points.length >= 2) {
      const pts = `${bbox.centerX},${bbox.minY} ${bbox.maxX},${bbox.centerY} ${bbox.centerX},${bbox.maxY} ${bbox.minX},${bbox.centerY}`;
      svg += `  <polygon points="${pts}" stroke="${strokeColor}" stroke-width="${strokeWidth}" ${fillStr} opacity="${opacity}" ${strokeDash} ${rotAttr} />\n`;
    } else if (s.tool === 'triangle' && s.points.length >= 2) {
      const pts = `${bbox.centerX},${bbox.minY} ${bbox.maxX},${bbox.maxY} ${bbox.minX},${bbox.maxY}`;
      svg += `  <polygon points="${pts}" stroke="${strokeColor}" stroke-width="${strokeWidth}" ${fillStr} opacity="${opacity}" ${strokeDash} ${rotAttr} />\n`;
    } else if (s.tool === 'speech') {
      const w = bbox.width;
      const h = Math.max(32, bbox.height - 14);
      const textContent = (s.text || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      svg += `  <g ${rotAttr}>\n`;
      svg += `    <rect x="${bbox.minX}" y="${bbox.minY}" width="${w}" height="${h}" rx="10" stroke="${strokeColor}" stroke-width="${strokeWidth}" ${fillStr} opacity="${opacity}" />\n`;
      svg += `    <polygon points="${bbox.minX + 20},${bbox.minY + h} ${bbox.minX + 12},${bbox.minY + h + 12} ${bbox.minX + 36},${bbox.minY + h}" fill="${strokeColor}" opacity="${opacity}" />\n`;
      if (textContent) {
        svg += `    <text x="${bbox.minX + 10}" y="${bbox.minY + h / 2 + 5}" font-family="system-ui, sans-serif" font-size="${s.fontSize || 13}" font-weight="600" fill="${strokeColor}">${textContent}</text>\n`;
      }
      svg += `  </g>\n`;
    } else if (s.tool === 'text') {
      const pt = s.points[0];
      const fontSize = s.fontSize || 18;
      const lines = (s.text || '').split('\n');
      const lineHeight = fontSize * 1.3;
      svg += `  <g ${rotAttr}>\n`;
      lines.forEach((lineText, idx) => {
        const escaped = lineText.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        svg += `    <text x="${pt.x}" y="${pt.y + idx * lineHeight}" font-family="system-ui, sans-serif" font-size="${fontSize}" font-weight="600" fill="${strokeColor}" opacity="${opacity}">${escaped}</text>\n`;
      });
      svg += `  </g>\n`;
    } else if (s.tool === 'sticky') {
      const pt = s.points[0];
      const textLines = (s.text || '').split('\n').map((l) => l.replace(/&/g, '&amp;').replace(/</g, '&lt;'));
      svg += `  <g transform="translate(${pt.x}, ${pt.y})" ${rotAttr}>\n`;
      svg += `    <rect width="150" height="110" rx="8" fill="${strokeColor}" opacity="0.95" />\n`;
      textLines.slice(0, 5).forEach((line, idx) => {
        svg += `    <text x="12" y="${32 + idx * 16}" font-family="system-ui, sans-serif" font-size="12" fill="#1e293b">${line}</text>\n`;
      });
      svg += `  </g>\n`;
    } else if (s.tool === 'line' && s.points.length >= 2) {
      const p1 = s.points[0];
      const p2 = s.points[s.points.length - 1];
      svg += `  <line x1="${p1.x}" y1="${p1.y}" x2="${p2.x}" y2="${p2.y}" stroke="${strokeColor}" stroke-width="${strokeWidth}" opacity="${opacity}" ${strokeDash} stroke-linecap="round" ${rotAttr} />\n`;
    } else if (s.tool === 'arrow' && s.points.length >= 2) {
      const p1 = s.points[0];
      const p2 = s.points[s.points.length - 1];
      svg += `  <line x1="${p1.x}" y1="${p1.y}" x2="${p2.x}" y2="${p2.y}" stroke="${strokeColor}" stroke-width="${strokeWidth}" opacity="${opacity}" stroke-linecap="round" ${rotAttr} />\n`;
    } else if (s.points.length > 1) {
      const d = s.points.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
      svg += `  <path d="${d}" fill="none" stroke="${strokeColor}" stroke-width="${strokeWidth}" opacity="${opacity}" stroke-linecap="round" stroke-linejoin="round" ${strokeDash} ${rotAttr} />\n`;
    }
  });

  svg += `</svg>`;
  return svg;
}

/**
 * Duplicate a stroke with a slight offset and new unique ID
 */
export function duplicateStroke(stroke: DrawingStroke, offset: number = 24): DrawingStroke {
  const newId = `stroke_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const shiftedPoints = stroke.points.map((p) => ({
    x: p.x + offset,
    y: p.y + offset,
  }));

  return {
    ...stroke,
    id: newId,
    points: shiftedPoints,
    dimensions: stroke.dimensions ? { ...stroke.dimensions } : undefined,
  };
}

/**
 * Rotate a stroke by an angle in degrees around its center
 */
export function rotateStroke(stroke: DrawingStroke, angleDeg: number): DrawingStroke {
  if (!stroke.points || stroke.points.length === 0) return stroke;
  const newRotation = (((stroke.rotation || 0) + angleDeg) % 360 + 360) % 360;

  return {
    ...stroke,
    rotation: newRotation,
  };
}

/**
 * Flip stroke horizontally or vertically across its bounding box center
 */
export function flipStroke(stroke: DrawingStroke, horizontal: boolean): DrawingStroke {
  if (!stroke.points || stroke.points.length === 0) return stroke;
  const bbox = getStrokeBoundingBox(stroke);

  if (stroke.points.length === 1) {
    const curRot = stroke.rotation || 0;
    return {
      ...stroke,
      rotation: (360 - curRot) % 360,
    };
  }

  const flippedPoints = stroke.points.map((p) => {
    return {
      x: horizontal ? Math.round(bbox.centerX * 2 - p.x) : p.x,
      y: !horizontal ? Math.round(bbox.centerY * 2 - p.y) : p.y,
    };
  });

  return {
    ...stroke,
    points: flippedPoints,
  };
}

/**
 * Reorder strokes: Bring selected stroke to the very top (front)
 */
export function bringToFront(strokes: DrawingStroke[], strokeId: string): DrawingStroke[] {
  const target = strokes.find((s) => s.id === strokeId);
  if (!target) return strokes;
  return [...strokes.filter((s) => s.id !== strokeId), target];
}

/**
 * Reorder strokes: Send selected stroke to the very bottom (back)
 */
export function sendToBack(strokes: DrawingStroke[], strokeId: string): DrawingStroke[] {
  const target = strokes.find((s) => s.id === strokeId);
  if (!target) return strokes;
  return [target, ...strokes.filter((s) => s.id !== strokeId)];
}

/**
 * Reorder strokes: Step forward or backward in z-index
 */
export function moveZOrder(
  strokes: DrawingStroke[],
  strokeId: string,
  direction: 'up' | 'down'
): DrawingStroke[] {
  const index = strokes.findIndex((s) => s.id === strokeId);
  if (index === -1) return strokes;
  const newIndex = direction === 'up' ? index + 1 : index - 1;
  if (newIndex < 0 || newIndex >= strokes.length) return strokes;

  const copy = [...strokes];
  const temp = copy[index];
  copy[index] = copy[newIndex];
  copy[newIndex] = temp;
  return copy;
}
