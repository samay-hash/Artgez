'use client';

import React, { useRef, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react';
import { getStroke } from 'perfect-freehand';
import type { PencilType, PaperType, Tool } from './data';

export type CanvasHandle = {
    getImageData: () => ImageData | null;
    putImageData: (d: ImageData) => void;
    clear: () => void;
    download: (name: string) => void;
    toDataURL: () => string;
};

type Props = {
    activePencil: PencilType;
    activePaper: PaperType;
    activeTool: Tool;
    brushSize: number;
    opacity: number;
    gridVisible: boolean;
    onStrokeStart: () => void;
    isDarkMode?: boolean;
};

const SketchCanvas = forwardRef<CanvasHandle, Props>(function SketchCanvas(
    { activePencil, activePaper, activeTool, brushSize, opacity, gridVisible, onStrokeStart, isDarkMode = false },
    ref
) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const isDrawing = useRef(false);
    const lastPos = useRef<{ x: number; y: number } | null>(null);
    const lineStart = useRef<{ x: number; y: number } | null>(null);
    const lineSnapshot = useRef<ImageData | null>(null);
    const currentStrokePoints = useRef<number[][]>([]);
    const strokeSnapshot = useRef<ImageData | null>(null);

    // Dynamic dark mode colors for realistic graphite/ink/charcoal sketching on dark paper
    const paperBg = isDarkMode
        ? (() => {
              switch (activePaper.id) {
                  case 'smooth': return '#121214';      // Slate black
                  case 'rough': return '#1c1c1f';       // Slate gray rough sketchpad
                  case 'newsprint': return '#181715';   // Charcoal warm newsprint
                  case 'watercolor': return '#1a1a1e';  // Highly textured deep cold press
                  case 'canvas': return '#212124';      // Gritty dark linen
                  case 'kraft': return '#30261c';       // Rich burnt umber brown paper
                  default: return '#18181b';
              }
          })()
        : activePaper.bg;

    const strokeColor = isDarkMode
        ? (() => {
              switch (activePencil.id) {
                  case '4h': return '#4b525d';      // Faint dark graphite guide
                  case '2h': return '#7c8695';      // Precise slate gray outline
                  case 'hb': return '#a6b0c0';      // Medium silver
                  case '2b': return '#cbd5e1';      // Soft silver white
                  case '4b': return '#f1f5f9';      // Rich bold off-white
                  case '6b': return '#ffffff';      // Luminous charcoal white
                  case 'ch': return '#e4e4e7';      // Textured light chalk
                  case 'ink': return '#2dd4bf';     // Luminous emerald/teal ink (extremely cool!)
                  case 'bp': return '#06b6d4';      // Cyan brush pen stroke
                  default: return '#ffffff';
              }
          })()
        : activePencil.color;

    // Expose methods to parent via ref
    useImperativeHandle(ref, () => ({
        getImageData() {
            const c = canvasRef.current;
            if (!c || c.width === 0 || c.height === 0) return null;
            return c.getContext('2d')!.getImageData(0, 0, c.width, c.height);
        },
        putImageData(data: ImageData) {
            const c = canvasRef.current;
            if (!c) return;
            c.getContext('2d')!.putImageData(data, 0, 0);
        },
        clear() {
            const c = canvasRef.current;
            if (!c) return;
            c.getContext('2d')!.clearRect(0, 0, c.width, c.height);
        },
        download(name: string) {
            const c = canvasRef.current;
            if (!c) return;
            // Composite with paper background
            const tmp = document.createElement('canvas');
            tmp.width = c.width;
            tmp.height = c.height;
            const tctx = tmp.getContext('2d')!;
            tctx.fillStyle = paperBg;
            tctx.fillRect(0, 0, tmp.width, tmp.height);
            tctx.drawImage(c, 0, 0);
            const url = tmp.toDataURL('image/png');
            const a = document.createElement('a');
            a.href = url;
            a.download = `${name}.png`;
            a.click();
        },
        toDataURL() {
            const c = canvasRef.current;
            if (!c) return '';
            const tmp = document.createElement('canvas');
            tmp.width = c.width;
            tmp.height = c.height;
            const tctx = tmp.getContext('2d')!;
            tctx.fillStyle = paperBg;
            tctx.fillRect(0, 0, tmp.width, tmp.height);
            tctx.drawImage(c, 0, 0);
            return tmp.toDataURL('image/png');
        },
    }), [paperBg]);

    // Resize canvas to container
    useEffect(() => {
        const container = containerRef.current;
        const canvas = canvasRef.current;
        if (!container || !canvas) return;

        const resize = () => {
            const ctx = canvas.getContext('2d')!;
            if (canvas.width > 0 && canvas.height > 0 && container.clientWidth > 0 && container.clientHeight > 0) {
                const snapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);
                canvas.width = container.clientWidth;
                canvas.height = container.clientHeight;
                ctx.putImageData(snapshot, 0, 0);
            } else {
                canvas.width = Math.max(container.clientWidth, 1);
                canvas.height = Math.max(container.clientHeight, 1);
            }
        };

        const ro = new ResizeObserver(resize);
        ro.observe(container);
        resize();
        return () => ro.disconnect();
    }, []);

    const getPos = useCallback((e: React.PointerEvent) => {
        const canvas = canvasRef.current!;
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        return {
            x: (e.clientX - rect.left) * scaleX,
            y: (e.clientY - rect.top) * scaleY,
        };
    }, []);

    const addGrain = useCallback((
        ctx: CanvasRenderingContext2D,
        x: number, y: number,
        size: number, grain: number
    ) => {
        if (grain < 0.1) return;
        const count = Math.floor(grain * 12);
        for (let i = 0; i < count; i++) {
            const gx = x + (Math.random() - 0.5) * size * 5;
            const gy = y + (Math.random() - 0.5) * size * 5;
            ctx.beginPath();
            ctx.arc(gx, gy, Math.random() * size * 0.35, 0, Math.PI * 2);
            // In dark mode, draw paper texture details as light soft flecks, in light mode draw dark flecks
            ctx.fillStyle = isDarkMode 
                ? `rgba(255,255,255,${grain * 0.08 * Math.random()})`
                : `rgba(0,0,0,${grain * 0.1 * Math.random()})`;
            ctx.fill();
        }
    }, [isDarkMode]);

    const startDraw = useCallback((e: React.PointerEvent) => {
        e.preventDefault();
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d')!;
        const pos = getPos(e);
        isDrawing.current = true;

        onStrokeStart();

        if (activeTool === 'line') {
            lineStart.current = pos;
            lineSnapshot.current = ctx.getImageData(0, 0, canvas.width, canvas.height);
        } else if (activeTool === 'eraser') {
            lastPos.current = pos;
        } else if (activeTool === 'pencil') {
            const pressure = e.pointerType === 'mouse' ? 0.5 : (e.pressure || 0.5);
            currentStrokePoints.current = [[pos.x, pos.y, pressure]];
            strokeSnapshot.current = ctx.getImageData(0, 0, canvas.width, canvas.height);
            
            // Single dot preview on start
            const size = activePencil.size * brushSize * (0.5 + pressure * 1.0);
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, size / 2, 0, Math.PI * 2);
            ctx.fillStyle = strokeColor;
            ctx.globalAlpha = activePencil.opacity * opacity * (0.3 + pressure * 0.7);
            ctx.fill();
            ctx.globalAlpha = 1;
        }
    }, [activeTool, activePencil, brushSize, opacity, getPos, onStrokeStart, strokeColor]);

    const draw = useCallback((e: React.PointerEvent) => {
        if (!isDrawing.current) return;
        e.preventDefault();
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d')!;
        const pos = getPos(e);

        if (activeTool === 'line' && lineStart.current && lineSnapshot.current) {
            // Preview line: restore snapshot then draw
            ctx.putImageData(lineSnapshot.current, 0, 0);
            ctx.beginPath();
            ctx.moveTo(lineStart.current.x, lineStart.current.y);
            ctx.lineTo(pos.x, pos.y);
            ctx.lineCap = 'round';
            ctx.lineWidth = activePencil.size * brushSize;
            ctx.globalAlpha = activePencil.opacity * opacity;
            ctx.strokeStyle = strokeColor;
            ctx.stroke();
            ctx.globalAlpha = 1;
            return;
        }

        if (activeTool === 'eraser') {
            ctx.save();
            ctx.globalCompositeOperation = 'destination-out';
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, brushSize * 12, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(0,0,0,1)';
            ctx.fill();
            ctx.restore();
            lastPos.current = pos;
            return;
        }

        if (activeTool === 'pencil' && strokeSnapshot.current) {
            let pressure = e.pressure;
            if (e.pointerType === 'mouse') {
                // Simulate pressure based on speed, or fallback
                if (currentStrokePoints.current.length > 0) {
                    const lastPt = currentStrokePoints.current[currentStrokePoints.current.length - 1];
                    const dx = pos.x - lastPt[0];
                    const dy = pos.y - lastPt[1];
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    // Fast movement = thinner line
                    pressure = Math.max(0.15, Math.min(1.0, 1.3 - dist / 40));
                } else {
                    pressure = 0.5;
                }
            } else {
                pressure = pressure || 0.5;
            }

            currentStrokePoints.current.push([pos.x, pos.y, pressure]);

            // Restore the canvas to the state before this stroke started
            ctx.putImageData(strokeSnapshot.current, 0, 0);

            // Get perfect-freehand outline points
            const size = activePencil.size * brushSize;
            const stroke = getStroke(currentStrokePoints.current, {
                size,
                thinning: activePencil.category === 'ink' ? 0.6 : activePencil.category === 'charcoal' ? 0.15 : 0.35,
                smoothing: 0.55,
                streamline: 0.55,
                simulatePressure: e.pointerType === 'mouse',
            });

            if (stroke.length > 0) {
                ctx.beginPath();
                ctx.moveTo(stroke[0][0], stroke[0][1]);
                for (let i = 1; i < stroke.length; i++) {
                    ctx.lineTo(stroke[i][0], stroke[i][1]);
                }
                ctx.closePath();
                ctx.fillStyle = strokeColor;
                ctx.globalAlpha = activePencil.opacity * opacity;
                ctx.fill();
                ctx.globalAlpha = 1;
            }

            // Draw beautiful grain for realistic textured pencils
            const grain = activePaper.grain;
            if (grain > 0.05 && activePencil.category !== 'ink') {
                const effectiveSize = size * (1.2 + grain * 0.4) * (0.4 + pressure * 1.2);
                addGrain(ctx, pos.x, pos.y, effectiveSize, grain);
            }
        }
    }, [activeTool, activePencil, brushSize, opacity, getPos, activePaper.grain, addGrain, strokeColor]);

    const stopDraw = useCallback(() => {
        if (activeTool === 'line' && lineStart.current) {
            lineSnapshot.current = null;
            lineStart.current = null;
        }
        isDrawing.current = false;
        lastPos.current = null;
        currentStrokePoints.current = [];
        strokeSnapshot.current = null;
    }, [activeTool]);

    const cursor = activeTool === 'eraser' ? 'cell' : 'crosshair';

    return (
        <div
            ref={containerRef}
            className="relative flex-1 overflow-hidden"
            style={{ backgroundColor: paperBg, transition: 'background-color 0.3s ease' }}
        >
            {/* Paper texture overlays */}
            {activePaper.grain > 0 && (
                <div
                    className={`pointer-events-none absolute inset-0 z-10 ${isDarkMode ? 'mix-blend-overlay' : 'mix-blend-multiply'}`}
                    style={{
                        opacity: isDarkMode ? activePaper.grain * 0.15 : activePaper.grain * 0.35,
                        backgroundImage: activePaper.id === 'rough' || activePaper.id === 'watercolor' || activePaper.id === 'canvas'
                            ? `url("data:image/svg+xml,%3Csvg viewBox='0 0 300 300' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='${0.5 + activePaper.grain * 0.4}' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`
                            : `repeating-linear-gradient(0deg, transparent, transparent 5px, rgba(0,0,0,0.04) 5px, rgba(0,0,0,0.04) 6px)`,
                        backgroundSize: '300px 300px',
                    }}
                />
            )}

            {/* Grid overlay */}
            {gridVisible && (
                <div
                    className="pointer-events-none absolute inset-0 z-10"
                    style={{
                        backgroundImage: isDarkMode
                            ? `linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)`
                            : `linear-gradient(rgba(0,0,0,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.08) 1px, transparent 1px)`,
                        backgroundSize: '40px 40px',
                    }}
                />
            )}

            {/* Empty state hint */}
            <div className="pointer-events-none absolute inset-0 z-0 flex flex-col items-center justify-center gap-2 select-none">
                <span className="text-5xl opacity-[0.06] dark:opacity-[0.04]">✏️</span>
                <p className="text-sm font-medium opacity-[0.12] dark:opacity-[0.08] dark:text-zinc-200">Draw here</p>
            </div>

            <canvas
                ref={canvasRef}
                className="absolute inset-0 z-20 touch-none"
                style={{ cursor, display: 'block', width: '100%', height: '100%' }}
                onPointerDown={startDraw}
                onPointerMove={draw}
                onPointerUp={stopDraw}
                onPointerLeave={stopDraw}
            />
        </div>
    );
});

export default SketchCanvas;
