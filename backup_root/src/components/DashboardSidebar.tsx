"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

interface SidebarProps {
    role: string | null;
}

export default function Sidebar({ role }: SidebarProps) {
    const pathname = usePathname();
    const [isMobileOpen, setIsMobileOpen] = useState(false);

    // Close sidebar on route change
    useEffect(() => {
        setIsMobileOpen(false);
    }, [pathname]);

    // Prevent body scroll when mobile sidebar is open
    useEffect(() => {
        if (isMobileOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "unset";
        }
        return () => {
            document.body.style.overflow = "unset";
        };
    }, [isMobileOpen]);

    const menuItems: Record<
        string,
        { label: string; href: string; icon: string }[]
    > = {
        GLOBAL_ADMIN: [
            { label: "Overview", href: "/admin", icon: "🏠" },
            { label: "CMS", href: "/admin/cms", icon: "📝" },
            { label: "Settings", href: "/admin/settings", icon: "⚙️" },
            { label: "Approvals", href: "/admin/approvals", icon: "✅" },
            { label: "Events", href: "/admin/events", icon: "📅" },
        ],
        STATE_ADMIN: [
            { label: "Overview", href: "/dashboard/state", icon: "🏠" },
            { label: "Districts", href: "/dashboard/state/districts", icon: "🗺️" },
            { label: "Events", href: "/dashboard/state/events", icon: "📅" },
            { label: "My Profile", href: "/dashboard/profile", icon: "👤" },
        ],
        DISTRICT_ADMIN: [
            { label: "Overview", href: "/dashboard/district", icon: "🏠" },
            { label: "Clubs", href: "/dashboard/district/clubs", icon: "🏢" },
            { label: "Skaters", href: "/dashboard/district/skaters", icon: "⛸️" },
            { label: "My Profile", href: "/dashboard/profile", icon: "👤" },
        ],
        CLUB_ADMIN: [
            { label: "Overview", href: "/dashboard/club", icon: "🏠" },
            { label: "Skaters", href: "/dashboard/club/skaters", icon: "⛸️" },
            { label: "Registrations", href: "/dashboard/club/registrations", icon: "📝" },
            { label: "My Profile", href: "/dashboard/profile", icon: "👤" },
        ],
        STUDENT: [
            { label: "Overview", href: "/dashboard/student", icon: "🏠" },
            { label: "My Events", href: "/dashboard/student/events", icon: "📅" },
            { label: "ID Card", href: "/dashboard/student/id-card", icon: "🪪" },
            { label: "Payments", href: "/dashboard/student/payments", icon: "💳" },
            { label: "My Profile", href: "/dashboard/profile", icon: "👤" },
        ],
    };

    const items = menuItems[role || ""] || [];

    const SidebarContent = () => (
        <>
            <div className="mb-8 px-2">
                <Link
                    href="/"
                    className="text-2xl font-bold hover:text-blue-200 transition font-heading"
                >
                    SSFI
                </Link>
                <p className="text-xs text-blue-300 mt-1 uppercase tracking-wider">
                    {role?.replace("_", " ") || "Portal"}
                </p>
            </div>

            <nav className="flex-1 space-y-2">
                {items.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${isActive
                                    ? "bg-blue-700 text-white shadow-md"
                                    : "text-blue-100 hover:bg-blue-800 hover:text-white"
                                }`}
                        >
                            <span className="text-xl">{item.icon}</span>
                            <span className="font-medium">{item.label}</span>
                        </Link>
                    );
                })}
            </nav>

            <div className="border-t border-blue-800 pt-4 mt-4">
                <button
                    onClick={() => {
                        document.cookie =
                            "token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT";
                        window.location.href = "/login";
                    }}
                    className="flex items-center space-x-3 px-4 py-3 w-full text-left text-blue-200 hover:text-white hover:bg-red-900/50 rounded-lg transition-colors"
                >
                    <span>🚪</span>
                    <span>Logout</span>
                </button>
            </div>
        </>
    );

    return (
        <>
            {/* Mobile Hamburger Button */}
            <button
                onClick={() => setIsMobileOpen(true)}
                className="md:hidden fixed top-4 left-4 z-40 p-2 bg-blue-900 text-white rounded-lg shadow-lg"
                aria-label="Open menu"
            >
                <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 6h16M4 12h16M4 18h16"
                    />
                </svg>
            </button>

            {/* Desktop Sidebar */}
            <aside className="hidden md:flex w-64 bg-blue-900 text-white min-h-screen p-4 flex-col">
                <SidebarContent />
            </aside>

            {/* Mobile Overlay */}
            <AnimatePresence>
                {isMobileOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsMobileOpen(false)}
                        className="md:hidden fixed inset-0 bg-black/50 z-40"
                    />
                )}
            </AnimatePresence>

            {/* Mobile Sidebar Drawer */}
            <AnimatePresence>
                {isMobileOpen && (
                    <motion.aside
                        initial={{ x: "-100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "-100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className="md:hidden fixed top-0 left-0 h-full w-72 bg-blue-900 text-white p-4 flex flex-col z-50"
                    >
                        {/* Close Button */}
                        <button
                            onClick={() => setIsMobileOpen(false)}
                            className="absolute top-4 right-4 p-2 rounded-lg hover:bg-blue-800 transition-colors"
                            aria-label="Close menu"
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

                        <SidebarContent />
                    </motion.aside>
                )}
            </AnimatePresence>
        </>
    );
}
