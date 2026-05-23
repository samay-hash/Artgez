'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, Star, FlaskConical, Eye, X } from 'lucide-react';
import { SUPPLY_SHOP, PENCILS } from './data';
import type { SupplyItem } from './data';
import dynamic from 'next/dynamic';
import RoughCard from './RoughCard';
import RoughButton from './RoughButton';

const ThreePencil = dynamic(() => import('./ThreePencil'), {
    ssr: false,
    loading: () => (
        <div className="h-48 w-full flex items-center justify-center bg-gray-50 dark:bg-zinc-800 text-xs font-bold text-gray-400 dark:text-zinc-500 select-none animate-pulse">
            Rendering 3D model...
        </div>
    )
});

type Props = {
    onTryInLab: (pencilId: string) => void;
    onBuySupply: (item: { id: string; name: string; price: string }) => void;
    isDarkMode?: boolean;
};

const FILTERS = ['All', 'Graphite', 'Charcoal', 'Ink', 'Paper', 'Kit'] as const;
type Filter = typeof FILTERS[number];

// ─── STYLIZED 2D ILLUSTRATIONS FOR ART SUPPLIES ─────────────────────────────────
function SupplyIllustration2D({ item, isDarkMode = false }: { item: SupplyItem; isDarkMode?: boolean }) {
    const matchingPencil = item.pencilId ? PENCILS.find(p => p.id === item.pencilId) : null;
    const typeLower = item.type.toLowerCase();

    // ── Render 2D Paper
    if (typeLower === 'paper') {
        const coverColor = item.brand.toLowerCase().includes('canson') ? '#1e3a8a' : '#78350f';
        return (
            <div className="flex items-center justify-center w-full h-full bg-[#fdfbf7] dark:bg-zinc-800 p-6 relative transition-colors duration-300">
                {/* Spiral sketchbook drawing */}
                <div className="relative w-28 h-32 border-2 border-black dark:border-white/20 bg-white dark:bg-zinc-900 rounded shadow-[3px_3px_0_rgba(0,0,0,0.15)] dark:shadow-[3px_3px_0_rgba(255,255,255,0.05)] flex flex-col justify-between overflow-hidden">
                    <div className="h-4 border-b-2 border-black dark:border-white/20" style={{ backgroundColor: coverColor }} />
                    <div className="flex-1 bg-yellow-50/20 p-2 flex flex-col gap-1 border-b-2 border-black/5 dark:border-white/5">
                        <div className="h-1 bg-black/5 dark:bg-white/5 rounded w-16" />
                        <div className="h-1 bg-black/5 dark:bg-white/5 rounded w-20" />
                        <div className="h-1 bg-black/5 dark:bg-white/5 rounded w-12" />
                    </div>
                    <div className="p-1 px-2 text-[8px] font-black text-gray-400 dark:text-zinc-500 text-right uppercase tracking-wider select-none bg-gray-50 dark:bg-zinc-950">
                        {item.brand}
                    </div>
                    {/* Ring binder spirals */}
                    <div className="absolute left-1.5 top-0 bottom-0 flex flex-col gap-2.5 justify-center">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="h-2 w-1.5 rounded-full border border-black dark:border-white/20 bg-gray-300 dark:bg-zinc-700" />
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    // ── Render 2D Kit
    if (typeLower === 'kit') {
        return (
            <div className="flex items-center justify-center w-full h-full bg-[#fdfbf7] dark:bg-zinc-800 p-6 transition-colors duration-300">
                {/* Pencil jar / set container drawing */}
                <div className="relative w-28 h-32 flex flex-col items-center justify-end">
                    {/* Multi-colored pencils sticking out */}
                    <div className="absolute top-2 flex gap-1 items-end z-10">
                        <div className="w-2.5 h-16 bg-amber-400 border border-black dark:border-white/20 rounded-t flex flex-col items-center">
                            <div className="w-full h-2 bg-yellow-100 dark:bg-zinc-700 rounded-t" />
                            <div className="w-1 h-2 bg-[#2d2d2d]" />
                        </div>
                        <div className="w-2.5 h-20 bg-blue-500 border border-black dark:border-white/20 rounded-t flex flex-col items-center">
                            <div className="w-full h-2 bg-yellow-100 dark:bg-zinc-700 rounded-t" />
                            <div className="w-1 h-2 bg-[#2d2d2d]" />
                        </div>
                        <div className="w-2.5 h-14 bg-red-500 border border-black dark:border-white/20 rounded-t flex flex-col items-center">
                            <div className="w-full h-2 bg-yellow-100 dark:bg-zinc-700 rounded-t" />
                            <div className="w-1 h-2 bg-[#2d2d2d]" />
                        </div>
                    </div>
                    {/* Wooden Pencil cup base */}
                    <div className="w-20 h-16 border-2 border-black dark:border-white/20 bg-amber-800/10 dark:bg-white/5 rounded-b shadow-[3px_3px_0_rgba(0,0,0,0.1)] dark:shadow-[3px_3px_0_rgba(255,255,255,0.05)] z-20 flex items-center justify-center">
                        <span className="text-xs font-black text-amber-900/30 dark:text-zinc-600 uppercase tracking-widest">SET</span>
                    </div>
                </div>
            </div>
        );
    }

    // ── Render 2D Pencils/Pens
    let bodyColor = '#1e3f20'; // Faber-Castell green default
    const brandLower = item.brand.toLowerCase();
    if (brandLower.includes('staedtler')) bodyColor = '#0f4c81';
    else if (brandLower.includes('sakura')) bodyColor = '#1f2937';
    else if (brandLower.includes('camlin') || typeLower === 'charcoal') bodyColor = '#374151';
    else if (brandLower.includes('pentel')) bodyColor = '#7f1d1d';

    const strokeColor = isDarkMode
        ? (() => {
              if (!item.pencilId) return '#ffffff';
              switch (item.pencilId) {
                  case '4h': return '#4b525d';      // 4H
                  case '2h': return '#7c8695';      // 2H
                  case 'hb': return '#a6b0c0';      // HB
                  case '2b': return '#cbd5e1';      // 2B
                  case '4b': return '#f1f5f9';      // 4B
                  case '6b': return '#ffffff';      // 6B
                  case 'ch': return '#e4e4e7';      // Charcoal
                  case 'ink': return '#2dd4bf';     // Teal
                  case 'bp': return '#06b6d4';      // Cyan
                  default: return '#ffffff';
              }
          })()
        : matchingPencil?.color || '#000000';

    return (
        <div className="flex items-center justify-center w-full h-full bg-[#fdfbf7] dark:bg-zinc-800 p-8 transition-colors duration-300">
            {/* Minimalist sleek horizontal pencil illustration */}
            <div className="relative w-48 h-8 flex items-center select-none">
                {/* Pink eraser (left) */}
                {!brandLower.includes('sakura') && !brandLower.includes('camlin') && (
                    <div className="w-3.5 h-4 bg-red-400 border-2 border-black dark:border-white/20 rounded-l shrink-0" />
                )}
                {/* Silver connector ring */}
                {!brandLower.includes('sakura') && !brandLower.includes('camlin') && (
                    <div className="w-2 h-4 bg-gray-300 dark:bg-zinc-700 border-y-2 border-r-2 border-black dark:border-white/20 shrink-0" />
                )}
                {/* Main pencil body */}
                <div className="flex-1 h-4 border-y-2 border-black dark:border-white/20 flex items-center justify-center" style={{ backgroundColor: bodyColor }}>
                    <div className="h-[2px] w-full bg-white/20" />
                </div>
                {/* Shaved wood cones */}
                <div className="w-5 h-4 border-y-2 border-black dark:border-white/20 overflow-hidden relative shrink-0 flex items-center">
                    <div className="absolute right-0 w-0 h-0 border-y-[8px] border-y-transparent border-l-[18px] border-l-[#d9b48f]" />
                </div>
                {/* Core carbon tip */}
                <div className="w-2.5 h-4 border-y-2 border-r-2 border-black dark:border-white/20 rounded-r overflow-hidden relative shrink-0 flex items-center">
                    <div className="absolute right-0 w-0 h-0 border-y-[8px] border-y-transparent border-l-[10px]" style={{ borderLeftColor: strokeColor }} />
                </div>
            </div>
        </div>
    );
}

function SupplyCard({ item, onTryInLab, onBuySupply, onInspect, isDarkMode = false }: { item: SupplyItem; onTryInLab: (id: string) => void; onBuySupply: (item: { id: string; name: string; price: string }) => void; onInspect: (item: SupplyItem) => void; isDarkMode?: boolean }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -3 }}
            className="group relative flex flex-col border-2 border-black dark:border-white/10 bg-white dark:bg-zinc-900 shadow-[3px_3px_0_rgba(0,0,0,1)] dark:shadow-[3px_3px_0_rgba(255,255,255,0.08)] hover:shadow-[5px_5px_0_rgba(0,0,0,1)] dark:hover:shadow-[5px_5px_0_rgba(255,255,255,0.12)] transition-all"
        >
            {/* Visual Header Illustration with Hover 3D Overlay */}
            <div className="h-44 w-full border-b-2 border-black dark:border-white/10 bg-[#fafaf8] dark:bg-zinc-850 overflow-hidden relative">
                <SupplyIllustration2D item={item} isDarkMode={isDarkMode} />
                
                {/* 3D Inspect Action Overlay */}
                <div className="absolute inset-0 bg-black/5 dark:bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[1px] z-20">
                    <button
                        onClick={() => onInspect(item)}
                        className="flex items-center gap-1.5 bg-white dark:bg-zinc-900 text-black dark:text-zinc-200 font-black text-xs px-3.5 py-2 border-2 border-black dark:border-white/20 shadow-[3px_3px_0_rgba(0,0,0,1)] dark:shadow-[3px_3px_0_rgba(255,255,255,0.1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
                    >
                        <Eye size={12} /> 👁️ 3D View
                    </button>
                </div>
            </div>

            <div className="flex flex-1 flex-col gap-3 p-4">
                {/* Type badge */}
                <div className="flex items-center justify-between">
                    <span className="rounded-full bg-black/5 dark:bg-white/5 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-gray-500 dark:text-zinc-400">
                        {item.type}
                    </span>
                    <div className="flex items-center gap-0.5">
                        <Star size={10} fill="#f59e0b" className="text-amber-400" />
                        <span className="text-[10px] font-semibold text-gray-500 dark:text-zinc-400">{item.rating}</span>
                        <span className="text-[10px] text-gray-400 dark:text-zinc-500">({item.reviews.toLocaleString()})</span>
                    </div>
                </div>

                <div>
                    <h3 className="text-sm font-bold leading-tight text-gray-950 dark:text-zinc-150">{item.name}</h3>
                    <p className="text-xs text-gray-500 dark:text-zinc-400">{item.brand}</p>
                </div>

                <p className="text-xs text-gray-600 dark:text-zinc-400 leading-relaxed flex-1">{item.desc}</p>

                <div className="mt-auto flex items-center justify-between gap-2">
                    <span className="text-lg font-black text-gray-950 dark:text-zinc-100">{item.price}</span>
                    <div className="flex gap-1.5">
                        {item.pencilId && (
                            <button
                                onClick={() => onTryInLab(item.pencilId!)}
                                className="flex items-center gap-1 rounded border border-black/20 dark:border-white/10 px-2 py-1.5 text-xs font-semibold text-gray-600 dark:text-zinc-300 transition-all hover:border-black dark:hover:border-white hover:bg-black dark:hover:bg-zinc-800 hover:text-white dark:hover:text-zinc-100"
                                title="Try in Sketch Lab"
                            >
                                <FlaskConical size={11} /> Try
                            </button>
                        )}
                        <button
                            onClick={() => onBuySupply({ id: item.id, name: item.name, price: item.price })}
                            className="flex items-center gap-1 rounded border-2 px-2.5 py-1.5 text-xs font-bold border-black dark:border-emerald-400 bg-[#ffeb3b] dark:bg-emerald-500 text-black dark:text-zinc-950 hover:bg-black dark:hover:bg-zinc-950 hover:text-white dark:hover:text-zinc-100 transition-all shadow-[2px_2px_0_rgba(0,0,0,1)] dark:shadow-[2px_2px_0_rgba(16,185,129,0.3)]"
                        >
                            <ShoppingBag size={11} /> Buy
                        </button>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

export default function SupplyShop({ onTryInLab, onBuySupply, isDarkMode = false }: Props) {
    const [activeFilter, setActiveFilter] = useState<Filter>('All');
    const [search, setSearch] = useState('');
    const [inspectingItem, setInspectingItem] = useState<SupplyItem | null>(null);

    const filtered = SUPPLY_SHOP.filter(item => {
        const matchesFilter = activeFilter === 'All' || item.type === activeFilter;
        const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase()) ||
            item.brand.toLowerCase().includes(search.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    const matchingPencil = inspectingItem?.pencilId ? PENCILS.find(p => p.id === inspectingItem.pencilId) : null;

    return (
        <div className="flex h-full flex-col overflow-hidden bg-[#fdfbf7] dark:bg-[#121214] relative transition-colors duration-300">
            {/* Header */}
            <div className="border-b-2 border-black/8 dark:border-white/5 bg-white dark:bg-zinc-900 px-6 py-4 shrink-0 transition-colors duration-300">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="text-xl font-black text-gray-900 dark:text-zinc-100">Supply Shop</h2>
                        <p className="text-sm text-gray-500 dark:text-zinc-400">Try in Lab → Love it → Buy it</p>
                    </div>

                    {/* Search */}
                    <input
                        type="text"
                        placeholder="Search supplies..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="h-9 rounded border-2 border-black/15 dark:border-white/10 bg-[#fafaf8] dark:bg-zinc-800 px-3 text-sm outline-none transition-all focus:border-black dark:focus:border-white/30 focus:bg-white dark:focus:bg-zinc-900 w-full sm:w-52 text-gray-950 dark:text-zinc-100"
                    />
                </div>

                {/* Filters */}
                <div className="mt-3 flex gap-2 overflow-x-auto pb-0.5">
                    {FILTERS.map(f => (
                        <button
                            key={f}
                            onClick={() => setActiveFilter(f)}
                            className={`shrink-0 rounded-full border-2 px-3 py-1 text-xs font-bold transition-all ${
                                activeFilter === f
                                    ? 'border-black dark:border-zinc-300 bg-black dark:bg-zinc-100 text-white dark:text-zinc-900'
                                    : 'border-black/15 dark:border-white/10 text-gray-500 dark:text-gray-400 hover:border-black/40 dark:hover:border-white/20 dark:hover:text-zinc-200'
                            }`}
                        >
                            {f}
                        </button>
                    ))}
                </div>
            </div>

            {/* Grid */}
            <div className="flex-1 overflow-y-auto p-6">
                {filtered.length === 0 ? (
                    <div className="flex h-40 flex-col items-center justify-center gap-2 opacity-40">
                        <span className="text-3xl">🔍</span>
                        <p className="text-sm font-medium dark:text-zinc-400">No supplies found</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {filtered.map((item) => (
                            <div key={item.id}>
                                <SupplyCard item={item} onTryInLab={onTryInLab} onBuySupply={onBuySupply} onInspect={setInspectingItem} isDarkMode={isDarkMode} />
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Centered wobbly 3D supply inspect modal popup */}
            <AnimatePresence>
                {inspectingItem && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-[2px]">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                            className="w-full max-w-lg"
                        >
                            <RoughCard className="bg-white dark:bg-zinc-900 border border-black/15 dark:border-white/10 p-6 shadow-2xl relative" roughness={0.8}>
                                {/* Close Button */}
                                <button
                                    onClick={() => setInspectingItem(null)}
                                    className="absolute top-4 right-4 bg-black/5 dark:bg-white/5 hover:bg-black dark:hover:bg-zinc-800 hover:text-white dark:hover:text-zinc-100 transition-all rounded p-1 text-gray-500 dark:text-zinc-400"
                                >
                                    <X size={16} />
                                </button>

                                {/* Modal Header */}
                                <div className="mb-4">
                                    <span className="rounded-full bg-purple-100 dark:bg-purple-950/30 text-purple-900 dark:text-purple-400 border border-purple-200 dark:border-purple-900/40 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider">
                                        {inspectingItem.type} 3D Inspector
                                    </span>
                                    <h3 className="text-2xl font-black mt-2 leading-tight text-gray-950 dark:text-zinc-100">{inspectingItem.name}</h3>
                                    <p className="text-xs text-gray-500 dark:text-zinc-400 font-bold mt-0.5">by {inspectingItem.brand}</p>
                                </div>

                                {/* Active 3D Render stable viewport */}
                                <div className="border-2 border-black dark:border-white/10 rounded-lg bg-gray-50 dark:bg-zinc-800 overflow-hidden relative mb-5 shadow-inner">
                                    <ThreePencil
                                        brand={inspectingItem.brand}
                                        category={matchingPencil ? matchingPencil.category : (inspectingItem.type.toLowerCase() === 'paper' ? 'paper' : inspectingItem.type.toLowerCase() === 'kit' ? 'kit' : 'pencil')}
                                        strokeColor={matchingPencil ? matchingPencil.color : '#374151'}
                                        heightClass="h-56"
                                    />
                                </div>

                                {/* Item specs & descriptions */}
                                <div className="flex flex-col gap-3.5 mb-6 border-b border-black/5 dark:border-white/5 pb-5">
                                    <p className="text-xs text-gray-700 dark:text-zinc-300 leading-relaxed font-semibold italic">
                                        "{inspectingItem.desc}"
                                    </p>
                                    <div className="flex justify-between items-center bg-gray-50 dark:bg-zinc-850 border border-black/5 dark:border-white/5 rounded p-3 text-xs">
                                        <div>
                                            <span className="text-gray-400 dark:text-zinc-500 font-bold uppercase text-[9px] block">Customer Rating</span>
                                            <span className="font-black text-gray-800 dark:text-zinc-200 flex items-center gap-1 mt-0.5">
                                                <Star size={11} fill="#f59e0b" className="text-amber-400" /> {inspectingItem.rating} ({inspectingItem.reviews.toLocaleString()} reviews)
                                            </span>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-gray-400 dark:text-zinc-500 font-bold uppercase text-[9px] block">Purchase Option</span>
                                            <span className="font-black text-purple-950 dark:text-emerald-400 text-base">{inspectingItem.price}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Actions trigger */}
                                <div className="flex gap-2">
                                    {inspectingItem.pencilId && (
                                        <button
                                            onClick={() => {
                                                onTryInLab(inspectingItem.pencilId!);
                                                setInspectingItem(null);
                                            }}
                                            className="flex-1 flex items-center justify-center gap-1 bg-white dark:bg-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-700 text-black dark:text-zinc-200 border-2 border-black dark:border-white/20 font-black text-xs px-4 py-3 shadow-[3px_3px_0_rgba(0,0,0,1)] dark:shadow-[3px_3px_0_rgba(255,255,255,0.05)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
                                        >
                                            <FlaskConical size={14} /> Try Out in Sketch Lab
                                        </button>
                                    )}
                                    <RoughButton
                                        onClick={() => {
                                            onBuySupply({ id: inspectingItem.id, name: inspectingItem.name, price: inspectingItem.price });
                                            setInspectingItem(null);
                                        }}
                                        className="flex-1 py-3 text-xs uppercase"
                                        bg="#ffeb3b"
                                    >
                                        <ShoppingBag size={14} /> Buy Supply Core · {inspectingItem.price}
                                    </RoughButton>
                                </div>
                            </RoughCard>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
