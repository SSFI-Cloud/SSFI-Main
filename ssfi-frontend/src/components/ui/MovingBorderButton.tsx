"use client";

import React, { useRef } from "react";
import {
    motion,
    useAnimationFrame,
    useMotionTemplate,
    useMotionValue,
    useTransform,
} from "framer-motion";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface MovingBorderButtonProps {
    children: React.ReactNode;
    href?: string;
    onClick?: () => void;
    className?: string;
    containerClassName?: string;
    borderRadius?: string;
    duration?: number;
    disabled?: boolean;
    type?: "button" | "submit" | "reset";
}

const MovingBorder = ({
    children,
    duration = 2000,
    rx = "30%",
    ry = "30%",
}: {
    children: React.ReactNode;
    duration?: number;
    rx?: string;
    ry?: string;
}) => {
    const pathRef = useRef<SVGRectElement>(null);
    const progress = useMotionValue<number>(0);

    useAnimationFrame((time) => {
        const length = pathRef.current?.getTotalLength();
        if (length) {
            const pxPerMillisecond = length / duration;
            progress.set((time * pxPerMillisecond) % length);
        }
    });

    const x = useTransform(progress, (val) =>
        pathRef.current?.getPointAtLength(val).x
    );
    const y = useTransform(progress, (val) =>
        pathRef.current?.getPointAtLength(val).y
    );

    const transform = useMotionTemplate`translateX(${x}px) translateY(${y}px) translateX(-50%) translateY(-50%)`;

    return (
        <>
            <svg
                xmlns="http://www.w3.org/2000/svg"
                preserveAspectRatio="none"
                className="absolute h-full w-full"
                width="100%"
                height="100%"
            >
                <rect
                    fill="none"
                    width="100%"
                    height="100%"
                    rx={rx}
                    ry={ry}
                    ref={pathRef}
                />
            </svg>
            <motion.div
                style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    display: "inline-block",
                    transform,
                }}
            >
                {children}
            </motion.div>
        </>
    );
};

export function MovingBorderButton({
    children,
    href,
    onClick,
    className,
    containerClassName,
    borderRadius = "1.5rem",
    duration = 2000,
    disabled = false,
    type = "button",
}: MovingBorderButtonProps) {
    const content = (
        <>
            {/* Moving border glow */}
            <div
                className="absolute inset-0"
                style={{ borderRadius: `calc(${borderRadius} * 0.96)` }}
            >
                <MovingBorder duration={duration} rx="30%" ry="30%">
                    <div className="h-20 w-20 opacity-[0.8] bg-[radial-gradient(#F59E0B_40%,transparent_60%)]" />
                </MovingBorder>
            </div>

            {/* Button content */}
            <div
                className={cn(
                    "relative flex items-center justify-center gap-2 w-full h-full",
                    "bg-amber-500 text-black font-semibold",
                    "transition-all duration-300",
                    "hover:bg-amber-400 hover:shadow-lg hover:shadow-amber-500/50",
                    disabled && "opacity-50 cursor-not-allowed",
                    className
                )}
                style={{
                    borderRadius: `calc(${borderRadius} * 0.96)`,
                }}
            >
                {children}
            </div>
        </>
    );

    const baseClasses = cn(
        "relative overflow-hidden p-[2px]",
        "inline-flex items-center justify-center",
        containerClassName
    );

    if (href && !disabled) {
        return (
            <Link
                href={href}
                className={baseClasses}
                style={{ borderRadius }}
            >
                {content}
            </Link>
        );
    }

    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled}
            className={baseClasses}
            style={{ borderRadius }}
        >
            {content}
        </button>
    );
}
