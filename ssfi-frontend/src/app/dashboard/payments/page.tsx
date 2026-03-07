'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    IndianRupee, Search, ArrowUpRight, ArrowDownRight, Download,
    CheckCircle, XCircle, Clock, CreditCard, Calendar,
    ChevronLeft, ChevronRight, Loader2, Wallet, TrendingUp, X, User, FileText,
} from 'lucide-react';
import { api } from '@/lib/api/client';
import { toast } from 'react-hot-toast';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Payment {
    id: number;
    amount: number;
    paymentType: string;
    status: string;
    razorpayOrderId: string;
    razorpayPaymentId?: string;
    description?: string;
    createdAt: string;
}

interface PaymentReceipt {
    id: number;
    amount: number;
    currency: string;
    paymentType: string;
    status: string;
    razorpayOrderId: string;
    razorpayPaymentId?: string;
    description?: string;
    createdAt: string;
    updatedAt: string;
    user: {
        name: string;
        uid: string;
        email: string;
        phone: string;
        role: string;
    };
}

interface PaymentStats {
    totalRevenue: number;
    thisMonthRevenue: number;
    monthGrowth: number;
    pendingCount: number;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PaymentsPage() {
    const [payments, setPayments] = useState<Payment[]>([]);
    const [meta, setMeta]         = useState({ total: 0, page: 1, limit: 10, totalPages: 1 });
    const [stats, setStats]       = useState<PaymentStats | null>(null);
    const [isLoading, setIsLoading]       = useState(true);
    const [statsLoading, setStatsLoading] = useState(true);
    const [searchInput, setSearchInput]   = useState('');
    const [searchQuery, setSearchQuery]   = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [page, setPage]                 = useState(1);
    const [exporting, setExporting]       = useState(false);

    // Receipt modal state
    const [receipt, setReceipt]           = useState<PaymentReceipt | null>(null);
    const [receiptLoading, setReceiptLoading] = useState(false);
    const [showReceipt, setShowReceipt]   = useState(false);

    // Debounce search
    useEffect(() => {
        const t = setTimeout(() => { setPage(1); setSearchQuery(searchInput); }, 400);
        return () => clearTimeout(t);
    }, [searchInput]);

    // Fetch stats cards
    const fetchStats = useCallback(async () => {
        setStatsLoading(true);
        try {
            const res = await api.get('/reports/payment-stats');
            setStats((res.data as any).data ?? res.data);
        } catch {
            // stats cards stay null — show "—"
        } finally {
            setStatsLoading(false);
        }
    }, []);

    // Fetch transaction list
    const fetchPayments = useCallback(async () => {
        setIsLoading(true);
        try {
            const params: Record<string, any> = { page, limit: 10 };
            if (searchQuery) params.search = searchQuery;
            if (filterStatus !== 'all') params.status = filterStatus;

            const res = await api.get('/payments/admin', { params });
            const payload = (res.data as any).data ?? res.data;

            // getPaymentsAdmin returns { payments, total } — no meta object
            const list  = payload.payments ?? [];
            const total = payload.total ?? list.length;
            setPayments(list);
            setMeta({ total, page, limit: 10, totalPages: Math.ceil(total / 10) });
        } catch (err: any) {
            toast.error(err.response?.data?.message ?? 'Failed to load payments');
        } finally {
            setIsLoading(false);
        }
    }, [page, searchQuery, filterStatus]);

    useEffect(() => { fetchStats(); }, [fetchStats]);
    useEffect(() => { fetchPayments(); }, [fetchPayments]);

    // View receipt
    const handleViewReceipt = async (paymentId: number) => {
        setReceiptLoading(true);
        setShowReceipt(true);
        try {
            const res = await api.get(`/payments/${paymentId}/receipt`);
            setReceipt((res.data as any).data ?? res.data);
        } catch {
            toast.error('Failed to load receipt details');
            setShowReceipt(false);
        } finally {
            setReceiptLoading(false);
        }
    };

    // Export payments CSV
    const handleExport = async () => {
        setExporting(true);
        try {
            const res = await api.get('/reports/payments-export', { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([res.data as unknown as BlobPart]));
            const a = document.createElement('a');
            a.href = url;
            a.download = `SSFI-Payments-${new Date().toISOString().split('T')[0]}.csv`;
            a.click();
            window.URL.revokeObjectURL(url);
            toast.success('Payments exported successfully');
        } catch {
            toast.error('Failed to export payments');
        } finally {
            setExporting(false);
        }
    };

    const formatCurrency = (n: number) =>
        new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'COMPLETED': return <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-600 text-xs font-medium rounded-full"><CheckCircle className="w-3 h-3" /> Successful</span>;
            case 'PENDING':   return <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-600 text-xs font-medium rounded-full"><Clock className="w-3 h-3" /> Pending</span>;
            case 'FAILED':    return <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-600 text-xs font-medium rounded-full"><XCircle className="w-3 h-3" /> Failed</span>;
            default:          return <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-500 text-xs font-medium rounded-full">{status}</span>;
        }
    };

    const StatSkeleton = () => <div className="h-9 w-32 bg-gray-100 animate-pulse rounded-lg" />;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Payments & Transactions</h1>
                    <p className="text-gray-500 mt-1">Manage and track all financial transactions</p>
                </div>
                <button onClick={handleExport} disabled={exporting}
                    className="px-4 py-2 bg-white text-gray-700 rounded-lg hover:bg-gray-100 flex items-center gap-2 border border-gray-200 self-start disabled:opacity-50">
                    {exporting ? <><Loader2 className="w-4 h-4 animate-spin" /> Exporting...</> : <><Download className="w-4 h-4" /> Export Report</>}
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Total Revenue */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-br from-teal-600 to-emerald-700 rounded-xl p-6 text-white shadow-lg">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-emerald-100 font-medium mb-1">Total Revenue</p>
                            {statsLoading ? <StatSkeleton /> : (
                                <h2 className="text-3xl font-bold">{formatCurrency(stats?.totalRevenue ?? 0)}</h2>
                            )}
                        </div>
                        <div className="p-2 bg-gray-200 rounded-lg ">
                            <IndianRupee className="w-6 h-6" />
                        </div>
                    </div>
                </motion.div>

                {/* This Month */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                    className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-gray-500 font-medium mb-1">This Month</p>
                            {statsLoading ? <StatSkeleton /> : (
                                <div className="flex items-baseline gap-2">
                                    <h2 className="text-3xl font-bold text-gray-900">{formatCurrency(stats?.thisMonthRevenue ?? 0)}</h2>
                                    {stats && (
                                        <span className={`text-xs flex items-center font-medium ${stats.monthGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                            {stats.monthGrowth >= 0
                                                ? <><ArrowUpRight className="w-3 h-3 mr-0.5" />+{stats.monthGrowth}%</>
                                                : <><ArrowDownRight className="w-3 h-3 mr-0.5" />{stats.monthGrowth}%</>}
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>
                        <div className="p-2 bg-green-100 rounded-lg">
                            <Wallet className="w-6 h-6 text-gray-900" />
                        </div>
                    </div>
                </motion.div>

                {/* Pending */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                    className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-gray-500 font-medium mb-1">Pending Transactions</p>
                            {statsLoading ? <StatSkeleton /> : (
                                <h2 className="text-3xl font-bold text-gray-900">{stats?.pendingCount ?? 0}</h2>
                            )}
                        </div>
                        <div className="p-2 bg-amber-100 rounded-lg">
                            <Clock className="w-6 h-6 text-gray-900" />
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-4 items-center justify-between bg-gray-50 p-4 rounded-xl border border-gray-100 shadow-sm">
                <div className="relative flex-1 min-w-[200px] max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-600" />
                    <input
                        type="text"
                        value={searchInput}
                        onChange={e => setSearchInput(e.target.value)}
                        placeholder="Search by Order ID or description…"
                        className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-900 placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                    />
                </div>
                <select
                    value={filterStatus}
                    onChange={e => { setFilterStatus(e.target.value); setPage(1); }}
                    className="px-4 py-2 bg-[#f5f6f8]/50 border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 min-w-[150px]"
                >
                    <option value="all">All Status</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="PENDING">Pending</option>
                    <option value="FAILED">Failed</option>
                </select>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-gray-100 bg-gray-500">
                                {['Transaction Details','Amount','Status','Date',''].map(h => (
                                    <th key={h} className={`px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider ${h === '' ? 'text-right' : 'text-left'}`}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200/30">
                            {isLoading ? (
                                <tr><td colSpan={5} className="px-6 py-12 text-center"><Loader2 className="w-8 h-8 text-emerald-600 animate-spin mx-auto" /></td></tr>
                            ) : payments.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                                        <CreditCard className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                        <p>No transactions found</p>
                                    </td>
                                </tr>
                            ) : payments.map((payment, index) => (
                                <motion.tr key={payment.id}
                                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.04 }}
                                    className="hover:bg-gray-50/60">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500">
                                                <CreditCard className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-900 text-sm">{payment.description || payment.paymentType}</p>
                                                <p className="text-xs text-gray-600 font-mono mt-0.5">{payment.razorpayOrderId}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className="text-gray-900 font-medium">{formatCurrency(Number(payment.amount))}</p>
                                        <p className="text-xs text-gray-600 uppercase">{payment.paymentType}</p>
                                    </td>
                                    <td className="px-6 py-4">{getStatusBadge(payment.status)}</td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2 text-sm text-gray-500">
                                            <Calendar className="w-3.5 h-3.5" />
                                            {new Date(payment.createdAt).toLocaleDateString('en-IN')}
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-gray-600 mt-1">
                                            <Clock className="w-3 h-3" />
                                            {new Date(payment.createdAt).toLocaleTimeString('en-IN')}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button
                                            onClick={() => handleViewReceipt(payment.id)}
                                            className="text-emerald-600 hover:text-emerald-800 text-sm font-medium hover:underline"
                                        >
                                            View
                                        </button>
                                    </td>
                                </motion.tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {meta.totalPages > 1 && (
                    <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
                        <p className="text-sm text-gray-500">
                            {(meta.page - 1) * meta.limit + 1}–{Math.min(meta.page * meta.limit, meta.total)} of {meta.total}
                        </p>
                        <div className="flex items-center gap-2">
                            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                                className="p-2 bg-gray-100 rounded-lg text-gray-500 hover:text-gray-900 disabled:opacity-50 transition-colors">
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <span className="text-sm text-gray-500 px-2">{page} / {meta.totalPages}</span>
                            <button onClick={() => setPage(p => Math.min(meta.totalPages, p + 1))} disabled={page === meta.totalPages}
                                className="p-2 bg-gray-100 rounded-lg text-gray-500 hover:text-gray-900 disabled:opacity-50 transition-colors">
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* ── Receipt Modal ─────────────────────────────────────────────────── */}
            <AnimatePresence>
                {showReceipt && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
                        onClick={() => setShowReceipt(false)}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
                            onClick={e => e.stopPropagation()}
                        >
                            {/* Modal Header */}
                            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                                <div className="flex items-center gap-2">
                                    <FileText className="w-5 h-5 text-emerald-600" />
                                    <h3 className="text-lg font-bold text-gray-900">Payment Receipt</h3>
                                </div>
                                <button onClick={() => setShowReceipt(false)} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                                    <X className="w-5 h-5 text-gray-500" />
                                </button>
                            </div>

                            {/* Modal Body */}
                            <div className="px-6 py-5">
                                {receiptLoading ? (
                                    <div className="flex items-center justify-center py-12">
                                        <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
                                    </div>
                                ) : receipt ? (
                                    <div className="space-y-5">
                                        {/* SSFI Header */}
                                        <div className="text-center pb-4 border-b border-gray-100">
                                            <h4 className="text-xl font-bold text-gray-900">SSFI</h4>
                                            <p className="text-xs text-gray-500 mt-0.5">Speed Skating Federation of India</p>
                                        </div>

                                        {/* Amount */}
                                        <div className="text-center py-3">
                                            <p className="text-sm text-gray-500 mb-1">Amount</p>
                                            <p className="text-3xl font-bold text-gray-900">{formatCurrency(receipt.amount)}</p>
                                            <div className="mt-2">{getStatusBadge(receipt.status)}</div>
                                        </div>

                                        {/* Details */}
                                        <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                                            {[
                                                { label: 'Payment Type', value: receipt.paymentType.replace(/_/g, ' ') },
                                                { label: 'Description', value: receipt.description || '—' },
                                                { label: 'Order ID', value: receipt.razorpayOrderId, mono: true },
                                                ...(receipt.razorpayPaymentId ? [{ label: 'Payment ID', value: receipt.razorpayPaymentId, mono: true }] : []),
                                                { label: 'Currency', value: receipt.currency },
                                                { label: 'Date', value: new Date(receipt.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' }) },
                                                { label: 'Time', value: new Date(receipt.createdAt).toLocaleTimeString('en-IN') },
                                            ].map(({ label, value, mono }: any) => (
                                                <div key={label} className="flex justify-between items-start gap-4">
                                                    <span className="text-sm text-gray-500 shrink-0">{label}</span>
                                                    <span className={`text-sm text-gray-900 font-medium text-right ${mono ? 'font-mono text-xs' : ''}`}>
                                                        {value}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>

                                        {/* User Info */}
                                        {receipt.user && (
                                            <div className="bg-emerald-50 rounded-xl p-4 space-y-3">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <User className="w-4 h-4 text-emerald-600" />
                                                    <span className="text-sm font-semibold text-emerald-900">Payer Details</span>
                                                </div>
                                                {[
                                                    { label: 'Name', value: receipt.user.name },
                                                    { label: 'UID', value: receipt.user.uid },
                                                    { label: 'Email', value: receipt.user.email },
                                                    { label: 'Phone', value: receipt.user.phone },
                                                    { label: 'Role', value: receipt.user.role?.replace(/_/g, ' ') },
                                                ].filter(r => r.value).map(({ label, value }) => (
                                                    <div key={label} className="flex justify-between items-start gap-4">
                                                        <span className="text-sm text-emerald-700/70 shrink-0">{label}</span>
                                                        <span className="text-sm text-emerald-900 font-medium text-right">{value}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {/* Footer */}
                                        <p className="text-xs text-gray-400 text-center pt-2">
                                            This is a system-generated receipt from SSFI.
                                        </p>
                                    </div>
                                ) : (
                                    <p className="text-center text-gray-500 py-8">Receipt not found</p>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
