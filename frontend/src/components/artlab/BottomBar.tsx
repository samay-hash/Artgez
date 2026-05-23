'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { PENCILS, PAPERS } from './data';
import type { PencilType, PaperType } from './data';

type Props = {
    activePencil: PencilType;
    activePaper: PaperType;
    setActivePencil: (p: PencilType) => void;
    setActivePaper: (p: PaperType) => void;
    isDarkMode?: boolean;
};

const CATEGORY_COLORS = {
    graphite: '#e5e7eb',
    charcoal: '#374151',
    ink: '#1e3a5f',
};

const CATEGORY_TEXT = {
    graphite: '#1f2937',
    charcoal: '#f9fafb',
    ink: '#f0f9ff',
};

export default function BottomBar({ activePencil, activePaper, setActivePencil, setActivePaper, isDarkMode = false }: Props) {
    return (
        <div className="flex flex-col border-t-2 border-black/10 dark:border-white/10 bg-[#fafaf8] dark:bg-[#18181b] transition-colors duration-300">

            {/* PENCIL ROW */}
            <div className="flex items-center gap-2 overflow-x-auto px-4 py-3 scrollbar-none">
                <span className="mr-1 shrink-0 text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-zinc-500">Pencil</span>
                {PENCILS.map(p => {
                    const isActive = activePencil.id === p.id;
                    const bgColor = CATEGORY_COLORS[p.category];
                    const textColor = CATEGORY_TEXT[p.category];
                    
                    const bg = isDarkMode
                        ? (p.category === 'graphite' ? '#27272a' : p.category === 'charcoal' ? '#3f3f46' : '#1e293b')
                        : bgColor;
                    const text = isDarkMode ? '#cbd5e1' : textColor;

                    return (
                        <motion.button
                            key={p.id}
                            onClick={() => setActivePencil(p)}
                            whileHover={{ y: -2 }}
                            whileTap={{ scale: 0.95 }}
                            className="group relative shrink-0"
                        >
                            <div
                                className={`flex h-9 items-center gap-1.5 rounded-full px-3.5 text-xs font-bold transition-all ${
                                    isActive
                                        ? 'border-2 border-black dark:border-emerald-400 shadow-[2px_2px_0_rgba(0,0,0,1)] dark:shadow-[2px_2px_0_rgba(16,185,129,0.3)]'
                                        : 'border-2 border-transparent hover:border-black/30 dark:hover:border-white/30'
                                }`}
                                style={{
                                    backgroundColor: isActive ? (isDarkMode ? '#10b981' : '#ffeb3b') : bg,
                                    color: isActive ? (isDarkMode ? '#09090b' : '#000') : text,
                                }}
                            >
                                {/* Visual pencil thickness indicator */}
                                <div
                                    className="rounded-full opacity-60"
                                    style={{
                                        width: Math.max(2, p.size * 1.5),
                                        height: Math.max(2, p.size * 1.5),
                                        backgroundColor: isActive ? '#000' : (isDarkMode ? '#ffffff' : p.color),
                                    }}
                                />
                                {p.label}
                            </div>

                            {/* Tooltip on hover */}
                            <div className="pointer-events-none absolute bottom-full left-1/2 mb-2 -translate-x-1/2 whitespace-nowrap rounded border border-black/10 dark:border-white/10 bg-white dark:bg-zinc-800 px-2 py-1 text-[10px] font-medium text-gray-700 dark:text-zinc-300 shadow-md opacity-0 transition-opacity group-hover:opacity-100 z-50">
                                {p.brand} · {p.price}
                            </div>
                        </motion.button>
                    );
                })}
            </div>

            {/* PAPER ROW */}
            <div className="flex items-center gap-2 overflow-x-auto border-t border-black/8 dark:border-white/5 px-4 py-2.5 scrollbar-none">
                <span className="mr-1 shrink-0 text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-zinc-500">Paper</span>
                {PAPERS.map(paper => {
                    const isActive = activePaper.id === paper.id;
                    return (
                        <motion.button
                            key={paper.id}
                            onClick={() => setActivePaper(paper)}
                            whileHover={{ y: -1 }}
                            whileTap={{ scale: 0.95 }}
                            className="group relative shrink-0"
                        >
                            <div
                                className={`flex h-7 items-center gap-2 rounded-full px-3 text-xs font-semibold transition-all ${
                                    isActive
                                        ? 'border-2 border-black dark:border-emerald-400 shadow-[2px_2px_0_rgba(0,0,0,1)] dark:shadow-[2px_2px_0_rgba(16,185,129,0.3)]'
                                        : 'border-2 border-black/15 dark:border-white/10 hover:border-black/40 dark:hover:border-white/30'
                                }`}
                                style={{ backgroundColor: isDarkMode ? (isActive ? '#10b981' : '#27272a') : paper.bg }}
                            >
                                <div
                                    className="h-2.5 w-2.5 rounded-full border border-black/20 dark:border-white/20 shrink-0"
                                    style={{ backgroundColor: isDarkMode ? (isActive ? '#09090b' : '#18181b') : paper.bg }}
                                />
                                <span className={isActive ? (isDarkMode ? 'text-zinc-950 font-bold' : 'text-black font-bold') : 'text-gray-800 dark:text-gray-200'}>
                                    {paper.label}
                                </span>
                            </div>

                            {/* Tooltip */}
                            <div className="pointer-events-none absolute bottom-full left-1/2 mb-2 -translate-x-1/2 whitespace-nowrap rounded border border-black/10 dark:border-white/10 bg-white dark:bg-zinc-800 px-2 py-1 text-[10px] font-medium text-gray-700 dark:text-zinc-300 shadow-md opacity-0 transition-opacity group-hover:opacity-100 z-50">
                                {paper.brand} · {paper.desc}
                            </div>
                        </motion.button>
                    );
                })}
            </div>
        </div>
    );
}
