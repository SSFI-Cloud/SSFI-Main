"use client";

import React, { useRef, useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface MagneticCardProps {
    children: React.ReactNode;
    className?: string;
    glowColor?: string;
}

export function MagneticCard({
    children,
    className,
    glowColor = "#6366f1",
}: MagneticCardProps) {
    const cardRef = useRef<HTMLDivElement>(null);
    const [rotateX, setRotateX] = useState(0);
    const [rotateY, setRotateY] = useState(0);
    const [translateX, setTranslateX] = useState(0);
    const [translateY, setTranslateY] = useState(0);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!cardRef.current) return;

        const rect = cardRef.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        const x = e.clientX - centerX;
        const y = e.clientY - centerY;

        // Tilt effect (subtle rotation)
        setRotateX(-y * 0.03);
        setRotateY(x * 0.03);

        // Magnetic pull (subtle movement toward cursor)
        setTranslateX(x * 0.05);
        setTranslateY(y * 0.05);
    };

    const handleMouseLeave = () => {
        setRotateX(0);
        setRotateY(0);
        setTranslateX(0);
        setTranslateY(0);
    };

    return (
        <motion.div
            ref={cardRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            animate={{
                rotateX,
                rotateY,
                x: translateX,
                y: translateY,
            }}
            transition={{
                type: "spring",
                stiffness: 150,
                damping: 20,
            }}
            style={{
                transformStyle: "preserve-3d",
                perspective: "1000px",
            }}
            className={cn(
                "relative rounded-2xl overflow-hidden cursor-pointer",
                "bg-white/[0.04] backdrop-blur-xl",
                "border border-white/[0.06]",
                "shadow-[0_40px_80px_rgba(0,0,0,0.5)]",
                className
            )}
        >
            {/* Color Splash Glow */}
            <motion.div
                className="absolute -top-16 -right-16 w-48 h-48 pointer-events-none"
                style={{
                    background: `radial-gradient(circle at 30% 30%, ${glowColor}, ${glowColor}80 60%, transparent 70%)`,
                    opacity: 0.35,
                    filter: "blur(60px)",
                    mixBlendMode: "screen",
                }}
                animate={{
                    x: [0, 20, 0],
                    y: [0, 20, 0],
                    scale: [1, 1.1, 1],
                }}
                transition={{
                    duration: 12,
                    repeat: Infinity,
                    ease: "easeInOut",
                }}
            />

            {/* Noise Texture Overlay */}
            <div
                className="absolute inset-0 pointer-events-none mix-blend-overlay"
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.8' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.08'/%3E%3C/svg%3E")`,
                }}
            />

            {/* Content */}
            <div className="relative z-10">{children}</div>
        </motion.div>
    );
}
