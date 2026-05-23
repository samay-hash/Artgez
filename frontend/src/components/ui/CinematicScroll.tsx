"use client";
import React, { useRef } from "react";
import { motion, useScroll, useTransform, useSpring, MotionValue } from "framer-motion";

const SECTIONS = [
    {
        title: "Intelligence",
        tagline: "The Brain of the Operation",
        description:
            "Our neural networks process billions of data points in milliseconds, providing you with actionable insights before the competition even blinks.",
        image:
            "https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=2000&q=80",
        color: "bg-blue-600",
    },
    {
        title: "Velocity",
        tagline: "Blazing Fast Performance",
        description:
            "Built on edge-computing architecture, ensuring your application stays responsive no matter where your users are located globally.",
        image:
            "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=2000&q=80",
        color: "bg-purple-600",
    },
    {
        title: "Security",
        tagline: "Fort-Knox Level Protection",
        description:
            "Zero-trust security models integrated at every layer of the stack. Your data isn't just encrypted; it's invisible to the outside world.",
        image:
            "https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=2000&q=80",
        color: "bg-emerald-600",
    },
    {
        title: "Scale",
        tagline: "Infinity is the Limit",
        description:
            "Elastic infrastructure that grows with you. From your first 100 users to your first 100 million, we handle the heavy lifting seamlessly.",
        image:
            "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=2000&q=80",
        color: "bg-rose-600",
    },
];


export default function LayeredPanelReveal() {
    const containerRef = useRef<HTMLDivElement>(null);

    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start start", "end end"],
    });

    return (
        <main ref={containerRef} className="relative bg-black">
            {SECTIONS.map((section, i) => {
                // We want the previous section to scale down while the current one slides in
                return (
                    <Section
                        key={i}
                        section={section}
                        index={i}
                        total={SECTIONS.length}
                        scrollYProgress={scrollYProgress}
                    />
                );
            })}

            {/* FINAL CTA SECTION */}
            <section className="h-screen bg-white flex flex-col items-center justify-center text-center px-6">
                <h2 className="text-black text-6xl md:text-8xl font-black tracking-tighter mb-8">
                    READY TO <br /> BUILD?
                </h2>
                <button className="px-12 py-6 bg-black text-white rounded-full font-bold text-lg hover:scale-105 transition-transform">
                    Start Your Journey
                </button>
            </section>
        </main>
    );
}

function Section({ section, index, total, scrollYProgress }: {
    section: any, index: number, total: number, scrollYProgress: MotionValue<number>
}) {
    const isLast = index === total - 1;

    // Calculate the range for this specific section
    const start = index / total;
    const end = (index + 1) / total;

    // ANIMATIONS
    // The section scales down slightly as the NEXT one comes in
    const scale = useTransform(scrollYProgress, [start, end], [1, 0.85]);
    const opacity = useTransform(scrollYProgress, [start, end], [1, 0.6]);

    // The content inside slides up
    const textY = useTransform(scrollYProgress, [start, start + 0.1], [100, 0]);
    const textOpacity = useTransform(scrollYProgress, [start, start + 0.1], [0, 1]);

    return (
        <div className="sticky top-0 h-screen w-full overflow-hidden">
            <motion.div
                style={{
                    scale: isLast ? 1 : scale,
                    opacity: isLast ? 1 : opacity,
                    backgroundColor: "#0a0a0a"
                }}
                className="relative w-full h-full flex flex-col md:flex-row items-center"
            >
                {/* LEFT SIDE: CONTENT */}
                <div className="w-full md:w-1/2 h-1/2 md:h-full flex flex-col justify-center px-10 md:px-20 space-y-6">
                    <motion.div style={{ y: textY, opacity: textOpacity }} className="space-y-4">
                        <span className="text-white/40 font-mono text-sm">0{index + 1} // {section.tagline}</span>
                        <h2 className="text-white text-5xl md:text-7xl font-bold tracking-tight">
                            {section.title}
                        </h2>
                        <p className="text-white/60 text-lg md:text-xl font-light leading-relaxed max-w-md">
                            {section.description}
                        </p>
                        <div className="pt-6">
                            <div className={`h-1 w-20 ${section.color} rounded-full`} />
                        </div>
                    </motion.div>
                </div>

                {/* RIGHT SIDE: IMAGE */}
                <div className="w-full md:w-1/2 h-1/2 md:h-full p-6 md:p-12">
                    <motion.div
                        style={{ scale: useTransform(scrollYProgress, [start, end], [1.1, 1]) }}
                        className="w-full h-full rounded-3xl overflow-hidden shadow-2xl relative"
                    >
                        <img
                            src={section.image}
                            className="w-full h-full object-contain"
                            alt={section.title}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent md:hidden" />
                    </motion.div>
                </div>

            </motion.div>
        </div>
    );
}