"use client";

import React, { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

interface ScrollGradientSectionProps {
    children: React.ReactNode;
}

export function ScrollGradientSection({ children }: ScrollGradientSectionProps) {
    const containerRef = useRef<HTMLDivElement>(null);

    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start start", "end start"],
    });

    // Parallax for content - moves slower than scroll
    const y = useTransform(scrollYProgress, [0, 1], [0, 150]);
    // Opacity fade as it scrolls out to blend better
    const opacity = useTransform(scrollYProgress, [0.8, 1], [1, 0]);

    return (
        <div ref={containerRef} className="relative z-0">
            <motion.div style={{ y, opacity }}>
                {children}
            </motion.div>
        </div>
    );
}

interface SmoothTransitionProps {
    fromDark?: boolean;
    height?: string;
    className?: string;
}

// Ultra-smooth gradient transition
export function SmoothTransition({
    fromDark = true,
    height = "300px", // Increased height for smoother flow
    className = "",
}: SmoothTransitionProps) {
    const darkColor = "#0f172a"; // dark-900

    // Create an extended gradient array for super smooth blending
    // Using bezier-like steps for natural falloff
    const gradientStops = fromDark
        ? [
            `${darkColor} 0%`,
            `${darkColor} 15%`,
            `${darkColor}E6 30%`, // 90%
            `${darkColor}B3 45%`, // 70%
            `${darkColor}80 60%`, // 50%
            `${darkColor}33 75%`, // 20%
            `transparent 100%`
        ]
        : [
            `transparent 0%`,
            `${darkColor}33 25%`, // 20%
            `${darkColor}80 40%`, // 50%
            `${darkColor}B3 55%`, // 70%
            `${darkColor}E6 70%`, // 90%
            `${darkColor} 85%`,
            `${darkColor} 100%`
        ];

    const background = `linear-gradient(to bottom, ${gradientStops.join(", ")})`;

    return (
        <div
            style={{
                height,
                marginTop: fromDark ? `-${parseInt(height) / 2}px` : "0",
                marginBottom: fromDark ? "0" : `-${parseInt(height) / 2}px`,
                position: 'relative',
                background: 'transparent'
            }}
            className={`z-10 pointer-events-none ${className} w-full`}
        >
            {/* Inner gradient for smoother steps */}
            <div
                className="absolute inset-0 w-full h-full"
                style={{ background }}
            />
        </div>
    );
}
