'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, Star, ExternalLink, Sparkles, Check, CheckCircle2, ChevronRight } from 'lucide-react';
import type { PencilType, PaperType } from './data';
import { PAPERS, PENCILS } from './data';
import dynamic from 'next/dynamic';
import RoughCard from './RoughCard';
import RoughButton from './RoughButton';

const ThreePencil = dynamic(() => import('./ThreePencil'), {
    ssr: false,
    loading: () => (
        <div className="h-44 w-full flex items-center justify-center bg-gray-50 dark:bg-zinc-800 rounded-lg border border-black/10 dark:border-white/10 text-xs font-bold text-gray-400 dark:text-zinc-500 select-none animate-pulse">
            Rendering 3D Supply...
        </div>
    )
});

function PencilIllustration2D({ p, isDarkMode }: { p: PencilType; isDarkMode: boolean }) {
    let bodyColor = '#1e3f20'; // Faber-Castell green default
    const brandLower = p.brand.toLowerCase();
    if (brandLower.includes('staedtler')) bodyColor = '#0f4c81';
    else if (brandLower.includes('sakura')) bodyColor = '#1a1a1a';
    else if (p.category === 'charcoal' || brandLower.includes('camlin')) bodyColor = '#374151';
    else if (brandLower.includes('pentel')) bodyColor = '#7f1d1d';

    const strokeColor = isDarkMode
        ? (() => {
              switch (p.id) {
                  case '4h': return '#4b525d';      // 4H
                  case '2h': return '#7c8695';      // 2H
                  case 'hb': return '#a6b0c0';      // HB
                  case '2b': return '#cbd5e1';      // 2B
                  case '4b': return '#f1f5f9';      // 4B
                  case '6b': return '#ffffff';      // 6B
                  case 'ch': return '#e4e4e7';      // Charcoal
                  case 'ink': return '#2dd4bf';     // Teal ink
                  case 'bp': return '#06b6d4';      // Cyan brush
                  default: return '#ffffff';
              }
          })()
        : p.color;

    return (
        <div className="flex items-center justify-center w-full h-full bg-[#fdfbf7] dark:bg-zinc-800 p-4 select-none rounded transition-colors duration-300">
            {/* 2D elegant horizontal pencil design */}
            <div className="relative w-36 h-6 flex items-center shrink-0">
                {p.category !== 'charcoal' && !brandLower.includes('sakura') && (
                    <div className="w-2.5 h-3.5 bg-red-400 border border-black dark:border-white/20 rounded-l shrink-0" />
                )}
                {p.category !== 'charcoal' && !brandLower.includes('sakura') && (
                    <div className="w-1.5 h-3.5 bg-gray-300 dark:bg-zinc-700 border-y border-r border-black dark:border-white/20 shrink-0" />
                )}
                <div className="flex-1 h-3.5 border-y border-black dark:border-white/20 flex items-center justify-center" style={{ backgroundColor: bodyColor }}>
                    <div className="h-[1px] w-full bg-white/20" />
                </div>
                <div className="w-4 h-3.5 border-y border-black dark:border-white/20 overflow-hidden relative shrink-0 flex items-center">
                    <div className="absolute right-0 w-0 h-0 border-y-[7px] border-y-transparent border-l-[14px] border-l-[#d9b48f]" />
                </div>
                <div className="w-2 h-3.5 border-y border-r border-black dark:border-white/20 rounded-r overflow-hidden relative shrink-0 flex items-center">
                    <div className="absolute right-0 w-0 h-0 border-y-[7px] border-y-transparent border-l-[8px]" style={{ borderLeftColor: strokeColor }} />
                </div>
            </div>
        </div>
    );
}

type Props = {
    pencil: PencilType;
    paper: PaperType;
    isSidebar?: boolean;
    onEquipPencil?: (p: PencilType) => void;
    onBuyPencil?: (item: { id: string; name: string; price: string }) => void;
    isDarkMode?: boolean;
};

function Bar({ label, value, color, isDarkMode }: { label: string; value: number; color: string; isDarkMode: boolean }) {
    return (
        <div className="flex items-center gap-3">
            <span className="w-20 shrink-0 text-xs font-semibold text-gray-500 dark:text-zinc-400">{label}</span>
            <div className="relative h-2 flex-1 rounded-full bg-black/8 dark:bg-white/10 overflow-hidden">
                <motion.div
                    className="absolute left-0 top-0 h-full rounded-full"
                    style={{ backgroundColor: color }}
                    animate={{ width: `${value * 100}%` }}
                    transition={{ type: 'spring', stiffness: 250, damping: 25 }}
                />
            </div>
            <span className="w-8 text-right text-xs font-bold opacity-50 dark:text-zinc-300">
                {Math.round(value * 10)}/10
            </span>
        </div>
    );
}

// Mini stroke preview on a paper
function StrokePreview({ paper, pencil, isDarkMode = false }: { paper: PaperType; pencil: PencilType; isDarkMode?: boolean }) {
    const paperBg = isDarkMode
        ? (() => {
              switch (paper.id) {
                  case 'smooth': return '#121214';
                  case 'rough': return '#1c1c1f';
                  case 'newsprint': return '#181715';
                  case 'watercolor': return '#1a1a1e';
                  case 'canvas': return '#212124';
                  case 'kraft': return '#30261c';
                  default: return '#18181b';
              }
          })()
        : paper.bg;

    const strokeColor = isDarkMode
        ? (() => {
              switch (pencil.id) {
                  case '4h': return '#4b525d';      // 4H
                  case '2h': return '#7c8695';      // 2H
                  case 'hb': return '#a6b0c0';      // HB
                  case '2b': return '#cbd5e1';      // 2B
                  case '4b': return '#f1f5f9';      // 4B
                  case '6b': return '#ffffff';      // 6B
                  case 'ch': return '#e4e4e7';      // Charcoal
                  case 'ink': return '#2dd4bf';     // Teal ink
                  case 'bp': return '#06b6d4';      // Cyan brush
                  default: return '#ffffff';
              }
          })()
        : pencil.color;

    return (
        <div
            className="relative h-10 overflow-hidden rounded border border-black/10 dark:border-white/10"
            style={{ backgroundColor: paperBg }}
        >
            <svg className="h-full w-full">
                <path
                    d="M 8 24 Q 30 8 52 24 T 96 22"
                    fill="none"
                    stroke={strokeColor}
                    strokeWidth={pencil.size * (1 + paper.grain * 0.5)}
                    strokeLinecap="round"
                    opacity={pencil.opacity * (1 - paper.grain * 0.12)}
                />
                {paper.grain > 0 && (
                    <path
                        d="M 8 28 Q 30 14 52 28 T 96 26"
                        fill="none"
                        stroke={strokeColor}
                        strokeWidth={pencil.size * 0.4}
                        strokeLinecap="round"
                        opacity={pencil.opacity * paper.grain * 0.4}
                        strokeDasharray="2 4"
                    />
                )}
            </svg>
            <span className="absolute bottom-1 right-2 text-[9px] font-bold opacity-40 dark:text-zinc-400">{paper.label}</span>
        </div>
    );
}

export default function PencilDNA({ pencil, paper, isSidebar = true, onEquipPencil, onBuyPencil, isDarkMode = false }: Props) {
    const [inspectedPencil, setInspectedPencil] = useState<PencilType>(pencil);

    // Sidebar & Mobile overlay layout remains compact and focused on the selected pencil
    if (isSidebar) {
        const categoryColor = isDarkMode
            ? (pencil.category === 'graphite'
                ? '#1e293b'
                : pencil.category === 'charcoal'
                ? '#27272a'
                : '#1f2937')
            : (pencil.category === 'graphite'
                ? '#a5f3fc'
                : pencil.category === 'charcoal'
                ? '#d1d5db'
                : '#fde68a');

        const categoryText = isDarkMode ? '#cbd5e1' : '#1f2937';

        return (
            <aside className="flex h-full w-72 flex-col gap-0 overflow-y-auto border-l-2 border-black/10 dark:border-white/10 bg-[#fafaf8] dark:bg-[#18181b] transition-colors duration-300">
                {/* Header */}
                <div className="border-b-2 border-black/8 dark:border-white/5 px-5 py-4">
                    <div className="mb-1 flex items-center gap-2">
                        <span
                            className="rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide border border-black/10 dark:border-white/10"
                            style={{ backgroundColor: categoryColor, color: categoryText }}
                        >
                            {pencil.category}
                        </span>
                        <span className="text-xs text-gray-400 dark:text-zinc-500">{pencil.brand}</span>
                    </div>
                    <h3 className="text-2xl font-black text-gray-900 dark:text-zinc-100">{pencil.label}</h3>
                    <p className="mt-1 text-sm text-gray-600 dark:text-zinc-400 leading-relaxed">{pencil.desc}</p>
                </div>

                {/* 3D Pencil Viewer */}
                <div className="border-b-2 border-black/8 dark:border-white/5 px-5 py-4">
                    <ThreePencil brand={pencil.brand} category={pencil.category} strokeColor={pencil.color} />
                </div>

                {/* DNA Bars */}
                <div className="border-b-2 border-black/8 dark:border-white/5 px-5 py-4">
                    <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-zinc-500">Pencil DNA</p>
                    <div className="flex flex-col gap-3">
                        <Bar label="Darkness"  value={pencil.darkness}         color={isDarkMode ? "#3b82f6" : "#1a1a2e"} isDarkMode={isDarkMode} />
                        <Bar label="Softness"  value={1 - pencil.hardness}     color="#3b82f6" isDarkMode={isDarkMode} />
                        <Bar label="Smudge"    value={pencil.smudge}           color="#8b5cf6" isDarkMode={isDarkMode} />
                        <Bar label="Line Wt."  value={pencil.size / 7}         color="#10b981" isDarkMode={isDarkMode} />
                    </div>
                </div>

                {/* Best For */}
                <div className="border-b-2 border-black/8 dark:border-white/5 px-5 py-4">
                    <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-zinc-500">Best For</p>
                    <div className="flex flex-wrap gap-2">
                        {pencil.bestFor.map(tag => (
                            <span
                                key={tag}
                                className="rounded border border-black/15 dark:border-white/10 bg-white dark:bg-zinc-800 px-2.5 py-1 text-xs font-semibold text-gray-700 dark:text-zinc-300"
                            >
                                {tag}
                            </span>
                        ))}
                    </div>
                </div>

                {/* Stroke on different papers */}
                <div className="border-b-2 border-black/8 dark:border-white/5 px-5 py-4">
                    <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-zinc-500">
                        On Different Papers
                    </p>
                    <div className="flex flex-col gap-2">
                        {PAPERS.slice(0, 3).map(p => (
                            <StrokePreview key={p.id} paper={p} pencil={pencil} isDarkMode={isDarkMode} />
                        ))}
                    </div>
                </div>

                {/* Current paper info */}
                <div className="border-b-2 border-black/8 dark:border-white/5 px-5 py-4">
                    <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-zinc-500">Current Paper</p>
                    <div className="flex items-center gap-3 rounded-lg border-2 border-black/10 dark:border-white/10 bg-white dark:bg-zinc-800 p-3">
                        <div className="h-10 w-10 rounded border border-black/15 dark:border-white/10 shrink-0" style={{ backgroundColor: isDarkMode ? (paper.id === 'smooth' ? '#121214' : '#1c1c1f') : paper.bg }} />
                        <div>
                            <p className="text-sm font-bold text-gray-800 dark:text-zinc-200">{paper.label}</p>
                            <p className="text-xs text-gray-500 dark:text-zinc-400">{paper.brand} · {paper.desc}</p>
                        </div>
                    </div>
                </div>

                {/* Buy CTA */}
                <div className="px-5 py-5">
                    <div className="mb-4 flex items-center justify-between">
                        <div>
                            <p className="text-xl font-black text-gray-900 dark:text-zinc-100">{pencil.price}</p>
                            <div className="flex items-center gap-1">
                                <Star size={11} fill="#f59e0b" className="text-amber-400" />
                                <Star size={11} fill="#f59e0b" className="text-amber-400" />
                                <Star size={11} fill="#f59e0b" className="text-amber-400" />
                                <Star size={11} fill="#f59e0b" className="text-amber-400" />
                                <Star size={11} fill="#f59e0b" className="text-amber-400" />
                                <span className="ml-1 text-xs text-gray-400 dark:text-zinc-500">4.8</span>
                            </div>
                        </div>
                        <span className="text-xs text-green-600 dark:text-green-400 font-semibold">● In Stock</span>
                    </div>

                    <motion.button
                        whileHover={{ scale: 1.02, y: -1 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => onBuyPencil?.({ id: pencil.id, name: `${pencil.brand} ${pencil.label}`, price: pencil.price })}
                        className="flex w-full items-center justify-center gap-2 border-2 border-black dark:border-emerald-400 bg-[#ffeb3b] dark:bg-emerald-500 px-4 py-3 text-sm font-bold text-black dark:text-zinc-950 shadow-[3px_3px_0_rgba(0,0,0,1)] dark:shadow-[3px_3px_0_rgba(16,185,129,0.3)] transition-all hover:shadow-[1px_1px_0_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px]"
                    >
                        <ShoppingBag size={15} /> Buy {pencil.label} · {pencil.price}
                    </motion.button>

                    <button className="mt-2 flex w-full items-center justify-center gap-1.5 py-2 text-xs font-semibold text-gray-400 dark:text-zinc-500 hover:text-gray-700 dark:hover:text-zinc-300 transition-colors">
                        <ExternalLink size={11} /> View on Amazon / Flipkart
                    </button>
                </div>
            </aside>
        );
    }

    // Gorgeous full-screen 3D Pencil DNA Gallery & Comparison Showroom
    const inspectedCategoryColor = isDarkMode
        ? (inspectedPencil.category === 'graphite'
            ? '#1e293b'
            : inspectedPencil.category === 'charcoal'
            ? '#27272a'
            : '#1f2937')
        : (inspectedPencil.category === 'graphite'
            ? '#a5f3fc'
            : inspectedPencil.category === 'charcoal'
            ? '#d1d5db'
            : '#fde68a');

    const inspectedCategoryText = isDarkMode ? '#cbd5e1' : '#1f2937';

    return (
        <div className="flex h-full flex-col lg:flex-row overflow-hidden bg-[#fdfbf7] dark:bg-[#121214] transition-colors duration-300">
            {/* Left side: Showroom Grid with ALL pencils in 3D */}
            <div className="flex-1 overflow-y-auto p-6 lg:p-8">
                <div className="max-w-4xl mx-auto">
                    <div className="mb-8">
                        <h2 className="text-3xl font-black tracking-tight flex items-center gap-2.5 text-gray-900 dark:text-zinc-100">
                            <Sparkles className="text-purple-600 dark:text-purple-400 animate-pulse" size={24} /> 3D Pencil DNA Gallery
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1 max-w-2xl">
                            Inspect carbon cores, friction ratings, and grain compatibility of our professional graphite, charcoal, and ink lineup in fully interactive 3D.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {PENCILS.map(p => {
                            const isEquipped = p.id === pencil.id;
                            const isInspected = p.id === inspectedPencil.id;
                            const cardBg = isDarkMode
                                ? (p.category === 'graphite' ? '#1e293b' : p.category === 'charcoal' ? '#27272a' : '#1f2937')
                                : (p.category === 'graphite' ? '#e0f7fa' : p.category === 'charcoal' ? '#f3f4f6' : '#fef3c7');
                            
                            const cardText = isDarkMode ? '#cbd5e1' : '#1f2937';

                            return (
                                <motion.div
                                    key={p.id}
                                    whileHover={{ y: -4 }}
                                    className="cursor-pointer"
                                    onClick={() => setInspectedPencil(p)}
                                >
                                    <RoughCard
                                        className={`p-4 bg-white dark:bg-zinc-900 relative transition-all duration-300 ${
                                            isInspected
                                                ? 'shadow-[6px_6px_0_rgba(139,92,246,1)] border-purple-600 dark:border-purple-400'
                                                : 'hover:shadow-[4px_4px_0_rgba(0,0,0,0.8)] dark:hover:shadow-[4px_4px_0_rgba(255,255,255,0.15)] dark:border-zinc-800'
                                        }`}
                                        roughness={0.7}
                                    >
                                        {/* Status badges */}
                                        <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5 items-start">
                                            <span
                                                className="rounded-full px-2 py-0.5 text-[9px] font-black uppercase border border-black/10 dark:border-white/10 shadow-sm"
                                                style={{ backgroundColor: cardBg, color: cardText }}
                                            >
                                                {p.category}
                                            </span>
                                            {isEquipped && (
                                                <span className="flex items-center gap-1 rounded-full bg-green-500 px-2 py-0.5 text-[9px] font-black text-white border border-black/10 dark:border-white/10 shadow-sm">
                                                    <Check size={8} strokeWidth={4} /> ACTIVE LAB
                                                </span>
                                            )}
                                        </div>

                                        <div className="absolute top-3 right-3 z-10">
                                            <span className="text-xs font-black text-gray-800 dark:text-zinc-200 bg-black/5 dark:bg-white/5 rounded px-1.5 py-0.5">
                                                {p.price}
                                            </span>
                                        </div>

                                        {/* Optimized 2D Preview inside the grid */}
                                        <div className="h-40 w-full mb-3 border border-black/5 dark:border-white/5 bg-[#fafaf8] dark:bg-zinc-855 overflow-hidden relative rounded">
                                            <PencilIllustration2D p={p} isDarkMode={isDarkMode} />
                                        </div>

                                        <div className="flex items-center justify-between border-t border-black/5 dark:border-white/5 pt-3">
                                            <div>
                                                <p className="text-xs text-gray-400 dark:text-zinc-500 font-semibold">{p.brand}</p>
                                                <h4 className="text-base font-black tracking-tight text-gray-800 dark:text-zinc-200">{p.label}</h4>
                                            </div>
                                            <div className="flex items-center gap-1 text-[11px] font-bold text-purple-700 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/20 rounded-full px-2.5 py-1 border border-purple-100 dark:border-purple-900/50">
                                                DNA Stats <ChevronRight size={10} />
                                            </div>
                                        </div>
                                    </RoughCard>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Right side: Floating comparison inspector */}
            <aside className="w-full lg:w-96 border-t-2 lg:border-t-0 lg:border-l-2 border-black/10 dark:border-white/10 bg-[#fafaf8] dark:bg-[#18181b] overflow-y-auto shrink-0 flex flex-col h-full transition-colors duration-300">
                {/* Header */}
                <div className="border-b-2 border-black/8 dark:border-white/5 px-6 py-5 bg-white dark:bg-zinc-900">
                    <span className="text-[10px] font-black uppercase tracking-widest text-purple-600 dark:text-purple-400 block mb-1">
                        DNA SPEC INSPECTOR
                    </span>
                    <div className="flex items-center gap-2 mb-1.5">
                        <span
                            className="rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wide border border-black/10 dark:border-white/10"
                            style={{ backgroundColor: inspectedCategoryColor, color: inspectedCategoryText }}
                        >
                            {inspectedPencil.category}
                        </span>
                        <span className="text-xs font-bold text-gray-400 dark:text-zinc-500">{inspectedPencil.brand}</span>
                    </div>
                    <h3 className="text-3xl font-black text-gray-950 dark:text-zinc-100">{inspectedPencil.label} Core</h3>
                    <p className="mt-1.5 text-xs text-gray-500 dark:text-zinc-400 leading-relaxed font-semibold">
                        {inspectedPencil.desc}
                    </p>
                </div>

                {/* 3D Model Explorer */}
                <div className="border-b-2 border-black/8 dark:border-white/5 px-6 py-5 bg-white dark:bg-zinc-900">
                    <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-zinc-500">
                        Interactive 3D Cylinder View
                    </p>
                    <ThreePencil
                        brand={inspectedPencil.brand}
                        category={inspectedPencil.category}
                        strokeColor={inspectedPencil.color}
                    />
                </div>

                {/* Carbon DNA Bars */}
                <div className="border-b-2 border-black/8 dark:border-white/5 px-6 py-5">
                    <p className="mb-3.5 text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-zinc-500">
                        Graphite & Carbon Density (DNA)
                    </p>
                    <div className="flex flex-col gap-3">
                        <Bar label="Darkness"  value={inspectedPencil.darkness}         color={isDarkMode ? "#3b82f6" : "#111827"} isDarkMode={isDarkMode} />
                        <Bar label="Softness"  value={1 - inspectedPencil.hardness}     color="#3b82f6" isDarkMode={isDarkMode} />
                        <Bar label="Smudge"    value={inspectedPencil.smudge}           color="#a855f7" isDarkMode={isDarkMode} />
                        <Bar label="Line Wt."  value={inspectedPencil.size / 7}         color="#10b981" isDarkMode={isDarkMode} />
                    </div>
                </div>

                {/* Best For Tags */}
                <div className="border-b-2 border-black/8 dark:border-white/5 px-6 py-5 bg-white/50 dark:bg-zinc-900/50">
                    <p className="mb-3 text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-zinc-500">Best Art Workflows</p>
                    <div className="flex flex-wrap gap-1.5">
                        {inspectedPencil.bestFor.map(tag => (
                            <span
                                key={tag}
                                className="rounded border border-black/15 dark:border-white/10 bg-white dark:bg-zinc-800 px-2 py-0.5 text-xs font-bold text-gray-600 dark:text-zinc-300"
                            >
                                {tag}
                            </span>
                        ))}
                    </div>
                </div>

                {/* Paper stroke previews */}
                <div className="border-b-2 border-black/8 dark:border-white/5 px-6 py-5">
                    <p className="mb-3 text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-zinc-500">
                        Stroke Texture Profile on Papers
                    </p>
                    <div className="flex flex-col gap-2">
                        {PAPERS.slice(0, 3).map(p => (
                            <StrokePreview key={p.id} paper={p} pencil={inspectedPencil} isDarkMode={isDarkMode} />
                        ))}
                    </div>
                </div>

                {/* Action CTA Block */}
                <div className="p-6 bg-white dark:bg-zinc-900 mt-auto border-t dark:border-white/5">
                    <div className="mb-4 flex items-center justify-between">
                        <div>
                            <p className="text-xl font-black text-gray-900 dark:text-zinc-100">{inspectedPencil.price}</p>
                            <div className="flex items-center gap-1 mt-0.5">
                                <Star size={11} fill="#f59e0b" className="text-amber-400" />
                                <Star size={11} fill="#f59e0b" className="text-amber-400" />
                                <Star size={11} fill="#f59e0b" className="text-amber-400" />
                                <Star size={11} fill="#f59e0b" className="text-amber-400" />
                                <Star size={11} fill="#f59e0b" className="text-amber-400" />
                                <span className="ml-1 text-[10px] text-gray-400 dark:text-zinc-500 font-bold">4.8 (21K reviews)</span>
                            </div>
                        </div>
                        <span className="text-xs text-green-600 dark:text-green-400 font-bold bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900/20 px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                            <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" /> In Stock
                        </span>
                    </div>

                    <div className="flex flex-col gap-2">
                        {onEquipPencil && (
                            <RoughButton
                                onClick={() => onEquipPencil(inspectedPencil)}
                                className="w-full py-3 text-xs uppercase"
                                bg={inspectedPencil.id === pencil.id ? (isDarkMode ? '#27272a' : '#cbd5e1') : '#ffeb3b'}
                                disabled={inspectedPencil.id === pencil.id}
                            >
                                {inspectedPencil.id === pencil.id ? (
                                    <span className="flex items-center justify-center gap-1.5 font-black text-gray-600 dark:text-zinc-400">
                                        <CheckCircle2 size={13} /> Active in Lab
                                    </span>
                                ) : (
                                    <span className="flex items-center justify-center gap-1.5 font-black text-black">
                                        🎨 Equip Pencil in Lab
                                    </span>
                                )}
                            </RoughButton>
                        )}

                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => onBuyPencil?.({ id: inspectedPencil.id, name: `${inspectedPencil.brand} ${inspectedPencil.label}`, price: inspectedPencil.price })}
                            className="flex w-full items-center justify-center gap-1.5 border border-black dark:border-emerald-400 bg-[#ffeb3b] dark:bg-emerald-500 py-3 text-xs font-black uppercase rounded shadow-[2px_2px_0_rgba(0,0,0,1)] dark:shadow-[2px_2px_0_rgba(16,185,129,0.3)] transition-all hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px] text-black dark:text-zinc-950"
                        >
                            <ShoppingBag size={13} /> Buy {inspectedPencil.label} Core · {inspectedPencil.price}
                        </motion.button>

                        <a
                            href={inspectedPencil.category === 'charcoal' ? "https://www.amazon.in/s?k=camlin+charcoal+pencil" : inspectedPencil.category === 'ink' ? "https://www.amazon.in/s?k=sakura+pigma+micron" : `https://www.amazon.in/s?k=${inspectedPencil.brand.toLowerCase()}+${inspectedPencil.label.toLowerCase()}+pencil`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-1 flex w-full items-center justify-center gap-1.5 py-1.5 text-[10px] font-bold text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors uppercase tracking-wider"
                        >
                            <ExternalLink size={10} /> Buy Official Brand on Amazon
                        </a>
                    </div>
                </div>
            </aside>
        </div>
    );
}
