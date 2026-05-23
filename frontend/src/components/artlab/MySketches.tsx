'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Trash2, Share2 } from 'lucide-react';
import type { SavedSketch } from './data';

type Props = {
    sketches: SavedSketch[];
    onDelete: (id: string) => void;
};

function SketchCard({ sketch, onDelete }: { sketch: SavedSketch; onDelete: (id: string) => void }) {
    const download = () => {
        const a = document.createElement('a');
        a.href = sketch.data;
        a.download = `${sketch.name}.png`;
        a.click();
    };

    const share = async () => {
        if (navigator.share) {
            try {
                const res = await fetch(sketch.data);
                const blob = await res.blob();
                const file = new File([blob], `${sketch.name}.png`, { type: 'image/png' });
                await navigator.share({ files: [file], title: sketch.name });
            } catch {}
        } else {
            navigator.clipboard.writeText(sketch.data);
            alert('Image data copied!');
        }
    };

    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.85 }}
            whileHover={{ y: -3 }}
            className="group relative overflow-hidden border-2 border-black/10 bg-white transition-all hover:border-black hover:shadow-[4px_4px_0_rgba(0,0,0,0.8)]"
        >
            {/* Thumbnail */}
            <div className="relative aspect-video overflow-hidden bg-gray-50">
                <img
                    src={sketch.data}
                    alt={sketch.name}
                    className="h-full w-full object-cover"
                />
                {/* Hover actions */}
                <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/40 opacity-0 transition-all group-hover:opacity-100">
                    <button
                        onClick={download}
                        className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-black transition-all hover:bg-[#ffeb3b]"
                        title="Download"
                    >
                        <Download size={15} />
                    </button>
                    <button
                        onClick={share}
                        className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-black transition-all hover:bg-[#ffeb3b]"
                        title="Share"
                    >
                        <Share2 size={15} />
                    </button>
                    <button
                        onClick={() => onDelete(sketch.id)}
                        className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-red-500 transition-all hover:bg-red-50"
                        title="Delete"
                    >
                        <Trash2 size={15} />
                    </button>
                </div>
            </div>

            {/* Info */}
            <div className="p-3">
                <p className="text-sm font-bold truncate">{sketch.name}</p>
                <div className="mt-1 flex items-center justify-between">
                    <span className="text-xs text-gray-400">{sketch.pencil} on {sketch.paper}</span>
                    <span className="text-xs text-gray-400">{sketch.date}</span>
                </div>
            </div>
        </motion.div>
    );
}

export default function MySketches({ sketches, onDelete }: Props) {
    return (
        <div className="flex h-full flex-col overflow-hidden bg-[#fdfbf7]">
            {/* Header */}
            <div className="border-b-2 border-black/8 bg-white px-6 py-4">
                <h2 className="text-xl font-black">My Sketches</h2>
                <p className="text-sm text-gray-500">
                    {sketches.length === 0 ? 'No sketches saved yet' : `${sketches.length} sketch${sketches.length !== 1 ? 'es' : ''} saved`}
                </p>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
                <AnimatePresence mode="popLayout">
                    {sketches.length === 0 ? (
                        <motion.div
                            key="empty"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex h-64 flex-col items-center justify-center gap-4 opacity-40"
                        >
                            <span className="text-6xl">🎨</span>
                            <div className="text-center">
                                <p className="text-base font-bold">Your masterpieces will live here</p>
                                <p className="text-sm">Save a sketch from the Lab using the Save button above</p>
                            </div>
                        </motion.div>
                    ) : (
                        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                            {sketches.map(sk => (
                                <SketchCard key={sk.id} sketch={sk} onDelete={onDelete} />
                            ))}
                        </div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
