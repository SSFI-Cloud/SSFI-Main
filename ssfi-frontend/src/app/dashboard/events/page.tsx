'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import toast from 'react-hot-toast';
import {
    Trophy,
    Plus,
    Search,
    Edit2,
    Trash2,
    Eye,
    Download,
    ChevronLeft,
    ChevronRight,
    ArrowUpDown,
    MapPin,
    Loader2,
    Calendar,
    Users,
    CheckCircle,
    IndianRupee,
    Flag,
    Building2,
    Globe,
    X,
    AlertCircle,
    Check,
    XCircle
} from 'lucide-react';
import { api } from '@/lib/api/client';
import { useAuth } from '@/lib/hooks/useAuth';
import { useEventStatusUpdate } from '@/lib/hooks/useEvents';

// Types
interface Event {
    id: number;
    code: string;
    name: string;
    description: string;
    eventLevel: string;
    eventType: string;
    eventDate: string;
    eventEndDate: string;
    registrationStartDate: string;
    registrationEndDate: string;
    venue: string;
    city: string;
    state: { id: number; name: string } | null;
    district: { id: number; name: string } | null;
    status: string;
    entryFee: number;
    currentEntries: number;
    createdAt: string;
    // Computed for frontend compatibility if needed
    event_level_type_id: number;
    creatorId?: number;
}

interface ApiResponse {
    status: string;
    data: {
        events: Event[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    };
}

const eventLevels = [
    { id: 1, name: 'District Level', icon: Building2, color: 'bg-emerald-100 text-emerald-600' },
    { id: 2, name: 'State Level', icon: Flag, color: 'bg-teal-100 text-teal-600' },
    { id: 3, name: 'National Meet', icon: Globe, color: 'bg-emerald-100 text-emerald-600' },
];

export default function EventsPage() {
    const { token, user } = useAuth();
    const { approveEvent, rejectEvent, isLoading: isUpdating } = useEventStatusUpdate();
    const [events, setEvents] = useState<Event[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [levelFilter, setLevelFilter] = useState<number | 'all'>('all');
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'pending'>('all');
    const [sortField, setSortField] = useState<string>('eventDate');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

    // UI State
    const [currentPage, setCurrentPage] = useState(1);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [viewingEvent, setViewingEvent] = useState<Event | null>(null);
    const [deletingEvent, setDeletingEvent] = useState<Event | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const itemsPerPage = 10;
    const [totalPages, setTotalPages] = useState(1);
    const [stats, setStats] = useState({
        totalEvents: 0,
        activeEvents: 0,
        totalRegistrations: 0,
        totalRevenue: 0
    });

    // Approval Handlers
    const handleApprove = async (event: Event) => {
        try {
            await approveEvent(event.id);
            toast.success('Event approved and published!');
            await fetchEvents();
        } catch (error: any) {
            console.error('Failed to approve event', error);
            toast.error(error?.message || 'Failed to approve event');
        }
    };

    const handleReject = async (event: Event) => {
        try {
            const reason = prompt('Enter reason for rejection:');
            if (reason) {
                await rejectEvent(event.id, reason);
                toast.success('Event rejected');
                await fetchEvents();
            }
        } catch (error: any) {
            console.error('Failed to reject event', error);
            toast.error(error?.message || 'Failed to reject event');
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            if (token) fetchEvents();
        }, 500);
        return () => clearTimeout(timer);
    }, [token, currentPage, searchQuery, levelFilter, statusFilter, sortField, sortOrder]);


    const handleSort = (field: string) => {
        if (sortField === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortOrder('asc');
        }
    };

    const getEventLevelBadge = (levelId: number) => {
        const level = eventLevels.find(l => l.id === levelId);
        if (!level) return null;
        const Icon = level.icon;
        return (
            <span className={`inline-flex items-center gap-1 px-2 py-1 ${level.color} text-xs font-medium rounded-full`}>
                <Icon className="w-3 h-3" />
                {level.name}
            </span>
        );
    };

    const getRegistrationStatus = (regStart: string, regEnd: string) => {
        if (!regStart || !regEnd) return <span className="text-gray-600 text-xs">Dates TBD</span>;
        const now = new Date();
        const start = new Date(regStart);
        const end = new Date(regEnd);

        if (now < start) {
            return <span className="text-amber-600 text-xs">Opens {new Date(regStart).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}</span>;
        } else if (now > end) {
            return <span className="text-gray-600 text-xs">Closed</span>;
        } else {
            return <span className="text-green-600 text-xs">Open Now</span>;
        }
    };

    const handleDelete = async (event: Event) => {
        setIsDeleting(true);
        try {
            await api.delete(`/events/${event.id}`);
            setDeletingEvent(null);
            fetchEvents();
        } catch (err: any) {
            console.error('Error deleting event:', err);
            setError(err.response?.data?.message || 'Failed to delete event');
        } finally {
            setIsDeleting(false);
        }
    };

    const fetchEvents = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const params: any = {
                page: currentPage,
                limit: itemsPerPage,
                sortField: sortField === 'name' ? 'name' : sortField === 'eventDate' ? 'eventDate' : sortField,
                sortOrder,
            };
            if (searchQuery) params.search = searchQuery;
            // Filter mapping
            if (levelFilter !== 'all') {
                if (levelFilter === 1) params.level = 'DISTRICT';
                if (levelFilter === 2) params.level = 'STATE';
                if (levelFilter === 3) params.level = 'NATIONAL';
            }
            if (statusFilter !== 'all') {
                if (statusFilter === 'active') params.status = 'PUBLISHED';
                else if (statusFilter === 'inactive') params.status = 'COMPLETED';
                else if (statusFilter === 'pending') params.status = 'DRAFT';
            }

            const response = await api.get('/events', { params });

            const resData = (response.data as any)?.data ?? response.data;
            if (resData?.events) {
                const { events: data, meta, totalPages: tp, total: t } = resData;
                const mappedEvents = data.map((e: any) => ({
                    ...e,
                    event_level_type_id: e.eventLevel === 'NATIONAL' ? 3 : e.eventLevel === 'STATE' ? 2 : 1,
                    status: e.status === 'DRAFT' ? 'pending' : e.status === 'REJECTED' ? 'rejected' : (e.status === 'PUBLISHED' || e.status === 'ONGOING' || e.status === 'REGISTRATION_OPEN' ? 'active' : 'inactive')
                }));

                setEvents(mappedEvents);
                setTotalPages(meta?.totalPages || tp || 1);
                setStats({
                    totalEvents: meta?.total || t || mappedEvents.length,
                    activeEvents: mappedEvents.filter((e: any) => e.status === 'active').length,
                    totalRegistrations: mappedEvents.reduce((acc: number, e: any) => acc + (e.currentEntries || 0), 0),
                    totalRevenue: 0
                });
            }
        } catch (err: any) {
            console.error('Error fetching events:', err);
            setError(err.response?.data?.message || 'Failed to fetch events');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Events Management</h1>
                    <p className="text-gray-500 mt-1">Create and manage your events</p>
                </div>
                <Link
                    href="/dashboard/events/new"
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors"
                >
                    <Plus className="w-5 h-5" />
                    Create Event
                </Link>
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4 bg-white p-4 rounded-xl border border-gray-200">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                    <input
                        type="text"
                        placeholder="Search events..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-[#f5f6f8] border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                    />
                </div>
                <select
                    value={levelFilter}
                    onChange={(e) => setLevelFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                    className="px-4 py-2.5 bg-[#f5f6f8] border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                >
                    <option value="all">All Levels</option>
                    {eventLevels.map(level => (
                        <option key={level.id} value={level.id}>{level.name}</option>
                    ))}
                </select>
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive' | 'pending')}
                    className="px-4 py-2.5 bg-[#f5f6f8] border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="pending">Pending Approval</option>
                    <option value="inactive">Completed</option>
                </select>
            </div>

            {/* Events Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {isLoading ? (
                    <div className="col-span-full py-12 text-center">
                        <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mx-auto" />
                    </div>
                ) : events.length === 0 ? (
                    <div className="col-span-full py-12 text-center text-gray-500">
                        No events found
                    </div>
                ) : (
                    events.map((event, index) => (
                        <motion.div
                            key={event.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:border-emerald-500/50 transition-colors"
                        >
                            {/* Event Header */}
                            <div className="relative h-32 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 p-4">
                                <div className="absolute top-4 left-4">
                                    {getEventLevelBadge(event.event_level_type_id)}
                                </div>
                                <div className="absolute top-4 right-4">
                                    {event.status === 'active' ? (
                                        <span className="px-2 py-1 bg-green-100 text-green-600 text-xs font-medium rounded-full">Active</span>
                                    ) : event.status === 'pending' ? (
                                        <span className="px-2 py-1 bg-yellow-100 text-yellow-600 text-xs font-medium rounded-full">Pending</span>
                                    ) : (
                                        <span className="px-2 py-1 bg-gray-100 text-gray-500 text-xs font-medium rounded-full">{event.status}</span>
                                    )}
                                </div>
                                <div className="absolute bottom-4 left-4 right-4">
                                    <h3 className="text-lg font-bold text-gray-900 line-clamp-2">{event.name}</h3>
                                </div>
                            </div>

                            <div className="p-4 space-y-3">
                                <div className="flex items-center gap-2 text-sm text-gray-500">
                                    <Calendar className="w-4 h-4" />
                                    <span>{new Date(event.eventDate).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-gray-500">
                                    <MapPin className="w-4 h-4" />
                                    <span className="truncate">{event.venue}, {event.city}</span>
                                </div>

                                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                                    <div className="flex items-center gap-4">
                                        <div>
                                            <p className="text-xs text-gray-600">Registrations</p>
                                            <p className="text-sm font-medium text-gray-900">{event.currentEntries}</p>
                                        </div>
                                    </div>
                                    {getRegistrationStatus(event.registrationStartDate, event.registrationEndDate)}
                                </div>
                            </div>

                            <div className="p-4 pt-0 flex flex-col gap-2">
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setViewingEvent(event)}
                                        className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-100 text-sm font-medium flex items-center justify-center gap-1"
                                    >
                                        <Eye className="w-4 h-4" />
                                        View
                                    </button>
                                    {(user?.role === 'GLOBAL_ADMIN' || Number(user?.id) === event.creatorId) && (
                                        <Link
                                            href={`/dashboard/events/${event.id}/edit`}
                                            className="flex-1 py-2 bg-emerald-100 text-emerald-600 rounded-lg hover:bg-emerald-200 text-sm font-medium flex items-center justify-center gap-1"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                            Edit
                                        </Link>
                                    )}
                                </div>

                                {user?.role === 'GLOBAL_ADMIN' && event.status === 'pending' && (
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleApprove(event)}
                                            disabled={isUpdating}
                                            className="flex-1 py-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 text-sm font-medium flex items-center justify-center gap-1"
                                        >
                                            <Check className="w-4 h-4" />
                                            Approve
                                        </button>
                                        <button
                                            onClick={() => handleReject(event)}
                                            disabled={isUpdating}
                                            className="flex-1 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 text-sm font-medium flex items-center justify-center gap-1"
                                        >
                                            <XCircle className="w-4 h-4" />
                                            Deny
                                        </button>
                                    </div>
                                )}

                                {(user?.role === 'GLOBAL_ADMIN' || Number(user?.id) === event.creatorId) && event.status !== 'pending' && (
                                    <div className="flex gap-2">
                                        <Link
                                            href={`/dashboard/manage-events/${event.id}/results`}
                                            className="flex-1 py-2 bg-emerald-100 text-emerald-600 rounded-lg hover:bg-emerald-200 text-sm font-medium flex items-center justify-center gap-1"
                                        >
                                            <Trophy className="w-4 h-4" />
                                            Results
                                        </Link>
                                        <Link
                                            href={`/dashboard/events/${event.id}/registrations`}
                                            className="flex-1 py-2 bg-teal-100 text-teal-600 rounded-lg hover:bg-teal-200 text-sm font-medium flex items-center justify-center gap-1"
                                        >
                                            <Users className="w-4 h-4" />
                                            Registrations
                                        </Link>
                                        <button
                                            onClick={() => setDeletingEvent(event)}
                                            className="flex-1 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 text-sm font-medium flex items-center justify-center gap-1"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                            Delete
                                        </button>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    ))
                )}
            </div>

            {/* Detail Modal */}
            <AnimatePresence>
                {viewingEvent && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
                        onClick={() => setViewingEvent(null)}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-xl border border-gray-200"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="flex justify-between items-center mb-6 border-b border-gray-200 pb-4">
                                <div>
                                    <span className="text-emerald-600 text-sm font-medium mb-1 block">{viewingEvent.eventLevel} Event</span>
                                    <h2 className="text-2xl font-bold text-gray-900">{viewingEvent.name}</h2>
                                </div>
                                <button
                                    onClick={() => setViewingEvent(null)}
                                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    <X className="w-5 h-5 text-gray-500" />
                                </button>
                            </div>

                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <div className="bg-[#f5f6f8]/50 p-4 rounded-xl space-y-3">
                                        <div className="flex items-center gap-3 text-gray-700">
                                            <Calendar className="w-4 h-4 text-gray-600" />
                                            <span>
                                                {new Date(viewingEvent.eventDate).toLocaleDateString('en-IN', {
                                                    weekday: 'long',
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric'
                                                })}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-3 text-gray-700">
                                            <MapPin className="w-4 h-4 text-gray-600" />
                                            <span>{viewingEvent.venue}, {viewingEvent.city}</span>
                                        </div>
                                        {viewingEvent.state && (
                                            <div className="flex items-center gap-3 text-gray-700">
                                                <Flag className="w-4 h-4 text-gray-600" />
                                                <span>{viewingEvent.state.name}</span>
                                            </div>
                                        )}
                                    </div>

                                    <div>
                                        <h3 className="text-sm font-medium text-gray-500 mb-2">Description</h3>
                                        <p className="text-gray-700 leading-relaxed bg-[#f5f6f8]/30 p-4 rounded-xl text-sm">
                                            {viewingEvent.description || 'No description provided.'}
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="bg-[#f5f6f8]/50 p-4 rounded-xl space-y-3">
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-500">Entry Fee</span>
                                            <span className="text-xl font-bold text-emerald-600">
                                                {viewingEvent.entryFee ? `₹${viewingEvent.entryFee}` : 'Free'}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-500">Status</span>
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${viewingEvent.status === 'PUBLISHED' ? 'bg-green-100 text-green-600' :
                                                    viewingEvent.status === 'DRAFT' ? 'bg-yellow-100 text-yellow-600' :
                                                        'bg-gray-100 text-gray-500'
                                                }`}>
                                                {viewingEvent.status}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-500">Current Entries</span>
                                            <span className="text-gray-900 font-medium">{viewingEvent.currentEntries}</span>
                                        </div>
                                    </div>

                                    {(user?.role === 'GLOBAL_ADMIN' || Number(user?.id) === viewingEvent.creatorId) && (
                                        <div className="pt-4 border-t border-gray-100">
                                            <Link
                                                href={`/dashboard/events/${viewingEvent.id}/edit`}
                                                className="block w-full py-2.5 bg-emerald-600 text-white text-center rounded-xl hover:bg-emerald-700 font-medium transition-colors"
                                            >
                                                Edit Event
                                            </Link>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Delete Confirmation Modal */}
            <AnimatePresence>
                {deletingEvent && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
                        onClick={() => !isDeleting && setDeletingEvent(null)}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-gray-200"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                                    <AlertCircle className="w-6 h-6 text-red-500" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900">Delete Event?</h3>
                                    <p className="text-gray-500 text-sm mt-1">
                                        Are you sure you want to delete "{deletingEvent.name}"? This action cannot be undone.
                                    </p>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setDeletingEvent(null)}
                                    disabled={isDeleting}
                                    className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 disabled:opacity-50 font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => handleDelete(deletingEvent)}
                                    disabled={isDeleting}
                                    className="flex-1 py-2.5 bg-red-500 text-white rounded-xl hover:bg-red-600 disabled:opacity-50 font-medium flex items-center justify-center gap-2"
                                >
                                    {isDeleting ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Deleting...
                                        </>
                                    ) : (
                                        'Delete Event'
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
