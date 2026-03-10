"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LucideIcon, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
    name: string;
    url?: string;
    icon?: LucideIcon;
    children?: { name: string; url: string; icon?: LucideIcon }[];
}

interface TubelightNavbarProps {
    items: NavItem[];
    className?: string;
}

export function TubelightNavbar({ items, className }: TubelightNavbarProps) {
    const pathname = usePathname();
    const [openDropdown, setOpenDropdown] = useState<string | null>(null);
    const dropdownRef = useRef<HTMLDivElement | null>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setOpenDropdown(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Close on route change
    useEffect(() => {
        setOpenDropdown(null);
    }, [pathname]);

    // Determine active tab based on current pathname
    const getActiveTab = () => {
        // Check top-level items
        const directMatch = items.find((item) => item.url === pathname);
        if (directMatch) return directMatch.name;

        // Check children
        for (const item of items) {
            if (item.children?.some(child => child.url === pathname || pathname.startsWith(child.url + '/'))) {
                return item.name;
            }
        }

        return items[0]?.name;
    };

    const activeTab = getActiveTab();

    return (
        <div className={cn("flex items-center", className)} ref={dropdownRef}>
            <div className="flex items-center gap-1 bg-white/5 border border-white/10 backdrop-blur-lg py-1 px-1 rounded-full">
                {items.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.name;
                    const hasChildren = item.children && item.children.length > 0;
                    const isOpen = openDropdown === item.name;

                    // Dropdown item
                    if (hasChildren) {
                        return (
                            <div key={item.name} className="relative">
                                <button
                                    onClick={() => setOpenDropdown(isOpen ? null : item.name)}
                                    className={cn(
                                        "relative cursor-pointer text-sm font-semibold px-5 py-2 rounded-full transition-colors flex items-center gap-1",
                                        "text-gray-400 hover:text-white",
                                        isActive && "text-white"
                                    )}
                                >
                                    <span className="hidden md:inline">{item.name}</span>
                                    {Icon && (
                                        <span className="md:hidden">
                                            <Icon size={18} strokeWidth={2.5} />
                                        </span>
                                    )}
                                    <ChevronDown className={cn(
                                        "w-3.5 h-3.5 transition-transform duration-200",
                                        isOpen && "rotate-180"
                                    )} />
                                    {isActive && (
                                        <motion.div
                                            layoutId="tubelight"
                                            className="absolute inset-0 w-full bg-white/10 rounded-full -z-10"
                                            initial={false}
                                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                        >
                                            <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-8 h-1 bg-primary-500 rounded-t-full">
                                                <div className="absolute w-12 h-6 bg-primary-500/30 rounded-full blur-md -top-2 -left-2" />
                                                <div className="absolute w-8 h-6 bg-primary-500/30 rounded-full blur-md -top-1" />
                                                <div className="absolute w-4 h-4 bg-primary-500/30 rounded-full blur-sm top-0 left-2" />
                                            </div>
                                        </motion.div>
                                    )}
                                </button>

                                {/* Dropdown panel */}
                                <AnimatePresence>
                                    {isOpen && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 8 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: 8 }}
                                            transition={{ duration: 0.15 }}
                                            className="absolute top-full left-1/2 -translate-x-1/2 mt-3 w-56 rounded-xl bg-dark-800/95 backdrop-blur-xl border border-white/10 shadow-2xl overflow-hidden z-50"
                                        >
                                            <div className="py-2">
                                                {item.children!.map((child) => {
                                                    const ChildIcon = child.icon;
                                                    const isChildActive = pathname === child.url || pathname.startsWith(child.url + '/');
                                                    return (
                                                        <Link
                                                            key={child.url}
                                                            href={child.url}
                                                            className={cn(
                                                                "flex items-center gap-3 px-4 py-2.5 text-sm transition-colors",
                                                                isChildActive
                                                                    ? "text-emerald-400 bg-emerald-500/10"
                                                                    : "text-gray-300 hover:text-white hover:bg-white/5"
                                                            )}
                                                        >
                                                            {ChildIcon && <ChildIcon className="w-4 h-4 flex-shrink-0" />}
                                                            <span className="font-medium">{child.name}</span>
                                                        </Link>
                                                    );
                                                })}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        );
                    }

                    // Regular link item
                    return (
                        <Link
                            key={item.name}
                            href={item.url || '/'}
                            className={cn(
                                "relative cursor-pointer text-sm font-semibold px-5 py-2 rounded-full transition-colors",
                                "text-gray-400 hover:text-white",
                                isActive && "text-white"
                            )}
                        >
                            <span className="hidden md:inline">{item.name}</span>
                            {Icon && (
                                <span className="md:hidden">
                                    <Icon size={18} strokeWidth={2.5} />
                                </span>
                            )}
                            {isActive && (
                                <motion.div
                                    layoutId="tubelight"
                                    className="absolute inset-0 w-full bg-white/10 rounded-full -z-10"
                                    initial={false}
                                    transition={{
                                        type: "spring",
                                        stiffness: 300,
                                        damping: 30,
                                    }}
                                >
                                    {/* Tubelight glow effect */}
                                    <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-8 h-1 bg-primary-500 rounded-t-full">
                                        <div className="absolute w-12 h-6 bg-primary-500/30 rounded-full blur-md -top-2 -left-2" />
                                        <div className="absolute w-8 h-6 bg-primary-500/30 rounded-full blur-md -top-1" />
                                        <div className="absolute w-4 h-4 bg-primary-500/30 rounded-full blur-sm top-0 left-2" />
                                    </div>
                                </motion.div>
                            )}
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
