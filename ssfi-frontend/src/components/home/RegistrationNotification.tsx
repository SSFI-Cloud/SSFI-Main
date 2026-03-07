'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
    Bell,
    Users,
    Shield,
    Building2,
    MapPin,
    Clock,
    ArrowRight,
    Flame,
} from 'lucide-react';
import { api } from '@/lib/api/client';

// Types
interface ActiveRegistration {
    id: number;
    type: 'student' | 'club' | 'state' | 'district';
    name: string;
    endDate: string;
    baseFee: number;
    registrationsCount?: number;
}

interface RegistrationNotificationProps {
    variant?: 'banner' | 'card' | 'compact';
}

// Configuration for each registration type
const registrationTypeConfig: Record<
    string,
    { icon: any; gradient: string; color: string; label: string }
> = {
    student: {
        icon: Users,
        gradient: 'from-emerald-600 to-cyan-500',
        color: 'text-emerald-400',
        label: 'Student Registration',
    },
    club: {
        icon: Shield,
        gradient: 'from-emerald-600 to-teal-500',
        color: 'text-emerald-400',
        label: 'Club Affiliation',
    },
    district: {
        icon: Building2,
        gradient: 'from-teal-600 to-emerald-500',
        color: 'text-teal-400',
        label: 'District Association',
    },
    state: {
        icon: MapPin,
        gradient: 'from-green-600 to-emerald-500',
        color: 'text-green-400',
        label: 'State Association',
    },
};

export default function RegistrationNotification({
    variant = 'card',
}: RegistrationNotificationProps) {
    const [activeRegistrations, setActiveRegistrations] = useState<ActiveRegistration[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Fetch active registrations (uses api.get which deduplicates with Header's call)
    useEffect(() => {
        const fetchActiveRegistrations = async () => {
            try {
                const response = await api.get('/registration-windows/active');
                if (response.data?.success && response.data?.data) {
                    setActiveRegistrations(response.data.data);
                }
            } catch (error) {
                console.error('Failed to fetch active registrations:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchActiveRegistrations();
    }, []);

    // Calculate time remaining
    const getTimeRemaining = (endDate: string): string => {
        const now = new Date();
        const end = new Date(endDate);
        const diff = end.getTime() - now.getTime();

        if (diff <= 0) return 'Ended';

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

        if (days > 0) {
            return `${days} day${days > 1 ? 's' : ''} left`;
        }
        return `${hours} hour${hours > 1 ? 's' : ''} left`;
    };

    // Don't render if loading or no registrations
    if (isLoading || activeRegistrations.length === 0) {
        return null;
    }

    // Banner variant
    if (variant === 'banner') {
        return (
            <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                className="bg-gradient-to-r from-primary-600 to-accent-600"
            >
                <div className="container mx-auto px-4 py-3">
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <Bell className="w-5 h-5 text-white animate-pulse" />
                            <span className="text-white text-sm font-medium">
                                {activeRegistrations.length} registration
                                {activeRegistrations.length > 1 ? 's' : ''} open!
                            </span>
                        </div>
                        <Link
                            href="/register"
                            className="px-4 py-1.5 bg-white text-primary-600 rounded-lg text-sm font-semibold hover:bg-white/90 transition-colors"
                        >
                            Register Now
                        </Link>
                    </div>
                </div>
            </motion.div>
        );
    }

    // Compact variant
    if (variant === 'compact') {
        return (
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary-500/10 to-accent-500/10 rounded-lg border border-primary-500/20"
            >
                <Bell className="w-4 h-4 text-primary-400 animate-pulse" />
                <span className="text-sm text-gray-300">
                    {activeRegistrations.length} open registration
                    {activeRegistrations.length > 1 ? 's' : ''}
                </span>
                <Link
                    href="/register"
                    className="text-sm font-semibold text-primary-400 hover:text-primary-300 flex items-center gap-1"
                >
                    View <ArrowRight className="w-3 h-3" />
                </Link>
            </motion.div>
        );
    }

    // Card variant - detailed cards for each registration (DEFAULT - PROMINENT)
    return (
        <section className="py-16 bg-gradient-to-b from-dark-900 via-dark-800 to-dark-900 relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute inset-0 opacity-10">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary-500 rounded-full blur-[200px]" />
            </div>

            <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                {/* Section Header with Hot Badge */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-12"
                >
                    <div className="inline-flex items-center gap-3 mb-4">
                        <span className="inline-block px-4 py-2 rounded-full bg-primary-500/10 text-primary-400 text-sm font-semibold border border-primary-500/20">
                            Open Now
                        </span>
                        {/* Hot Badge with Flashing Effect */}
                        <motion.div
                            animate={{
                                scale: [1, 1.1, 1],
                                boxShadow: [
                                    '0 0 0 0 rgba(16, 185, 129, 0)',
                                    '0 0 20px 10px rgba(16, 185, 129, 0.3)',
                                    '0 0 0 0 rgba(16, 185, 129, 0)',
                                ],
                            }}
                            transition={{
                                duration: 1.5,
                                repeat: Infinity,
                                ease: 'easeInOut',
                            }}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-xs font-bold shadow-lg"
                        >
                            <Flame className="w-4 h-4 fill-white" />
                            HOT
                        </motion.div>
                    </div>
                    <h2 className="text-3xl md:text-4xl font-headline font-bold text-white mb-4">
                        Registrations Are Open!
                    </h2>
                    <p className="text-lg text-gray-400 max-w-2xl mx-auto">
                        Don't miss your chance to register. Limited time slots available.
                    </p>
                </motion.div>

                {/* Registration Cards */}
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-10">
                    {activeRegistrations.map((reg, index) => {
                        const config = registrationTypeConfig[reg.type];
                        const Icon = config?.icon || Users;
                        const timeRemaining = getTimeRemaining(reg.endDate);

                        return (
                            <motion.div
                                key={reg.id}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.1 }}
                                whileHover={{ scale: 1.03, y: -5 }}
                                className="relative overflow-hidden rounded-2xl bg-dark-800/80 backdrop-blur border border-white/10 p-6 group shadow-xl hover:shadow-2xl hover:shadow-primary-500/10 transition-all duration-300"
                            >
                                {/* Gradient accent bar */}
                                <div
                                    className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${config?.gradient || 'from-primary-500 to-accent-500'}`}
                                />

                                {/* Hot indicator for urgent items */}
                                {timeRemaining.includes('hour') && (
                                    <div className="absolute top-4 right-4">
                                        <motion.span
                                            animate={{ opacity: [0.5, 1, 0.5] }}
                                            transition={{ duration: 1, repeat: Infinity }}
                                            className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-red-500/20 text-red-400 text-xs font-bold"
                                        >
                                            <Flame className="w-3 h-3" />
                                            Ending Soon
                                        </motion.span>
                                    </div>
                                )}

                                {/* Content */}
                                <div className="flex items-start gap-4 mb-6">
                                    <div
                                        className={`w-14 h-14 rounded-xl bg-gradient-to-br ${config?.gradient || 'from-primary-500 to-accent-500'} p-0.5`}
                                    >
                                        <div className="w-full h-full rounded-xl bg-dark-800 flex items-center justify-center">
                                            <Icon className={`w-6 h-6 ${config?.color || 'text-primary-400'}`} />
                                        </div>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="text-lg font-bold text-white truncate">
                                            {config?.label || reg.name}
                                        </h4>
                                        <div className="flex items-center gap-1.5 mt-1 text-sm text-gray-400">
                                            <Clock className="w-4 h-4" />
                                            <span>{timeRemaining}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Fee */}
                                <div className="mb-6">
                                    <p className="text-sm text-gray-500">Registration Fee</p>
                                    <p className="text-2xl font-bold text-white">₹{reg.baseFee}</p>
                                </div>

                                {/* CTA */}
                                <Link
                                    href={`/register?type=${reg.type}`}
                                    className={`w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r ${config?.gradient || 'from-primary-500 to-accent-500'} text-white font-semibold transition-all duration-300 group-hover:shadow-lg`}
                                >
                                    Register Now
                                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                                </Link>
                            </motion.div>
                        );
                    })}
                </div>

                {/* View All Link */}
                <div className="text-center">
                    <Link
                        href="/register"
                        className="inline-flex items-center gap-2 px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white rounded-xl text-lg font-semibold transition-all duration-300"
                    >
                        View All Registration Options
                        <ArrowRight className="w-5 h-5" />
                    </Link>
                </div>
            </div>
        </section>
    );
}
