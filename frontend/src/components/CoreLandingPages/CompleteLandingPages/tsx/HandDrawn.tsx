import React, { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { cn } from "@/src/lib/utils"

// --- 1. THE ENGINE (Squiggle Filters) ---
// This makes things look hand-drawn without needing images.
export function HandDrawnFilters() {
    return (
        <svg className="fixed h-0 w-0 pointer-events-none">
            <defs>
                {/* TURBULENCE: Creates the wobbly edge effect */}
                <filter id="rough-paper">
                    <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="5" result="noise" />
                    <feDisplacementMap in="SourceGraphic" in2="noise" scale="2" />
                </filter>

                {/* PENCIL TEXTURE: Adds grain to solid fills */}
                <filter id="pencil-texture">
                    <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="3" />
                    <feColorMatrix type="saturate" values="0" />
                    <feComposite operator="in" in2="SourceGraphic" />
                </filter>
            </defs>
        </svg>
    );
}

// --- 2. COMPONENTS ---

// A. Highlighter Effect (Highlights text on scroll)
export function Highlight({ children, color = "#ffeb3b" }: { children: React.ReactNode, color?: string }) {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: "-10%" });

    return (
        <span ref={ref} className="relative inline-block px-1">
            <motion.span
                initial={{ scaleX: 0 }}
                animate={isInView ? { scaleX: 1 } : {}}
                transition={{ duration: 0.8, delay: 0.2, ease: "circOut" }}
                style={{ backgroundColor: color }}
                className="absolute bottom-1 left-0 -z-10 h-[80%] w-full origin-left -rotate-1 rounded-sm opacity-60"
            />
            {children}
        </span>
    );
}

// B. Hand-Drawn Button (Scribbles on hover)
export function SketchButton({ children, className }: { children: React.ReactNode, className?: string }) {
    return (
        <motion.button
            whileHover="hover"
            whileTap="tap"
            className={cn("group relative px-8 py-4 font-bold text-black", className)}
        >
            {/* The Border (SVG Path that draws itself) */}
            <div className="absolute inset-0 h-full w-full">
                <svg className="h-full w-full overflow-visible">
                    <motion.rect
                        x="2" y="2" width="98%" height="96%" rx="4"
                        fill="transparent"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        style={{ filter: "url(#rough-paper)" }}
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 1, ease: "easeInOut" }}
                    />
                </svg>
            </div>

            {/* The Scribble Fill (Appears on Hover) */}
            <motion.div
                className="absolute inset-2 -z-10 bg-black opacity-0"
                variants={{
                    hover: {
                        opacity: 0.1,
                        scale: 1.05,
                        transition: { duration: 0.2 }
                    }
                }}
                style={{
                    maskImage: "url('data:image/svg+xml;utf8,<svg viewBox=%220 0 200 100%22 xmlns=%22http://www.w3.org/2000/svg%22><path d=%22M0,50 Q50,0 100,50 T200,50%22 stroke=%22black%22 stroke-width=%2210%22 fill=%22none%22/></svg>')",
                    filter: "url(#rough-paper)"
                }}
            />

            <span className="relative flex items-center gap-2">{children}</span>
        </motion.button>
    );
}

// C. The Sketch Card
export function SketchCard({ title, icon: Icon, delay }: { title: string, icon: React.ReactNode, delay: number }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay, duration: 0.5 }}
            viewport={{ once: true }}
            whileHover={{ y: -5, rotate: Math.random() * 2 - 1 }}
            className="relative flex flex-col gap-4 p-8"
        >
            {/* Hand Drawn Border via CSS + Filter */}
            <div
                className="absolute inset-0 rounded-xl border-2 border-black bg-white shadow-sm"
                style={{ filter: "url(#rough-paper)" }}
            />

            <div className="relative z-10 flex h-12 w-12 items-center justify-center rounded-full border border-black bg-[#f0f0f0]">
                {Icon}
            </div>
            <h3 className="relative z-10 text-xl font-bold">{title}</h3>
            <p className="relative z-10 text-gray-600 leading-relaxed">
                Authentic, rough edges that communicate a human touch in a digital world.
            </p>
        </motion.div>
    )
}

// D. Drawn Arrow (Decoration)
export function DrawnArrow() {
    return (
        <svg width="100" height="100" viewBox="0 0 100 100" className="absolute -right-24 top-0 hidden md:block rotate-12">
            <motion.path
                d="M10,50 Q50,10 90,50 M60,50 L90,50 L80,20"
                fill="none"
                stroke="black"
                strokeWidth="2"
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1.5, delay: 1 }}
                style={{ filter: "url(#rough-paper)" }}
            />
            <motion.text
                x="20" y="80"
                fontFamily="monospace"
                fontSize="12"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 2 }}
            >
                Look here!
            </motion.text>
        </svg>
    );
}
