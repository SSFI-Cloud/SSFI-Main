"use client";

import { motion } from "framer-motion";

interface PageTransitionProps {
    children: React.ReactNode;
}

export default function PageTransition({ children }: PageTransitionProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
        >
            {children}
        </motion.div>
    );
}

// Fade only variant
export function FadeTransition({ children }: PageTransitionProps) {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
        >
            {children}
        </motion.div>
    );
}

// Slide from right variant
export function SlideTransition({ children }: PageTransitionProps) {
    return (
        <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
        >
            {children}
        </motion.div>
    );
}

// Scale up variant
export function ScaleTransition({ children }: PageTransitionProps) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15 }}
        >
            {children}
        </motion.div>
    );
}
