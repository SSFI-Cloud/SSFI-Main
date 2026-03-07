'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Building2,
    MapPin,
    Phone,
    Mail,
    Calendar,
    Search,
    CheckCircle,
    XCircle,
    Loader2,
    AlertCircle,
    RefreshCw,
    X,
    AlertTriangle,
} from 'lucide-react';
import { api } from '@/lib/api/client';
import { toast } from 'react-hot-toast';

// ─── Types ────────────────────────────────────────────────────────────────────

interface StateSecretary {
    id: string;
    uid: string;
    name: string;
    email: string;
    phone: string;
    state: { name: string; code: string };
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    createdAt: string;
}

const STATUS_FILTERS = ['PENDING', 'APPROVED', 'REJECTED', 'ALL'] as const;

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function StateSecretariesApprovalPage() {
    const [secretaries, setSecretaries]           = useState<StateSecretary[]>([]);
    const [loading, setLoading]                   = useState(true);
    const [error, setError]                       = useState<string | null>(null);
    const [actionLoading, setActionLoading]       = useState<string | null>(null);
    const [filter, setFilter]                     = useState<string>('PENDING');
    const [searchInput, setSearchInput]           = useState('');
    const [searchQuery, setSearchQuery]           = useState('');
    const [showRejectModal, setShowRejectModal]   = useState(false);
    const [rejectTarget, setRejectTarget]         = useState<StateSecretary | null>(null);
    const [rejectReason, setRejectReason]         = useState('');

    // ── Fetch ──────────────────────────────────────────────────────────────────

    const fetchSecretaries = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const params: Record<string, any> = {};
            if (filter !== 'ALL') params.status = filter;
            if (searchQuery) params.search = searchQuery;

            const res = await api.get('/state-secretaries', { params });
            const payload = (res.data as any).data ?? res.data;
            // backend may return { data: [...] } or { data: { data: [...] } }
            const list = Array.isArray(payload) ? payload
                : Array.isArray(payload?.data) ? payload.data
                : [];
            setSecretaries(list);
        } catch (err: any) {
            setError(err.response?.data?.message ?? 'Failed to load state secretaries');
        } finally {
            setLoading(false);
        }
    }, [filter, searchQuery]);

    useEffect(() => {
        fetchSecretaries();
    }, [fetchSecretaries]);

    // Debounce search
    useEffect(() => {
        const t = setTimeout(() => setSearchQuery(searchInput), 400);
        return () => clearTimeout(t);
    }, [searchInput]);

    // ── Actions ────────────────────────────────────────────────────────────────

    const handleApprove = async (sec: StateSecretary) => {
        setActionLoading(sec.id);
        try {
            await api.put(`/state-secretaries/${sec.id}/status`, { status: 'APPROVED' });
            toast.success(`${sec.name} approved`);
            fetchSecretaries();
        } catch (err: any) {
            toast.error(err.response?.data?.message ?? 'Failed to approve');
        } finally {
            setActionLoading(null);
        }
    };

    const openRejectModal = (sec: StateSecretary) => {
        setRejectTarget(sec);
        setShowRejectModal(true);
    };

    const handleReject = async () => {
        if (!rejectTarget) return;
        setActionLoading(rejectTarget.id);
        try {
            await api.put(`/state-secretaries/${rejectTarget.id}/status`, {
                status: 'REJECTED',
                remarks: rejectReason || undefined,
            });
            toast.success(`${rejectTarget.name}'s application rejected`);
            setShowRejectModal(false);
            setRejectTarget(null);
            setRejectReason('');
            fetchSecretaries();
        } catch (err: any) {
            toast.error(err.response?.data?.message ?? 'Failed to reject');
        } finally {
            setActionLoading(null);
        }
    };

    // ── Render ─────────────────────────────────────────────────────────────────

    const pendingCount = secretaries.filter(s => s.status === 'PENDING').length;

    return (
        <div className="space-y-6">

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">State Secretary Approvals</h1>
                    <p className="text-gray-500">Manage state secretary registrations</p>
                </div>
                <div className="flex items-center gap-3">
                    {filter === 'PENDING' && (
                        <div className="px-4 py-2 bg-amber-100 text-amber-600 rounded-lg flex items-center gap-2 text-sm font-medium">
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>{pendingCount} Pending</span>}
                        </div>
                    )}
                    <button
                        onClick={fetchSecretaries}
                        className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-900 rounded-lg transition-colors"
                        title="Refresh"
                    >
                        <RefreshCw className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Status Filter Tabs */}
            <div className="flex gap-2 flex-wrap">
                {STATUS_FILTERS.map(l => (
                    <button
                        key={l}
                        onClick={() => setFilter(l)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                            filter === l
                                ? 'bg-emerald-500 text-white'
                                : 'bg-white text-gray-500 hover:bg-gray-100 hover:text-gray-900'
                        }`}
                    >
                        {l === 'ALL' ? 'All' : l.charAt(0) + l.slice(1).toLowerCase()}
                    </button>
                ))}
            </div>

            {/* Search */}
            <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-600" />
                <input
                    type="text"
                    value={searchInput}
                    onChange={e => setSearchInput(e.target.value)}
                    placeholder="Search by name, email, or state…"
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                />
            </div>

            {/* Error */}
            {error && (
                <div className="bg-red-100 border border-red-500/30 text-red-600 p-4 rounded-lg flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <span>{error}</span>
                    <button onClick={fetchSecretaries} className="ml-auto text-xs underline">Retry</button>
                </div>
            )}

            {/* List */}
            {loading ? (
                <div className="flex justify-center py-16">
                    <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
                </div>
            ) : secretaries.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
                    <Building2 className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-500">No {filter === 'ALL' ? '' : filter.toLowerCase()} applications found</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {secretaries.map((sec, i) => (
                        <motion.div
                            key={sec.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.04 }}
                            className="bg-white rounded-2xl p-5 border border-gray-200 flex flex-col md:flex-row justify-between md:items-center gap-4"
                        >
                            <div className="space-y-2">
                                <div className="flex items-center gap-3 flex-wrap">
                                    <h3 className="text-lg font-semibold text-gray-900">{sec.name}</h3>
                                    <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-xs font-mono">{sec.uid}</span>
                                    <span className={`px-2 py-0.5 rounded text-xs font-medium border ${
                                        sec.status === 'APPROVED' ? 'bg-green-100 text-green-600 border-green-500/20'
                                        : sec.status === 'REJECTED' ? 'bg-red-100 text-red-600 border-red-500/20'
                                        : 'bg-yellow-100 text-yellow-600 border-yellow-500/20'
                                    }`}>
                                        {sec.status}
                                    </span>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-1 text-sm text-gray-500">
                                    <div className="flex items-center gap-2"><Mail className="w-4 h-4" /> {sec.email}</div>
                                    <div className="flex items-center gap-2"><Phone className="w-4 h-4" /> {sec.phone}</div>
                                    <div className="flex items-center gap-2 text-gray-900 font-medium">
                                        <MapPin className="w-4 h-4 text-gray-600" /> {sec.state.name} ({sec.state.code})
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Calendar className="w-4 h-4" /> Applied: {new Date(sec.createdAt).toLocaleDateString('en-IN')}
                                    </div>
                                </div>
                            </div>

                            {sec.status === 'PENDING' && (
                                <div className="flex items-center gap-3 shrink-0">
                                    <button
                                        onClick={() => handleApprove(sec)}
                                        disabled={actionLoading === sec.id}
                                        className="flex items-center gap-2 px-4 py-2 bg-green-100 hover:bg-green-100 text-green-600 rounded-lg border border-green-500/30 transition-colors disabled:opacity-50"
                                    >
                                        {actionLoading === sec.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                                        Approve
                                    </button>
                                    <button
                                        onClick={() => openRejectModal(sec)}
                                        disabled={actionLoading === sec.id}
                                        className="flex items-center gap-2 px-4 py-2 bg-red-100 hover:bg-red-100 text-red-600 rounded-lg border border-red-500/30 transition-colors disabled:opacity-50"
                                    >
                                        {actionLoading === sec.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                                        Reject
                                    </button>
                                </div>
                            )}
                        </motion.div>
                    ))}
                </div>
            )}

            {/* ── Reject Modal ── */}
            <AnimatePresence>
                {showRejectModal && rejectTarget && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
                        onClick={() => setShowRejectModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white rounded-2xl max-w-md w-full p-6"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <AlertTriangle className="w-6 h-6 text-gray-900" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 text-center mb-2">Reject Application</h3>
                            <p className="text-gray-500 text-center text-sm mb-6">
                                Rejecting <span className="text-gray-900 font-medium">{rejectTarget.name}</span>'s state secretary application.
                            </p>
                            <textarea
                                value={rejectReason}
                                onChange={e => setRejectReason(e.target.value)}
                                placeholder="Reason for rejection (optional)…"
                                rows={3}
                                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-red-500/50 resize-none mb-4"
                            />
                            <div className="flex gap-3">
                                <button
                                    onClick={() => { setShowRejectModal(false); setRejectReason(''); }}
                                    className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleReject}
                                    disabled={actionLoading === rejectTarget.id}
                                    className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium flex items-center justify-center gap-2 disabled:opacity-50 transition-colors"
                                >
                                    {actionLoading === rejectTarget.id ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Confirm Reject'}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
