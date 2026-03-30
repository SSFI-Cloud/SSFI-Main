'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
    Calendar,
    MapPin,
    Users,
    Clock,
    Trophy,
    ChevronLeft,
    Share2,
    Ticket,
    Info,
    Award,
    FileText,
    AlertCircle,
    ArrowRight,
    Flame,
    Zap,
    Star,
} from 'lucide-react';
import {
    formatEventDate,
    getStatusConfig,
    isRegistrationOpen,
    getDaysUntilEvent,
    DISCIPLINES,
    type Event
} from '@/types/event';
import apiClient from '@/lib/api/client';
import { resolveImageUrl } from '@/lib/utils/resolveImageUrl';
import toast from 'react-hot-toast';

/* ── level-specific theming ──────────────────────────── */
const LEVEL_THEMES: Record<string, { gradient: string; accent: string; badge: string; glow: string }> = {
    NATIONAL: {
        gradient: 'from-[#0a1628] via-[#0c2340] to-[#162d50]',
        accent: '#14b8a6',
        badge: 'bg-teal-500 text-gray-900',
        glow: 'shadow-teal-500/20',
    },
    STATE: {
        gradient: 'from-[#0a1628] via-[#0b2a3c] to-[#0c3547]',
        accent: '#06b6d4',
        badge: 'bg-cyan-500 text-gray-900',
        glow: 'shadow-cyan-500/20',
    },
    DISTRICT: {
        gradient: 'from-[#0f1a12] via-[#14291a] to-[#1a3a22]',
        accent: '#22c55e',
        badge: 'bg-green-500 text-gray-900',
        glow: 'shadow-green-500/20',
    },
    default: {
        gradient: 'from-[#0a1628] via-[#131b2e] to-[#1a2744]',
        accent: '#10b981',
        badge: 'bg-emerald-500 text-white',
        glow: 'shadow-emerald-500/20',
    },
};

const getLevelTheme = (level?: string) =>
    LEVEL_THEMES[level || ''] ?? LEVEL_THEMES.default;

export default function EventDetailClient() {
    const params = useParams();
    const router = useRouter();
    const [event, setEvent] = useState<Event | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchEvent = async () => {
            try {
                setIsLoading(true);
                const eventId = params.id as string;

                // Demo events
                if (eventId?.startsWith('demo-')) {
                    const demoEvents: Record<string, any> = {
                        'demo-1': {
                            id: 'demo-1',
                            name: 'National Speed Skating Championship 2026',
                            description: 'Join us for the National Speed Skating Championship 2026, featuring top skaters from across India competing for the national title. Events include speed skating across multiple age categories with athletes from 28 states.',
                            eventDate: '2026-03-15T09:00:00Z',
                            eventEndDate: '2026-03-17T18:00:00Z',
                            registrationStartDate: '2026-01-01T00:00:00Z',
                            registrationEndDate: '2026-03-10T23:59:59Z',
                            venue: 'Jawaharlal Nehru Stadium',
                            city: 'New Delhi',
                            state: 'Delhi',
                            eventLevel: 'NATIONAL',
                            status: 'PUBLISHED',
                            entryFee: 2500,
                            disciplines: ['SPEED'],
                            ageCategories: ['U-14', 'U-18', 'SENIOR', 'MASTERS'],
                            _count: { registrations: 450 },
                        },
                        'demo-2': {
                            id: 'demo-2',
                            name: 'State Level Roller Hockey Tournament',
                            description: 'An exciting state-level roller hockey tournament showcasing the best teams from Maharashtra.',
                            eventDate: '2026-04-02T10:00:00Z',
                            eventEndDate: '2026-04-04T17:00:00Z',
                            registrationStartDate: '2026-02-01T00:00:00Z',
                            registrationEndDate: '2026-03-28T23:59:59Z',
                            venue: 'Shivaji Park',
                            city: 'Mumbai',
                            state: 'Maharashtra',
                            eventLevel: 'STATE',
                            status: 'PUBLISHED',
                            entryFee: 1500,
                            disciplines: ['HOCKEY'],
                            ageCategories: ['U-14', 'U-18', 'OPEN'],
                            _count: { registrations: 120 },
                        },
                        'demo-3': {
                            id: 'demo-3',
                            name: 'District School Games',
                            description: 'District-level school skating games featuring young talents from various schools in Pune.',
                            eventDate: '2026-02-28T08:00:00Z',
                            eventEndDate: '2026-02-28T16:00:00Z',
                            registrationStartDate: '2026-01-15T00:00:00Z',
                            registrationEndDate: '2026-02-25T23:59:59Z',
                            venue: 'Shree Shiv Chhatrapati Sports Complex',
                            city: 'Pune',
                            state: 'Maharashtra',
                            eventLevel: 'DISTRICT',
                            status: 'PUBLISHED',
                            entryFee: 500,
                            disciplines: ['ARTISTIC', 'SPEED'],
                            ageCategories: ['U-10', 'U-12', 'U-14'],
                            _count: { registrations: 300 },
                        },
                    };
                    const d = demoEvents[eventId] as Event | undefined;
                    if (d) { setEvent(d); setIsLoading(false); return; }
                }

                const response = await apiClient.get<{ success: boolean; data: Event }>(`/events/${params.id}`);
                setEvent(response.data.data);
            } catch (err: any) {
                setError(err.message || 'Failed to load event details');
                toast.error('Failed to load event details');
            } finally {
                setIsLoading(false);
            }
        };
        if (params.id) fetchEvent();
    }, [params.id]);

    /* ── loading ── */
    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#0a1628] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="relative w-16 h-16">
                        <div className="absolute inset-0 rounded-full border-[3px] border-white/10" />
                        <div className="absolute inset-0 rounded-full border-[3px] border-t-teal-400 animate-spin" />
                    </div>
                    <p className="text-white/40 text-sm tracking-widest uppercase">Loading event…</p>
                </div>
            </div>
        );
    }

    /* ── error ── */
    if (error || !event) {
        return (
            <div className="min-h-screen bg-[#0a1628] flex flex-col items-center justify-center p-4">
                <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center mb-6">
                    <AlertCircle className="w-10 h-10 text-red-400" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Event Not Found</h2>
                <p className="text-white/40 mb-8 text-center max-w-md">{error || "The event you're looking for doesn't exist."}</p>
                <button onClick={() => router.back()}
                    className="px-8 py-3 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-xl transition-all">
                    ← Go Back
                </button>
            </div>
        );
    }

    const theme = getLevelTheme(event.eventLevel);
    const statusCfg = getStatusConfig(event.status);
    const daysUntil = getDaysUntilEvent(event.eventDate);
    const canRegister = isRegistrationOpen(event);
    const regPercent = event.maxParticipants
        ? Math.min(100, ((event._count?.registrations || 0) / event.maxParticipants) * 100)
        : null;

    return (
        <div className="min-h-screen bg-[#f8f9fb]">
            {/* ═══════════════ HERO ═══════════════ */}
            <section className={`relative overflow-hidden bg-gradient-to-br ${theme.gradient}`}>
                {/* Decorative grid */}
                <div className="absolute inset-0 opacity-[0.04]"
                    style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'40\' height=\'40\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M0 0h40v40H0z\' fill=\'none\' stroke=\'white\' stroke-width=\'0.5\'/%3E%3C/svg%3E")' }} />
                {/* Glowing orb */}
                <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full"
                    style={{ background: `radial-gradient(circle, ${theme.accent}15 0%, transparent 70%)` }} />
                <div className="absolute -bottom-20 -left-20 w-[300px] h-[300px] rounded-full"
                    style={{ background: `radial-gradient(circle, ${theme.accent}10 0%, transparent 70%)` }} />

                {/* Banner image (if any) */}
                {event.bannerImage && (
                    <div className="absolute inset-0">
                        <img src={resolveImageUrl(event.bannerImage)} alt={event.name || 'Event banner'} className="w-full h-full object-cover opacity-20" />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#0a1628] via-[#0a1628]/80 to-transparent" />
                    </div>
                )}

                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-16 md:pt-32 md:pb-24">
                    {/* Top row: back + badges */}
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                        className="flex flex-wrap items-center gap-3 mb-8">
                        <button onClick={() => router.back()}
                            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-all mr-1">
                            <ChevronLeft className="w-5 h-5 text-white/70" />
                        </button>
                        <span className={`px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${theme.badge}`}>
                            {event.eventLevel}
                        </span>
                        <span className="px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-white/10 text-white border border-white/10">
                            {statusCfg.label}
                        </span>
                        {daysUntil > 0 && daysUntil <= 60 && (
                            <span className="px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
                                <Flame className="w-3.5 h-3.5" />
                                {daysUntil === 1 ? 'Tomorrow' : `${daysUntil} days left`}
                            </span>
                        )}
                    </motion.div>

                    {/* Title */}
                    <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-white leading-[1.05] max-w-5xl tracking-tight">
                        {event.name.split(' ').map((word, i) => (
                            <span key={i}>
                                {word}{' '}
                                {i === Math.floor(event.name.split(' ').length / 2) - 1 && <br className="hidden md:block" />}
                            </span>
                        ))}
                    </motion.h1>

                    {/* Meta row */}
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }}
                        className="flex flex-wrap items-center gap-x-8 gap-y-3 mt-8">
                        <div className="flex items-center gap-2.5 text-white/60">
                            <div className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center border border-white/10">
                                <Calendar className="w-4 h-4 text-white/80" />
                            </div>
                            <span className="text-sm md:text-base font-medium">{formatEventDate(event.eventDate, event.eventEndDate)}</span>
                        </div>
                        <div className="flex items-center gap-2.5 text-white/60">
                            <div className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center border border-white/10">
                                <MapPin className="w-4 h-4 text-white/80" />
                            </div>
                            <span className="text-sm md:text-base font-medium">{event.venue}, {event.city}</span>
                        </div>
                        <div className="flex items-center gap-2.5 text-white/60">
                            <div className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center border border-white/10">
                                <Users className="w-4 h-4 text-white/80" />
                            </div>
                            <span className="text-sm md:text-base font-medium">{event._count?.registrations || 0} Registered</span>
                        </div>
                    </motion.div>
                </div>

                {/* Bottom accent line */}
                <div className="h-1 w-full" style={{ background: `linear-gradient(90deg, transparent, ${theme.accent}, transparent)`, opacity: 0.4 }} />
            </section>

            {/* ═══════════════ BODY ═══════════════ */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-10">
                    {/* ── LEFT COLUMN ── */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* About */}
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
                            className="bg-white rounded-2xl border border-gray-100 p-6 md:p-8 shadow-sm">
                            <div className="flex items-center gap-3 mb-5">
                                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${theme.accent}15` }}>
                                    <Info className="w-5 h-5" style={{ color: theme.accent }} />
                                </div>
                                <h2 className="text-xl font-bold text-gray-900">About This Event</h2>
                            </div>
                            <p className="text-gray-500 leading-relaxed whitespace-pre-wrap text-[15px]">{event.description}</p>
                        </motion.div>

                        {/* Disciplines */}
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
                            className="bg-white rounded-2xl border border-gray-100 p-6 md:p-8 shadow-sm">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center">
                                    <Trophy className="w-5 h-5 text-teal-500" />
                                </div>
                                <h2 className="text-xl font-bold text-gray-900">Disciplines</h2>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {(event.disciplines || []).map((discValue) => {
                                    const discipline = DISCIPLINES.find(d => d.value === discValue);
                                    return (
                                        <div key={discValue}
                                            className="group relative flex items-center gap-4 p-5 rounded-xl bg-gradient-to-br from-gray-50 to-white border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all">
                                            <span className="text-3xl">{discipline?.icon || '🏅'}</span>
                                            <div>
                                                <h3 className="font-semibold text-gray-900">{discipline?.label || discValue}</h3>
                                                <p className="text-sm text-gray-400 mt-0.5">All age groups eligible</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Age categories */}
                            {event.ageCategories && event.ageCategories.length > 0 && (
                                <div className="mt-8 pt-6 border-t border-gray-100">
                                    <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Age Categories</h3>
                                    <div className="flex flex-wrap gap-2.5">
                                        {event.ageCategories.map((cat) => (
                                            <span key={cat}
                                                className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-50 text-gray-700 border border-gray-150 hover:bg-gray-100 transition-colors">
                                                {cat}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    </div>

                    {/* ── RIGHT SIDEBAR ── */}
                    <div className="lg:col-span-1">
                        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
                            className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden sticky top-24">
                            {/* Price header */}
                            <div className={`p-6 bg-gradient-to-br ${theme.gradient} relative overflow-hidden`}>
                                <div className="absolute inset-0 opacity-[0.06]"
                                    style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'20\' height=\'20\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Ccircle cx=\'1\' cy=\'1\' r=\'1\' fill=\'white\'/%3E%3C/svg%3E")' }} />
                                <div className="relative flex items-end justify-between">
                                    <div>
                                        <p className="text-white/40 text-xs uppercase tracking-widest mb-1">Entry Fee</p>
                                        <p className="text-3xl font-extrabold text-white">
                                            {event.entryFee > 0 ? `₹${event.entryFee.toLocaleString('en-IN')}` : 'Free'}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-white/40 text-xs uppercase tracking-widest mb-1">Registered</p>
                                        <p className="text-2xl font-bold text-white flex items-center justify-end gap-2">
                                            <Users className="w-5 h-5 text-white/50" />
                                            {event._count?.registrations || 0}
                                        </p>
                                    </div>
                                </div>
                                {/* Capacity bar */}
                                {regPercent !== null && (
                                    <div className="mt-4">
                                        <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                                            <div className="h-full rounded-full transition-all duration-700"
                                                style={{ width: `${regPercent}%`, backgroundColor: theme.accent }} />
                                        </div>
                                        <p className="text-white/30 text-xs mt-1.5">{Math.round(regPercent)}% capacity filled</p>
                                    </div>
                                )}
                            </div>

                            {/* CTA + details */}
                            <div className="p-6 space-y-5">
                                {canRegister ? (
                                    <button onClick={() => router.push(`/events/${event.id}/register`)}
                                        className={`w-full py-4 rounded-xl font-bold text-base transition-all flex items-center justify-center gap-2.5 group shadow-lg ${theme.glow}`}
                                        style={{ backgroundColor: theme.accent, color: '#fff' }}>
                                        <Zap className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                                        Register Now
                                        <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                                    </button>
                                ) : (
                                    <button disabled
                                        className="w-full py-4 bg-gray-50 text-gray-400 border border-gray-200 rounded-xl font-bold cursor-not-allowed flex items-center justify-center gap-2">
                                        <Clock className="w-5 h-5" />
                                        Registration Closed
                                    </button>
                                )}

                                {/* Key dates */}
                                <div className="space-y-0 divide-y divide-gray-100 text-sm">
                                    <div className="flex justify-between py-3">
                                        <span className="text-gray-400">Registration Opens</span>
                                        <span className="text-gray-700 font-medium">{new Date(event.registrationStartDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                    </div>
                                    <div className="flex justify-between py-3">
                                        <span className="text-gray-400">Registration Closes</span>
                                        <span className="text-red-500 font-medium">{new Date(event.registrationEndDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                    </div>
                                    {event.maxParticipants && (
                                        <div className="flex justify-between py-3">
                                            <span className="text-gray-400">Max Participants</span>
                                            <span className="text-gray-700 font-medium">{event.maxParticipants}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Share */}
                                <button
                                    onClick={() => { navigator.clipboard.writeText(window.location.href); toast.success('Link copied!'); }}
                                    className="w-full py-3 rounded-xl text-sm font-medium text-gray-500 bg-gray-50 hover:bg-gray-100 border border-gray-100 transition-colors flex items-center justify-center gap-2">
                                    <Share2 className="w-4 h-4" />
                                    Share Event
                                </button>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </div>
        </div>
    );
}
