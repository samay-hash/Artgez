'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Sparkles, Plus, Image as ImageIcon, Frame, Loader2, ArrowLeft, X } from 'lucide-react';
import RoughCard from './RoughCard';
import RoughButton from './RoughButton';
import { logEvent } from '@/src/lib/analytics';

type ExhibitionItem = {
    id: string;
    sessionId: string;
    sketchId: string;
    name: string;
    imageData: string;
    frameType: string;
    pencilUsed: string;
    paperUsed: string;
    likes: number;
    createdAt: string;
};

type Props = {
    sessionId: string;
    mySketches: any[];
    onBackToCanvas?: () => void;
};

export default function MuseumHall({ sessionId, mySketches, onBackToCanvas }: Props) {
    const [exhibitions, setExhibitions] = useState<ExhibitionItem[]>([]);
    const [loading, setLoading] = useState(false);
    
    // Modal state for posting artwork
    const [isPosting, setIsPosting] = useState(false);
    const [selectedSketchId, setSelectedSketchId] = useState('');
    const [selectedFrame, setSelectedFrame] = useState('gold'); // gold, wood, black
    const [publishing, setPublishing] = useState(false);

    const fetchExhibitions = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/exhibitions');
            const result = await res.json();
            if (result.success) {
                setExhibitions(result.data);
            }
        } catch (err) {
            console.error('Failed to fetch exhibitions:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchExhibitions();
    }, []);

    const handleLike = async (artId: string) => {
        // Optimistic UI update
        setExhibitions(prev => prev.map(art => {
            if (art.id === artId) {
                return { ...art, likes: art.likes + 1 };
            }
            return art;
        }));

        try {
            const res = await fetch(`/api/exhibitions/${artId}/like`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-session-id': sessionId,
                }
            });
            const result = await res.json();
            if (result.success) {
                // update with exact value from DB
                setExhibitions(prev => prev.map(art => {
                    if (art.id === artId) {
                        return { ...art, likes: result.likes };
                    }
                    return art;
                }));
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handlePublish = async () => {
        const matchingSketch = mySketches.find(s => s.id === selectedSketchId);
        if (!matchingSketch) return;

        setPublishing(true);
        try {
            const res = await fetch('/api/exhibitions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-session-id': sessionId,
                },
                body: JSON.stringify({
                    sketchId: matchingSketch.id,
                    name: matchingSketch.name,
                    imageData: matchingSketch.data,
                    frameType: selectedFrame,
                    pencilUsed: matchingSketch.pencil,
                    paperUsed: matchingSketch.paper,
                })
            });
            const result = await res.json();
            if (result.success) {
                fetchExhibitions();
                setIsPosting(false);
                setSelectedSketchId('');
            }
        } catch (err) {
            console.error(err);
        } finally {
            setPublishing(false);
        }
    };

    return (
        <div className="flex h-full flex-col overflow-hidden bg-[#18181b] text-white relative">
            {/* Museum Gallery spotlights overlay */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-yellow-500/10 via-transparent to-transparent pointer-events-none z-0" />

            {/* Top header */}
            <div className="border-b-2 border-white/10 px-6 py-5 flex items-center justify-between shrink-0 z-10 bg-black/40 backdrop-blur-md">
                <div>
                    <h2 className="text-2xl font-black tracking-tight flex items-center gap-2">
                        <Sparkles className="text-yellow-400 animate-pulse" size={24} /> The Grand Museum Hall
                    </h2>
                    <p className="text-xs text-gray-400 mt-0.5">Exhibit your framed masterpieces under spotlights in our community showroom</p>
                </div>

                <div className="flex gap-2">
                    {onBackToCanvas && (
                        <button
                            onClick={onBackToCanvas}
                            className="flex items-center gap-1 bg-white/5 border border-white/10 hover:bg-white/10 font-bold text-xs px-3.5 py-2 rounded transition-colors"
                        >
                            <ArrowLeft size={13} /> Back to Canvas
                        </button>
                    )}
                    <button
                        onClick={() => {
                            if (mySketches.length === 0) {
                                alert("You haven't saved any sketches yet! Go draw and save a sketch in the Lab first.");
                                return;
                            }
                            setIsPosting(true);
                            logEvent('open_exhibition_modal');
                        }}
                        className="flex items-center gap-1.5 bg-yellow-400 text-black border-2 border-black font-black text-xs px-4 py-2 rounded shadow-[3px_3px_0_rgba(255,255,255,1)] hover:shadow-none translate-y-[-1px] hover:translate-y-[1px] hover:translate-x-[1px] transition-all"
                    >
                        <Plus size={14} /> Exhibit Art Masterpiece
                    </button>
                </div>
            </div>

            {/* Framed Wall Grid */}
            <div className="flex-1 overflow-y-auto p-6 md:p-10 z-10 select-none">
                {loading && exhibitions.length === 0 ? (
                    <div className="flex flex-col items-center justify-center gap-2 h-64">
                        <Loader2 size={36} className="animate-spin text-yellow-400" />
                        <p className="text-xs font-bold text-gray-400">Loading virtual art galleries...</p>
                    </div>
                ) : exhibitions.length === 0 ? (
                    <div className="flex flex-col items-center justify-center gap-3 h-80 opacity-50 border-2 border-dashed border-white/10 rounded-xl m-4 bg-white/5">
                        <ImageIcon size={44} className="text-gray-500 animate-bounce" />
                        <div className="text-center">
                            <p className="text-sm font-black text-white">Exhibition Wall is Empty</p>
                            <p className="text-xs text-gray-400 mt-1 max-w-xs">Be the first to frame your sketch and hang it in the museum hall for other creators to view!</p>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 max-w-6xl mx-auto">
                        {exhibitions.map((art) => {
                            // Frame Styling
                            let frameClass = '';
                            let innerBorderClass = '';
                            if (art.frameType === 'gold') {
                                frameClass = 'bg-gradient-to-r from-yellow-600 via-yellow-400 to-amber-600 border-4 border-amber-500 p-6 shadow-[0_20px_40px_rgba(251,191,36,0.15)]';
                                innerBorderClass = 'border-4 border-[#b45309] shadow-inner';
                            } else if (art.frameType === 'wood') {
                                frameClass = 'bg-gradient-to-r from-amber-900 via-amber-800 to-amber-950 border-4 border-[#451a03] p-6 shadow-[0_20px_40px_rgba(0,0,0,0.4)]';
                                innerBorderClass = 'border-4 border-amber-950 shadow-inner';
                            } else {
                                frameClass = 'bg-[#09090b] border-4 border-[#27272a] p-5 shadow-[0_20px_40px_rgba(0,0,0,0.6)]';
                                innerBorderClass = 'border-4 border-white/90 shadow-inner';
                            }

                            return (
                                <motion.div
                                    key={art.id}
                                    initial={{ opacity: 0, y: 30 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="flex flex-col items-center relative"
                                >
                                    {/* Spotlight beam glow overlay */}
                                    <div className="absolute -top-10 w-24 h-48 bg-yellow-500/5 blur-xl rounded-full pointer-events-none" />

                                    {/* Framed Canvas Box */}
                                    <div className={`relative ${frameClass} w-full aspect-square max-w-[320px] transition-all hover:scale-[1.02] flex items-center justify-center border-y-black`}>
                                        {/* Frame Corner Accents for Gold */}
                                        {art.frameType === 'gold' && (
                                            <>
                                                <div className="absolute top-1.5 left-1.5 h-3.5 w-3.5 bg-yellow-300 border border-black rounded-full" />
                                                <div className="absolute top-1.5 right-1.5 h-3.5 w-3.5 bg-yellow-300 border border-black rounded-full" />
                                                <div className="absolute bottom-1.5 left-1.5 h-3.5 w-3.5 bg-yellow-300 border border-black rounded-full" />
                                                <div className="absolute bottom-1.5 right-1.5 h-3.5 w-3.5 bg-yellow-300 border border-black rounded-full" />
                                            </>
                                        )}

                                        <div className={`w-full h-full bg-[#fdfbf7] overflow-hidden flex items-center justify-center relative ${innerBorderClass}`}>
                                            <img src={art.imageData} alt={art.name} className="w-full h-full object-cover select-none" />
                                        </div>
                                    </div>

                                    {/* Spotlight beam source */}
                                    <div className="w-12 h-1.5 bg-yellow-400/20 rounded-full blur-[1px] absolute -top-4" />

                                    {/* Art Card Description Label hanging underneath */}
                                    <div className="w-[280px] bg-white text-black p-3.5 mt-4 border-2 border-black shadow-[3px_3px_0_rgba(255,255,255,1)] relative">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <h4 className="text-sm font-black leading-tight">{art.name}</h4>
                                                <span className="text-[9px] uppercase font-bold tracking-wider text-purple-600 block mt-0.5">
                                                    by sess_{art.sessionId.substring(5, 11)}
                                                </span>
                                            </div>
                                            <button
                                                onClick={() => handleLike(art.id)}
                                                className="flex items-center gap-1 rounded border-2 border-black bg-red-100 hover:bg-red-200 px-2 py-1 text-xs font-bold transition-all shadow-[2px_2px_0_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px]"
                                            >
                                                <Heart size={11} fill="#ef4444" className="text-red-500" /> {art.likes}
                                            </button>
                                        </div>

                                        <div className="mt-2.5 pt-2 border-t border-black/5 flex justify-between text-[9px] text-gray-500 font-semibold select-none">
                                            <span>✏️ {art.pencilUsed}</span>
                                            <span>📄 {art.paperUsed}</span>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Exhibit choice framing modal overlay */}
            <AnimatePresence>
                {isPosting && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-[3px]">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="w-full max-w-md text-black"
                        >
                            <RoughCard className="bg-white p-6 shadow-2xl relative" roughness={0.8}>
                                {/* Close Button */}
                                <button
                                    onClick={() => setIsPosting(false)}
                                    className="absolute top-4 right-4 bg-black/5 hover:bg-black hover:text-white rounded p-1 transition-colors"
                                >
                                    <X size={16} />
                                </button>

                                <div className="mb-4">
                                    <span className="flex items-center gap-1 text-[9px] uppercase font-black tracking-widest text-purple-600">
                                        <Frame size={11} /> Museum Framing Workshop
                                    </span>
                                    <h3 className="text-xl font-black mt-1">Exhibit Art Masterpiece</h3>
                                    <p className="text-xs text-gray-500 font-semibold">Select your saved canvas drawing and choose an elegant frame style.</p>
                                </div>

                                <div className="flex flex-col gap-4">
                                    {/* Select Art Sketch */}
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-xs font-bold text-gray-600">Select Sketch Artwork</label>
                                        <select
                                            value={selectedSketchId}
                                            onChange={e => setSelectedSketchId(e.target.value)}
                                            className="h-10 rounded border-2 border-black/15 bg-white px-3 text-xs font-semibold outline-none focus:border-black"
                                        >
                                            <option value="">-- Choose from saved sketches --</option>
                                            {mySketches.map(s => (
                                                <option key={s.id} value={s.id}>
                                                    {s.name} ({s.pencil} core on {s.paper})
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Choose Frame Styling */}
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-xs font-bold text-gray-600">Exhibition Frame Style</label>
                                        <div className="grid grid-cols-3 gap-2.5 mt-1">
                                            {/* Royal Gold */}
                                            <label 
                                                className={`flex flex-col items-center gap-1.5 border-2 p-2.5 rounded cursor-pointer transition-all ${
                                                    selectedFrame === 'gold' ? 'border-amber-500 bg-amber-50 shadow-[2px_2px_0_rgba(0,0,0,1)]' : 'border-black/15 hover:border-black/35'
                                                }`}
                                            >
                                                <input 
                                                    type="radio" 
                                                    name="frame" 
                                                    value="gold"
                                                    checked={selectedFrame === 'gold'}
                                                    onChange={() => setSelectedFrame('gold')}
                                                    className="accent-amber-500 hidden"
                                                />
                                                <div className="h-5 w-5 rounded bg-gradient-to-r from-yellow-500 via-yellow-300 to-amber-500 border border-black shadow" />
                                                <span className="text-[10px] font-black">Royal Gold</span>
                                            </label>

                                            {/* Eco Wood */}
                                            <label 
                                                className={`flex flex-col items-center gap-1.5 border-2 p-2.5 rounded cursor-pointer transition-all ${
                                                    selectedFrame === 'wood' ? 'border-amber-800 bg-amber-50/50 shadow-[2px_2px_0_rgba(0,0,0,1)]' : 'border-black/15 hover:border-black/35'
                                                }`}
                                            >
                                                <input 
                                                    type="radio" 
                                                    name="frame" 
                                                    value="wood"
                                                    checked={selectedFrame === 'wood'}
                                                    onChange={() => setSelectedFrame('wood')}
                                                    className="accent-amber-800 hidden"
                                                />
                                                <div className="h-5 w-5 rounded bg-amber-900 border border-black shadow" />
                                                <span className="text-[10px] font-black">Eco Wood</span>
                                            </label>

                                            {/* Minimalist Black */}
                                            <label 
                                                className={`flex flex-col items-center gap-1.5 border-2 p-2.5 rounded cursor-pointer transition-all ${
                                                    selectedFrame === 'black' ? 'border-black bg-gray-50 shadow-[2px_2px_0_rgba(0,0,0,1)]' : 'border-black/15 hover:border-black/35'
                                                }`}
                                            >
                                                <input 
                                                    type="radio" 
                                                    name="frame" 
                                                    value="black"
                                                    checked={selectedFrame === 'black'}
                                                    onChange={() => setSelectedFrame('black')}
                                                    className="accent-black hidden"
                                                />
                                                <div className="h-5 w-5 rounded bg-[#18181b] border border-black shadow" />
                                                <span className="text-[10px] font-black">Gallery Black</span>
                                            </label>
                                        </div>
                                    </div>

                                    {/* Preview container */}
                                    {selectedSketchId && (
                                        <div className="mt-2 flex items-center justify-center p-3.5 bg-gray-50 rounded border border-black/5">
                                            <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest flex items-center gap-1">
                                                <Sparkles size={11} className="text-yellow-500 animate-spin" /> Ready to exhibit on spotlight wall
                                            </div>
                                        </div>
                                    )}

                                    {/* Trigger Submit */}
                                    <div className="mt-4 pt-4 border-t border-black/5 flex gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setIsPosting(false)}
                                            className="px-4 py-2.5 rounded border border-black text-xs font-bold uppercase hover:bg-gray-50 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <RoughButton
                                            onClick={handlePublish}
                                            className="flex-1 py-3 text-xs uppercase"
                                            bg="#ffeb3b"
                                            disabled={publishing || !selectedSketchId}
                                        >
                                            {publishing ? (
                                                <span className="flex items-center justify-center gap-1.5">
                                                    <Loader2 size={13} className="animate-spin" /> Hanging on spotlight Wall...
                                                </span>
                                            ) : (
                                                <span className="flex items-center justify-center gap-1.5">
                                                    Publish to Virtual Museum
                                                </span>
                                            )}
                                        </RoughButton>
                                    </div>
                                </div>
                            </RoughCard>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
