'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Shield,
    Search,
    CheckCircle,
    XCircle,
    Eye,
    ChevronLeft,
    ChevronRight,
    Loader2,
    Clock,
    MapPin,
    X,
    Check,
    AlertCircle,
    Building2,
    RefreshCw,
} from 'lucide-react';
import { api } from '@/lib/api/client';
import { toast } from 'react-hot-toast';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Club {
    id: number;
    membership_id: string;
    club_name: string;
    contact_person: string;
    mobile_number: string;
    email_address: string;
    registration_number: string;
    established_year: string;
    district_name: string;
    state_name: string;
    club_address: string;
    logo_path: string;
    created_at: string;
    status: string;
}

interface Meta {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ClubApprovalsPage() {
    const [clubs, setClubs]                       = useState<Club[]>([]);
    const [meta, setMeta]                         = useState<Meta>({ total: 0, page: 1, limit: 10, totalPages: 1 });
    const [searchInput, setSearchInput]           = useState('');
    const [searchQuery, setSearchQuery]           = useState('');
    const [currentPage, setCurrentPage]           = useState(1);
    const [isLoading, setIsLoading]               = useState(true);
    const [error, setError]                       = useState<string | null>(null);
    const [viewingClub, setViewingClub]           = useState<Club | null>(null);
    const [processingId, setProcessingId]         = useState<number | null>(null);
    const [rejectReason, setRejectReason]         = useState('');
    const [showRejectModal, setShowRejectModal]   = useState(false);
    const [selectedForReject, setSelectedForReject] = useState<Club | null>(null);

    const LIMIT = 10;

    // ── Fetch ──────────────────────────────────────────────────────────────────

    const fetchClubs = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const params: Record<string, any> = {
                status: 'PENDING',
                page: currentPage,
                limit: LIMIT,
            };
            if (searchQuery) params.search = searchQuery;

            const res = await api.get('/clubs', { params });
            const payload = (res.data as any).data ?? res.data;
            setClubs(payload.clubs ?? []);
            setMeta(payload.meta ?? { total: 0, page: 1, limit: LIMIT, totalPages: 1 });
        } catch (err: any) {
            if (err.response?.status === 404) {
                setClubs([]);
            } else {
                setError(err.response?.data?.message ?? 'Failed to load pending clubs');
            }
        } finally {
            setIsLoading(false);
        }
    }, [currentPage, searchQuery]);

    useEffect(() => {
        fetchClubs();
    }, [fetchClubs]);

    // Debounce search
    useEffect(() => {
        const t = setTimeout(() => {
            setCurrentPage(1);
            setSearchQuery(searchInput);
        }, 400);
        return () => clearTimeout(t);
    }, [searchInput]);

    // ── Actions ────────────────────────────────────────────────────────────────

    const handleApprove = async (club: Club) => {
        setProcessingId(club.id);
        try {
            await api.put(`/clubs/${club.id}/status`, { status: 'APPROVED' });
            toast.success(`${club.club_name} approved`);
            setViewingClub(null);
            fetchClubs();
        } catch (err: any) {
            toast.error(err.response?.data?.message ?? 'Failed to approve club');
        } finally {
            setProcessingId(null);
        }
    };

    const handleReject = async () => {
        if (!selectedForReject) return;
        setProcessingId(selectedForReject.id);
        try {
            await api.put(`/clubs/${selectedForReject.id}/status`, {
                status: 'REJECTED',
                remarks: rejectReason || undefined,
            });
            toast.success(`${selectedForReject.club_name} rejected`);
            setShowRejectModal(false);
            setSelectedForReject(null);
            setRejectReason('');
            setViewingClub(null);
            fetchClubs();
        } catch (err: any) {
            toast.error(err.response?.data?.message ?? 'Failed to reject club');
        } finally {
            setProcessingId(null);
        }
    };

    const openRejectModal = (club: Club) => {
        setSelectedForReject(club);
        setShowRejectModal(true);
    };

    // ── Render ─────────────────────────────────────────────────────────────────

    return (
        <div className="space-y-6">

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Club Approvals</h1>
                    <p className="text-gray-500 mt-1">Review and approve pending club registrations</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="px-4 py-2 bg-amber-100 text-amber-600 rounded-lg flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        <span className="font-medium">{meta.total} Pending</span>
                    </div>
                    <button
                        onClick={fetchClubs}
                        className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-900 rounded-lg transition-colors"
                        title="Refresh"
                    >
                        <RefreshCw className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Error */}
            {error && (
                <div className="bg-red-100 border border-red-500/30 text-red-600 p-4 rounded-lg flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <span>{error}</span>
                    <button onClick={fetchClubs} className="ml-auto text-xs underline">Retry</button>
                </div>
            )}

            {/* Search */}
            <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-600" />
                <input
                    type="text"
                    value={searchInput}
                    onChange={e => setSearchInput(e.target.value)}
                    placeholder="Search by club name or contact…"
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                />
            </div>

            {/* Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {isLoading ? (
                    <div className="col-span-full py-16 text-center">
                        <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mx-auto" />
                        <p className="text-gray-500 mt-2 text-sm">Loading pending clubs…</p>
                    </div>
                ) : clubs.length === 0 ? (
                    <div className="col-span-full py-16 text-center text-gray-500">
                        <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-600 opacity-50" />
                        <p>No pending club approvals</p>
                    </div>
                ) : (
                    clubs.map((club, index) => (
                        <motion.div
                            key={club.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
                        >
                            <div className="p-4">
                                <div className="flex items-start gap-3 mb-4">
                                    <div className="w-12 h-12 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 rounded-xl flex items-center justify-center shrink-0">
                                        <Shield className="w-6 h-6 text-white" />
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="font-semibold text-gray-900 truncate">{club.club_name}</h3>
                                        <p className="text-xs text-emerald-600 font-mono">{club.membership_id}</p>
                                    </div>
                                </div>
                                <div className="space-y-1.5 text-sm text-gray-500">
                                    <div className="flex items-center gap-2">
                                        <Building2 className="w-4 h-4 shrink-0" />
                                        <span className="truncate">{club.contact_person}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <MapPin className="w-4 h-4 shrink-0" />
                                        <span className="truncate">{club.district_name}, {club.state_name}</span>
                                    </div>
                                    <p className="text-xs text-gray-600 pt-2 border-t border-gray-100 mt-2">
                                        Submitted {new Date(club.created_at).toLocaleDateString('en-IN')}
                                    </p>
                                </div>
                            </div>
                            <div className="px-4 pb-4 flex gap-2">
                                <button
                                    onClick={() => setViewingClub(club)}
                                    className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-100 text-sm font-medium flex items-center justify-center gap-1 transition-colors"
                                >
                                    <Eye className="w-4 h-4" /> View
                                </button>
                                <button
                                    onClick={() => handleApprove(club)}
                                    disabled={processingId === club.id}
                                    className="flex-1 py-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 text-sm font-medium flex items-center justify-center gap-1 disabled:opacity-50 transition-colors"
                                >
                                    {processingId === club.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                                    Approve
                                </button>
                                <button
                                    onClick={() => openRejectModal(club)}
                                    className="py-2 px-3 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 text-sm font-medium transition-colors"
                                    title="Reject"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        </motion.div>
                    ))
                )}
            </div>

            {/* Pagination */}
            {meta.totalPages > 1 && (
                <div className="flex items-center justify-center gap-3">
                    <button
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="p-2 bg-gray-100 rounded-lg text-gray-500 hover:text-gray-900 disabled:opacity-40 transition-colors"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-gray-500 text-sm">Page {currentPage} of {meta.totalPages}</span>
                    <button
                        onClick={() => setCurrentPage(p => Math.min(meta.totalPages, p + 1))}
                        disabled={currentPage === meta.totalPages}
                        className="p-2 bg-gray-100 rounded-lg text-gray-500 hover:text-gray-900 disabled:opacity-40 transition-colors"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* ── Detail Modal ── */}
            <AnimatePresence>
                {viewingClub && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
                        onClick={() => setViewingClub(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white rounded-2xl max-w-2xl w-full"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 rounded-xl flex items-center justify-center">
                                        <Shield className="w-6 h-6 text-white" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-gray-900">{viewingClub.club_name}</h2>
                                        <p className="text-emerald-600 font-mono text-xs">{viewingClub.membership_id}</p>
                                    </div>
                                </div>
                                <button onClick={() => setViewingClub(null)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <div className="p-6">
                                <div className="grid grid-cols-2 gap-4 mb-6">
                                    {[
                                        { label: 'Contact Person', value: viewingClub.contact_person },
                                        { label: 'Mobile', value: viewingClub.mobile_number },
                                        { label: 'Email', value: viewingClub.email_address },
                                        { label: 'Reg. Number', value: viewingClub.registration_number },
                                        { label: 'Est. Year', value: viewingClub.established_year },
                                        { label: 'Location', value: `${viewingClub.district_name}, ${viewingClub.state_name}` },
                                    ].map(({ label, value }) => (
                                        <div key={label} className="bg-gray-50 rounded-xl p-4">
                                            <p className="text-xs text-gray-500 mb-1">{label}</p>
                                            <p className="font-medium text-gray-900 text-sm break-all">{value || '—'}</p>
                                        </div>
                                    ))}
                                </div>
                                <div className="flex gap-3 pt-4 border-t border-gray-200">
                                    <button
                                        onClick={() => handleApprove(viewingClub)}
                                        disabled={processingId === viewingClub.id}
                                        className="flex-1 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 font-medium flex items-center justify-center gap-2 disabled:opacity-50 transition-colors"
                                    >
                                        {processingId === viewingClub.id ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Check className="w-5 h-5" /> Approve</>}
                                    </button>
                                    <button
                                        onClick={() => openRejectModal(viewingClub)}
                                        className="flex-1 py-3 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 font-medium flex items-center justify-center gap-2 transition-colors"
                                    >
                                        <X className="w-5 h-5" /> Reject
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Reject Modal ── */}
            <AnimatePresence>
                {showRejectModal && selectedForReject && (
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
                            <h3 className="text-xl font-bold text-gray-900 text-center mb-2">Reject Club</h3>
                            <p className="text-gray-500 text-center text-sm mb-6">
                                Rejecting <span className="text-gray-900 font-medium">{selectedForReject.club_name}</span>
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
                                    disabled={processingId === selectedForReject.id}
                                    className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium flex items-center justify-center gap-2 disabled:opacity-50 transition-colors"
                                >
                                    {processingId === selectedForReject.id ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Confirm Reject'}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
