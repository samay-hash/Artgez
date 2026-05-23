'use client';

import React, { useEffect, useRef, useState } from 'react';
import rough from 'roughjs';

type Props = {
    children: React.ReactNode;
    className?: string;
    roughness?: number;
    bowing?: number;
    stroke?: string;
    strokeWidth?: number;
    fill?: string;
    fillStyle?: 'solid' | 'hachure' | 'zigzag' | 'cross-hatch' | 'dots' | 'sunburst' | 'dashed';
};

export default function RoughCard({
    children,
    className = '',
    roughness = 1.2,
    bowing = 1.0,
    stroke = '#2d2d2d',
    strokeWidth = 2,
    fill,
    fillStyle = 'hachure',
}: Props) {
    const svgRef = useRef<SVGSVGElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
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

        // Clear existing SVG children
        while (svg.firstChild) {
            svg.removeChild(svg.firstChild);
        }

        svg.setAttribute('width', `${size.width}`);
        svg.setAttribute('height', `${size.height}`);
        svg.setAttribute('viewBox', `0 0 ${size.width} ${size.height}`);

        const rc = rough.svg(svg);
        const rect = rc.rectangle(2, 2, size.width - 4, size.height - 4, {
            roughness,
            bowing,
            stroke,
            strokeWidth,
            fill,
            fillStyle,
            fillWeight: 1.5,
            hachureGap: fillStyle === 'dots' ? 6 : 10,
        });

        svg.appendChild(rect);
    }, [size, roughness, bowing, stroke, strokeWidth, fill, fillStyle]);

    return (
        <div ref={containerRef} className={`relative ${className}`}>
            <svg
                ref={svgRef}
                className="absolute inset-0 -z-10 pointer-events-none overflow-visible"
            />
            <div className="relative z-10 w-full h-full">
                {children}
            </div>
        </div>
    );
}
