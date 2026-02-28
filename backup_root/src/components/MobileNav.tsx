"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavLink {
    href: string;
    label: string;
    icon?: React.ReactNode;
}

interface MobileNavProps {
    links: NavLink[];
    logo?: React.ReactNode;
}

export default function MobileNav({ links, logo }: MobileNavProps) {
    const [isOpen, setIsOpen] = useState(false);
    const pathname = usePathname();

    // Close menu on route change
    useEffect(() => {
        setIsOpen(false);
    }, [pathname]);

    // Prevent body scroll when menu is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "unset";
        }
        return () => {
            document.body.style.overflow = "unset";
        };
    }, [isOpen]);

    return (
        <>
            {/* Hamburger Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors z-50 relative"
                aria-label="Toggle menu"
            >
                <div className="w-6 h-5 flex flex-col justify-between">
                    <motion.span
                        animate={isOpen ? { rotate: 45, y: 8 } : { rotate: 0, y: 0 }}
                        className="w-full h-0.5 bg-gray-800 rounded-full origin-left"
                    />
                    <motion.span
                        animate={isOpen ? { opacity: 0 } : { opacity: 1 }}
                        className="w-full h-0.5 bg-gray-800 rounded-full"
                    />
                    <motion.span
                        animate={isOpen ? { rotate: -45, y: -8 } : { rotate: 0, y: 0 }}
                        className="w-full h-0.5 bg-gray-800 rounded-full origin-left"
                    />
                </div>
            </button>

            {/* Overlay */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsOpen(false)}
                        className="fixed inset-0 bg-black/50 z-40 md:hidden"
                    />
                )}
            </AnimatePresence>

            {/* Slide-out Drawer */}
            <AnimatePresence>
                {isOpen && (
                    <motion.nav
                        initial={{ x: "-100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "-100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className="fixed top-0 left-0 h-full w-72 bg-white shadow-xl z-50 md:hidden"
                    >
                        {/* Header */}
                        <div className="p-4 border-b flex items-center justify-between">
                            {logo || (
                                <span className="text-xl font-bold text-[#003399]">
                                    SSFI
                                </span>
                            )}
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-2 rounded-lg hover:bg-gray-100"
                            >
                                <svg
                                    className="w-5 h-5"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M6 18L18 6M6 6l12 12"
                                    />
                                </svg>
                            </button>
                        </div>

                        {/* Navigation Links */}
                        <div className="p-4">
                            <ul className="space-y-2">
                                {links.map((link) => (
                                    <li key={link.href}>
                                        <Link
                                            href={link.href}
                                            className={`
                                                flex items-center gap-3 px-4 py-3 rounded-lg transition-colors
                                                ${pathname === link.href
                                                    ? "bg-[#003399] text-white"
                                                    : "text-gray-700 hover:bg-gray-100"
                                                }
                                            `}
                                        >
                                            {link.icon}
                                            <span className="font-medium">{link.label}</span>
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </motion.nav>
                )}
            </AnimatePresence>
        </>
    );
}
