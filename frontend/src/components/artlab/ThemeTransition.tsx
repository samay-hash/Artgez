'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Play synthesized modern theme chimes offline using pure Web Audio API
export function playThemeSound(isDark: boolean) {
    if (typeof window === 'undefined') return;
    try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioCtx) return;
        const ctx = new AudioCtx();
        
        if (isDark) {
            // Dark theme chime: complex downward futuristic synthesizer chime
            const now = ctx.currentTime;
            
            // Sub-bass chime
            const osc1 = ctx.createOscillator();
            const gain1 = ctx.createGain();
            osc1.type = 'sine';
            osc1.frequency.setValueAtTime(320, now);
            osc1.frequency.exponentialRampToValueAtTime(120, now + 0.5);
            gain1.gain.setValueAtTime(0.08, now);
            gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
            osc1.connect(gain1);
            gain1.connect(ctx.destination);
            
            // High metal chime
            const osc2 = ctx.createOscillator();
            const gain2 = ctx.createGain();
            osc2.type = 'triangle';
            osc2.frequency.setValueAtTime(800, now);
            osc2.frequency.exponentialRampToValueAtTime(300, now + 0.4);
            gain2.gain.setValueAtTime(0.05, now);
            gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
            osc2.connect(gain2);
            gain2.connect(ctx.destination);
            
            osc1.start(now);
            osc2.start(now);
            
            osc1.stop(now + 0.5);
            osc2.stop(now + 0.5);
        } else {
            // Light theme chime: bright upwards bubble synthesizer chime
            const now = ctx.currentTime;
            
            // Low bubble chime
            const osc1 = ctx.createOscillator();
            const gain1 = ctx.createGain();
            osc1.type = 'sine';
            osc1.frequency.setValueAtTime(150, now);
            osc1.frequency.exponentialRampToValueAtTime(450, now + 0.45);
            gain1.gain.setValueAtTime(0.1, now);
            gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
            osc1.connect(gain1);
            gain1.connect(ctx.destination);
            
            // High chime
            const osc2 = ctx.createOscillator();
            const gain2 = ctx.createGain();
            osc2.type = 'sine';
            osc2.frequency.setValueAtTime(300, now);
            osc2.frequency.exponentialRampToValueAtTime(900, now + 0.35);
            gain2.gain.setValueAtTime(0.06, now);
            gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
            osc2.connect(gain2);
            gain2.connect(ctx.destination);
            
            osc1.start(now);
            osc2.start(now);
            
            osc1.stop(now + 0.45);
            osc2.stop(now + 0.35);
        }
    } catch (err) {
        console.warn('Audio synthesis not allowed or supported:', err);
    }
}

type ThemeCurtainProps = {
    isActive: boolean;
    isDarkTarget: boolean;
};

export default function ThemeCurtain({ isActive, isDarkTarget }: ThemeCurtainProps) {
    return (
        <AnimatePresence>
            {isActive && (
                <motion.div
                    initial={{ y: '-100%' }}
                    animate={{ y: '0%' }}
                    exit={{ y: '100%' }}
                    transition={{ duration: 0.5, ease: [0.76, 0, 0.24, 1] }}
                    className="fixed inset-0 z-[10000] pointer-events-none flex flex-col items-center justify-center select-none"
                    style={{
                        backgroundColor: isDarkTarget ? '#121214' : '#fdfbf7',
                        backgroundImage: isDarkTarget
                            ? 'radial-gradient(circle_at_center, rgba(255,255,255,0.03) 1px, transparent 1px)'
                            : 'radial-gradient(circle_at_center, rgba(0,0,0,0.03) 1px, transparent 1px)',
                        backgroundSize: '28px 28px'
                    }}
                >
                    {/* Sketch loader or pulsing loader symbol inside the curtain */}
                    <div className="flex flex-col items-center gap-3">
                        <span className="text-5xl animate-bounce select-none">✏️</span>
                        <span className={`text-[10px] font-black uppercase tracking-widest ${isDarkTarget ? 'text-zinc-500' : 'text-gray-400'}`}>
                            {isDarkTarget ? 'Tuning into shadow...' : 'Opening the canvas light...'}
                        </span>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
