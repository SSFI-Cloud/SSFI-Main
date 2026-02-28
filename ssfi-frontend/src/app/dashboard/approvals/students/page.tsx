'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Users,
    Search,
    CheckCircle,
    XCircle,
    Eye,
    ChevronLeft,
    ChevronRight,
    Loader2,
    Clock,
    User,
    FileText,
    X,
    Check,
    AlertTriangle,
    AlertCircle,
    RefreshCw,
} from 'lucide-react';
import { api } from '@/lib/api/client';
import { toast } from 'react-hot-toast';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Student {
    id: number;
    ssfi_id: string;
    name: string;
    father_name: string;
    dob: string;
    gender: 'MALE' | 'FEMALE' | 'OTHER';
    mobile: string;
    email: string;
    club_name: string;
    club_id: number;
    district_name: string;
    state_name: string;
    coach_name: string;
    approval_status: string;
    profile_image: string | null;
    created_at: string;
}

interface Meta {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

interface Stats {
    total: number;
    verified: number;
    pending: number;
    male: number;
    female: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function calcAge(dob: string) {
    const birth = new Date(dob);
    const now = new Date();
    let age = now.getFullYear() - birth.getFullYear();
    const m = now.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
    return age;
}

function fmtDate(d: string) {
    return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function StudentApprovalsPage() {
    const [students, setStudents]               = useState<Student[]>([]);
    const [meta, setMeta]                       = useState<Meta>({ total: 0, page: 1, limit: 10, totalPages: 1 });
    const [stats, setStats]                     = useState<Stats | null>(null);
    const [searchQuery, setSearchQuery]         = useState('');
    const [searchInput, setSearchInput]         = useState('');
    const [currentPage, setCurrentPage]         = useState(1);
    const [isLoading, setIsLoading]             = useState(true);
    const [error, setError]                     = useState<string | null>(null);
    const [viewingStudent, setViewingStudent]   = useState<Student | null>(null);
    const [processingId, setProcessingId]       = useState<number | null>(null);
    const [rejectReason, setRejectReason]       = useState('');
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [selectedForReject, setSelectedForReject] = useState<Student | null>(null);
    // Bulk selection
    const [selectedIds, setSelectedIds]         = useState<Set<number>>(new Set());
    const [isBulkApproving, setIsBulkApproving] = useState(false);

    const LIMIT = 10;

    // ── Fetch ──────────────────────────────────────────────────────────────────

    const fetchStudents = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const params: Record<string, any> = {
                status: 'PENDING',
                page: currentPage,
                limit: LIMIT,
            };
            if (searchQuery) params.search = searchQuery;

            const res = await api.get('/students', { params });
            // backend: { status:'success', data:{ students, meta, stats } }
            const payload = (res.data as any).data ?? res.data;
            setStudents(payload.students ?? []);
            setMeta(payload.meta ?? { total: 0, page: 1, limit: LIMIT, totalPages: 1 });
            if (payload.stats) setStats(payload.stats);
            setSelectedIds(new Set()); // Clear selection on data refresh
        } catch (err: any) {
            const msg = err.response?.data?.message ?? 'Failed to load pending students';
            setError(msg);
        } finally {
            setIsLoading(false);
        }
    }, [currentPage, searchQuery]);

    useEffect(() => {
        fetchStudents();
    }, [fetchStudents]);

    // Debounce search
    useEffect(() => {
        const t = setTimeout(() => {
            setCurrentPage(1);
            setSearchQuery(searchInput);
        }, 400);
        return () => clearTimeout(t);
    }, [searchInput]);

    // ── Actions ────────────────────────────────────────────────────────────────

    const handleApprove = async (student: Student) => {
        setProcessingId(student.id);
        try {
            await api.put(`/students/${student.id}/status`, { status: 'APPROVED' });
            toast.success(`${student.name} approved successfully`);
            setViewingStudent(null);
            fetchStudents();
        } catch (err: any) {
            toast.error(err.response?.data?.message ?? 'Failed to approve student');
        } finally {
            setProcessingId(null);
        }
    };

    const handleReject = async () => {
        if (!selectedForReject) return;
        setProcessingId(selectedForReject.id);
        try {
            await api.put(`/students/${selectedForReject.id}/status`, {
                status: 'REJECTED',
                remarks: rejectReason || undefined,
            });
            toast.success(`${selectedForReject.name}'s registration rejected`);
            setShowRejectModal(false);
            setSelectedForReject(null);
            setRejectReason('');
            setViewingStudent(null);
            fetchStudents();
        } catch (err: any) {
            toast.error(err.response?.data?.message ?? 'Failed to reject student');
        } finally {
            setProcessingId(null);
        }
    };

    const openRejectModal = (student: Student) => {
        setSelectedForReject(student);
        setShowRejectModal(true);
    };

    // ── Bulk helpers ───────────────────────────────────────────────────────────

    const toggleSelect = (id: number) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    const toggleSelectAll = () => {
        if (selectedIds.size === students.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(students.map(s => s.id)));
        }
    };

    const handleBulkApprove = async () => {
        if (selectedIds.size === 0) return;
        setIsBulkApproving(true);
        const ids = Array.from(selectedIds);
        let successCount = 0;
        let failCount = 0;
        await Promise.all(
            ids.map(id =>
                api.put(`/students/${id}/status`, { status: 'APPROVED' })
                    .then(() => { successCount++; })
                    .catch(() => { failCount++; })
            )
        );
        setIsBulkApproving(false);
        setSelectedIds(new Set());
        if (successCount > 0) toast.success(`${successCount} student${successCount > 1 ? 's' : ''} approved`);
        if (failCount > 0) toast.error(`${failCount} approval${failCount > 1 ? 's' : ''} failed`);
        fetchStudents();
    };

    // ── Render ─────────────────────────────────────────────────────────────────

    return (
        <div className="space-y-6">

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Student Approvals</h1>
                    <p className="text-gray-500 mt-1">Review and approve pending student registrations</p>
                </div>
                <div className="flex items-center gap-3">
                    {/* Bulk approve bar — appears when any rows are selected */}
                    {selectedIds.size > 0 && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="flex items-center gap-2 px-3 py-2 bg-green-100 border border-green-500/40 rounded-lg"
                        >
                            <span className="text-green-600 text-sm font-medium">
                                {selectedIds.size} selected
                            </span>
                            <button
                                onClick={handleBulkApprove}
                                disabled={isBulkApproving}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white text-sm font-semibold rounded-lg disabled:opacity-60 transition-colors"
                            >
                                {isBulkApproving
                                    ? <Loader2 className="w-4 h-4 animate-spin" />
                                    : <CheckCircle className="w-4 h-4" />}
                                Approve All
                            </button>
                            <button
                                onClick={() => setSelectedIds(new Set())}
                                className="p-1 text-gray-500 hover:text-gray-900 rounded"
                            >
                                <XCircle className="w-4 h-4" />
                            </button>
                        </motion.div>
                    )}
                    {stats && (
                        <div className="px-4 py-2 bg-amber-100 text-amber-600 rounded-lg flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            <span className="font-medium">{stats.pending} Pending</span>
                        </div>
                    )}
                    <button
                        onClick={fetchStudents}
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
                    <button onClick={fetchStudents} className="ml-auto text-xs underline">Retry</button>
                </div>
            )}

            {/* Search */}
            <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-600" />
                <input
                    type="text"
                    value={searchInput}
                    onChange={e => setSearchInput(e.target.value)}
                    placeholder="Search by name, UID, or mobile..."
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-gray-100">
                                <th className="px-4 py-3 w-10">
                                    <input
                                        type="checkbox"
                                        checked={students.length > 0 && selectedIds.size === students.length}
                                        ref={el => { if (el) el.indeterminate = selectedIds.size > 0 && selectedIds.size < students.length; }}
                                        onChange={toggleSelectAll}
                                        className="w-4 h-4 rounded border-gray-200 bg-gray-100 text-green-500 focus:ring-green-500/50"
                                    />
                                </th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Student</th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Club</th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Location</th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Submitted</th>
                                <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr>
                                    <td colSpan={6} className="px-4 py-16 text-center">
                                        <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto" />
                                        <p className="text-gray-500 mt-2 text-sm">Loading pending students…</p>
                                    </td>
                                </tr>
                            ) : students.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-4 py-16 text-center">
                                        <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-600 opacity-50" />
                                        <p className="text-gray-500">No pending student approvals</p>
                                    </td>
                                </tr>
                            ) : (
                                students.map((student, index) => (
                                    <motion.tr
                                        key={student.id}
                                        initial={{ opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.04 }}
                                        className={`border-b border-gray-200/30 hover:bg-gray-50/60 ${
                                            selectedIds.has(student.id) ? 'bg-green-500/5' : ''
                                        }`}
                                    >
                                        <td className="px-4 py-3">
                                            <input
                                                type="checkbox"
                                                checked={selectedIds.has(student.id)}
                                                onChange={() => toggleSelect(student.id)}
                                                className="w-4 h-4 rounded border-gray-200 bg-gray-100 text-green-500 focus:ring-green-500/50"
                                            />
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${student.gender === 'MALE' ? 'bg-cyan-100' : 'bg-pink-100'}`}>
                                                    <User className={`w-5 h-5 ${student.gender === 'MALE' ? 'text-cyan-600' : 'text-pink-600'}`} />
                                                </div>
                                                <div>
                                                    <p className="font-medium text-gray-900">{student.name}</p>
                                                    <p className="text-xs text-gray-500 font-mono">{student.ssfi_id}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <p className="text-sm text-gray-900">{student.club_name}</p>
                                        </td>
                                        <td className="px-4 py-3">
                                            <p className="text-sm text-gray-700">{student.district_name}</p>
                                            <p className="text-xs text-gray-600">{student.state_name}</p>
                                        </td>
                                        <td className="px-4 py-3">
                                            <p className="text-sm text-gray-500">{fmtDate(student.created_at)}</p>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => setViewingStudent(student)}
                                                    className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-gray-900 transition-colors"
                                                    title="View Details"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleApprove(student)}
                                                    disabled={processingId === student.id}
                                                    className="p-2 hover:bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg text-green-600 hover:text-green-300 disabled:opacity-50 transition-colors"
                                                    title="Approve"
                                                >
                                                    {processingId === student.id
                                                        ? <Loader2 className="w-4 h-4 animate-spin" />
                                                        : <CheckCircle className="w-4 h-4" />}
                                                </button>
                                                <button
                                                    onClick={() => openRejectModal(student)}
                                                    className="p-2 hover:bg-gradient-to-br from-red-500 to-rose-600 rounded-lg text-red-600 hover:text-red-300 transition-colors"
                                                    title="Reject"
                                                >
                                                    <XCircle className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </motion.tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {meta.totalPages > 1 && (
                    <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
                        <p className="text-sm text-gray-500">
                            Showing {(meta.page - 1) * meta.limit + 1}–{Math.min(meta.page * meta.limit, meta.total)} of {meta.total}
                        </p>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="p-2 bg-gray-100 rounded-lg text-gray-500 hover:text-gray-900 disabled:opacity-40 transition-colors"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <span className="text-sm text-gray-500 px-2">
                                {currentPage} / {meta.totalPages}
                            </span>
                            <button
                                onClick={() => setCurrentPage(p => Math.min(meta.totalPages, p + 1))}
                                disabled={currentPage === meta.totalPages}
                                className="p-2 bg-gray-100 rounded-lg text-gray-500 hover:text-gray-900 disabled:opacity-40 transition-colors"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* ── Detail Modal ── */}
            <AnimatePresence>
                {viewingStudent && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
                        onClick={() => setViewingStudent(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                            onClick={e => e.stopPropagation()}
                        >
                            {/* Modal Header */}
                            <div className="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white z-10">
                                <div className="flex items-center gap-4">
                                    <div className={`w-14 h-14 rounded-full flex items-center justify-center ${viewingStudent.gender === 'MALE' ? 'bg-cyan-100' : 'bg-pink-100'}`}>
                                        <User className={`w-7 h-7 ${viewingStudent.gender === 'MALE' ? 'text-cyan-600' : 'text-pink-600'}`} />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-gray-900">{viewingStudent.name}</h2>
                                        <p className="text-blue-600 font-mono text-sm">{viewingStudent.ssfi_id}</p>
                                    </div>
                                </div>
                                <button onClick={() => setViewingStudent(null)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Modal Body */}
                            <div className="space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    {[
                                        { label: "Father's Name", value: viewingStudent.father_name || '—' },
                                        { label: 'Date of Birth', value: viewingStudent.dob ? `${fmtDate(viewingStudent.dob)} (${calcAge(viewingStudent.dob)} yrs)` : '—' },
                                        { label: 'Mobile', value: viewingStudent.mobile || '—' },
                                        { label: 'Email', value: viewingStudent.email || '—' },
                                        { label: 'Gender', value: viewingStudent.gender },
                                        { label: 'Coach', value: viewingStudent.coach_name || '—' },
                                    ].map(({ label, value }) => (
                                        <div key={label} className="bg-gray-50 rounded-xl p-4">
                                            <p className="text-xs text-gray-500 mb-1">{label}</p>
                                            <p className="font-medium text-gray-900 text-sm break-all">{value}</p>
                                        </div>
                                    ))}
                                    <div className="bg-gray-50 rounded-xl p-4 col-span-2">
                                        <p className="text-xs text-gray-500 mb-1">Club</p>
                                        <p className="font-medium text-gray-900">{viewingStudent.club_name}</p>
                                        <p className="text-sm text-gray-500">{viewingStudent.district_name}, {viewingStudent.state_name}</p>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex gap-3 pt-4 border-t border-gray-200">
                                    <button
                                        onClick={() => handleApprove(viewingStudent)}
                                        disabled={processingId === viewingStudent.id}
                                        className="flex-1 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 font-medium flex items-center justify-center gap-2 disabled:opacity-50 transition-colors"
                                    >
                                        {processingId === viewingStudent.id
                                            ? <Loader2 className="w-5 h-5 animate-spin" />
                                            : <><Check className="w-5 h-5" /> Approve</>}
                                    </button>
                                    <button
                                        onClick={() => openRejectModal(viewingStudent)}
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

            {/* ── Reject Reason Modal ── */}
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
                            className="bg-white rounded-2xl max-w-md w-full"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="p-6">
                                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <AlertTriangle className="w-6 h-6 text-gray-900" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 text-center mb-2">Reject Registration</h3>
                                <p className="text-gray-500 text-center text-sm mb-6">
                                    Rejecting <span className="text-gray-900 font-medium">{selectedForReject.name}</span>'s application. This action will notify the applicant.
                                </p>
                                <div className="mb-6">
                                    <label className="block text-sm font-medium text-gray-500 mb-2">
                                        Reason for rejection <span className="text-gray-600">(optional)</span>
                                    </label>
                                    <textarea
                                        value={rejectReason}
                                        onChange={e => setRejectReason(e.target.value)}
                                        placeholder="Enter reason…"
                                        rows={3}
                                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-red-500/50 resize-none"
                                    />
                                </div>
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
                                        {processingId === selectedForReject.id
                                            ? <Loader2 className="w-5 h-5 animate-spin" />
                                            : 'Confirm Reject'}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
