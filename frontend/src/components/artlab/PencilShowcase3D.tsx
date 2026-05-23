'use client';

import React, { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Text, Environment } from '@react-three/drei';
import * as THREE from 'three';
import { motion, AnimatePresence } from 'framer-motion';
import { PENCILS } from './data';
import type { PencilType } from './data';
import { ShoppingBag, FlaskConical, X, ChevronLeft, ChevronRight, Sparkles, Star } from 'lucide-react';

// ─── BRAND COLOR MAP ─────────────────────────────────────────────────────────
function getBrandColor(pencil: PencilType): string {
    const b = pencil.brand.toLowerCase();
    if (b.includes('staedtler')) return '#0f4c81';
    if (b.includes('sakura'))    return '#1a1a1a';
    if (b.includes('camlin') || pencil.category === 'charcoal') return '#242424';
    if (b.includes('pentel'))    return '#7f1d1d';
    return '#1e3f20'; // Faber-Castell green
}

// ─── SINGLE PENCIL 3D MESH ───────────────────────────────────────────────────
function Pencil3D({
    pencil,
    position,
    isActive,
    index,
    onClick,
}: {
    pencil: PencilType;
    position: [number, number, number];
    isActive: boolean;
    index: number;
    onClick: () => void;
}) {
    const groupRef = useRef<THREE.Group>(null);
    const [hovered, setHovered] = useState(false);
    const bodyColor = getBrandColor(pencil);

    // Determine if it's a brush pen
    const isBrush = pencil.id === 'bp';
    const isInk   = pencil.id === 'ink';
    const isCharcoal = pencil.category === 'charcoal';

    useFrame((state) => {
        if (!groupRef.current) return;
        const t = state.clock.getElapsedTime();
        // Floating bob — different phase per pencil
        groupRef.current.position.y = position[1] + Math.sin(t * 1.2 + index * 0.7) * 0.06;
        // Slow spin on Y
        groupRef.current.rotation.y = t * 0.35 + index * 0.4;
        // Scale up when active or hovered
        const targetScale = isActive ? 1.45 : hovered ? 1.2 : 1.0;
        groupRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.08);
        // Tilt
        groupRef.current.rotation.x = isActive ? -0.2 : -0.15;
    });

    // Tip color = stroke / lead color
    const tipColor = pencil.color;

    return (
        <group
            ref={groupRef}
            position={position}
            onClick={(e) => { e.stopPropagation(); onClick(); }}
            onPointerOver={() => { setHovered(true); document.body.style.cursor = 'pointer'; }}
            onPointerOut={() => { setHovered(false); document.body.style.cursor = 'default'; }}
        >
            {/* ── Glow ring when active */}
            {isActive && (
                <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, -0.85, 0]}>
                    <torusGeometry args={[0.28, 0.02, 16, 64]} />
                    <meshStandardMaterial color="#facc15" emissive="#facc15" emissiveIntensity={2} />
                </mesh>
            )}

            {isBrush ? (
                // ── BRUSH PEN ──────────────────────────────────────────────
                <>
                    {/* Handle body */}
                    <mesh position={[0, 0.3, 0]}>
                        <cylinderGeometry args={[0.11, 0.11, 1.4, 32]} />
                        <meshStandardMaterial color={bodyColor} roughness={0.4} metalness={0.1} />
                    </mesh>
                    {/* Clip stripe */}
                    <mesh position={[0.12, 0.6, 0]}>
                        <boxGeometry args={[0.015, 0.85, 0.03]} />
                        <meshStandardMaterial color="#c0c0c0" metalness={0.9} roughness={0.1} />
                    </mesh>
                    {/* Brush ferrule */}
                    <mesh position={[0, -0.42, 0]}>
                        <cylinderGeometry args={[0.11, 0.07, 0.18, 32]} />
                        <meshStandardMaterial color="#b0b0b0" metalness={0.8} roughness={0.2} />
                    </mesh>
                    {/* Brush bristles (tapered) */}
                    <mesh position={[0, -0.65, 0]}>
                        <cylinderGeometry args={[0.07, 0.005, 0.35, 24]} />
                        <meshStandardMaterial color={tipColor} roughness={0.85} />
                    </mesh>
                    {/* Cap */}
                    <mesh position={[0, 1.06, 0]}>
                        <cylinderGeometry args={[0.11, 0.11, 0.12, 32]} />
                        <meshStandardMaterial color="#e5e7eb" roughness={0.5} />
                    </mesh>
                </>
            ) : isInk ? (
                // ── INK PEN ──────────────────────────────────────────────
                <>
                    {/* Body */}
                    <mesh position={[0, 0.25, 0]}>
                        <cylinderGeometry args={[0.095, 0.095, 1.3, 32]} />
                        <meshStandardMaterial color="#111111" roughness={0.2} metalness={0.3} />
                    </mesh>
                    {/* Label band */}
                    <mesh position={[0, 0.45, 0]}>
                        <cylinderGeometry args={[0.097, 0.097, 0.18, 32]} />
                        <meshStandardMaterial color="#ef4444" roughness={0.4} />
                    </mesh>
                    {/* Metal tip section */}
                    <mesh position={[0, -0.44, 0]}>
                        <cylinderGeometry args={[0.095, 0.06, 0.2, 32]} />
                        <meshStandardMaterial color="#c0c0c0" metalness={0.95} roughness={0.05} />
                    </mesh>
                    {/* Nib */}
                    <mesh position={[0, -0.6, 0]}>
                        <cylinderGeometry args={[0.025, 0.002, 0.2, 16]} />
                        <meshStandardMaterial color="#888" metalness={0.9} roughness={0.1} />
                    </mesh>
                    {/* Cap */}
                    <mesh position={[0, 0.98, 0]}>
                        <cylinderGeometry args={[0.097, 0.097, 0.13, 32]} />
                        <meshStandardMaterial color="#222" roughness={0.3} />
                    </mesh>
                </>
            ) : isCharcoal ? (
                // ── CHARCOAL STICK ─────────────────────────────────────
                <>
                    {/* Charcoal body — rougher */}
                    <mesh position={[0, 0, 0]}>
                        <cylinderGeometry args={[0.14, 0.12, 1.8, 12]} />
                        <meshStandardMaterial color="#1c1c1c" roughness={0.98} metalness={0} />
                    </mesh>
                    {/* Powdery tip */}
                    <mesh position={[0, -0.98, 0]}>
                        <cylinderGeometry args={[0.12, 0.01, 0.18, 12]} />
                        <meshStandardMaterial color="#0a0a0a" roughness={0.99} />
                    </mesh>
                </>
            ) : (
                // ── GRAPHITE PENCIL ──────────────────────────────────
                <>
                    {/* Eraser */}
                    <mesh position={[0, 1.0, 0]}>
                        <cylinderGeometry args={[0.115, 0.115, 0.18, 32]} />
                        <meshStandardMaterial color="#f9a8d4" roughness={0.7} />
                    </mesh>
                    {/* Ferrule (metal band) */}
                    <mesh position={[0, 0.88, 0]}>
                        <cylinderGeometry args={[0.117, 0.117, 0.1, 32]} />
                        <meshStandardMaterial color="#c0c0c0" metalness={0.9} roughness={0.1} />
                    </mesh>
                    {/* Body */}
                    <mesh position={[0, 0.1, 0]}>
                        <cylinderGeometry args={[0.115, 0.115, 1.5, 6]} />
                        <meshStandardMaterial color={bodyColor} roughness={0.5} />
                    </mesh>
                    {/* Wood cone */}
                    <mesh position={[0, -0.72, 0]}>
                        <cylinderGeometry args={[0.115, 0.045, 0.25, 6]} />
                        <meshStandardMaterial color="#d9b48f" roughness={0.8} />
                    </mesh>
                    {/* Lead tip */}
                    <mesh position={[0, -0.88, 0]}>
                        <cylinderGeometry args={[0.045, 0.003, 0.18, 16]} />
                        <meshStandardMaterial color={tipColor} roughness={0.6} metalness={0.1} />
                    </mesh>
                </>
            )}
        </group>
    );
}

// ─── SCENE: CIRCULAR CAROUSEL ───────────────────────────────────────────────
function ShowcaseScene({
    activePencilId,
    onSelect,
}: {
    activePencilId: string;
    onSelect: (id: string) => void;
}) {
    const RADIUS = 4.2;
    const COUNT  = PENCILS.length;

    return (
        <>
            <ambientLight intensity={0.6} />
            <directionalLight position={[5, 8, 5]} intensity={1.4} castShadow />
            <pointLight position={[-3, 4, -3]} intensity={0.8} color="#facc15" />
            <pointLight position={[3, -2, 4]} intensity={0.5} color="#818cf8" />

            {/* Floor reflection ring */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.1, 0]}>
                <ringGeometry args={[3.4, 5.2, 64]} />
                <meshStandardMaterial color="#facc15" transparent opacity={0.04} />
            </mesh>

            {PENCILS.map((pencil, i) => {
                const angle = (i / COUNT) * Math.PI * 2;
                const x = Math.sin(angle) * RADIUS;
                const z = Math.cos(angle) * RADIUS;
                return (
                    <Pencil3D
                        key={pencil.id}
                        pencil={pencil}
                        position={[x, 0, z]}
                        isActive={pencil.id === activePencilId}
                        index={i}
                        onClick={() => onSelect(pencil.id)}
                    />
                );
            })}

            <OrbitControls
                enablePan={false}
                minDistance={5}
                maxDistance={14}
                minPolarAngle={Math.PI / 5}
                maxPolarAngle={Math.PI / 1.8}
                autoRotate
                autoRotateSpeed={0.6}
            />
        </>
    );
}

// ─── STAT BAR ────────────────────────────────────────────────────────────────
function StatBar({ label, value }: { label: string; value: number }) {
    return (
        <div className="flex items-center gap-2">
            <span className="w-16 text-[10px] text-gray-400 font-bold uppercase shrink-0">{label}</span>
            <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.round(value * 100)}%` }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                    className="h-full rounded-full bg-gradient-to-r from-yellow-400 to-amber-500"
                />
            </div>
            <span className="text-[10px] text-gray-300 font-black w-7 text-right">{Math.round(value * 10)}/10</span>
        </div>
    );
}

// ─── MAIN EXPORT ─────────────────────────────────────────────────────────────
type Props = {
    onClose: () => void;
    onTryInLab: (pencilId: string) => void;
    onBuySupply?: (item: { id: string; name: string; price: string }) => void;
};

export default function PencilShowcase3D({ onClose, onTryInLab, onBuySupply }: Props) {
    const [activePencilId, setActivePencilId] = useState(PENCILS[3].id); // start on 2B
    const activePencil = PENCILS.find(p => p.id === activePencilId) || PENCILS[3];

    const selectNext = () => {
        const idx = PENCILS.findIndex(p => p.id === activePencilId);
        setActivePencilId(PENCILS[(idx + 1) % PENCILS.length].id);
    };
    const selectPrev = () => {
        const idx = PENCILS.findIndex(p => p.id === activePencilId);
        setActivePencilId(PENCILS[(idx - 1 + PENCILS.length) % PENCILS.length].id);
    };

    const getBrandColor = (p: PencilType) => {
        const b = p.brand.toLowerCase();
        if (b.includes('staedtler')) return '#3b82f6';
        if (b.includes('sakura'))    return '#9ca3af';
        if (b.includes('camlin') || p.category === 'charcoal') return '#6b7280';
        if (b.includes('pentel'))    return '#ef4444';
        return '#22c55e';
    };

    return (
        <div className="fixed inset-0 z-[200] flex bg-[#0a0a10]">
            {/* ── LEFT 3D CANVAS ────────────────────────────────────────────── */}
            <div className="flex-1 relative">
                {/* Header */}
                <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-6 py-4 bg-gradient-to-b from-black/60 to-transparent">
                    <div>
                        <div className="flex items-center gap-2">
                            <Sparkles size={16} className="text-yellow-400 animate-pulse" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-yellow-400">Artgez Tool Lab</span>
                        </div>
                        <h1 className="text-2xl font-black text-white mt-0.5">3D Pencil Showcase</h1>
                        <p className="text-xs text-gray-400 mt-0.5">Drag to orbit · Click a pencil to inspect</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-9 h-9 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors border border-white/10"
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* Canvas */}
                <Canvas
                    camera={{ position: [0, 3, 11], fov: 45 }}
                    style={{ background: 'radial-gradient(ellipse at center, #12122a 0%, #060608 100%)' }}
                >
                    <ShowcaseScene activePencilId={activePencilId} onSelect={setActivePencilId} />
                </Canvas>

                {/* Bottom pencil selector pills */}
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1.5">
                    {PENCILS.map(p => (
                        <button
                            key={p.id}
                            onClick={() => setActivePencilId(p.id)}
                            title={p.label}
                            className={`w-2.5 h-2.5 rounded-full transition-all duration-200 border ${
                                p.id === activePencilId
                                    ? 'scale-150 border-yellow-400 bg-yellow-400'
                                    : 'border-white/30 bg-white/10 hover:bg-white/30'
                            }`}
                        />
                    ))}
                </div>

                {/* Prev/Next arrows */}
                <button
                    onClick={selectPrev}
                    className="absolute left-5 top-1/2 -translate-y-1/2 z-10 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-yellow-400 hover:text-black text-white transition-all border border-white/10"
                >
                    <ChevronLeft size={20} />
                </button>
                <button
                    onClick={selectNext}
                    className="absolute right-[336px] top-1/2 -translate-y-1/2 z-10 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-yellow-400 hover:text-black text-white transition-all border border-white/10"
                >
                    <ChevronRight size={20} />
                </button>
            </div>

            {/* ── RIGHT DETAIL PANEL ────────────────────────────────────────── */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={activePencilId}
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 30 }}
                    transition={{ duration: 0.25 }}
                    className="w-80 bg-[#0f0f1a] border-l border-white/8 flex flex-col overflow-y-auto shrink-0"
                >
                    {/* Category badge */}
                    <div className="px-6 pt-8 pb-4">
                        <div className="flex items-center gap-2 mb-3">
                            <span
                                className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded"
                                style={{ backgroundColor: getBrandColor(activePencil) + '33', color: getBrandColor(activePencil) }}
                            >
                                {activePencil.category}
                            </span>
                            <span className="text-[9px] font-bold text-gray-500">{activePencil.brand}</span>
                        </div>
                        <h2 className="text-3xl font-black text-white leading-none">{activePencil.label}</h2>
                        <p className="text-xs text-gray-400 mt-2 leading-relaxed">{activePencil.desc}</p>

                        {/* Price + stars */}
                        <div className="flex items-center justify-between mt-4">
                            <span className="text-2xl font-black text-yellow-400">{activePencil.price}</span>
                            <div className="flex items-center gap-0.5">
                                {[1,2,3,4,5].map(s => (
                                    <Star key={s} size={11} fill={s <= Math.round((1 - activePencil.darkness * 0.3 + 0.7) * 5) ? '#facc15' : 'transparent'} stroke="#facc15" />
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Divider */}
                    <div className="h-px bg-white/8 mx-6" />

                    {/* DNA Stats */}
                    <div className="px-6 py-5 flex flex-col gap-3">
                        <p className="text-[9px] font-black uppercase tracking-widest text-gray-500">DNA Spec Sheet</p>
                        <StatBar label="Darkness"  value={activePencil.darkness} />
                        <StatBar label="Softness"  value={1 - activePencil.hardness} />
                        <StatBar label="Smudge"    value={activePencil.smudge} />
                        <StatBar label="Opacity"   value={activePencil.opacity} />
                        <StatBar label="Line Wt."  value={activePencil.size / 10} />
                    </div>

                    {/* Divider */}
                    <div className="h-px bg-white/8 mx-6" />

                    {/* Best For */}
                    <div className="px-6 py-5">
                        <p className="text-[9px] font-black uppercase tracking-widest text-gray-500 mb-3">Best Art Workflows</p>
                        <div className="flex flex-wrap gap-1.5">
                            {activePencil.bestFor.map(use => (
                                <span key={use} className="text-[10px] font-bold px-2.5 py-1 rounded border border-white/10 text-gray-300 bg-white/5">
                                    {use}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Divider */}
                    <div className="h-px bg-white/8 mx-6" />

                    {/* Stroke preview */}
                    <div className="px-6 py-5">
                        <p className="text-[9px] font-black uppercase tracking-widest text-gray-500 mb-3">Stroke Preview</p>
                        <div className="bg-[#fdfbf7] rounded-lg p-3 h-14 flex items-center justify-center overflow-hidden">
                            <svg width="200" height="32" viewBox="0 0 200 32">
                                <path
                                    d="M 10 16 Q 40 4 70 16 Q 100 28 130 16 Q 160 4 190 16"
                                    fill="none"
                                    stroke={activePencil.color}
                                    strokeWidth={activePencil.size * 1.2}
                                    strokeLinecap="round"
                                    opacity={activePencil.opacity}
                                />
                            </svg>
                        </div>
                    </div>

                    {/* Spacer */}
                    <div className="flex-1" />

                    {/* Action Buttons */}
                    <div className="px-6 py-6 flex flex-col gap-2.5 border-t border-white/8">
                        <button
                            onClick={() => { onTryInLab(activePencil.id); onClose(); }}
                            className="flex items-center justify-center gap-2 w-full py-3 rounded bg-yellow-400 hover:bg-yellow-300 text-black font-black text-xs uppercase tracking-wider border-2 border-yellow-500 shadow-[0_4px_0_rgba(202,138,4,1)] hover:shadow-none hover:translate-y-[2px] transition-all"
                        >
                            <FlaskConical size={14} /> Try in Sketch Lab
                        </button>
                        <button
                            onClick={() => onBuySupply?.({ id: activePencil.id, name: activePencil.label, price: activePencil.price })}
                            className="flex items-center justify-center gap-2 w-full py-3 rounded border border-white/20 text-white font-black text-xs uppercase tracking-wider hover:bg-white/10 transition-colors"
                        >
                            <ShoppingBag size={14} /> Add to Cart · {activePencil.price}
                        </button>
                    </div>
                </motion.div>
            </AnimatePresence>
        </div>
    );
}
