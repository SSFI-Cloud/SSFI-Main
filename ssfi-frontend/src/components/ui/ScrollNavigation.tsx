'use client';

import { useState, useEffect } from 'react';
import { ArrowUp, ArrowDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ScrollNavigation() {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const toggleVisibility = () => {
            // Show if we have enough content to scroll
            if (document.documentElement.scrollHeight > window.innerHeight) {
                setIsVisible(true);
            }
        };

        window.addEventListener('scroll', toggleVisibility);
        window.addEventListener('resize', toggleVisibility);

        // Initial check
        toggleVisibility();

        return () => {
            window.removeEventListener('scroll', toggleVisibility);
            window.removeEventListener('resize', toggleVisibility);
        };
    }, []);

    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth',
        });
    };

    const scrollToBottom = () => {
        window.scrollTo({
            top: document.documentElement.scrollHeight,
            behavior: 'smooth',
        });
    };

    if (!isVisible) return null;

    return (
        <div className="fixed bottom-8 right-8 z-40 flex flex-col gap-3">
            <motion.button
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={scrollToTop}
                className="p-3 bg-slate-800/80 backdrop-blur-md border border-white/10 rounded-full text-white shadow-lg hover:bg-primary-500 transition-colors group"
                aria-label="Scroll to top"
            >
                <ArrowUp className="w-5 h-5 group-hover:-translate-y-1 transition-transform duration-300" />
            </motion.button>

            <motion.button
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={scrollToBottom}
                className="p-3 bg-slate-800/80 backdrop-blur-md border border-white/10 rounded-full text-white shadow-lg hover:bg-primary-500 transition-colors group"
                aria-label="Scroll to bottom"
            >
                <ArrowDown className="w-5 h-5 group-hover:translate-y-1 transition-transform duration-300" />
            </motion.button>
        </div>
    );
}
