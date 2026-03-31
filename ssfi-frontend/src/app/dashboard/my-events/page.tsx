'use client'

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Calendar,
    MapPin,
    Trophy,
    Medal,
    Search,
    Clock,
    CheckCircle,
    XCircle,
    Download,
    ChevronRight,
    Loader2,
    Filter,
    ArrowRight
} from 'lucide-react';
import { api } from '@/lib/api/client';
import { useAuth } from '@/lib/hooks/useAuth';

interface Event {
    id: number;
    name: string;
    eventDate: string;
    venue: string;
    city: string;
    state: string;
    status: string;
    eventLevel?: string;
}

interface Registration {
    id: number;
    eventId: number;
    event: Event;
    status: string;
    paymentStatus: string;
    categories: any;
    disciplines: any;
    fee: number;
}

interface ApiResponse {
    status: string;
    data: {
        registrations: Registration[];
    };
}

import { useRouter } from 'next/navigation';

export default function MyEventsPage() {
    const router = useRouter();
    const { token } = useAuth();
    const [registrations, setRegistrations] = useState<Registration[]>([]);
    const [certificates, setCertificates] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [medalsCount, setMedalsCount] = useState({ gold: 0, silver: 0, bronze: 0 });
    const [stats, setStats] = useState({ total: 0, upcoming: 0, completed: 0 });

    useEffect(() => {
        const loadData = async () => {
            if (!token) return;
            try {
                // 1. Fetch Events
                const eventsRes = await api.get('/events/my-events');

                if (eventsRes.data.status === 'success') {
                    // Map backend "events" to frontend "Registration" structure
                    const backendEvents = eventsRes.data.data.events || [];
                    const mappedRegistrations = backendEvents.map((item: any) => ({
                        id: item.id,
                        eventId: item.details.id,
                        event: item.details,
                        status: item.registration_status,
                        paymentStatus: item.payment_status,
                        categories: [], // Backend doesn't return categories in this specific view yet, defaulting to empty
                        disciplines: [],
                        fee: item.payment?.amount || 0
                    }));
                    setRegistrations(mappedRegistrations);

                    // Calculate stats
                    const now = new Date();
                    const up = mappedRegistrations.filter((r: any) => new Date(r.event.eventDate) > now).length;
                    const comp = mappedRegistrations.filter((r: any) => new Date(r.event.eventDate) <= now).length;
                    setStats({
                        total: mappedRegistrations.length,
                        upcoming: up,
                        completed: comp
                    });
                }

            } catch (error) {
                console.error('Error loading my events data:', error);
            }

            // 2. Fetch Certificates/Medals (isolated so events still display on failure)
            try {
                const certRes = await api.get('/certificates/my');
                const certs = certRes.data || [];
                setCertificates(certs);

                const counts = { gold: 0, silver: 0, bronze: 0 };
                certs.forEach((c: any) => {
                    if (c.position === 1) counts.gold++;
                    if (c.position === 2) counts.silver++;
                    if (c.position === 3) counts.bronze++;
                });
                setMedalsCount(counts);
            } catch (error) {
                console.error('Error loading certificates:', error);
            } finally {
                setIsLoading(false);
            }
        };

        loadData();
    }, [token]);

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'APPROVED': return <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-100 text-green-600 text-xs font-medium rounded-full"><CheckCircle className="w-3 h-3" /> Approved</span>;
            case 'PENDING': return <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-100 text-amber-600 text-xs font-medium rounded-full"><Clock className="w-3 h-3" /> Pending</span>;
            case 'REJECTED': return <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-100 text-red-600 text-xs font-medium rounded-full"><XCircle className="w-3 h-3" /> Rejected</span>;
            default: return <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 text-gray-500 text-xs font-medium rounded-full">{status}</span>;
        }
    };

    const getPaymentStatusBadge = (status: string) => {
        if (status === 'COMPLETED') return <span className="text-xs text-green-600 font-medium">Payment Successful</span>;
        if (status === 'PENDING') return <span className="text-xs text-amber-600 font-medium">Payment Pending</span>;
        return <span className="text-xs text-red-600 font-medium">Payment Failed</span>;
    };

    const filteredRegistrations = registrations.filter(reg => {
        // Safety check: ensure event exists
        if (!reg || !reg.event) return false;

        const matchesSearch = reg.event.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            reg.event.venue?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesFilter = filterStatus === 'all' ||
            (filterStatus === 'upcoming' && new Date(reg.event.eventDate) > new Date()) ||
            (filterStatus === 'completed' && new Date(reg.event.eventDate) <= new Date());
        return matchesSearch && matchesFilter;
    });

    const activeEventsCount = stats.upcoming;
    const completedEventsCount = stats.completed;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">My Events</h1>
                    <p className="text-gray-500 mt-1">Track your competition usage, results, and upcoming events</p>
                </div>
                <div className="flex items-center gap-2">
                    {/* Placeholder for 'Register for Event' button if needed */}
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center">
                            <Trophy className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900">{registrations.length}</p>
                            <p className="text-sm text-gray-500">Total Events</p>
                        </div>
                    </div>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-lg flex items-center justify-center">
                            <Clock className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900">{activeEventsCount}</p>
                            <p className="text-sm text-gray-500">Upcoming</p>
                        </div>
                    </div>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                            <CheckCircle className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900">{completedEventsCount}</p>
                            <p className="text-sm text-gray-500">Completed</p>
                        </div>
                    </div>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                            <Medal className="w-5 h-5 text-yellow-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900">{medalsCount.gold + medalsCount.silver + medalsCount.bronze}</p>
                            <p className="text-sm text-gray-500">Medals Won</p>
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Filters */}
            <div className="flex gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-600" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search events..."
                        className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                    />
                </div>
                <div className="relative">
                    <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="pl-10 pr-8 py-2 bg-white border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 appearance-none min-w-[150px]"
                    >
                        <option value="all">All Events</option>
                        <option value="upcoming">Upcoming</option>
                        <option value="completed">Completed</option>
                    </select>
                </div>
            </div>

            {/* Event List */}
            <div className="space-y-4">
                {isLoading ? (
                    <div className="py-12 text-center">
                        <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mx-auto" />
                    </div>
                ) : filteredRegistrations.length === 0 ? (
                    <div className="py-12 text-center text-gray-500">
                        <Trophy className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p>No events found</p>
                    </div>
                ) : (
                    filteredRegistrations.map((reg, index) => {
                        const eventDate = new Date(reg.event.eventDate);
                        const isUpcoming = eventDate > new Date();

                        return (
                            <motion.div
                                key={reg.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
                            >
                                <div className="p-6">
                                    <div className="flex flex-col lg:flex-row gap-6">
                                        {/* Date Box */}
                                        <div className="shrink-0 flex flex-col items-center justify-center w-20 h-20 bg-gray-100 rounded-xl border border-gray-200/50">
                                            <span className="text-xs font-semibold text-gray-500 uppercase">{eventDate.toLocaleDateString('en-IN', { month: 'short' })}</span>
                                            <span className="text-2xl font-bold text-gray-900">{eventDate.getDate()}</span>
                                            <span className="text-xs text-gray-600">{eventDate.getFullYear()}</span>
                                        </div>

                                        {/* Info */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-4">
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        {reg.event.eventLevel && (
                                                            <span className="text-xs font-medium text-emerald-600 px-2 py-0.5 bg-emerald-100 rounded-full">{reg.event.eventLevel}</span>
                                                        )}
                                                        {getStatusBadge(reg.status)}
                                                    </div>
                                                    <h3 className="text-lg font-bold text-gray-900 truncate">{reg.event.name}</h3>
                                                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                                                        <div className="flex items-center gap-1.5">
                                                            <MapPin className="w-4 h-4" />
                                                            <span>{reg.event.venue}, {reg.event.city}</span>
                                                        </div>
                                                        <div className="flex items-center gap-1.5">
                                                            <Clock className="w-4 h-4" />
                                                            <span>{isUpcoming ? 'Starts in 5 days' : 'Completed'}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="text-right shrink-0">
                                                    {getPaymentStatusBadge(reg.paymentStatus)}
                                                </div>
                                            </div>

                                            {/* Categories */}
                                            <div className="mt-4 pt-4 border-t border-gray-100">
                                                <p className="text-xs font-medium text-gray-600 mb-2 uppercase">Participating In</p>
                                                <div className="flex flex-wrap gap-2 mb-4">
                                                    {Array.isArray(reg.categories) && reg.categories.length > 0 ? (
                                                        reg.categories.map((cat: string, idx: number) => (
                                                            <span key={idx} className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-lg border border-gray-200/50">
                                                                {cat}
                                                            </span>
                                                        ))
                                                    ) : (
                                                        <span className="text-sm text-gray-600 italic">No categories specified</span>
                                                    )}
                                                </div>

                                                {/* Actions / Results (Mocked for completed) */}
                                                <div className="flex items-center justify-between">
                                                    {!isUpcoming ? (
                                                        (() => {
                                                            const cert = certificates.find(c => c.eventId === reg.eventId);
                                                            const pos = cert ? Number(cert.position) : 0;
                                                            if (pos === 1) return (
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-sm text-gray-500">Result:</span>
                                                                    <div className="flex items-center gap-1.5 px-3 py-1 bg-yellow-100 text-yellow-600 rounded-full border border-yellow-500/20">
                                                                        <Medal className="w-3.5 h-3.5" />
                                                                        <span className="text-xs font-bold">Gold Medal</span>
                                                                    </div>
                                                                </div>
                                                            );
                                                            if (pos === 2) return (
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-sm text-gray-500">Result:</span>
                                                                    <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-400/10 text-gray-700 rounded-full border border-slate-400/20">
                                                                        <Medal className="w-3.5 h-3.5" />
                                                                        <span className="text-xs font-bold">Silver Medal</span>
                                                                    </div>
                                                                </div>
                                                            );
                                                            if (pos === 3) return (
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-sm text-gray-500">Result:</span>
                                                                    <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-600/10 text-amber-500 rounded-full border border-amber-600/20">
                                                                        <Medal className="w-3.5 h-3.5" />
                                                                        <span className="text-xs font-bold">Bronze Medal</span>
                                                                    </div>
                                                                </div>
                                                            );
                                                            return <div className="text-sm text-gray-600 italic">Participation</div>;
                                                        })()
                                                    ) : (
                                                        <div className="text-sm text-gray-600 italic">Results pending</div>
                                                    )}

                                                    <div className="flex gap-2">
                                                        {reg.status === 'APPROVED' && (
                                                            <button className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg flex items-center gap-2 transition-colors">
                                                                <Download className="w-4 h-4" />
                                                                Receipt
                                                            </button>
                                                        )}
                                                        {!isUpcoming && reg.status === 'APPROVED' && (
                                                            <button className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium rounded-lg flex items-center gap-2 transition-colors">
                                                                <Download className="w-4 h-4" />
                                                                Certificate
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={() => router.push(`/dashboard/my-events/${reg.eventId}`)}
                                                            className="px-4 py-2 bg-white hover:bg-gray-100 text-gray-700 hover:text-white text-sm font-medium rounded-lg flex items-center gap-2 border border-gray-200 transition-colors"
                                                        >
                                                            Details
                                                            <ArrowRight className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })
                )}
            </div>
        </div>
    );
}