'use client';

import React, { useEffect, useRef, useState } from 'react';
import rough from 'roughjs';
import { motion } from 'framer-motion';

type Props = {
    children: React.ReactNode;
    onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
    className?: string;
    roughness?: number;
    stroke?: string;
    strokeWidth?: number;
    bg?: string;
    disabled?: boolean;
    type?: 'button' | 'submit' | 'reset';
};

export default function RoughButton({
    children,
    onClick,
    className = '',
    roughness = 1.0,
    stroke = '#2d2d2d',
    strokeWidth = 2,
    bg = '#ffeb3b',
    disabled = false,
    type = 'button',
}: Props) {
    const svgRef = useRef<SVGSVGElement>(null);
    const containerRef = useRef<HTMLButtonElement>(null);
    const [size, setSize] = useState({ width: 0, height: 0 });

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const handleResize = () => {
            setSize({
                width: container.clientWidth,
                height: container.clientHeight
            });
        };

        const ro = new ResizeObserver(handleResize);
        ro.observe(container);
        handleResize();

        return () => ro.disconnect();
    }, []);

    useEffect(() => {
        const svg = svgRef.current;
        if (!svg || size.width === 0 || size.height === 0) return;

        while (svg.firstChild) {
            svg.removeChild(svg.firstChild);
        }

        svg.setAttribute('width', `${size.width}`);
        svg.setAttribute('height', `${size.height}`);
        svg.setAttribute('viewBox', `0 0 ${size.width} ${size.height}`);

        const rc = rough.svg(svg);
        const rect = rc.rectangle(2, 2, size.width - 4, size.height - 4, {
            roughness,
            stroke,
            strokeWidth,
            fill: bg,
            fillStyle: 'solid',
        });

        svg.appendChild(rect);
    }, [size, roughness, stroke, strokeWidth, bg]);

    return (
        <motion.button
            ref={containerRef}
            onClick={disabled ? undefined : onClick}
            whileTap={disabled ? undefined : { scale: 0.97 }}
            className={`relative font-bold text-black border-none bg-transparent outline-none focus:outline-none transition-transform ${
                disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:-translate-y-[1px]'
            } ${className}`}
            style={{ border: 'none', background: 'transparent' }}
            disabled={disabled}
            type={type}
        >
            <svg
                ref={svgRef}
                className="absolute inset-0 -z-10 pointer-events-none overflow-visible"
            />
            <span className="relative z-10 w-full h-full flex items-center justify-center">
                {children}
            </span>
        </motion.button>
    );
}
