'use client';

import React, { useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

type PencilModelProps = {
    brand: string;
    category: string;
    strokeColor: string;
    heightClass?: string;
};

// ─── 3D PENCIL MODEL ────────────────────────────────────────────────────────
function PencilModel({ brand, category, strokeColor }: PencilModelProps) {
    const meshRef = useRef<THREE.Group>(null);
    const [hovered, setHovered] = useState(false);

    // Rotate and float the supply slowly
    useFrame((state) => {
        if (meshRef.current) {
            meshRef.current.rotation.y = state.clock.getElapsedTime() * 0.6 + (hovered ? 0.5 : 0);
            meshRef.current.position.y = Math.sin(state.clock.getElapsedTime() * 1.5) * 0.08; // smooth floating bob
            meshRef.current.rotation.x = -0.3; // Tilt slightly towards camera
        }
    });

    const isCharcoal = category.toLowerCase() === 'charcoal' || brand.toLowerCase().includes('camlin');
    const isInkPen = category.toLowerCase() === 'ink' && !brand.toLowerCase().includes('pentel');
    const isBrushPen = category.toLowerCase() === 'ink' && brand.toLowerCase().includes('pentel');
    const isPaper = category.toLowerCase() === 'paper';
    const isKit = category.toLowerCase() === 'kit';

    // ── Brand color logic for standard pencils
    let bodyColor = '#1e3f20'; // Faber-Castell green default
    const brandLower = brand.toLowerCase();
    if (brandLower.includes('staedtler')) {
        bodyColor = '#0f4c81'; // Staedtler blue
    } else if (brandLower.includes('sakura')) {
        bodyColor = '#1a1a1a'; // Sakura black
    } else if (isCharcoal) {
        bodyColor = '#242424'; // Matte dark grey
    } else if (brandLower.includes('pentel')) {
        bodyColor = '#7f1d1d'; // Pentel dark red
    }

    // ── Render 3D Paper (Sketchbook)
    if (isPaper) {
        const coverColor = brandLower.includes('canson') ? '#3b5998' : '#78350f'; // blue or brown cover
        return (
            <group ref={meshRef} onPointerOver={() => setHovered(true)} onPointerOut={() => setHovered(false)}>
                {/* Book Cover (bottom) */}
                <mesh position={[0, -0.05, 0]}>
                    <boxGeometry args={[2.5, 0.05, 1.8]} />
                    <meshStandardMaterial color={coverColor} roughness={0.8} />
                </mesh>
                
                {/* Book Pages Block */}
                <mesh position={[0, 0.05, 0]}>
                    <boxGeometry args={[2.46, 0.16, 1.76]} />
                    <meshStandardMaterial color="#fefbf2" roughness={0.9} />
                </mesh>

                {/* Book Cover (top, slightly tilted open) */}
                <mesh position={[0, 0.15, 0.02]} rotation={[0.08, 0, 0]}>
                    <boxGeometry args={[2.5, 0.04, 1.8]} />
                    <meshStandardMaterial color={coverColor} roughness={0.8} />
                </mesh>

                {/* Spiral Ring Binder Loops along the left side */}
                <group position={[-1.2, 0.05, 0]}>
                    {[-0.7, -0.42, -0.14, 0.14, 0.42, 0.7].map((z, idx) => (
                        <mesh key={idx} position={[0, 0, z]} rotation={[Math.PI / 2, 0, 0]}>
                            <torusGeometry args={[0.13, 0.02, 8, 24]} />
                            <meshStandardMaterial color="#b0b0b0" metalness={0.9} roughness={0.1} />
                        </mesh>
                    ))}
                </group>
            </group>
        );
    }

    // ── Render 3D Supply Kit (Pencil Jar)
    if (isKit) {
        return (
            <group ref={meshRef} onPointerOver={() => setHovered(true)} onPointerOut={() => setHovered(false)}>
                {/* Elegant Glass/Metal Cup base */}
                <mesh position={[0, -0.4, 0]}>
                    <cylinderGeometry args={[0.5, 0.4, 0.8, 16]} />
                    <meshStandardMaterial color="#312e81" roughness={0.2} metalness={0.7} transparent opacity={0.85} />
                </mesh>
                <mesh position={[0, -0.75, 0]}>
                    <cylinderGeometry args={[0.42, 0.42, 0.1, 16]} />
                    <meshStandardMaterial color="#ffd700" metalness={0.9} roughness={0.1} />
                </mesh>

                {/* Standing Pencil 1 (HB - yellow) */}
                <group position={[-0.15, 0, -0.15]} rotation={[0.25, 0.1, 0.2]}>
                    <mesh position={[0, 0, 0]}>
                        <cylinderGeometry args={[0.08, 0.08, 1.4, 6]} />
                        <meshStandardMaterial color="#f59e0b" roughness={0.3} />
                    </mesh>
                    <mesh position={[0, 0.7, 0]} rotation={[0, 0, 0]}>
                        <coneGeometry args={[0.08, 0.25, 12]} />
                        <meshStandardMaterial color="#e5c19d" roughness={0.8} />
                    </mesh>
                    <mesh position={[0, 0.825, 0]} rotation={[0, 0, 0]}>
                        <coneGeometry args={[0.03, 0.08, 12]} />
                        <meshStandardMaterial color="#374151" roughness={0.9} />
                    </mesh>
                </group>

                {/* Standing Pencil 2 (Red - 2B) */}
                <group position={[0.2, 0.05, 0]} rotation={[-0.15, 0, -0.22]}>
                    <mesh position={[0, 0, 0]}>
                        <cylinderGeometry args={[0.08, 0.08, 1.5, 6]} />
                        <meshStandardMaterial color="#ef4444" roughness={0.3} />
                    </mesh>
                    <mesh position={[0, 0.75, 0]} rotation={[0, 0, 0]}>
                        <coneGeometry args={[0.08, 0.25, 12]} />
                        <meshStandardMaterial color="#e5c19d" roughness={0.8} />
                    </mesh>
                    <mesh position={[0, 0.875, 0]} rotation={[0, 0, 0]}>
                        <coneGeometry args={[0.03, 0.08, 12]} />
                        <meshStandardMaterial color="#1f2937" roughness={0.9} />
                    </mesh>
                </group>

                {/* Standing Charcoal Rod (Black) */}
                <group position={[-0.05, 0.1, 0.2]} rotation={[0.2, 0, -0.1]}>
                    <mesh position={[0, 0, 0]}>
                        <cylinderGeometry args={[0.07, 0.07, 1.6, 8]} />
                        <meshStandardMaterial color="#1a1a1a" roughness={0.95} />
                    </mesh>
                    <mesh position={[0, 0.8, 0]} rotation={[0, 0, 0]}>
                        <coneGeometry args={[0.07, 0.15, 8]} />
                        <meshStandardMaterial color="#111" roughness={1} />
                    </mesh>
                </group>

                {/* Standing Brush Pen (Blue) */}
                <group position={[0.05, 0.12, -0.2]} rotation={[-0.25, 0, 0.1]}>
                    <mesh position={[0, 0, 0]}>
                        <cylinderGeometry args={[0.09, 0.09, 1.7, 16]} />
                        <meshStandardMaterial color="#3b82f6" roughness={0.4} />
                    </mesh>
                    {/* Brush Clip cap */}
                    <mesh position={[0, -0.1, 0]}>
                        <cylinderGeometry args={[0.1, 0.1, 0.3, 16]} />
                        <meshStandardMaterial color="#1e3a8a" roughness={0.3} />
                    </mesh>
                    <mesh position={[0, 0.85, 0]} rotation={[0, 0, 0]}>
                        <coneGeometry args={[0.09, 0.3, 16]} />
                        <meshStandardMaterial color="#111111" roughness={0.7} />
                    </mesh>
                </group>
            </group>
        );
    }

    // ── Render Charcoal Stick/Pencil
    if (isCharcoal) {
        return (
            <group ref={meshRef} onPointerOver={() => setHovered(true)} onPointerOut={() => setHovered(false)}>
                {/* Hexagonal Matte Charcoal body */}
                <mesh position={[0, 0.1, 0]}>
                    <cylinderGeometry args={[0.18, 0.18, 3.1, 6]} />
                    <meshStandardMaterial color={bodyColor} roughness={0.95} metalness={0.0} />
                </mesh>

                {/* Shaved Charcoal Woodtip */}
                <mesh position={[0, -1.6, 0]} rotation={[Math.PI, 0, 0]}>
                    <coneGeometry args={[0.18, 0.55, 8]} />
                    <meshStandardMaterial color="#cf9e7a" roughness={0.9} />
                </mesh>

                {/* Charcoal Core lead */}
                <mesh position={[0, -1.9, 0]} rotation={[Math.PI, 0, 0]}>
                    <coneGeometry args={[0.08, 0.22, 8]} />
                    <meshStandardMaterial color={strokeColor} roughness={1.0} />
                </mesh>
            </group>
        );
    }

    // ── Render Sleek Ink Pen
    if (isInkPen) {
        return (
            <group ref={meshRef} onPointerOver={() => setHovered(true)} onPointerOut={() => setHovered(false)}>
                {/* Metallic Chrome Trim Cap end */}
                <mesh position={[0, 1.7, 0]}>
                    <cylinderGeometry args={[0.14, 0.15, 0.2, 16]} />
                    <meshStandardMaterial color="#e2e8f0" metalness={0.9} roughness={0.1} />
                </mesh>

                {/* Main Casing Body */}
                <mesh position={[0, 0.1, 0]}>
                    <cylinderGeometry args={[0.16, 0.15, 3.0, 16]} />
                    <meshStandardMaterial color={bodyColor} roughness={0.3} metalness={0.3} />
                </mesh>

                {/* Metallic Clip Details */}
                <mesh position={[0.16, 1.0, 0]}>
                    <boxGeometry args={[0.06, 0.8, 0.08]} />
                    <meshStandardMaterial color="#d1d5db" metalness={0.9} roughness={0.1} />
                </mesh>

                {/* Metallic Pen Nib Grip section */}
                <mesh position={[0, -1.5, 0]}>
                    <cylinderGeometry args={[0.15, 0.1, 0.4, 16]} />
                    <meshStandardMaterial color="#cbd5e1" metalness={0.8} roughness={0.2} />
                </mesh>

                {/* Fine Metal needle-point lead */}
                <mesh position={[0, -1.8, 0]} rotation={[Math.PI, 0, 0]}>
                    <coneGeometry args={[0.03, 0.3, 16]} />
                    <meshStandardMaterial color="#94a3b8" metalness={0.9} roughness={0.1} />
                </mesh>
                <mesh position={[0, -1.96, 0]} rotation={[Math.PI, 0, 0]}>
                    <coneGeometry args={[0.015, 0.08, 16]} />
                    <meshStandardMaterial color={strokeColor} roughness={0.9} />
                </mesh>
            </group>
        );
    }

    // ── Render Sleek Brush Pen
    if (isBrushPen) {
        return (
            <group ref={meshRef} onPointerOver={() => setHovered(true)} onPointerOut={() => setHovered(false)}>
                {/* Main Body */}
                <mesh position={[0, 0.2, 0]}>
                    <cylinderGeometry args={[0.18, 0.17, 2.9, 16]} />
                    <meshStandardMaterial color={bodyColor} roughness={0.4} metalness={0.1} />
                </mesh>

                {/* Metallic details ring */}
                <mesh position={[0, 1.4, 0]}>
                    <cylinderGeometry args={[0.182, 0.182, 0.06, 16]} />
                    <meshStandardMaterial color="#ffd700" metalness={0.9} roughness={0.1} />
                </mesh>

                {/* Grip section */}
                <mesh position={[0, -1.35, 0]}>
                    <cylinderGeometry args={[0.17, 0.15, 0.6, 16]} />
                    <meshStandardMaterial color="#2d2d2d" roughness={0.8} />
                </mesh>

                {/* Tapered plastic tip base */}
                <mesh position={[0, -1.75, 0]} rotation={[Math.PI, 0, 0]}>
                    <coneGeometry args={[0.15, 0.3, 16]} />
                    <meshStandardMaterial color={bodyColor} roughness={0.4} />
                </mesh>

                {/* Soft Hair Brush tip */}
                <mesh position={[0, -2.05, 0]} rotation={[Math.PI, 0, 0]}>
                    <coneGeometry args={[0.07, 0.35, 16]} />
                    <meshStandardMaterial color={strokeColor} roughness={0.8} />
                </mesh>
            </group>
        );
    }

    // ── Render standard Hexagonal Graphite Pencil
    return (
        <group ref={meshRef} onPointerOver={() => setHovered(true)} onPointerOut={() => setHovered(false)}>
            {/* Main Pencil Shaft - Hexagonal cylinder */}
            <mesh position={[0, 0, 0]}>
                <cylinderGeometry args={[0.2, 0.2, 3, 6]} />
                <meshStandardMaterial color={bodyColor} roughness={0.4} metalness={0.1} />
            </mesh>

            {/* Silver metal ferrule */}
            <mesh position={[0, 1.6, 0]}>
                <cylinderGeometry args={[0.2, 0.2, 0.2, 16]} />
                <meshStandardMaterial color="#c0c0c0" roughness={0.2} metalness={0.8} />
            </mesh>

            {/* Pink Eraser */}
            <mesh position={[0, 1.8, 0]}>
                <cylinderGeometry args={[0.2, 0.2, 0.2, 16]} />
                <meshStandardMaterial color="#f87171" roughness={0.6} />
            </mesh>

            {/* Wood Tip */}
            <mesh position={[0, -1.8, 0]} rotation={[Math.PI, 0, 0]}>
                <coneGeometry args={[0.2, 0.6, 16]} />
                <meshStandardMaterial color="#d9b48f" roughness={0.8} />
            </mesh>

            {/* Graphite/Ink Tip Lead */}
            <mesh position={[0, -2.12, 0]} rotation={[Math.PI, 0, 0]}>
                <coneGeometry args={[0.07, 0.2, 16]} />
                <meshStandardMaterial color={strokeColor} roughness={0.9} />
            </mesh>
        </group>
    );
}

export default function ThreePencil({ brand, category, strokeColor, heightClass = 'h-48' }: PencilModelProps) {
    return (
        <div className={`${heightClass} w-full relative flex items-center justify-center select-none overflow-hidden`}>
            {/* Soft backdrop indicator text */}
            <div className="absolute top-2 left-2 text-[8px] font-black tracking-wider text-gray-400/40 uppercase select-none pointer-events-none z-10">
                3D Model · Drag to Rotate
            </div>
            <div className="w-full h-full">
                <Canvas camera={{ position: [0, 0, 4.3], fov: 45 }}>
                    <ambientLight intensity={1.6} />
                    <directionalLight position={[5, 5, 5]} intensity={1.6} />
                    <directionalLight position={[-5, 5, -5]} intensity={0.6} />
                    <PencilModel brand={brand} category={category} strokeColor={strokeColor} />
                    <OrbitControls enableZoom={false} autoRotate={false} />
                </Canvas>
            </div>
        </div>
    );
}
