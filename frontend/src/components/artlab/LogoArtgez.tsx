'use client';

import React from 'react';

export default function LogoArtgez({ className = '' }: { className?: string }) {
    return (
        <span className={`group inline-flex items-baseline tracking-tight select-none cursor-pointer ${className}`}>
            {/* Elegant calligraphic cursive 'A' */}
            <span className="font-cursive-logo text-4xl font-normal text-[#2d2d2d] dark:text-zinc-100 group-hover:text-emerald-500 transition-colors duration-300 inline-block translate-y-[2px] transform group-hover:scale-105 select-none">
                A
            </span>
            {/* Charcoal/Zinc 'rt' */}
            <span className="text-2xl font-black text-[#2d2d2d] dark:text-zinc-100 group-hover:text-emerald-500 transition-colors duration-300 select-none">
                rt
            </span>
            {/* Sky-Blue 'gez' -> reverses/goes dark or white on hover */}
            <span className="text-2xl font-black text-sky-500 group-hover:text-[#2d2d2d] dark:group-hover:text-zinc-100 transition-colors duration-300 select-none">
                gez
            </span>
        </span>
    );
}
