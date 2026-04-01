'use client'

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    CalendarClock,
    Plus,
    Search,
    Edit2,
    Trash2,
    X,
    Calendar,
    CheckCircle,
    XCircle,
    Loader2,
    AlertCircle,
    Users,
    Shield,
    Trophy,
    Clock,
    Play,
    Pause,
    Settings,
    AlertTriangle
} from 'lucide-react';
import { api } from '@/lib/api/client';
import { useAuth } from '@/lib/hooks/useAuth';

// Backend Type
interface RegistrationWindow {
    id: string;
    title: string;
    type: string;
    startDate: string;
    endDate: string;
    baseFee: number;
    description?: string;
    instructions?: string;
    isActive: boolean;
    isPaused: boolean;
    renewalEnabled: boolean;
    registrationsCount: number;
    maxRegistrations: number | null;
    createdAt: string;
}

interface ApiResponse {
    status: string;
    data: {
        windows: RegistrationWindow[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    };
}

// DB stores uppercase types; frontend uses lowercase for form values
const windowTypes = [
    { value: 'state', dbType: 'STATE_SECRETARY', label: 'State Secretary', icon: Users, color: 'bg-emerald-100 text-emerald-600' },
    { value: 'district', dbType: 'DISTRICT_SECRETARY', label: 'District Secretary', icon: Users, color: 'bg-teal-100 text-teal-600' },
    { value: 'club', dbType: 'CLUB', label: 'Club Affiliation', icon: Shield, color: 'bg-teal-100 text-teal-600' },
    { value: 'student', dbType: 'STUDENT', label: 'Student Registration', icon: Trophy, color: 'bg-amber-100 text-amber-600' },
];

export default function RegistrationWindowsPage() {
    const { token } = useAuth();
    const [windows, setWindows] = useState<RegistrationWindow[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState<string>('all');
    const [filterStatus, setFilterStatus] = useState<string>('all');

    // Modal State
    const [showModal, setShowModal] = useState(false);
    const [editingWindow, setEditingWindow] = useState<RegistrationWindow | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        type: 'club',
        startDate: '',
        endDate: '',
        baseFee: 0,
        description: '',
        instructions: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fetchWindows = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const params: any = { page: 1, limit: 100 };
            if (searchQuery) params.search = searchQuery;
            if (filterType !== 'all') params.type = filterType;

            const response = await api.get<ApiResponse>('/registration-windows', { params });

            if (response.data.status === 'success') {
                setWindows(response.data.data.windows);
            }
        } catch (err: any) {
            console.error('Error fetching windows:', err);
            setError(err.response?.data?.message || 'Failed to fetch registration windows');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            if (token) fetchWindows();
        }, 500);
        return () => clearTimeout(timer);
    }, [token, searchQuery, filterType]);

    // Helpers
    const getStatus = (window: RegistrationWindow) => {
        if (window.isPaused) return 'paused';
        const now = new Date();
        const start = new Date(window.startDate);
        const end = new Date(window.endDate);
        if (now < start) return 'scheduled';
        if (now > end) return 'closed';
        return 'active';
    };

    const getStatusBadge = (status: string) => {
        const badges = {
            active: { color: 'bg-green-100 text-green-600', icon: CheckCircle, label: 'Active' },
            scheduled: { color: 'bg-emerald-100 text-emerald-600', icon: Clock, label: 'Scheduled' },
            closed: { color: 'bg-gray-100 text-gray-500', icon: XCircle, label: 'Closed' },
            paused: { color: 'bg-amber-100 text-amber-600', icon: Pause, label: 'Paused' },
        };
        const badge = badges[status as keyof typeof badges] || badges.closed;
        const Icon = badge.icon;
        return (
            <span className={`inline-flex items-center gap-1 px-2 py-1 ${badge.color} text-xs font-medium rounded-full`}>
                <Icon className="w-3 h-3" />
                {badge.label}
            </span>
        );
    };

    const getTypeBadge = (type: string) => {
        // Match against both lowercase value and uppercase dbType
        const typeConfig = windowTypes.find(t => t.value === type || t.dbType === type);
        if (!typeConfig) return <span className="text-xs">{type}</span>;
        const Icon = typeConfig.icon;
        return (
            <span className={`inline-flex items-center gap-1 px-2 py-1 ${typeConfig.color} text-xs font-medium rounded-full`}>
                <Icon className="w-3 h-3" />
                {typeConfig.label}
            </span>
        );
    };

    const getTimeRemaining = (endDate: string) => {
        const end = new Date(endDate);
        const now = new Date();
        const diff = end.getTime() - now.getTime();

        if (diff < 0) return 'Ended';

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        if (days > 30) return `${Math.floor(days / 30)} months`;
        if (days > 0) return `${days} days`;

        const hours = Math.floor(diff / (1000 * 60 * 60));
        return `${hours} hours`;
    };

    // Filter Logic
    const filteredWindows = windows.filter(w => {
        const status = getStatus(w);
        return filterStatus === 'all' || status === filterStatus;
    });

    // Stats — compute from actual data
    const activeWindowsCount = windows.filter(w => getStatus(w) === 'active').length;
    const scheduledWindowsCount = windows.filter(w => getStatus(w) === 'scheduled').length;
    const totalRegistrations = windows.reduce((sum, w) => sum + (w.registrationsCount || 0), 0);

    // Actions
    const handleOpenModal = (window?: RegistrationWindow) => {
        if (window) {
            setEditingWindow(window);
            // Map DB uppercase type back to lowercase form value
            const typeConfig = windowTypes.find(t => t.dbType === window.type || t.value === window.type);
            setFormData({
                name: window.title,
                type: typeConfig?.value || window.type.toLowerCase(),
                startDate: new Date(window.startDate).toISOString().split('T')[0],
                endDate: new Date(window.endDate).toISOString().split('T')[0],
                baseFee: window.baseFee,
                description: window.description || '',
                instructions: window.instructions || ''
            });
        } else {
            setEditingWindow(null);
            setFormData({
                name: '',
                type: 'club',
                startDate: '',
                endDate: '',
                baseFee: 0,
                description: '',
                instructions: ''
            });
        }
        setShowModal(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            if (editingWindow) {
                await api.put(`/registration-windows/${editingWindow.id}`, formData);
            } else {
                await api.post('/registration-windows', formData);
            }
            setShowModal(false);
            fetchWindows();
        } catch (err: any) {
            alert(err.response?.data?.message || 'Operation failed');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this registration window?')) return;
        try {
            await api.delete(`/registration-windows/${id}`);
            fetchWindows();
        } catch (err: any) {
            alert(err.response?.data?.message || 'Delete failed');
        }
    };

    const toggleStatus = async (window: RegistrationWindow) => {
        try {
            await api.post(`/registration-windows/${window.id}/toggle-pause`, {});
            fetchWindows();
        } catch (err) {
            console.error('Failed to toggle status', err);
        }
    };

    const toggleRenewal = async (window: RegistrationWindow) => {
        try {
            await api.post(`/registration-windows/${window.id}/toggle-renewal`, {});
            fetchWindows();
        } catch (err) {
            console.error('Failed to toggle renewal', err);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Registration Windows</h1>
                    <p className="text-gray-500 mt-1">Manage registration periods for students, clubs, and events</p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 flex items-center gap-2"
                >
                    <Plus className="w-4 h-4" />
                    Create Window
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                            <CheckCircle className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900">{activeWindowsCount}</p>
                            <p className="text-sm text-gray-500">Active</p>
                        </div>
                    </div>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center">
                            <Clock className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900">{scheduledWindowsCount}</p>
                            <p className="text-sm text-gray-500">Scheduled</p>
                        </div>
                    </div>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-lg flex items-center justify-center">
                            <Users className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900">{totalRegistrations}</p>
                            <p className="text-sm text-gray-500">Total Registrations</p>
                        </div>
                    </div>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-500 rounded-lg flex items-center justify-center">
                            <CalendarClock className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900">{windows.length}</p>
                            <p className="text-sm text-gray-500">Total Windows</p>
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-4">
                <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-600" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search windows..."
                        className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                    />
                </div>
                <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                >
                    <option value="all">All Types</option>
                    {windowTypes.map(type => (
                        <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                </select>
                <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="scheduled">Scheduled</option>
                    <option value="paused">Paused</option>
                    <option value="closed">Closed</option>
                </select>
            </div>

            {/* Windows List */}
            <div className="space-y-4">
                {isLoading ? (
                    <div className="py-12 text-center">
                        <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mx-auto" />
                    </div>
                ) : filteredWindows.length === 0 ? (
                    <div className="py-12 text-center text-gray-500">
                        <CalendarClock className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p>No registration windows found</p>
                    </div>
                ) : (
                    filteredWindows.map((window, index) => {
                        const status = getStatus(window);
                        return (
                            <motion.div
                                key={window.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
                            >
                                <div className="p-6">
                                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                                        <div className="flex items-start gap-4">
                                            <div className="w-12 h-12 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 rounded-xl flex items-center justify-center shrink-0">
                                                <CalendarClock className="w-6 h-6 text-emerald-600" />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2 flex-wrap mb-1">
                                                    {getTypeBadge(window.type)}
                                                    {getStatusBadge(status)}
                                                    <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${window.renewalEnabled ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'}`}>
                                                            {window.renewalEnabled ? 'Renewal ON' : 'Renewal OFF'}
                                                        </span>
                                                </div>
                                                <h3 className="text-lg font-semibold text-gray-900">{window.title}</h3>
                                                <p className="text-sm text-gray-500 mt-1">{window.description}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-6 lg:gap-8">
                                            <div className="text-center">
                                                <p className="text-2xl font-bold text-gray-900">{window.registrationsCount ?? 0}</p>
                                                <p className="text-xs text-gray-500">Registrations</p>
                                            </div>
                                            <div className="text-center">
                                                <p className="text-lg font-semibold text-gray-900">{getTimeRemaining(window.endDate)}</p>
                                                <p className="text-xs text-gray-500">Remaining</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-4 pt-4 border-t border-gray-100 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                        <div className="flex items-center gap-6 text-sm text-gray-500">
                                            <div className="flex items-center gap-2">
                                                <Calendar className="w-4 h-4" />
                                                <span>Start: {new Date(window.startDate).toLocaleDateString('en-IN')}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Calendar className="w-4 h-4" />
                                                <span>End: {new Date(window.endDate).toLocaleDateString('en-IN')}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-gray-900 font-medium">
                                                <span>₹{window.baseFee}</span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 flex-wrap">
                                            {status !== 'closed' && (
                                                <button
                                                    onClick={() => toggleStatus(window)}
                                                    className={`px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1 ${window.isPaused
                                                        ? 'bg-green-100 text-green-600 hover:bg-green-200'
                                                        : 'bg-amber-100 text-amber-600 hover:bg-amber-200'
                                                        }`}
                                                >
                                                    {window.isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                                                    {window.isPaused ? 'Activate' : 'Pause'}
                                                </button>
                                            )}
                                            {status !== 'closed' && (
                                                <button
                                                    onClick={() => toggleRenewal(window)}
                                                    className={`px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1 ${window.renewalEnabled
                                                        ? 'bg-blue-100 text-blue-600 hover:bg-blue-200'
                                                        : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                                        }`}
                                                >
                                                    {window.renewalEnabled ? 'Disable Renewal' : 'Enable Renewal'}
                                                </button>
                                            )}
                                            <button
                                                onClick={() => handleOpenModal(window)}
                                                className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium flex items-center gap-1"
                                            >
                                                <Settings className="w-4 h-4" />
                                                Configure
                                            </button>
                                            <button
                                                onClick={() => handleDelete(window.id)}
                                                className="px-3 py-1.5 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 text-sm font-medium flex items-center gap-1"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })
                )}
            </div>

            {/* Create/Edit Modal */}
            <AnimatePresence>
                {showModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto border border-gray-200"
                        >
                            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                                <h2 className="text-xl font-bold text-gray-900">
                                    {editingWindow ? 'Edit Registration Window' : 'Create Registration Window'}
                                </h2>
                                <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-900">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="p-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-500 mb-2">Window Title</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="e.g., Club Affiliation 2025-26"
                                        className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-500 mb-2">Type</label>
                                    <select
                                        value={formData.type}
                                        onChange={e => setFormData({ ...formData, type: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                                    >
                                        {windowTypes.map(type => (
                                            <option key={type.value} value={type.value}>{type.label}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-500 mb-2">Start Date</label>
                                        <input
                                            type="date"
                                            required
                                            value={formData.startDate}
                                            onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                                            className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-500 mb-2">End Date</label>
                                        <input
                                            type="date"
                                            required
                                            value={formData.endDate}
                                            onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                                            className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-500 mb-2">Registration Fee (₹)</label>
                                    <input
                                        type="number"
                                        required
                                        min="0"
                                        value={formData.baseFee}
                                        onChange={e => setFormData({ ...formData, baseFee: Number(e.target.value) })}
                                        className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-500 mb-2">Description</label>
                                    <textarea
                                        value={formData.description}
                                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                                        rows={3}
                                        placeholder="Brief description of this window"
                                        className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                                    />
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setShowModal(false)}
                                        className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="flex-1 py-2.5 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 font-medium disabled:opacity-50"
                                    >
                                        {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : (editingWindow ? 'Save Changes' : 'Create Window')}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
