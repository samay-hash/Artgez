'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { motion, useScroll, useTransform, useInView, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
    ArrowRight, PenTool, Layers, Palette, Zap, Users, ShoppingBag,
    Star, CheckCircle2, ChevronDown, Sparkles, BookOpen, Brain, Wallet
} from 'lucide-react';
import { HandDrawnFilters, Highlight, SketchButton } from "@/src/components/CoreLandingPages/CompleteLandingPages/tsx/HandDrawn";
import LogoArtgez from '@/src/components/artlab/LogoArtgez';

// ─── TYPES ────────────────────────────────────────────────────────────────────

type PencilType = { id: string; label: string; hardness: number; opacity: number; size: number; color: string; desc: string };
type PaperType = { id: string; label: string; grain: number; texture: string; bg: string };

// ─── DATA ─────────────────────────────────────────────────────────────────────

const PENCILS: PencilType[] = [
    { id: 'h',  label: '4H',  hardness: 0.1, opacity: 0.25, size: 1,   color: '#8899aa', desc: 'Very light, sharp — technical drawing' },
    { id: 'hb', label: 'HB',  hardness: 0.4, opacity: 0.55, size: 1.5, color: '#4a4a5a', desc: 'All-purpose — everyday sketching' },
    { id: '2b', label: '2B',  hardness: 0.6, opacity: 0.75, size: 2.5, color: '#2d2d3d', desc: 'Soft & dark — expressive shading' },
    { id: '4b', label: '4B',  hardness: 0.8, opacity: 0.88, size: 3.5, color: '#1a1a2e', desc: 'Very dark — bold strokes, deep shadows' },
    { id: '6b', label: '6B',  hardness: 1.0, opacity: 0.96, size: 5,   color: '#0d0d1a', desc: 'Blackest — dramatic, rich marks' },
    { id: 'ch', label: 'Charcoal', hardness: 0.9, opacity: 0.7, size: 6, color: '#2a2a2a', desc: 'Powdery & smudgeable — gestural art' },
];

const PAPERS: PaperType[] = [
    { id: 'smooth',    label: 'Smooth',    grain: 0,    texture: 'none',        bg: '#fdfbf7' },
    { id: 'rough',     label: 'Rough',     grain: 0.6,  texture: 'rough',       bg: '#f5f0e8' },
    { id: 'newsprint', label: 'Newsprint', grain: 0.3,  texture: 'newsprint',   bg: '#ede8d8' },
];

const FEATURES = [
    { icon: <PenTool size={22} />,  title: "Pencil DNA System",       color: '#a5f3fc', desc: "Hardness graph, smudge level, paper grip — every pencil fully profiled before you buy." },
    { icon: <Layers size={22} />,   title: "Paper Lab",                color: '#bae6fd', desc: "Test any pencil on 8+ paper types: Fabriano, Canson, newsprint, watercolor, and more." },
    { icon: <Brain size={22} />,    title: "Style Detector AI",        color: '#fbcfe8', desc: "Upload 5 drawings → AI detects your style → personalized supply recommendations." },
    { icon: <Wallet size={22} />,   title: "Budget Builder",           color: '#bbf7d0', desc: "₹500 budget? Get a prioritized shopping list. No more expensive starter kits you won't use." },
    { icon: <Users size={22} />,    title: "Community Sketchbook",     color: '#ddd6fe', desc: "Share what you made and which supplies you used. Click a supply → try it instantly." },
    { icon: <Zap size={22} />,      title: "Compatibility Checker",    color: '#fed7aa', desc: "\"Can I use ink pen on watercolor paper?\" — get an instant answer before wasting supplies." },
];

const STEPS = [
    { num: '01', title: 'Pick Your Tool', desc: 'Choose from HB to 6B, charcoal, brush pen — each with real feel data.', color: '#a5f3fc' },
    { num: '02', title: 'Draw on Paper', desc: 'Switch between paper textures. See exactly how each stroke behaves.', color: '#bae6fd' },
    { num: '03', title: 'Buy With Confidence', desc: 'Found your perfect match? One click to buy the exact product.', color: '#bbf7d0' },
];

// ─── SKETCH CANVAS ────────────────────────────────────────────────────────────

function SketchCanvas({ isDarkMode }: { isDarkMode: boolean }) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const isDrawing = useRef(false);
    const lastPos = useRef<{ x: number; y: number } | null>(null);
    const [activePencil, setActivePencil] = useState<PencilType>(PENCILS[2]); // 2B default
    const [activePaper, setActivePaper] = useState<PaperType>(PAPERS[0]);
    const [showBuyCard, setShowBuyCard] = useState(false);
    const [strokes, setStrokes] = useState(0);

    const paperBg = isDarkMode
        ? (() => {
              switch (activePaper.id) {
                  case 'smooth': return '#121214';
                  case 'rough': return '#1c1c1f';
                  case 'newsprint': return '#181715';
                  default: return '#18181b';
              }
          })()
        : activePaper.bg;

    const strokeColor = isDarkMode
        ? (() => {
              switch (activePencil.id) {
                  case 'h': return '#4b525d';      // 4H
                  case 'hb': return '#a6b0c0';     // HB
                  case '2b': return '#cbd5e1';     // 2B
                  case '4b': return '#f1f5f9';     // 4B
                  case '6b': return '#ffffff';     // 6B
                  case 'ch': return '#e4e4e7';     // Charcoal
                  default: return '#ffffff';
              }
          })()
        : activePencil.color;

    const clearCanvas = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        setStrokes(0);
    }, []);

    // Reset canvas when paper changes
    useEffect(() => {
        clearCanvas();
    }, [activePaper, clearCanvas]);

    const getPos = (e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) => {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        if ('touches' in e) {
            return {
                x: (e.touches[0].clientX - rect.left) * scaleX,
                y: (e.touches[0].clientY - rect.top) * scaleY,
            };
        }
        return {
            x: (e.clientX - rect.left) * scaleX,
            y: (e.clientY - rect.top) * scaleY,
        };
    };

    const addGrain = useCallback((ctx: CanvasRenderingContext2D, x: number, y: number, size: number, grain: number) => {
        if (grain === 0) return;
        for (let i = 0; i < 8; i++) {
            const gx = x + (Math.random() - 0.5) * size * 4;
            const gy = y + (Math.random() - 0.5) * size * 4;
            ctx.beginPath();
            ctx.arc(gx, gy, Math.random() * size * 0.4, 0, Math.PI * 2);
            ctx.fillStyle = isDarkMode
                ? `rgba(255,255,255,${grain * 0.05 * Math.random()})`
                : `rgba(0,0,0,${grain * 0.08 * Math.random()})`;
            ctx.fill();
        }
    }, [isDarkMode]);

    const draw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
        if (!isDrawing.current) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const pos = getPos(e, canvas);
        if (!lastPos.current) { lastPos.current = pos; return; }

        ctx.beginPath();
        ctx.moveTo(lastPos.current.x, lastPos.current.y);

        // Slight wobble for organic feel
        const wobble = activePaper.grain * 2;
        const cpx = (lastPos.current.x + pos.x) / 2 + (Math.random() - 0.5) * wobble;
        const cpy = (lastPos.current.y + pos.y) / 2 + (Math.random() - 0.5) * wobble;
        ctx.quadraticCurveTo(cpx, cpy, pos.x, pos.y);

        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.lineWidth = activePencil.size + activePaper.grain * activePencil.size * 0.5;
        ctx.globalAlpha = activePencil.opacity * (1 - activePaper.grain * 0.15);
        ctx.strokeStyle = strokeColor;
        ctx.stroke();

        // Paper grain simulation
        addGrain(ctx, pos.x, pos.y, activePencil.size, activePaper.grain);

        ctx.globalAlpha = 1;
        lastPos.current = pos;
        setStrokes(s => s + 1);
    }, [activePencil, activePaper, addGrain, strokeColor]);

    const startDraw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
        e.preventDefault();
        isDrawing.current = true;
        const canvas = canvasRef.current;
        if (!canvas) return;
        lastPos.current = getPos(e, canvas);
    }, []);

    const stopDraw = useCallback(() => {
        isDrawing.current = false;
        lastPos.current = null;
        if (strokes > 5) setShowBuyCard(true);
    }, [strokes]);

    return (
        <div className="relative">
            {/* Controls Row */}
            <div className="mb-4 flex flex-wrap items-center gap-3">
                {/* Pencil Selector */}
                <div className="flex gap-2 flex-wrap">
                    {PENCILS.map(p => (
                        <button
                            key={p.id}
                            onClick={() => { setActivePencil(p); setShowBuyCard(false); }}
                            className={`relative px-3 py-1.5 text-sm font-bold border-2 transition-all ${
                                activePencil.id === p.id
                                    ? 'border-black dark:border-emerald-400 bg-black dark:bg-emerald-500 text-white dark:text-zinc-950 shadow-[3px_3px_0_#10b981]'
                                    : 'border-black/30 dark:border-white/10 bg-white dark:bg-zinc-900 text-black dark:text-zinc-300 hover:border-black dark:hover:border-white'
                            }`}
                            style={{ filter: 'url(#rough-paper)' }}
                        >
                            {p.label}
                        </button>
                    ))}
                </div>

                <div className="h-6 w-px bg-black/20 dark:bg-white/10 hidden sm:block" />

                {/* Paper Selector */}
                <div className="flex gap-2">
                    {PAPERS.map(paper => (
                        <button
                            key={paper.id}
                            onClick={() => setActivePaper(paper)}
                            className={`px-3 py-1.5 text-sm font-medium border-2 transition-all ${
                                activePaper.id === paper.id
                                    ? 'border-black dark:border-emerald-400 bg-[#ffeb3b] dark:bg-emerald-500 text-black dark:text-zinc-950 shadow-[2px_2px_0_rgba(0,0,0,1)]'
                                    : 'border-black/20 dark:border-white/10 bg-white dark:bg-zinc-900 text-black dark:text-zinc-300 hover:border-black/60 dark:hover:border-white/40'
                            }`}
                            style={{ filter: 'url(#rough-paper)' }}
                        >
                            {paper.label}
                        </button>
                    ))}
                </div>

                <button
                    onClick={clearCanvas}
                    className="ml-auto px-3 py-1.5 text-sm font-medium border-2 border-black/20 dark:border-white/10 text-black dark:text-zinc-300 hover:border-red-400 dark:hover:border-red-400/50 hover:text-red-500 transition-all"
                    style={{ filter: 'url(#rough-paper)' }}
                >
                    Clear
                </button>
            </div>

            {/* Pencil info bar */}
            <div className="mb-3 flex items-center gap-3">
                <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider opacity-50 dark:text-zinc-400">Selected:</span>
                    <span className="text-sm font-bold dark:text-zinc-100">{activePencil.label}</span>
                    <span className="text-xs text-gray-500 dark:text-zinc-400">— {activePencil.desc}</span>
                </div>
                {/* Hardness visual bar */}
                <div className="ml-auto hidden sm:flex items-center gap-2">
                    <span className="text-xs opacity-40 dark:text-zinc-500">Light</span>
                    <div className="relative h-2 w-24 rounded-full bg-black/10 dark:bg-white/10">
                        <motion.div
                            className="absolute left-0 top-0 h-full rounded-full bg-black dark:bg-zinc-100"
                            animate={{ width: `${activePencil.hardness * 100}%` }}
                            transition={{ type: 'spring', stiffness: 300 }}
                        />
                    </div>
                    <span className="text-xs opacity-40 dark:text-zinc-500">Dark</span>
                </div>
            </div>

            {/* Canvas */}
            <div
                className="relative overflow-hidden border-2 border-black dark:border-white/20 shadow-[6px_6px_0_rgba(0,0,0,0.8)] dark:shadow-[6px_6px_0_rgba(255,255,255,0.15)]"
                style={{ background: paperBg, filter: 'url(#rough-paper)' }}
            >
                {/* Paper texture overlay */}
                {activePaper.grain > 0 && (
                    <div
                        className={`pointer-events-none absolute inset-0 z-10 ${isDarkMode ? 'opacity-10 invert' : 'opacity-30'}`}
                        style={{
                            backgroundImage: activePaper.id === 'rough'
                                ? `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E")`
                                : (isDarkMode
                                    ? `repeating-linear-gradient(0deg, transparent, transparent 4px, rgba(255,255,255,0.02) 4px, rgba(255,255,255,0.02) 5px)`
                                    : `repeating-linear-gradient(0deg, transparent, transparent 4px, rgba(0,0,0,0.04) 4px, rgba(0,0,0,0.04) 5px)`),
                            backgroundSize: activePaper.id === 'rough' ? '200px 200px' : 'auto',
                        }}
                    />
                )}

                {/* Hint text */}
                {strokes === 0 && (
                    <div className="pointer-events-none absolute inset-0 z-20 flex flex-col items-center justify-center gap-2">
                        <PenTool size={32} className="opacity-20 dark:text-zinc-200" />
                        <p className="text-sm font-medium opacity-30 dark:opacity-20 dark:text-zinc-200">Draw here to feel the difference</p>
                    </div>
                )}

                <canvas
                    ref={canvasRef}
                    width={800}
                    height={300}
                    className="w-full cursor-crosshair touch-none"
                    style={{ display: 'block' }}
                    onMouseDown={startDraw}
                    onMouseMove={draw}
                    onMouseUp={stopDraw}
                    onMouseLeave={stopDraw}
                    onTouchStart={startDraw}
                    onTouchMove={draw}
                    onTouchEnd={stopDraw}
                />
            </div>

            {/* Buy Card (appears after drawing) */}
            <AnimatePresence>
                {showBuyCard && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="mt-4 flex items-center justify-between gap-4 border-2 border-black dark:border-emerald-400 bg-[#ffeb3b] dark:bg-emerald-500 p-4 text-black dark:text-zinc-950 shadow-[4px_4px_0_rgba(0,0,0,1)] dark:shadow-[4px_4px_0_rgba(16,185,129,0.3)]"
                        style={{ filter: 'url(#rough-paper)' }}
                    >
                        <div>
                            <p className="font-bold">Faber-Castell {activePencil.label} Pencil</p>
                            <p className="text-sm opacity-70">Perfect for {activePencil.desc.toLowerCase()}</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="text-xl font-black">₹129</span>
                            <button className="flex items-center gap-2 border-2 border-black bg-black dark:bg-zinc-950 px-4 py-2 text-sm font-bold text-white hover:bg-white dark:hover:bg-zinc-900 hover:text-black dark:hover:text-zinc-100 transition-all">
                                Buy Now <ShoppingBag size={14} />
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// ─── FEATURE CARD ─────────────────────────────────────────────────────────────

function FeatureCard({ feature, index }: { feature: typeof FEATURES[0]; index: number }) {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: '-10%' });
    return (
        <motion.div
            ref={ref}
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: index * 0.08, duration: 0.5 }}
            whileHover={{ y: -4, rotate: (index % 2 === 0 ? 0.5 : -0.5) }}
            className="relative flex flex-col gap-4 p-7"
        >
            <div className="absolute inset-0 border-2 border-black bg-white shadow-sm" style={{ filter: 'url(#rough-paper)' }} />
            <div
                className="relative z-10 flex h-11 w-11 items-center justify-center border-2 border-black"
                style={{ backgroundColor: feature.color, filter: 'url(#rough-paper)' }}
            >
                {feature.icon}
            </div>
            <h3 className="relative z-10 text-lg font-bold leading-tight">{feature.title}</h3>
            <p className="relative z-10 text-sm text-gray-600 leading-relaxed">{feature.desc}</p>
            <div
                className="absolute -bottom-2 -right-2 h-4 w-4 border-2 border-black"
                style={{ backgroundColor: feature.color }}
            />
        </motion.div>
    );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────

export default function ArtopPage() {
    const { scrollYProgress } = useScroll();
    const yHero = useTransform(scrollYProgress, [0, 0.3], [0, -60]);
    const heroOpacity = useTransform(scrollYProgress, [0, 0.25], [1, 0]);

    useEffect(() => {
        // Explicitly force light mode on the landing page to keep its beautiful original hand-drawn look
        document.documentElement.classList.remove('dark');
    }, []);

    return (
        <main className="relative min-h-screen w-full overflow-x-hidden bg-[#fdfbf7] font-sans text-[#2d2d2d] selection:bg-[#ffeb3b] transition-colors duration-300">
            <HandDrawnFilters />

            {/* Grid background */}
            <div
                style={{
                    backgroundImage: `linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)`,
                    backgroundSize: '40px 40px',
                }}
            />

            {/* ── NAVBAR ──────────────────────────────────────────────────── */}
            <nav className="fixed top-0 z-50 flex w-full items-center justify-between px-6 py-5 backdrop-blur-sm">
                <LogoArtgez />
                <div className="hidden gap-8 md:flex text-sm font-semibold">
                    {[['Sketch Lab', '#lab'], ['Marketplace', '#marketplace'], ['Pricing', '#pricing']].map(([label, href]) => (
                        <a key={label} href={href} className="relative group opacity-70 hover:opacity-100 dark:text-zinc-300 dark:hover:text-zinc-100 transition-opacity">
                            {label}
                            <span className="absolute -bottom-0.5 left-0 h-0.5 w-0 bg-black dark:bg-white transition-all group-hover:w-full rounded-full" />
                        </a>
                    ))}
                </div>
                <div className="flex items-center gap-3">
                    <Link href="/app"><SketchButton className="text-sm">Try Free</SketchButton></Link>
                </div>
            </nav>

            {/* ── HERO ────────────────────────────────────────────────────── */}
            <section className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4 pt-24 text-center">
                <motion.div style={{ y: yHero, opacity: heroOpacity }} className="flex flex-col items-center">
                    {/* Badge */}
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="mb-8 inline-flex items-center gap-2 rounded-full border-2 border-black bg-[#e0f2fe] px-5 py-2 text-xs font-bold uppercase tracking-widest shadow-[3px_3px_0_rgba(0,0,0,1)]"
                        style={{ filter: 'url(#rough-paper)' }}
                    >
                        <Sparkles size={12} /> India's First Artist Supply Simulator
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.7, delay: 0.1 }}
                        className="mb-6 max-w-4xl text-5xl font-black leading-[1.05] tracking-tight md:text-7xl lg:text-8xl"
                    >
                        Feel Every Stroke.
                        <br />
                        <Highlight color="#a5f3fc">Before You Buy.</Highlight>
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.25 }}
                        className="mb-10 max-w-2xl text-lg text-gray-600 font-medium leading-relaxed md:text-xl"
                    >
                        Try pencils, brushes & paper textures virtually — then buy exactly what works for your art style.
                        No more guessing. No more wasted money.
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.4 }}
                        className="flex flex-wrap items-center justify-center gap-4"
                    >
                        <Link href="/app">
                            <SketchButton>
                                Open Sketch Lab <ArrowRight size={16} />
                            </SketchButton>
                        </Link>
                        <Link href="/app" className="flex items-center gap-2 px-6 py-4 text-sm font-semibold opacity-60 hover:opacity-100 transition-opacity">
                            Browse Artists <ArrowRight size={14} />
                        </Link>
                    </motion.div>

                    {/* Floating stat pills */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.8 }}
                        className="mt-16 flex flex-wrap justify-center gap-4"
                    >
                        {[['50+', 'Pencil Types'], ['8', 'Paper Textures'], ['Free', 'To Start']].map(([val, label]) => (
                            <div key={label} className="flex items-center gap-2 border border-black/10 bg-white px-4 py-2 shadow-sm" style={{ filter: 'url(#rough-paper)' }}>
                                <span className="text-lg font-black">{val}</span>
                                <span className="text-xs font-medium text-gray-500">{label}</span>
                            </div>
                        ))}
                    </motion.div>
                </motion.div>

                {/* Scroll cue */}
                <motion.div
                    animate={{ y: [0, 8, 0] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="absolute bottom-10 left-1/2 -translate-x-1/2 opacity-30"
                >
                    <ChevronDown size={24} />
                </motion.div>

                {/* Decorative floating icons */}
                <motion.div style={{ y: yHero }} className="absolute left-[8%] top-[30%] opacity-10 hidden xl:block -rotate-12">
                    <PenTool size={80} />
                </motion.div>
                <motion.div style={{ y: yHero }} className="absolute right-[8%] top-[28%] opacity-10 hidden xl:block rotate-12">
                    <Palette size={80} />
                </motion.div>
            </section>

            {/* ── HOW IT WORKS ────────────────────────────────────────────── */}
            <section className="relative z-10 bg-[#fffdf5] px-6 py-28 border-y border-black/5">
                <div className="mx-auto max-w-6xl">
                    <div className="mb-16 text-center">
                        <h2 className="text-4xl font-black md:text-5xl">
                            How it <Highlight color="#a5f3fc">Works</Highlight>
                        </h2>
                        <p className="mt-4 text-gray-600 text-lg">Three steps from curiosity to confidence.</p>
                    </div>

                    <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
                        {STEPS.map((step, i) => (
                            <motion.div
                                key={step.num}
                                initial={{ opacity: 0, y: 40 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.15, duration: 0.5 }}
                                viewport={{ once: true }}
                                className="relative flex flex-col gap-5 p-8"
                            >
                                <div className="absolute inset-0 border-2 border-black bg-white" style={{ filter: 'url(#rough-paper)' }} />
                                {/* Step number */}
                                <div
                                    className="relative z-10 inline-flex h-14 w-14 items-center justify-center border-2 border-black text-2xl font-black"
                                    style={{ backgroundColor: step.color }}
                                >
                                    {step.num}
                                </div>
                                <h3 className="relative z-10 text-xl font-bold">{step.title}</h3>
                                <p className="relative z-10 text-gray-600 leading-relaxed">{step.desc}</p>
                                {/* Arrow connector */}
                                {i < 2 && (
                                    <div className="absolute -right-5 top-1/2 z-20 hidden -translate-y-1/2 md:block">
                                        <ArrowRight size={20} className="opacity-30" />
                                    </div>
                                )}
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── SKETCH LAB ──────────────────────────────────────────────── */}
            <section id="lab" className="relative z-10 px-6 py-28">
                <div className="mx-auto max-w-5xl">
                    <div className="mb-12 text-center">
                        <div className="mb-4 inline-flex items-center gap-2 border border-black/20 bg-white px-4 py-2 text-xs font-bold uppercase tracking-widest">
                            <Zap size={12} className="text-yellow-500" /> Live Demo — Draw Right Now
                        </div>
                        <h2 className="text-4xl font-black md:text-5xl">
                            The <Highlight color="#a5f3fc">Sketch Lab</Highlight>
                        </h2>
                        <p className="mt-4 max-w-xl mx-auto text-gray-600">
                            Pick a pencil. Switch the paper. Feel the actual difference between a 4H and a 6B — right here in your browser.
                        </p>
                    </div>

                    <SketchCanvas isDarkMode={false} />
                </div>
            </section>

            {/* ── MARQUEE — trusted brands ─────────────────────────────────── */}
            <section className="relative z-10 overflow-hidden border-y-2 border-black bg-transparent py-10">
                <div className="flex whitespace-nowrap">
                    <motion.div
                        animate={{ x: [0, -1200] }}
                        transition={{ repeat: Infinity, ease: 'linear', duration: 22 }}
                        className="flex gap-20 px-12 text-2xl font-black uppercase tracking-widest text-black"
                    >
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="flex items-center gap-10">
                                <span>Faber-Castell</span>
                                <span className="opacity-30">×</span>
                                <span>Staedtler</span>
                                <span className="opacity-30">×</span>
                                <span>Winsor & Newton</span>
                                <span className="opacity-30">×</span>
                                <span>Camlin</span>
                                <span className="opacity-30">×</span>
                                <span>Canson</span>
                                <span className="opacity-30">×</span>
                            </div>
                        ))}
                    </motion.div>
                </div>
            </section>

            {/* ── FEATURES ────────────────────────────────────────────────── */}
            <section className="relative z-10 px-6 py-28">
                <div className="mx-auto max-w-6xl">
                    <div className="mb-16 text-center">
                        <h2 className="text-4xl font-black md:text-5xl">
                            Why <Highlight color="#bae6fd">Artgez</Highlight>
                        </h2>
                        <p className="mt-4 text-gray-600 text-lg max-w-xl mx-auto">
                            Tools built for how artists actually think — not how supply stores want to sell.
                        </p>
                    </div>
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {FEATURES.map((f, i) => <FeatureCard key={f.title} feature={f} index={i} />)}
                    </div>
                </div>
            </section>

            {/* ── TESTIMONIAL ─────────────────────────────────────────────── */}
            <section className="relative z-10 flex items-center justify-center py-24 bg-[#fffdf5] border-y border-black/5">
                <div className="relative w-full max-w-2xl px-6">
                    <motion.div
                        whileHover={{ rotate: 0, scale: 1.02 }}
                        className="relative rotate-1 bg-[#e0f2fe] p-12 shadow-[6px_6px_0_rgba(0,0,0,0.8)]"
                        style={{ filter: 'url(#rough-paper)' }}
                    >
                        <div className="absolute -top-3 left-1/2 h-6 w-6 -translate-x-1/2 rounded-full bg-red-500 border border-black/20 shadow-sm" />
                        <div className="mb-4 flex gap-1">
                            {[...Array(5)].map((_, i) => <Star key={i} size={14} fill="black" />)}
                        </div>
                        <p className="font-serif text-2xl italic leading-relaxed text-black/80">
                            "I wasted ₹2000 buying the wrong charcoal pencils. Artgez ka Sketch Lab hota toh pehle try kar leta — kabhi nahi khareedta woh."
                        </p>
                        <div className="mt-8 flex items-center gap-4">
                            <div className="h-12 w-12 rounded-full bg-black/10 border border-black/20 flex items-center justify-center font-bold text-sm">RA</div>
                            <div>
                                <div className="font-bold">Rohan Agarwal</div>
                                <div className="text-sm opacity-60">Fine Arts Student, Delhi</div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* ── PRICING ─────────────────────────────────────────────────── */}
            <section id="pricing" className="relative z-10 px-6 py-28">
                <div className="mx-auto max-w-4xl">
                    <div className="mb-16 text-center">
                        <h2 className="text-4xl font-black md:text-5xl">
                            Simple <Highlight color="#bbf7d0">Pricing.</Highlight>
                        </h2>
                        <p className="mt-4 text-gray-600">Start free. Upgrade when you're ready.</p>
                    </div>

                    <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                        {/* Free */}
                        <motion.div
                            whileHover={{ scale: 1.02 }}
                            className="relative border-2 border-black bg-white p-10 text-center"
                            style={{ filter: 'url(#rough-paper)' }}
                        >
                            <h3 className="text-xl font-bold uppercase tracking-wide">Free Sketch</h3>
                            <div className="my-6 text-6xl font-black">₹0</div>
                            <ul className="mb-8 space-y-3 text-sm font-medium text-gray-600 text-left">
                                {['Basic Sketch Board', '5 Pencil Types', '1 Paper Texture', 'Community access'].map(f => (
                                    <li key={f} className="flex items-center gap-3">
                                        <CheckCircle2 size={16} className="text-green-500 shrink-0" />
                                        {f}
                                    </li>
                                ))}
                            </ul>
                            <SketchButton className="w-full justify-center">Get Started Free</SketchButton>
                        </motion.div>

                        {/* Pro */}
                        <motion.div
                            whileHover={{ scale: 1.02 }}
                            className="relative border-4 border-black bg-black text-white p-10 text-center shadow-[12px_12px_0_#bae6fd]"
                            style={{ filter: 'url(#rough-paper)' }}
                        >
                            <div className="absolute -top-5 right-6 rotate-12 border-2 border-black bg-[#bae6fd] px-4 py-1 text-xs font-black text-black shadow-[3px_3px_0_rgba(0,0,0,1)]">
                                MOST POPULAR
                            </div>
                            <h3 className="text-xl font-bold uppercase tracking-wide">Pro Artist</h3>
                            <div className="my-6 text-6xl font-black">₹199<span className="text-2xl font-medium opacity-50">/mo</span></div>
                            <ul className="mb-8 space-y-3 text-sm font-medium text-gray-300 text-left">
                                {[
                                    'All 50+ Pencil Brands',
                                    'Full Paper Lab (8 textures)',
                                    'Style Detector AI',
                                    'Budget Builder',
                                    'Save & Share Sketches',
                                    'Collab Canvas (coming soon)',
                                ].map(f => (
                                    <li key={f} className="flex items-center gap-3">
                                        <CheckCircle2 size={16} className="text-[#bae6fd] shrink-0" />
                                        {f}
                                    </li>
                                ))}
                            </ul>
                            <button className="w-full border-2 border-white bg-white py-4 font-bold text-black transition-all hover:bg-transparent hover:text-white" style={{ filter: 'url(#rough-paper)' }}>
                                Start Pro — ₹199/mo
                            </button>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* ── CTA BANNER ──────────────────────────────────────────────── */}
            <section className="relative z-10 mx-6 mb-20 overflow-hidden border-4 border-black bg-[#2d2d2d] p-16 text-center text-white shadow-[8px_8px_0_#bae6fd]" style={{ filter: 'url(#rough-paper)' }}>
                <h2 className="mb-4 text-4xl font-black md:text-5xl">
                    Stop guessing.<br />
                    <span className="text-[#bae6fd]">Start drawing right.</span>
                </h2>
                <p className="mb-8 text-gray-400 text-lg">Join 1,000+ artists who trial before they buy.</p>
                <div className="flex flex-wrap justify-center gap-4">
                    <SketchButton className="text-white border-white">
                        Open Sketch Lab Free <ArrowRight size={16} />
                    </SketchButton>
                </div>
            </section>

            {/* ── FOOTER ──────────────────────────────────────────────────── */}
            <footer className="border-t-2 border-dashed border-black/20 px-6 py-12">
                <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 md:flex-row md:justify-between">
                    <LogoArtgez />
                    <p className="text-sm font-medium opacity-40 text-center">
                        Drawn with love in India. Built for artists everywhere. 🎨
                    </p>
                    <div className="flex gap-6 text-sm font-medium opacity-50">
                        <a href="#" className="hover:opacity-100 transition-opacity">Privacy</a>
                        <a href="#" className="hover:opacity-100 transition-opacity">Terms</a>
                        <a href="#" className="hover:opacity-100 transition-opacity">Contact</a>
                    </div>
                </div>
            </footer>
        </main>
    );
}
