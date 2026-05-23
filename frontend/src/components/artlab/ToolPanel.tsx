'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Pencil, Eraser, Minus, Undo2, Redo2, Trash2, Grid3X3, Download } from 'lucide-react';
import type { Tool } from './data';

type Props = {
    activeTool: Tool;
    setActiveTool: (t: Tool) => void;
    brushSize: number;
    setBrushSize: (n: number) => void;
    opacity: number;
    setOpacity: (n: number) => void;
    gridVisible: boolean;
    setGridVisible: (b: boolean) => void;
    onUndo: () => void;
    onRedo: () => void;
    onClear: () => void;
    onDownload: () => void;
    canUndo: boolean;
    canRedo: boolean;
};

const TOOLS: { id: Tool; icon: React.ReactNode; label: string }[] = [
    { id: 'pencil', icon: <Pencil size={18} />, label: 'Pencil' },
    { id: 'eraser', icon: <Eraser size={18} />, label: 'Eraser' },
    { id: 'line',   icon: <Minus size={18} />,  label: 'Line' },
];

export default function ToolPanel({
    activeTool, setActiveTool,
    brushSize, setBrushSize,
    opacity, setOpacity,
    gridVisible, setGridVisible,
    onUndo, onRedo, onClear, onDownload,
    canUndo, canRedo,
}: Props) {
    return (
        <aside className="flex h-full w-16 flex-col items-center gap-3 border-r-2 border-black/10 dark:border-white/10 bg-[#fafaf8] dark:bg-[#18181b] py-4 transition-colors duration-300">

            {/* TOOLS */}
            <div className="flex flex-col gap-1.5 w-full px-2">
                {TOOLS.map(tool => (
                    <motion.button
                        key={tool.id}
                        onClick={() => setActiveTool(tool.id)}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        title={tool.label}
                        className={`relative flex h-10 w-full items-center justify-center rounded-lg border-2 transition-all ${
                            activeTool === tool.id
                                ? 'border-black dark:border-emerald-400 bg-[#ffeb3b] dark:bg-emerald-500 text-black dark:text-zinc-950 shadow-[2px_2px_0_rgba(0,0,0,0.8)] dark:shadow-[2px_2px_0_rgba(16,185,129,0.3)]'
                                : 'border-transparent bg-transparent text-gray-500 dark:text-zinc-400 hover:border-black/20 dark:hover:border-white/20 hover:bg-white dark:hover:bg-zinc-800 hover:text-black dark:hover:text-zinc-100'
                        }`}
                    >
                        {tool.icon}
                        {activeTool === tool.id && (
                            <motion.div layoutId="active-tool" className="absolute -right-0.5 top-1/2 h-2 w-1 -translate-y-1/2 rounded-full bg-black dark:bg-emerald-400" />
                        )}
                    </motion.button>
                ))}
            </div>

            <div className="w-8 border-t border-black/10 dark:border-white/10" />

            {/* UNDO / REDO */}
            <div className="flex flex-col gap-1.5 w-full px-2">
                {[
                    { fn: onUndo, icon: <Undo2 size={16} />, label: 'Undo', disabled: !canUndo },
                    { fn: onRedo, icon: <Redo2 size={16} />, label: 'Redo', disabled: !canRedo },
                ].map(({ fn, icon, label, disabled }) => (
                    <button
                        key={label}
                        onClick={fn}
                        disabled={disabled}
                        title={label}
                        className={`flex h-10 w-full items-center justify-center rounded-lg border-2 border-transparent transition-all ${
                            disabled
                                ? 'opacity-20 cursor-not-allowed'
                                : 'hover:border-black/20 dark:hover:border-white/20 hover:bg-white dark:hover:bg-zinc-800 text-gray-500 dark:text-zinc-400 hover:text-black dark:hover:text-zinc-100'
                        }`}
                    >
                        {icon}
                    </button>
                ))}
            </div>

            <div className="w-8 border-t border-black/10 dark:border-white/10" />

            {/* GRID TOGGLE */}
            <button
                onClick={() => setGridVisible(!gridVisible)}
                title="Toggle Grid"
                className={`flex h-10 w-10 items-center justify-center rounded-lg border-2 transition-all ${
                    gridVisible
                        ? 'border-black dark:border-emerald-400 bg-black dark:bg-emerald-500 text-white dark:text-zinc-950 shadow-[2px_2px_0_rgba(0,0,0,0.8)] dark:shadow-[2px_2px_0_rgba(16,185,129,0.3)]'
                        : 'border-transparent text-gray-400 dark:text-zinc-500 hover:border-black/20 dark:hover:border-white/20 hover:text-black dark:hover:text-zinc-200'
                }`}
            >
                <Grid3X3 size={16} />
            </button>

            {/* DOWNLOAD */}
            <button
                onClick={onDownload}
                title="Download PNG"
                className="flex h-10 w-10 items-center justify-center rounded-lg border-2 border-transparent text-gray-400 dark:text-zinc-500 transition-all hover:border-black/20 dark:hover:border-white/20 hover:text-black dark:hover:text-zinc-200"
            >
                <Download size={16} />
            </button>

            <div className="w-8 border-t border-black/10 dark:border-white/10" />

            {/* BRUSH SIZE */}
            <div className="flex flex-col items-center gap-2 px-2 w-full">
                <span className="text-[9px] font-bold uppercase tracking-wider text-gray-400 dark:text-zinc-500">Size</span>
                <input
                    type="range" min={0.3} max={3} step={0.1}
                    value={brushSize}
                    onChange={e => setBrushSize(parseFloat(e.target.value))}
                    className="h-24 w-2 cursor-pointer appearance-none rounded-full bg-black/10 dark:bg-zinc-800 [writing-mode:vertical-lr] [direction:rtl]"
                    style={{ WebkitAppearance: 'slider-vertical' } as React.CSSProperties}
                />
                <span className="text-[9px] font-bold text-gray-400 dark:text-zinc-500">{brushSize.toFixed(1)}×</span>
            </div>

            <div className="w-8 border-t border-black/10 dark:border-white/10" />

            {/* OPACITY */}
            <div className="flex flex-col items-center gap-2 px-2 w-full">
                <span className="text-[9px] font-bold uppercase tracking-wider text-gray-400 dark:text-zinc-500">Opacity</span>
                <input
                    type="range" min={0.1} max={1} step={0.05}
                    value={opacity}
                    onChange={e => setOpacity(parseFloat(e.target.value))}
                    className="h-20 w-2 cursor-pointer appearance-none rounded-full bg-black/10 dark:bg-zinc-800 [writing-mode:vertical-lr] [direction:rtl]"
                    style={{ WebkitAppearance: 'slider-vertical' } as React.CSSProperties}
                />
                <span className="text-[9px] font-bold text-gray-400 dark:text-zinc-500">{Math.round(opacity * 100)}%</span>
            </div>

            {/* SPACER + CLEAR */}
            <div className="mt-auto px-2 w-full">
                <div className="w-8 border-t border-black/10 dark:border-white/10 mb-3 mx-auto" />
                <button
                    onClick={onClear}
                    title="Clear Canvas"
                    className="flex h-10 w-full items-center justify-center rounded-lg border-2 border-transparent text-gray-400 dark:text-zinc-500 transition-all hover:border-red-300 hover:bg-red-50 dark:hover:bg-red-950/20 hover:text-red-500"
                >
                    <Trash2 size={16} />
                </button>
            </div>
        </aside>
    );
}
