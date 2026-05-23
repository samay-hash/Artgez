'use client';

import React, { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Users, Plus, LogIn, Clipboard, Check, Loader2, 
    ArrowLeft, RotateCcw, ShieldAlert, Sparkles 
} from 'lucide-react';
import RoughCard from './RoughCard';
import RoughButton from './RoughButton';
import { logEvent } from '@/src/lib/analytics';

type Point = { x: number; y: number };
type Stroke = {
    id: number;
    sessionId: string;
    strokeData: Point[];
    color: string;
    size: number;
    opacity: number;
    timestamp: number;
};

type Props = {
    sessionId: string;
    onBackToCanvas?: () => void;
};

export default function CoDrawRoom({ sessionId, onBackToCanvas }: Props) {
    const [roomId, setRoomId] = useState('');
    const [activeRoom, setActiveRoom] = useState<string | null>(null);
    const [joiningRoomCode, setJoiningRoomCode] = useState('');
    
    const [creating, setCreating] = useState(false);
    const [joining, setJoining] = useState(false);
    const [copied, setCopied] = useState(false);

    // Canvas drawing states
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [activeColor, setActiveColor] = useState('#1e2937');
    const [brushSize, setBrushSize] = useState(3);
    
    // Polling states
    const [lastPolledTime, setLastPolledTime] = useState(0);
    const currentPoints = useRef<Point[]>([]);
    
    const handleCreateRoom = async () => {
        setCreating(true);
        try {
            const res = await fetch('/api/rooms', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-session-id': sessionId
                }
            });
            const result = await res.json();
            if (result.success) {
                setActiveRoom(result.roomId);
                setRoomId(result.roomId);
                setLastPolledTime(Date.now());
                logEvent('multitask_room_create', result.roomId);
            }
        } catch (err) {
            console.error('Room creation failed:', err);
        } finally {
            setCreating(false);
        }
    };

    const handleJoinRoom = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!joiningRoomCode.trim()) return;

        setJoining(true);
        try {
            // Verify room exists by calling fetch strokes
            const res = await fetch(`/api/rooms/${joiningRoomCode.trim().toUpperCase()}/strokes?since=0`);
            const result = await res.json();
            if (result.success) {
                setActiveRoom(result.joiningRoomCode || joiningRoomCode.trim().toUpperCase());
                setRoomId(joiningRoomCode.trim().toUpperCase());
                setLastPolledTime(Date.now() - 5000); // fetch some past strokes
                logEvent('multitask_room_join', joiningRoomCode.trim().toUpperCase());
            } else {
                alert('Room not found! Verify your code and try again.');
            }
        } catch (err) {
            console.error('Room join failed:', err);
            alert('Co-draw room not found! Please check code.');
        } finally {
            setJoining(false);
        }
    };

    const handleCopyCode = () => {
        if (!activeRoom) return;
        navigator.clipboard.writeText(activeRoom);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        logEvent('copy_room_code', activeRoom);
    };

    // ─── Drawing Canvas Operations ─────────────────────────────────────────────
    const getCoordinates = (e: React.PointerEvent<HTMLCanvasElement>): Point => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };
        const rect = canvas.getBoundingClientRect();
        
        // Scale coordinate matching to actual canvas buffer size
        const x = ((e.clientX - rect.left) / rect.width) * canvas.width;
        const y = ((e.clientY - rect.top) / rect.height) * canvas.height;
        return { x, y };
    };

    const startDrawing = (e: React.PointerEvent<HTMLCanvasElement>) => {
        e.preventDefault();
        const canvas = canvasRef.current;
        if (!canvas) return;
        
        const pt = getCoordinates(e);
        currentPoints.current = [pt];
        setIsDrawing(true);

        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.beginPath();
            ctx.moveTo(pt.x, pt.y);
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.strokeStyle = activeColor;
            ctx.lineWidth = brushSize;
            ctx.globalAlpha = 0.9;
        }
    };

    const draw = (e: React.PointerEvent<HTMLCanvasElement>) => {
        if (!isDrawing) return;
        e.preventDefault();
        
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!canvas || !ctx) return;

        const pt = getCoordinates(e);
        currentPoints.current.push(pt);

        ctx.lineTo(pt.x, pt.y);
        ctx.stroke();
    };

    const stopDrawing = async () => {
        if (!isDrawing) return;
        setIsDrawing(false);

        if (currentPoints.current.length < 2) return;

        // Push stroke to database for friend sync
        const strokePayload = {
            strokeData: currentPoints.current,
            color: activeColor,
            size: brushSize,
            opacity: 0.9
        };

        try {
            await fetch(`/api/rooms/${activeRoom}/strokes`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-session-id': sessionId
                },
                body: JSON.stringify(strokePayload)
            });
        } catch (err) {
            console.error('Failed to sync stroke coordinates:', err);
        }
        currentPoints.current = [];
    };

    // Render single stroke line on canvas
    const drawStrokeOnCanvas = (points: Point[], color: string, size: number, opacity: number) => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!canvas || !ctx || points.length < 2) return;

        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.strokeStyle = color;
        ctx.lineWidth = size;
        ctx.globalAlpha = opacity;

        for (let i = 1; i < points.length; i++) {
            ctx.lineTo(points[i].x, points[i].y);
        }
        ctx.stroke();
    };

    // ─── Polling Synchronizer Hook ──────────────────────────────────────────────
    useEffect(() => {
        if (!activeRoom) return;

        let intervalId: any;
        const pollStrokes = async () => {
            try {
                const res = await fetch(`/api/rooms/${activeRoom}/strokes?since=${lastPolledTime}`);
                const result = await res.json();
                if (result.success && result.strokes.length > 0) {
                    let maxTime = lastPolledTime;
                    result.strokes.forEach((stroke: Stroke) => {
                        maxTime = Math.max(maxTime, stroke.timestamp);
                        // Render strokes drawn by OTHER sessions
                        if (stroke.sessionId !== sessionId) {
                            drawStrokeOnCanvas(stroke.strokeData, stroke.color, stroke.size, stroke.opacity);
                        }
                    });
                    setLastPolledTime(maxTime);
                }
            } catch (err) {
                console.error('Polling error:', err);
            }
        };

        // Poll every 1.5 seconds for clean cooperative drawing updates
        intervalId = setInterval(pollStrokes, 1500);

        return () => {
            clearInterval(intervalId);
        };
    }, [activeRoom, lastPolledTime, sessionId]);

    // Handle canvas dimensions matching
    useEffect(() => {
        if (!activeRoom) return;
        const canvas = canvasRef.current;
        if (canvas) {
            canvas.width = 1200;
            canvas.height = 800;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.fillStyle = '#fdfbf7';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
            }
            // Fetch all past room strokes to draw them
            const fetchInitial = async () => {
                try {
                    const res = await fetch(`/api/rooms/${activeRoom}/strokes?since=0`);
                    const result = await res.json();
                    if (result.success && result.strokes) {
                        let maxTime = 0;
                        result.strokes.forEach((stroke: Stroke) => {
                            drawStrokeOnCanvas(stroke.strokeData, stroke.color, stroke.size, stroke.opacity);
                            maxTime = Math.max(maxTime, stroke.timestamp);
                        });
                        if (maxTime > 0) setLastPolledTime(maxTime);
                    }
                } catch (err) {
                    console.error(err);
                }
            };
            fetchInitial();
        }
    }, [activeRoom]);

    const handleClearLocal = () => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (canvas && ctx) {
            ctx.fillStyle = '#fdfbf7';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
    };

    return (
        <div className="flex h-full flex-col overflow-hidden bg-[#18181b] text-white">
            
            {/* LOBBY INTERFACE */}
            {!activeRoom ? (
                <div className="flex-1 flex flex-col items-center justify-center p-6 relative">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-purple-500/10 via-transparent to-transparent pointer-events-none" />

                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="w-full max-w-md"
                    >
                        <RoughCard className="bg-white text-black p-6 shadow-2xl" roughness={0.8}>
                            <div className="flex items-center gap-2 mb-2">
                                <div className="h-9 w-9 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
                                    <Users size={18} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black">Cooperative Draw Lab</h3>
                                    <span className="text-[9px] font-black uppercase text-purple-600 tracking-wider">Multiplayer Workshop</span>
                                </div>
                            </div>
                            <p className="text-xs text-gray-500 mb-6 leading-relaxed">
                                Share a synchronized board with your friends! Create a clean private board code or type one in below to start sketching cooperatively.
                            </p>

                            <div className="flex flex-col gap-4">
                                {/* Create Room Option */}
                                <div className="p-4 rounded-lg bg-gray-50 border-2 border-black/10 flex flex-col gap-3">
                                    <h4 className="text-sm font-black">Option A: Host Private Room</h4>
                                    <p className="text-[10px] text-gray-400 font-semibold leading-relaxed">Generate a shared room coordinate path and invite your partners to sketch together.</p>
                                    <RoughButton
                                        onClick={handleCreateRoom}
                                        className="w-full py-3 text-xs uppercase"
                                        bg="#ffeb3b"
                                        disabled={creating}
                                    >
                                        {creating ? (
                                            <span className="flex items-center justify-center gap-2">
                                                <Loader2 size={13} className="animate-spin" /> Generating Code...
                                            </span>
                                        ) : (
                                            <span className="flex items-center justify-center gap-1.5">
                                                <Plus size={14} /> Create Multiplayer Room
                                            </span>
                                        )}
                                    </RoughButton>
                                </div>

                                <div className="flex items-center justify-center gap-3">
                                    <span className="h-[1px] flex-1 bg-black/10" />
                                    <span className="text-[9px] uppercase font-bold text-gray-400 select-none">Or join</span>
                                    <span className="h-[1px] flex-1 bg-black/10" />
                                </div>

                                {/* Join Room Option */}
                                <form onSubmit={handleJoinRoom} className="p-4 rounded-lg bg-gray-50 border-2 border-black/10 flex flex-col gap-3">
                                    <h4 className="text-sm font-black">Option B: Join Active Code</h4>
                                    <div className="flex gap-2">
                                        <input 
                                            type="text" 
                                            placeholder="ROOM_CODE"
                                            value={joiningRoomCode}
                                            onChange={e => setJoiningRoomCode(e.target.value.toUpperCase())}
                                            className="h-10 flex-1 rounded border-2 border-black/15 bg-white px-3 text-xs font-bold uppercase tracking-wider outline-none focus:border-black"
                                        />
                                        <button
                                            type="submit"
                                            disabled={joining || !joiningRoomCode}
                                            className="flex items-center gap-1.5 bg-black hover:bg-purple-950 text-white font-bold text-xs px-4 rounded transition-all active:translate-y-[1px]"
                                        >
                                            {joining ? <Loader2 size={13} className="animate-spin" /> : <LogIn size={14} />} Join
                                        </button>
                                    </div>
                                </form>
                            </div>

                            {onBackToCanvas && (
                                <button
                                    onClick={onBackToCanvas}
                                    className="w-full mt-4 flex items-center justify-center gap-1 text-xs font-bold text-gray-400 hover:text-black py-2.5 transition-colors uppercase tracking-wider"
                                >
                                    <ArrowLeft size={12} /> Return to Sketch Lab
                                </button>
                            )}
                        </RoughCard>
                    </motion.div>
                </div>
            ) : (
                
                // ACTIVE SYNCHRONIZED DRAWING ROOM
                <div className="flex-1 flex flex-col overflow-hidden">
                    
                    {/* Active Room Top bar */}
                    <div className="border-b-2 border-white/10 px-5 py-3 flex items-center justify-between shrink-0 bg-black/40 backdrop-blur-md">
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => {
                                    setActiveRoom(null);
                                    setRoomId('');
                                }}
                                className="bg-white/5 border border-white/10 hover:bg-white/10 text-white font-bold text-xs p-2 rounded transition-colors"
                                title="Leave Room"
                            >
                                <ArrowLeft size={14} />
                            </button>
                            <div>
                                <h3 className="text-base font-black flex items-center gap-1.5">
                                    <Users size={16} className="text-purple-400 animate-pulse" /> Cooperative Sketch Board
                                </h3>
                                <div className="flex items-center gap-2 mt-0.5 select-text">
                                    <code className="text-xs font-black text-yellow-400 bg-yellow-500/10 border border-yellow-400/20 px-2 py-0.5 rounded">
                                        {activeRoom}
                                    </code>
                                    <button
                                        onClick={handleCopyCode}
                                        className="text-gray-400 hover:text-white transition-colors"
                                        title="Copy Room Invitation Code"
                                    >
                                        {copied ? <Check size={11} className="text-green-500" /> : <Clipboard size={11} />}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Stroke Controls Bar */}
                        <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-full px-3 py-1.5 select-none">
                            {/* Color Selector */}
                            <div className="flex items-center gap-1">
                                {['#1e2937', '#ef4444', '#10b981', '#3b82f6', '#f59e0b', '#8b5cf6'].map(col => (
                                    <button
                                        key={col}
                                        onClick={() => setActiveColor(col)}
                                        className={`h-4.5 w-4.5 rounded-full border border-black/40 transition-all ${
                                            activeColor === col ? 'scale-120 border-white ring-2 ring-purple-500' : 'hover:scale-110'
                                        }`}
                                        style={{ backgroundColor: col }}
                                    />
                                ))}
                            </div>
                            
                            <span className="h-4 w-[1px] bg-white/10" />

                            {/* Brush size Selector */}
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] text-gray-400 uppercase font-black tracking-wide">Size</span>
                                <input 
                                    type="range" 
                                    min={1} 
                                    max={12} 
                                    value={brushSize}
                                    onChange={e => setBrushSize(parseInt(e.target.value, 10))}
                                    className="w-16 h-1 rounded bg-white/10 accent-purple-500"
                                />
                                <span className="text-[10px] font-bold w-4">{brushSize}px</span>
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <button
                                onClick={handleClearLocal}
                                className="flex items-center gap-1 bg-white/5 hover:bg-white/10 text-white font-bold text-xs px-3.5 py-2 rounded transition-colors"
                                title="Clear Local Screen Canvas"
                            >
                                <RotateCcw size={12} /> Clear Board
                            </button>
                            <span className="flex items-center gap-1.5 rounded-full bg-emerald-500 border border-black/10 px-3 py-1.5 text-[9px] font-black text-white select-none">
                                <span className="h-1.5 w-1.5 rounded-full bg-white animate-ping" /> LIVE ROOM
                            </span>
                        </div>
                    </div>

                    {/* Canvas sync warning overlay indicator */}
                    <div className="bg-purple-950/20 border-b border-purple-500/10 px-4 py-1 text-center text-[10px] text-purple-300 font-bold uppercase tracking-wider select-none flex items-center justify-center gap-1">
                        <Sparkles size={11} className="animate-spin text-purple-400" /> Collaborative board syncs coordinates every 1.5 seconds. Enjoy drawing together!
                    </div>

                    {/* Drawing Workspace Canvas Area */}
                    <div className="flex-1 bg-[#121214] flex items-center justify-center p-6 overflow-hidden relative">
                        <canvas
                            ref={canvasRef}
                            onPointerDown={startDrawing}
                            onPointerMove={draw}
                            onPointerUp={stopDrawing}
                            onPointerLeave={stopDrawing}
                            className="bg-[#fdfbf7] shadow-2xl border-4 border-black/30 rounded max-w-full max-h-full cursor-crosshair relative z-10"
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
