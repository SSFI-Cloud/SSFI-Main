"use client";

import React from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
    name: string;
    url: string;
    icon?: LucideIcon;
}

interface TubelightNavbarProps {
    items: NavItem[];
    className?: string;
}

export function TubelightNavbar({ items, className }: TubelightNavbarProps) {
    const pathname = usePathname();

    // Determine active tab based on current pathname
    const getActiveTab = () => {
        const activeItem = items.find((item) => item.url === pathname);
        return activeItem?.name || items[0]?.name;
    };

    const activeTab = getActiveTab();

    return (
        <div className={cn("flex items-center", className)}>
            <div className="flex items-center gap-1 bg-white/5 border border-white/10 backdrop-blur-lg py-1 px-1 rounded-full">
                {items.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.name;

                    return (
                        <Link
                            key={item.name}
                            href={item.url}
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
