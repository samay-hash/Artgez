"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const SECTION_LABEL = "TESTIMONIALS";
const HEADING_LINE1 = "TRUSTED BY ARTISTS";
const HEADING_LINE2 = "LOVED BY INSTITUTIONS";
const SUBHEADING = "From classrooms to global art brands — artists trust Artgez.";
const AUTO_ADVANCE_MS = 3000;

const TESTIMONIALS = [
    {
        id: 1,
        company: "NID Ahmedabad",
        quote: "Artgez completely transformed how I prepare for studio sessions. I can feel the exact weight and pressure of a 6B before ever touching paper. My students now prototype their pencil choices digitally — it has cut our material waste by nearly half.",
        author: "Priya Nair",
        role: "Senior Faculty, NID Ahmedabad",
        avatar: "https://api.dicebear.com/9.x/notionists/svg?seed=PriyaNairNID",
        clipWidth: 52,
    },
    {
        id: 2,
        company: "Camlin India",
        quote: "We partnered with Artgez to let artists digitally simulate our full pencil range before purchasing. The results were remarkable — product returns dropped and customer satisfaction scores hit an all-time high within the first quarter.",
        author: "Rajiv Sharma",
        role: "Head of Product, Camlin India",
        avatar: "https://api.dicebear.com/9.x/notionists/svg?seed=RajivSharmaCamlin",
        clipWidth: 60,
    },
    {
        id: 3,
        company: "Sir J.J. School",
        quote: "I spent years buying pencils that didn't suit my style — wasted thousands. Artgez's Pencil DNA is the tool I always wished existed. Now I know exactly what I'm buying before I spend a single rupee.",
        author: "Ananya Mehta",
        role: "Fine Arts Graduate, Sir J.J. School",
        avatar: "https://api.dicebear.com/9.x/notionists/svg?seed=AnanyaMehtaJJ",
        clipWidth: 44,
    },
    {
        id: 4,
        company: "Faber-Castell",
        quote: "Artgez built something we couldn't — a bridge between physical and digital art supplies. Artists who simulate our Polychromos range on Artgez convert to buyers at nearly 3x the rate of any other channel.",
        author: "Markus Voss",
        role: "Brand Director, Faber-Castell APAC",
        avatar: "https://api.dicebear.com/9.x/notionists/svg?seed=MarkusVossFaber",
        clipWidth: 56,
    },
    {
        id: 5,
        company: "NIFT Delhi",
        quote: "Every fashion illustration student at our institute now uses the Artgez Sketch Lab for paper selection before printing. It has streamlined our coursework and saved an enormous amount of resource budget every semester.",
        author: "Dr. Sunita Kapoor",
        role: "Program Director, NIFT Delhi",
        avatar: "https://api.dicebear.com/9.x/notionists/svg?seed=SunitaKapoorNIFT",
        clipWidth: 48,
    },
    {
        id: 6,
        company: "Staedtler",
        quote: "We recommended Artgez to our Indian retail partners as a digital try-before-you-buy platform. Engagement with our Mars Lumograph line tripled. This is the future of art supply retail — and Artgez is leading it.",
        author: "Laura Fischer",
        role: "Regional Sales Lead, Staedtler",
        avatar: "https://api.dicebear.com/9.x/notionists/svg?seed=LauraFischerStaedtler",
        clipWidth: 50,
    },
];

interface FounderBadgeProps {
    backgroundColor?: string;
    accentColor?: string;
}

const FounderBadge: React.FC<FounderBadgeProps> = ({
    backgroundColor = "#f2f2ee",
    accentColor = "#9aaa1f",
}) => {
    const [current, setCurrent] = useState(0);
    const total = TESTIMONIALS.length;

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrent((c) => (c + 1) % total);
        }, AUTO_ADVANCE_MS);
        return () => clearInterval(timer);
    }, [total]);

    const t = TESTIMONIALS[current];

    return (
        <div
            className="w-full py-28 flex flex-col items-center justify-center gap-12 px-6"
            style={{ backgroundColor }}
        >
            {/* ── Header ─────────────────────────────── */}
            <div className="text-center select-none">
                <p
                    className="text-[10px] font-mono tracking-[0.38em] uppercase mb-5"
                    style={{ color: accentColor }}
                >
                    {SECTION_LABEL}
                </p>
                <h2 className="text-4xl md:text-[3.2rem] font-black text-black leading-[1.05] tracking-tight uppercase">
                    {HEADING_LINE1}
                    <br />
                    {HEADING_LINE2}
                </h2>
                <p className="text-gray-400 text-sm mt-4 font-light">{SUBHEADING}</p>
            </div>

            {/* ── Card stack ─────────────────────────── */}
            <div className="relative" style={{ width: 464, height: 300 }}>

                {/* Ghost cards behind (depth effect) */}
                {[2, 1].map((offset) => (
                    <div
                        key={offset}
                        className="absolute inset-0 bg-white rounded-[28px]"
                        style={{
                            transform: `translateY(${-offset * 8}px) scale(${1 - offset * 0.032})`,
                            opacity: 1 - offset * 0.28,
                            boxShadow: "0 4px 20px rgba(0,0,0,0.055)",
                            zIndex: offset === 2 ? 1 : 2,
                        }}
                    />
                ))}

                {/* Badge clip — animates its width per testimonial */}
                <div
                    className="absolute z-20"
                    style={{ top: -22, left: "50%", transform: "translateX(-50%)" }}
                >
                    <motion.div
                        animate={{ width: t.clipWidth }}
                        transition={{ type: "spring", stiffness: 220, damping: 22 }}
                        className="rounded-[5px]"
                        style={{
                            height: 22,
                            backgroundColor: "#c8c8c4",
                            boxShadow:
                                "inset 0 2px 4px rgba(0,0,0,0.14), inset 0 -1px 2px rgba(255,255,255,0.6), 0 2px 5px rgba(0,0,0,0.12)",
                        }}
                    />
                </div>

                {/* Active card */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={current}
                        initial={{ y: 44, opacity: 0, scale: 0.96 }}
                        animate={{ y: 0, opacity: 1, scale: 1 }}
                        exit={{ y: -18, opacity: 0, scale: 0.98 }}
                        transition={{ type: "spring", stiffness: 340, damping: 28, mass: 0.75 }}
                        className="absolute inset-0 bg-white rounded-[28px] p-7 flex flex-col justify-between"
                        style={{
                            zIndex: 10,
                            boxShadow:
                                "0 8px 48px rgba(0,0,0,0.09), 0 2px 10px rgba(0,0,0,0.05)",
                        }}
                    >
                        {/* Top row: logo + dots */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                                <div
                                    className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-[11px] font-bold shrink-0"
                                    style={{ backgroundColor: "#111" }}
                                >
                                    {t.company[0].toUpperCase()}
                                </div>
                                <span className="text-sm font-semibold text-gray-800 tracking-tight">
                                    {t.company}
                                </span>
                            </div>

                            {/* Progress dots */}
                            <div className="flex gap-1.5 items-center">
                                {TESTIMONIALS.map((_, i) => (
                                    <motion.div
                                        key={i}
                                        animate={{
                                            backgroundColor: i === current ? "#111111" : "#d1d5db",
                                            scale: i === current ? 1.35 : 1,
                                        }}
                                        transition={{ duration: 0.25 }}
                                        className="w-1.5 h-1.5 rounded-full"
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Opening quote mark */}
                        <p
                            className="text-5xl leading-none text-gray-200 font-serif mt-1 select-none"
                            aria-hidden
                        >
                            &#8220;
                        </p>

                        {/* Quote text */}
                        <p className="text-gray-500 text-[13px] leading-relaxed flex-1 mt-1 line-clamp-4">
                            {t.quote}
                        </p>

                        {/* Bottom row: author + LinkedIn */}
                        <div className="flex items-center justify-between mt-4">
                            <div className="flex items-center gap-3">
                                <img
                                    src={t.avatar}
                                    alt={t.author}
                                    className="w-10 h-10 rounded-full bg-gray-100 shrink-0"
                                />
                                <div>
                                    <p className="text-[13px] font-bold text-gray-900 leading-none mb-1">
                                        {t.author}
                                    </p>
                                    <p className="text-[11px] text-gray-400 font-light">{t.role}</p>
                                </div>
                            </div>

                            {/* LinkedIn badge */}
                            <div className="w-8 h-8 rounded-lg bg-[#0A66C2] flex items-center justify-center shrink-0">
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="15"
                                    height="15"
                                    viewBox="0 0 24 24"
                                    fill="currentColor"
                                    stroke="none"
                                    className="text-white"
                                >
                                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                                </svg>
                            </div>
                        </div>
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
};

export default FounderBadge;
