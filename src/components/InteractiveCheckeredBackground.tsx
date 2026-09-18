import React, { useEffect, useRef, useState, useCallback } from 'react';

export type NeonPalette = 'multi' | 'cyan' | 'emerald' | 'violet' | 'amber';

interface InteractiveCheckeredBackgroundProps {
  cellSize?: number;
  className?: string;
  palette?: NeonPalette;
  opacity?: number; // overall background master opacity
  showControls?: boolean;
  mode?: 'light' | 'dark';
}

// Soft, feather-light pastel neon colors specifically tuned for dark mode
const NEON_COLORS: Record<NeonPalette, string[]> = {
  multi: [
    'rgba(125, 211, 252, ', // Soft Sky Cyan
    'rgba(110, 231, 183, ', // Soft Mint
    'rgba(216, 180, 254, ', // Delicate Lavender Violet
    'rgba(253, 230, 138, ', // Pale Warm Amber
    'rgba(153, 246, 228, ', // Gentle Aqua
  ],
  cyan: [
    'rgba(186, 230, 253, ', // Very light sky
    'rgba(125, 211, 252, ',
    'rgba(103, 232, 249, ',
    'rgba(165, 243, 252, ',
  ],
  emerald: [
    'rgba(167, 243, 208, ', // Light mint emerald
    'rgba(110, 231, 183, ',
    'rgba(153, 246, 228, ',
    'rgba(209, 250, 229, ',
  ],
  violet: [
    'rgba(233, 213, 255, ', // Light lavender
    'rgba(216, 180, 254, ',
    'rgba(192, 132, 252, ',
    'rgba(245, 208, 254, ',
  ],
  amber: [
    'rgba(254, 243, 199, ', // Pale warm gold
    'rgba(253, 230, 138, ',
    'rgba(254, 215, 170, ',
    'rgba(252, 211, 77, ',
  ],
};

// Rich, high-contrast jewel-toned accents optimized for crisp light canvas
const LIGHT_NEON_COLORS: Record<NeonPalette, string[]> = {
  multi: [
    'rgba(2, 132, 199, ',   // Sky 600
    'rgba(5, 150, 105, ',   // Emerald 600
    'rgba(124, 58, 237, ',  // Violet 600
    'rgba(217, 119, 6, ',   // Amber 600
    'rgba(13, 148, 136, ',  // Teal 600
  ],
  cyan: [
    'rgba(2, 132, 199, ',
    'rgba(3, 105, 161, ',
    'rgba(14, 165, 233, ',
    'rgba(8, 145, 178, ',
  ],
  emerald: [
    'rgba(5, 150, 105, ',
    'rgba(16, 185, 129, ',
    'rgba(4, 120, 87, ',
    'rgba(13, 148, 136, ',
  ],
  violet: [
    'rgba(124, 58, 237, ',
    'rgba(147, 51, 234, ',
    'rgba(109, 40, 217, ',
    'rgba(192, 38, 211, ',
  ],
  amber: [
    'rgba(217, 119, 6, ',
    'rgba(245, 158, 11, ',
    'rgba(180, 83, 9, ',
    'rgba(234, 88, 12, ',
  ],
};

interface ActiveCell {
  x: number; // grid col index
  y: number; // grid row index
  intensity: number; // 0 to 1
  colorIndex: number;
}

interface Ripple {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  strength: number;
  color: string;
}

export function InteractiveCheckeredBackground({
  cellSize = 38,
  className = '',
  palette = 'multi',
  opacity = 0.8,
  showControls = false,
  mode = 'light',
}: InteractiveCheckeredBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [currentPalette, setCurrentPalette] = useState<NeonPalette>(palette);

  // Mouse & interaction state refs (to avoid unnecessary React re-renders on every animation frame)
  const mouseRef = useRef<{
    x: number;
    y: number;
    targetX: number;
    targetY: number;
    isHovering: boolean;
    lastMoved: number;
  }>({
    x: -1000,
    y: -1000,
    targetX: -1000,
    targetY: -1000,
    isHovering: false,
    lastMoved: 0,
  });

  const activeCellsRef = useRef<Map<string, ActiveCell>>(new Map());
  const ripplesRef = useRef<Ripple[]>([]);
  const animFrameIdRef = useRef<number | null>(null);

  // Trigger subtle ripple on mouse click/touch tap
  const triggerRipple = useCallback((clientX: number, clientY: number) => {
    const colorsDict = mode === 'light' ? LIGHT_NEON_COLORS : NEON_COLORS;
    const paletteColors = colorsDict[currentPalette];
    const chosenColor = paletteColors[Math.floor(Math.random() * paletteColors.length)];
    ripplesRef.current.push({
      x: clientX,
      y: clientY,
      radius: 4,
      maxRadius: 160,
      strength: mode === 'light' ? 0.22 : 0.12,
      color: chosenColor,
    });
  }, [currentPalette, mode]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // High efficiency: Pre-render static checkered grid to an offscreen canvas
    let offscreenCanvas: HTMLCanvasElement | null = document.createElement('canvas');
    let offscreenCtx = offscreenCanvas.getContext('2d');

    const renderStaticGrid = () => {
      if (!offscreenCanvas || !offscreenCtx) return;
      offscreenCanvas.width = width;
      offscreenCanvas.height = height;
      const cols = Math.ceil(width / cellSize) + 1;
      const rows = Math.ceil(height / cellSize) + 1;

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const x = c * cellSize;
          const y = r * cellSize;
          const isEvenCheck = (c + r) % 2 === 0;

          if (mode === 'light') {
            // Subtle alternating checked tiles for light canvas
            if (isEvenCheck) {
              offscreenCtx.fillStyle = 'rgba(15, 23, 42, 0.012)';
              offscreenCtx.fillRect(x, y, cellSize, cellSize);
            } else {
              offscreenCtx.fillStyle = 'rgba(15, 23, 42, 0.024)';
              offscreenCtx.fillRect(x, y, cellSize, cellSize);
            }

            // Checkered grid border lines
            offscreenCtx.strokeStyle = 'rgba(15, 23, 42, 0.04)';
            offscreenCtx.lineWidth = 1;
            offscreenCtx.strokeRect(x + 0.5, y + 0.5, cellSize, cellSize);

            // Technical micro-dot crosshairs at check corners
            if (isEvenCheck) {
              offscreenCtx.fillStyle = 'rgba(15, 23, 42, 0.08)';
              offscreenCtx.fillRect(x - 0.75, y - 0.75, 1.5, 1.5);
            }
          } else {
            // Subtle alternating checked tiles for dark canvas
            if (isEvenCheck) {
              offscreenCtx.fillStyle = 'rgba(255, 255, 255, 0.007)';
              offscreenCtx.fillRect(x, y, cellSize, cellSize);
            } else {
              offscreenCtx.fillStyle = 'rgba(0, 0, 0, 0.08)';
              offscreenCtx.fillRect(x, y, cellSize, cellSize);
            }

            // Subtle checkered grid border lines
            offscreenCtx.strokeStyle = 'rgba(255, 255, 255, 0.016)';
            offscreenCtx.lineWidth = 1;
            offscreenCtx.strokeRect(x + 0.5, y + 0.5, cellSize, cellSize);

            // Technical micro-dot crosshairs at check corners
            if (isEvenCheck) {
              offscreenCtx.fillStyle = 'rgba(255, 255, 255, 0.025)';
              offscreenCtx.fillRect(x - 0.75, y - 0.75, 1.5, 1.5);
            }
          }
        }
      }
    };

    renderStaticGrid();

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      renderStaticGrid();
    };

    window.addEventListener('resize', handleResize);

    const handlePointerMove = (e: PointerEvent) => {
      mouseRef.current.targetX = e.clientX;
      mouseRef.current.targetY = e.clientY;
      mouseRef.current.isHovering = true;
      mouseRef.current.lastMoved = performance.now();
    };

    const handlePointerLeave = () => {
      mouseRef.current.isHovering = false;
    };

    const handlePointerDown = (e: PointerEvent) => {
      triggerRipple(e.clientX, e.clientY);
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    window.addEventListener('pointerdown', handlePointerDown, { passive: true });
    document.addEventListener('mouseleave', handlePointerLeave);

    let lastTime = performance.now();

    const render = (time: number) => {
      // Pause drawing when tab is hidden to conserve 100% CPU and battery
      if (document.hidden) {
        animFrameIdRef.current = requestAnimationFrame(render);
        return;
      }

      const dt = Math.min((time - lastTime) / 1000, 0.1);
      lastTime = time;

      // Smooth mouse position lerping for buttery soft tracking
      const mouse = mouseRef.current;
      mouse.x += (mouse.targetX - mouse.x) * 0.25;
      mouse.y += (mouse.targetY - mouse.y) * 0.25;

      ctx.clearRect(0, 0, width, height);

      // Fast blit of pre-rendered static checkered grid (1 single draw call instead of 1,500)
      if (offscreenCanvas) {
        ctx.drawImage(offscreenCanvas, 0, 0);
      }

      const cols = Math.ceil(width / cellSize) + 1;
      const rows = Math.ceil(height / cellSize) + 1;

      // 1. If mouse is within screen, activate cells under and around cursor
      if (mouse.isHovering && mouse.x >= 0 && mouse.x <= width && mouse.y >= 0 && mouse.y <= height) {
        const centerCol = Math.floor(mouse.x / cellSize);
        const centerRow = Math.floor(mouse.y / cellSize);

        // Check cells within proximity radius
        const radiusCells = 3;
        for (let r = -radiusCells; r <= radiusCells; r++) {
          for (let c = -radiusCells; c <= radiusCells; c++) {
            const col = centerCol + c;
            const row = centerRow + r;
            if (col < 0 || col >= cols || row < 0 || row >= rows) continue;

            const cellCenterX = col * cellSize + cellSize / 2;
            const cellCenterY = row * cellSize + cellSize / 2;
            const dist = Math.hypot(mouse.x - cellCenterX, mouse.y - cellCenterY);
            const maxDist = cellSize * (radiusCells + 0.5);

            if (dist < maxDist) {
              const key = `${col}_${row}`;
              const factor = Math.max(0, 1 - dist / maxDist);
              // Target intensity has a gentle non-linear curve for whisper-soft lightness
              const targetIntensity = Math.pow(factor, 2.2) * 0.45;

              const colorsDict = mode === 'light' ? LIGHT_NEON_COLORS : NEON_COLORS;
              const paletteColors = colorsDict[currentPalette];
              const colorIdx = (col * 7 + row * 13 + Math.floor(time / 4000)) % paletteColors.length;

              const existing = activeCellsRef.current.get(key);
              if (existing) {
                existing.intensity = Math.max(existing.intensity, targetIntensity);
                existing.colorIndex = colorIdx;
              } else {
                activeCellsRef.current.set(key, {
                  x: col,
                  y: row,
                  intensity: targetIntensity,
                  colorIndex: colorIdx,
                });
              }
            }
          }
        }
      }

      // 2. Ambient subtle drift if user is idle for > 3 seconds
      const idleTime = time - mouse.lastMoved;
      if (idleTime > 3000) {
        const waveX = (Math.sin(time * 0.0006) * 0.5 + 0.5) * cols;
        const waveY = (Math.cos(time * 0.0005) * 0.5 + 0.5) * rows;
        const ambientCol = Math.floor(waveX);
        const ambientRow = Math.floor(waveY);
        const ambientKey = `${ambientCol}_${ambientRow}`;
        const colorsDict = mode === 'light' ? LIGHT_NEON_COLORS : NEON_COLORS;
        if (!activeCellsRef.current.has(ambientKey)) {
          activeCellsRef.current.set(ambientKey, {
            x: ambientCol,
            y: ambientRow,
            intensity: mode === 'light' ? 0.18 : 0.12,
            colorIndex: (ambientCol + ambientRow) % colorsDict[currentPalette].length,
          });
        }
      }

      // 3. Base checkered pattern is efficiently blitted above via offscreenCanvas

      // 4. Update and draw active glowing neon checks
      const colorsDict = mode === 'light' ? LIGHT_NEON_COLORS : NEON_COLORS;
      const paletteColors = colorsDict[currentPalette];
      const decayRate = 0.93; // Smooth, soft decay

      activeCellsRef.current.forEach((cell, key) => {
        if (cell.intensity <= 0.008) {
          activeCellsRef.current.delete(key);
          return;
        }

        const x = cell.x * cellSize;
        const y = cell.y * cellSize;
        const baseColor = paletteColors[cell.colorIndex % paletteColors.length];

        // Fill active check with soft translucent wash
        const fillAlpha = mode === 'light'
          ? (cell.intensity * 0.08).toFixed(3)
          : (cell.intensity * 0.045).toFixed(3);
        ctx.fillStyle = `${baseColor}${fillAlpha})`;
        ctx.fillRect(x + 1, y + 1, cellSize - 1, cellSize - 1);

        // Thin, delicate luminous outline for the checked tile
        const strokeAlpha = mode === 'light'
          ? (cell.intensity * 0.28).toFixed(3)
          : (cell.intensity * 0.14).toFixed(3);
        ctx.strokeStyle = `${baseColor}${strokeAlpha})`;
        ctx.lineWidth = mode === 'light' ? 1 : 0.8;
        ctx.strokeRect(x + 0.5, y + 0.5, cellSize, cellSize);

        // Subtle micro-dot corner accents
        const cornerAlpha = mode === 'light'
          ? (cell.intensity * 0.38).toFixed(3)
          : (cell.intensity * 0.22).toFixed(3);
        ctx.fillStyle = `${baseColor}${cornerAlpha})`;
        const dotSize = 1.5;
        ctx.fillRect(x - 0.75, y - 0.75, dotSize, dotSize);
        ctx.fillRect(x + cellSize - 0.75, y - 0.75, dotSize, dotSize);
        ctx.fillRect(x - 0.75, y + cellSize - 0.75, dotSize, dotSize);
        ctx.fillRect(x + cellSize - 0.75, y + cellSize - 0.75, dotSize, dotSize);

        // Decay intensity
        cell.intensity *= decayRate;
      });

      // 5. Update & draw ripples (from clicks/taps)
      for (let i = ripplesRef.current.length - 1; i >= 0; i--) {
        const ripple = ripplesRef.current[i];
        ripple.radius += (ripple.maxRadius - ripple.radius) * 0.12 + 2;
        ripple.strength *= 0.93;

        if (ripple.radius >= ripple.maxRadius || ripple.strength <= 0.02) {
          ripplesRef.current.splice(i, 1);
          continue;
        }

        // Draw expanding soft neon ripple ring
        ctx.beginPath();
        ctx.arc(ripple.x, ripple.y, ripple.radius, 0, Math.PI * 2);
        const rippleAlpha = mode === 'light'
          ? (ripple.strength * 0.28).toFixed(3)
          : (ripple.strength * 0.15).toFixed(3);
        ctx.strokeStyle = `${ripple.color}${rippleAlpha})`;
        ctx.lineWidth = mode === 'light' ? 1.2 : 1;
        ctx.stroke();

        // Illuminate check cells that intersect the ripple wavefront gently
        const hitCol = Math.floor((ripple.x + ripple.radius * 0.7) / cellSize);
        const hitRow = Math.floor((ripple.y + ripple.radius * 0.7) / cellSize);
        const rippleKey = `${hitCol}_${hitRow}`;
        if (!activeCellsRef.current.has(rippleKey)) {
          activeCellsRef.current.set(rippleKey, {
            x: hitCol,
            y: hitRow,
            intensity: ripple.strength * (mode === 'light' ? 0.35 : 0.25),
            colorIndex: Math.floor(Math.random() * paletteColors.length),
          });
        }
      }

      // 6. Very soft, diffused radial neon cursor glow
      if (mouse.isHovering && mouse.x >= 0 && mouse.y >= 0) {
        const radialGrad = ctx.createRadialGradient(
          mouse.x,
          mouse.y,
          0,
          mouse.x,
          mouse.y,
          cellSize * 3.5
        );
        const primaryNeon = paletteColors[0];
        const secondaryNeon = paletteColors[1] || primaryNeon;

        if (mode === 'light') {
          radialGrad.addColorStop(0, `${primaryNeon}0.045)`);
          radialGrad.addColorStop(0.4, `${secondaryNeon}0.015)`);
          radialGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
        } else {
          radialGrad.addColorStop(0, `${primaryNeon}0.025)`);
          radialGrad.addColorStop(0.4, `${secondaryNeon}0.008)`);
          radialGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        }

        ctx.fillStyle = radialGrad;
        ctx.beginPath();
        ctx.arc(mouse.x, mouse.y, cellSize * 3.5, 0, Math.PI * 2);
        ctx.fill();
      }

      animFrameIdRef.current = requestAnimationFrame(render);
    };

    animFrameIdRef.current = requestAnimationFrame(render);

    return () => {
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
      offscreenCanvas = null;
      offscreenCtx = null;
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('mouseleave', handlePointerLeave);
    };
  }, [cellSize, currentPalette, mode, triggerRipple]);

  return (
    <div
      className={`fixed inset-0 pointer-events-none select-none z-0 overflow-hidden ${className}`}
      style={{ opacity }}
      aria-hidden="true"
    >
      <canvas ref={canvasRef} className="w-full h-full block" />

      {/* Optional Neon Palette Switcher for users who want to customize their neon aesthetic */}
      {showControls && (
        <div
          className={`absolute bottom-4 right-4 pointer-events-auto z-20 flex items-center gap-1.5 p-1.5 rounded-full backdrop-blur-md text-[11px] shadow-lg ${
            mode === 'light'
              ? 'bg-white/95 border border-slate-200 text-slate-700 shadow-slate-200/50'
              : 'bg-neutral-900/90 border border-neutral-800 text-neutral-300'
          }`}
        >
          <span className={`px-2 font-medium ${mode === 'light' ? 'text-slate-500' : 'text-neutral-400'}`}>
            Grid Accent:
          </span>
          {(['multi', 'cyan', 'emerald', 'violet', 'amber'] as NeonPalette[]).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setCurrentPalette(p)}
              className={`px-2 py-0.5 rounded-full font-medium capitalize transition-colors cursor-pointer ${
                currentPalette === p
                  ? mode === 'light'
                    ? 'bg-slate-900 text-white font-semibold shadow-xs'
                    : 'bg-white/15 text-white font-semibold shadow-xs'
                  : mode === 'light'
                  ? 'text-slate-600 hover:text-slate-900'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
