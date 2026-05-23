'use client';

import React, { useRef, useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Save, FlaskConical, ShoppingBag, ImageIcon, Dna, X, Brain, Users, Sparkles, Menu, ChevronLeft, ChevronRight, UserCircle2 } from 'lucide-react';
import Link from 'next/link';

import { PENCILS, PAPERS } from '@/src/components/artlab/data';
import type { PencilType, PaperType, Tool, SavedSketch } from '@/src/components/artlab/data';
import ToolPanel from '@/src/components/artlab/ToolPanel';
import SketchCanvas, { type CanvasHandle } from '@/src/components/artlab/SketchCanvas';
import PencilDNA from '@/src/components/artlab/PencilDNA';
import BottomBar from '@/src/components/artlab/BottomBar';
import SupplyShop from '@/src/components/artlab/SupplyShop';
import MySketches from '@/src/components/artlab/MySketches';
import AIAssist from '@/src/components/artlab/AIAssist';
import MuseumHall from '@/src/components/artlab/MuseumHall';
import CoDrawRoom from '@/src/components/artlab/CoDrawRoom';
import { HandDrawnFilters } from '@/src/components/CoreLandingPages/CompleteLandingPages/tsx/HandDrawn';
import RazorpayModal from '@/src/components/artlab/RazorpayModal';
import { logEvent } from '@/src/lib/analytics';
import LogoArtgez from '@/src/components/artlab/LogoArtgez';
import ThemeCurtain, { playThemeSound } from '@/src/components/artlab/ThemeTransition';

type Tab = 'lab' | 'dna' | 'shop' | 'sketches' | 'ai' | 'museum' | 'codraw';

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'lab',      label: 'Sketch Lab',  icon: <FlaskConical size={14} /> },
    { id: 'dna',      label: 'Pencil DNA',  icon: <Dna size={14} /> },
    { id: 'shop',     label: 'Supply Shop', icon: <ShoppingBag size={14} /> },
    { id: 'sketches', label: 'My Sketches', icon: <ImageIcon size={14} /> },
    { id: 'ai',       label: 'AI Assist',   icon: <Brain size={14} /> },
    { id: 'museum',   label: 'Museum Hall', icon: <Sparkles size={14} /> },
    { id: 'codraw',   label: 'Co-Draw Lab', icon: <Users size={14} /> },
];

function LoaderArtz() {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-[#fdfbf7]/90 dark:bg-[#121214]/90 backdrop-blur-[1.5px] z-[9999] flex flex-col items-center justify-center select-none"
        >
            <div className="flex flex-col items-center gap-4 text-center">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                    className="relative w-16 h-16 flex items-center justify-center"
                >
                    <svg className="w-full h-full text-teal-500" viewBox="0 0 100 100">
                        <circle
                            cx="50"
                            cy="50"
                            r="40"
                            stroke="currentColor"
                            strokeWidth="8"
                            fill="transparent"
                            strokeDasharray="160 100"
                            strokeLinecap="round"
                        />
                    </svg>
                    <span className="absolute text-xl">✏️</span>
                </motion.div>
                <motion.h3
                    animate={{ scale: [0.95, 1.05, 0.95], opacity: [0.8, 1, 0.8] }}
                    transition={{ repeat: Infinity, duration: 1.2, ease: "easeInOut" }}
                    className="text-3xl font-black tracking-widest text-[#2d2d2d] dark:text-zinc-100"
                >
                    Art<span className="text-teal-500">z</span>
                </motion.h3>
                <span className="text-[9px] uppercase font-black text-gray-400 dark:text-zinc-500 tracking-widest animate-pulse">
                    Simulating Canvas Core...
                </span>
            </div>
        </motion.div>
    );
}

const MAX_UNDO = 30;

export default function ArtLabApp() {
    // ── State ────────────────────────────────────────────────────────────────
    const [activePencil, setActivePencil] = useState<PencilType>(PENCILS[3]); // 2B
    const [activePaper, setActivePaper] = useState<PaperType>(PAPERS[0]);
    const [activeTool, setActiveTool] = useState<Tool>('pencil');
    const [brushSize, setBrushSize] = useState(1);
    const [opacity, setOpacity] = useState(1);
    const [gridVisible, setGridVisible] = useState(false);
    const [activeTab, setActiveTab] = useState<Tab>('lab');
    const [isTabTransitioning, setIsTabTransitioning] = useState(false);

    const handleTabChange = useCallback((targetTab: Tab) => {
        setIsTabTransitioning(true);
        setTimeout(() => {
            setActiveTab(targetTab);
            setIsTabTransitioning(false);
        }, 50);
    }, []);
    const [savedSketches, setSavedSketches] = useState<SavedSketch[]>([]);
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [curtainActive, setCurtainActive] = useState(false);
    const [curtainDarkTarget, setCurtainDarkTarget] = useState(false);

    useEffect(() => {
        const saved = localStorage.getItem('artgez-theme');
        const isDark = saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches);
        setIsDarkMode(isDark);
        if (isDark) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, []);

    const toggleTheme = useCallback(() => {
        const nextDark = !isDarkMode;
        setCurtainDarkTarget(nextDark);
        setCurtainActive(true);
        playThemeSound(nextDark);

        setTimeout(() => {
            setIsDarkMode(nextDark);
            if (nextDark) {
                document.documentElement.classList.add('dark');
                localStorage.setItem('artgez-theme', 'dark');
            } else {
                document.documentElement.classList.remove('dark');
                localStorage.setItem('artgez-theme', 'light');
            }
        }, 250);

        setTimeout(() => {
            setCurtainActive(false);
        }, 600);
    }, [isDarkMode]);
    const [undoStack, setUndoStack] = useState<ImageData[]>([]);
    const [redoStack, setRedoStack] = useState<ImageData[]>([]);
    const [saveToast, setSaveToast] = useState(false);
    const [showDNAMobile, setShowDNAMobile] = useState(false);
    const [sessionId, setSessionId] = useState<string>('');
    const [checkoutItem, setCheckoutItem] = useState<{ id: string; name: string; price: string } | null>(null);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

    const canvasHandle = useRef<CanvasHandle>(null);

    const fetchSketches = useCallback(async (sid: string) => {
        if (!sid) return;
        try {
            const res = await fetch(`/api/sketches?session=${sid}`);
            const result = await res.json();
            if (result.success && result.data) {
                const mapped: SavedSketch[] = result.data.map((s: any) => ({
                    id: s.id,
                    name: s.name,
                    data: s.image_data,
                    pencil: s.pencil_label,
                    paper: s.paper_label,
                    date: new Date(s.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' }),
                }));
                setSavedSketches(mapped);
            }
        } catch (err) {
            console.error('Failed to fetch sketches:', err);
        }
    }, []);

    // Load session and fetch sketches
    useEffect(() => {
        let sid = localStorage.getItem('artgez-session-id');
        if (!sid) {
            sid = `sess_${Math.random().toString(36).substring(2, 15)}_${Date.now()}`;
            localStorage.setItem('artgez-session-id', sid);
        }
        setSessionId(sid);
        fetchSketches(sid);
    }, [fetchSketches]);

    // Telemetry hooks for active supply trials
    const isPencilMounted = useRef(false);
    useEffect(() => {
        if (!isPencilMounted.current) {
            isPencilMounted.current = true;
            return;
        }
        logEvent('PENCIL_TRY', activePencil.id, { label: activePencil.label, brand: activePencil.brand });
    }, [activePencil]);

    const isPaperMounted = useRef(false);
    useEffect(() => {
        if (!isPaperMounted.current) {
            isPaperMounted.current = true;
            return;
        }
        logEvent('PAPER_TRY', activePaper.id, { label: activePaper.label, brand: activePaper.brand });
    }, [activePaper]);

    // ── Undo/Redo ────────────────────────────────────────────────────────────
    const handleStrokeStart = useCallback(() => {
        const data = canvasHandle.current?.getImageData();
        if (!data) return;
        setUndoStack(prev => [...prev.slice(-MAX_UNDO + 1), data]);
        setRedoStack([]);
    }, []);

    const handleUndo = useCallback(() => {
        if (undoStack.length === 0) return;
        const current = canvasHandle.current?.getImageData();
        const prev = undoStack[undoStack.length - 1];
        if (current) setRedoStack(r => [...r, current]);
        canvasHandle.current?.putImageData(prev);
        setUndoStack(u => u.slice(0, -1));
    }, [undoStack]);

    const handleRedo = useCallback(() => {
        if (redoStack.length === 0) return;
        const current = canvasHandle.current?.getImageData();
        const next = redoStack[redoStack.length - 1];
        if (current) setUndoStack(u => [...u, current]);
        canvasHandle.current?.putImageData(next);
        setRedoStack(r => r.slice(0, -1));
    }, [redoStack]);

    const handleClear = useCallback(() => {
        const data = canvasHandle.current?.getImageData();
        if (data) setUndoStack(u => [...u, data]);
        setRedoStack([]);
        canvasHandle.current?.clear();
    }, []);

    const handleDownload = useCallback(() => {
        canvasHandle.current?.download(`artgez-sketch-${Date.now()}`);
    }, []);

    // ── Save Sketch ──────────────────────────────────────────────────────────
    const handleSave = useCallback(async () => {
        const data = canvasHandle.current?.toDataURL();
        if (!data || !sessionId) return;
        
        const name = `Sketch ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`;
        try {
            const res = await fetch('/api/sketches', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-session-id': sessionId,
                },
                body: JSON.stringify({
                    name,
                    imageData: data,
                    pencilId: activePencil.id,
                    pencilLabel: activePencil.label,
                    paperId: activePaper.id,
                    paperLabel: activePaper.label,
                    sessionId,
                }),
            });
            const result = await res.json();
            if (result.success) {
                setSaveToast(true);
                setTimeout(() => setSaveToast(false), 2500);
                fetchSketches(sessionId);
                logEvent('SKETCH_SAVE', activePencil.id, { name, paperId: activePaper.id });
            } else {
                console.error('Failed to save sketch:', result.error);
            }
        } catch (err) {
            console.error('Failed to save sketch:', err);
        }
    }, [activePencil, activePaper, sessionId, fetchSketches]);

    // ── Delete Sketch ────────────────────────────────────────────────────────
    const handleDelete = useCallback(async (id: string) => {
        if (!sessionId) return;
        try {
            const res = await fetch(`/api/sketches/${id}?session=${sessionId}`, {
                method: 'DELETE',
            });
            const result = await res.json();
            if (result.success) {
                fetchSketches(sessionId);
            } else {
                console.error('Failed to delete sketch:', result.error);
            }
        } catch (err) {
            console.error('Failed to delete sketch:', err);
        }
    }, [sessionId, fetchSketches]);

    // ── Try in Lab (from shop) ───────────────────────────────────────────────
    const handleTryInLab = useCallback((pencilId: string) => {
        const found = PENCILS.find(p => p.id === pencilId);
        if (found) {
            setActivePencil(found);
            handleTabChange('lab');
        }
    }, [handleTabChange]);

    // ── Keyboard shortcuts ───────────────────────────────────────────────────
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.metaKey || e.ctrlKey) {
                if (e.key === 'z') { e.preventDefault(); if (e.shiftKey) handleRedo(); else handleUndo(); }
                if (e.key === 's') { e.preventDefault(); handleSave(); }
            }
            if (e.key === 'p' || e.key === 'b') setActiveTool('pencil');
            if (e.key === 'e') setActiveTool('eraser');
            if (e.key === 'l') setActiveTool('line');
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [handleUndo, handleRedo, handleSave]);

    // ── Render ───────────────────────────────────────────────────────────────
    return (
        <div className="flex h-screen flex-col overflow-hidden bg-[#fdfbf7] dark:bg-[#121214] text-[#2d2d2d] dark:text-zinc-100 transition-colors duration-300">
            <ThemeCurtain isActive={curtainActive} isDarkTarget={curtainDarkTarget} />
            <HandDrawnFilters />

            {/* ── TOP NAV ─────────────────────────────────────────────────── */}
            <header className="flex h-12 shrink-0 items-center justify-between border-b-2 border-black/10 bg-white px-4">
                {/* Left: logo + back */}
                <div className="flex items-center gap-3">
                    <Link
                        href="/"
                        className="flex items-center gap-1.5 rounded border border-black/10 px-2.5 py-1 text-xs font-semibold text-gray-500 transition-all hover:border-black hover:text-black"
                    >
                        <ArrowLeft size={12} /> Back
                    </Link>
                    <div className="flex items-center gap-1.5 scale-90 origin-left select-none">
                        <LogoArtgez />
                        <span className="ml-1 text-xs font-medium text-gray-400">/ ArtLab</span>
                    </div>
                </div>



                {/* Right: actions */}
                <div className="flex items-center gap-2">
                    {/* Mobile DNA toggle */}
                    <button
                        onClick={() => setShowDNAMobile(v => !v)}
                        className="flex items-center gap-1 rounded border border-black/10 px-2.5 py-1 text-xs font-semibold text-gray-500 transition-all hover:border-black hover:text-black xl:hidden"
                    >
                        <Dna size={12} /> DNA
                    </button>
                    <button
                        onClick={handleSave}
                        className="flex items-center gap-1.5 rounded border-2 border-black dark:border-emerald-400 bg-[#ffeb3b] dark:bg-emerald-500 px-3 py-1 text-xs font-bold text-black dark:text-zinc-950 shadow-[2px_2px_0_rgba(0,0,0,0.5)] dark:shadow-[2px_2px_0_rgba(16,185,129,0.3)] transition-all hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]"
                    >
                        <Save size={12} /> Save
                    </button>
                </div>
            </header>

            {/* Mobile tabs */}
            <div className="flex sm:hidden border-b border-black/8 bg-white">
                {TABS.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => handleTabChange(tab.id)}
                        className={`flex flex-1 items-center justify-center gap-1 py-2 text-[10px] font-bold uppercase tracking-wide transition-all ${
                            activeTab === tab.id
                                ? 'border-b-2 border-black text-black'
                                : 'text-gray-400'
                        }`}
                    >
                        {tab.icon} {tab.label}
                    </button>
                ))}
            </div>

            {/* ── MAIN CONTENT ────────────────────────────────────────────── */}
            <div className="relative flex flex-1 overflow-hidden">
                <AnimatePresence>
                    {isTabTransitioning && <LoaderArtz />}
                </AnimatePresence>
                {/* 📊 COLLAPSIBLE WORKSPACE SIDEBAR NAVIGATION */}
                <motion.aside
                    animate={{ width: isSidebarCollapsed ? 64 : 220 }}
                    transition={{ type: 'spring', damping: 26, stiffness: 220 }}
                    className="hidden sm:flex flex-col border-r-2 border-black/10 dark:border-white/10 bg-white dark:bg-[#18181b] h-full relative z-30 select-none shrink-0 transition-colors duration-300"
                >
                    {/* Sidebar Toggle Chevron Header */}
                    <div className="flex items-center justify-between p-3.5 border-b border-black/5 dark:border-white/5 bg-[#fafaf8] dark:bg-[#202024] transition-colors duration-300">
                        {!isSidebarCollapsed && (
                            <span className="text-[9px] font-black uppercase text-gray-400 tracking-wider">Workspace Panels</span>
                        )}
                        <button
                            onClick={() => setIsSidebarCollapsed(v => !v)}
                            className="bg-black/5 hover:bg-black hover:text-white rounded border border-black/15 p-1 transition-all mx-auto sm:mx-0 shrink-0"
                            title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
                        >
                            {isSidebarCollapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
                        </button>
                    </div>

                    {/* Navigation Buttons list */}
                    <div className="flex flex-col gap-1.5 p-2.5 flex-1 mt-2">
                        {TABS.map(tab => {
                            const isActive = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => handleTabChange(tab.id)}
                                    className={`flex items-center gap-3 rounded-lg px-3.5 py-3 text-xs font-black transition-all group relative border-2 ${
                                        isActive
                                            ? 'bg-[#ffeb3b] dark:bg-emerald-500 text-black dark:text-zinc-950 border-black dark:border-emerald-400 shadow-[2px_2px_0_rgba(0,0,0,1)] dark:shadow-[2px_2px_0_rgba(16,185,129,0.3)]'
                                            : 'text-gray-500 hover:text-black dark:text-gray-400 dark:hover:text-zinc-100 border-transparent hover:bg-gray-100 dark:hover:bg-zinc-800/50'
                                    }`}
                                >
                                    <span className="shrink-0">{tab.icon}</span>
                                    {!isSidebarCollapsed && (
                                        <span className="truncate uppercase tracking-wider text-[10px]">{tab.label}</span>
                                    )}

                                    {/* Spring Tooltips for collapsed state */}
                                    {isSidebarCollapsed && (
                                        <div className="pointer-events-none absolute left-full ml-4 z-50 whitespace-nowrap rounded border-2 border-black bg-white px-2.5 py-1.5 text-[10px] font-black uppercase tracking-wider text-black shadow-[3px_3px_0_rgba(0,0,0,1)] opacity-0 group-hover:opacity-100 transition-opacity">
                                            {tab.label}
                                        </div>
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    {/* Theme Toggle Button */}
                    <div className="p-2 border-t border-black/5 dark:border-white/5 bg-[#fafaf8]/50 dark:bg-[#202024]/50">
                        <button
                            onClick={toggleTheme}
                            className={`w-full flex items-center justify-center gap-2.5 px-3 py-2.5 text-xs font-black rounded-lg border-2 border-black dark:border-zinc-300 transition-all ${
                                isDarkMode 
                                    ? 'bg-zinc-100 text-zinc-950 shadow-[2px_2px_0_rgba(0,0,0,1)] dark:shadow-[2px_2px_0_rgba(255,255,255,0.15)]' 
                                    : 'bg-gray-100 hover:bg-gray-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-gray-600 hover:text-black dark:text-gray-300 dark:hover:text-zinc-100 border-transparent'
                            }`}
                            title="Toggle Light/Dark Theme"
                        >
                            <span className="shrink-0 text-sm leading-none">{isDarkMode ? '☀️' : '🌙'}</span>
                            {!isSidebarCollapsed && (
                                <span className="uppercase tracking-wider text-[9px] leading-none">{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>
                            )}
                        </button>
                    </div>

                    {/* Active Session telemetry indicators at the bottom */}
                    {!isSidebarCollapsed && (
                        <div className="p-4 border-t border-black/5 dark:border-white/5 bg-[#fafaf8] dark:bg-[#202024] text-[9px] font-bold text-gray-400 uppercase tracking-widest leading-relaxed transition-colors duration-300">
                            <div className="flex items-center gap-1.5 truncate">
                                <UserCircle2 size={13} className="text-purple-600 shrink-0" />
                                <span className="truncate">session: {sessionId.substring(5, 12)}...</span>
                            </div>
                        </div>
                    )}
                </motion.aside>

                {/* SKETCH LAB (always mounted, hidden when other tab active on desktop) */}
                <div className={`flex flex-1 overflow-hidden ${activeTab !== 'lab' ? 'hidden' : 'flex'}`}>

                    {/* Left tool panel */}
                    <ToolPanel
                        activeTool={activeTool}
                        setActiveTool={setActiveTool}
                        brushSize={brushSize}
                        setBrushSize={setBrushSize}
                        opacity={opacity}
                        setOpacity={setOpacity}
                        gridVisible={gridVisible}
                        setGridVisible={setGridVisible}
                        onUndo={handleUndo}
                        onRedo={handleRedo}
                        onClear={handleClear}
                        onDownload={handleDownload}
                        canUndo={undoStack.length > 0}
                        canRedo={redoStack.length > 0}
                    />

                    {/* Canvas + bottom bar */}
                    <div className="flex flex-1 flex-col overflow-hidden">
                        <SketchCanvas
                            ref={canvasHandle}
                            activePencil={activePencil}
                            activePaper={activePaper}
                            activeTool={activeTool}
                            brushSize={brushSize}
                            opacity={opacity}
                            gridVisible={gridVisible}
                            onStrokeStart={handleStrokeStart}
                            isDarkMode={isDarkMode}
                        />
                        <BottomBar
                            activePencil={activePencil}
                            activePaper={activePaper}
                            setActivePencil={setActivePencil}
                            setActivePaper={setActivePaper}
                            isDarkMode={isDarkMode}
                        />
                    </div>

                    {/* Right DNA panel — desktop only */}
                    <div className="hidden xl:block">
                        <PencilDNA pencil={activePencil} paper={activePaper} isSidebar={true} onBuyPencil={setCheckoutItem} isDarkMode={isDarkMode} />
                    </div>
                </div>

                {/* OTHER TABS */}
                {activeTab === 'dna' && (
                    <div className="flex-1 overflow-hidden">
                        <PencilDNA 
                            pencil={activePencil} 
                            paper={activePaper} 
                            isSidebar={false} 
                            onEquipPencil={setActivePencil} 
                            onBuyPencil={setCheckoutItem}
                            isDarkMode={isDarkMode}
                        />
                    </div>
                )}
                {activeTab === 'shop' && (
                    <div className="flex-1 overflow-hidden">
                        <SupplyShop onTryInLab={handleTryInLab} onBuySupply={setCheckoutItem} isDarkMode={isDarkMode} />
                    </div>
                )}
                {activeTab === 'sketches' && (
                    <div className="flex-1 overflow-hidden">
                        <MySketches sketches={savedSketches} onDelete={handleDelete} />
                    </div>
                )}
                {activeTab === 'ai' && (
                    <div className="flex-1 overflow-hidden">
                        <AIAssist sessionId={sessionId} onTryInLab={handleTryInLab} />
                    </div>
                )}
                {activeTab === 'museum' && (
                    <div className="flex-1 overflow-hidden">
                        <MuseumHall sessionId={sessionId} mySketches={savedSketches} onBackToCanvas={() => handleTabChange('lab')} />
                    </div>
                )}
                {activeTab === 'codraw' && (
                    <div className="flex-1 overflow-hidden">
                        <CoDrawRoom sessionId={sessionId} onBackToCanvas={() => handleTabChange('lab')} />
                    </div>
                )}

                {/* Mobile DNA overlay */}
                <AnimatePresence>
                    {showDNAMobile && (
                        <motion.div
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
                            className="absolute right-0 top-0 z-50 h-full w-80 overflow-y-auto border-l-2 border-black/10 dark:border-white/10 bg-white dark:bg-zinc-900 text-gray-950 dark:text-zinc-150 shadow-2xl xl:hidden"
                        >
                            <div className="flex items-center justify-between border-b border-black/10 dark:border-white/5 px-4 py-3">
                                <span className="text-sm font-bold text-gray-900 dark:text-zinc-100">Pencil DNA</span>
                                <button onClick={() => setShowDNAMobile(false)} className="rounded p-1 hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-500 dark:text-zinc-400">
                                    <X size={16} />
                                </button>
                            </div>
                            <PencilDNA pencil={activePencil} paper={activePaper} isSidebar={true} onBuyPencil={setCheckoutItem} isDarkMode={isDarkMode} />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* ── SAVE TOAST ──────────────────────────────────────────────── */}
            <AnimatePresence>
                {saveToast && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded border-2 border-black bg-[#ffeb3b] px-5 py-2.5 text-sm font-bold text-black shadow-[4px_4px_0_rgba(0,0,0,1)]"
                    >
                        ✅ Sketch saved to My Sketches!
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Keyboard shortcuts hint */}
            <div className="hidden lg:flex items-center gap-4 border-t border-black/5 bg-white px-4 py-1.5">
                {[['P','Pencil'],['E','Eraser'],['L','Line'],['⌘Z','Undo'],['⌘S','Save']].map(([k,l]) => (
                    <span key={k} className="flex items-center gap-1 text-[10px] text-gray-400">
                        <kbd className="rounded border border-black/10 bg-gray-50 px-1 font-mono text-[10px]">{k}</kbd>
                        {l}
                    </span>
                ))}
            </div>

            <RazorpayModal
                isOpen={checkoutItem !== null}
                onClose={() => setCheckoutItem(null)}
                itemName={checkoutItem?.name || ''}
                itemPrice={checkoutItem?.price || ''}
                itemId={checkoutItem?.id || ''}
                sessionId={sessionId}
            />
        </div>
    );
}
