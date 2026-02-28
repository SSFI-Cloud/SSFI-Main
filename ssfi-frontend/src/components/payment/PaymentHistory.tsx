'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    CreditCard,
    Search,
    Download,
    ChevronLeft,
    ChevronRight,
    CheckCircle,
    XCircle,
    Clock,
    RefreshCw,
    Calendar,
    Eye,
    Loader2,
} from 'lucide-react';
import apiClient from '@/lib/api/client';

interface Payment {
    id: number;
    razorpayOrderId: string;
    razorpayPaymentId: string | null;
    amount: number;
    status: string;
    paymentType: string;
    createdAt: string;
}

interface PaymentHistoryProps {
    limit?: number;
    showFilters?: boolean;
    showPagination?: boolean;
    title?: string;
}

export default function PaymentHistory({
    limit = 10,
    showFilters = true,
    showPagination = true,
    title = 'Payment History',
}: PaymentHistoryProps) {
    const [payments, setPayments] = useState<Payment[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [typeFilter, setTypeFilter] = useState<string>('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);

    useEffect(() => {
        fetchPayments();
    }, [currentPage, statusFilter, typeFilter]);

    const fetchPayments = async () => {
        setIsLoading(true);
        try {
            const params = new URLSearchParams({
                page: currentPage.toString(),
                limit: limit.toString(),
            });

            if (statusFilter !== 'all') params.append('status', statusFilter);
            if (typeFilter !== 'all') params.append('payment_type', typeFilter);

            const response = await apiClient.get(`/payments?${params}`);
            if (response.data.status === 'success') {
                setPayments(response.data.data.payments || []);
                setTotal(response.data.data.meta?.total || 0);
                setTotalPages(response.data.data.meta?.totalPages || 1);
            }
        } catch (error) {
            console.error('Failed to fetch payments:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const getStatusBadge = (status: string) => {
        const statusLower = status.toLowerCase();
        const badges: Record<string, { color: string; icon: typeof CheckCircle; label: string }> = {
            completed: { color: 'bg-green-500/20 text-green-400', icon: CheckCircle, label: 'Success' },
            captured: { color: 'bg-green-500/20 text-green-400', icon: CheckCircle, label: 'Success' },
            failed: { color: 'bg-red-500/20 text-red-400', icon: XCircle, label: 'Failed' },
            pending: { color: 'bg-amber-500/20 text-amber-400', icon: Clock, label: 'Pending' },
            refunded: { color: 'bg-purple-500/20 text-purple-400', icon: RefreshCw, label: 'Refunded' },
        };
        const badge = badges[statusLower] || badges.pending;
        const Icon = badge.icon;
        return (
            <span className={`inline-flex items-center gap-1 px-2 py-1 ${badge.color} text-xs font-medium rounded-full`}>
                <Icon className="w-3 h-3" />
                {badge.label}
            </span>
        );
    };

    const getTypeBadge = (type: string) => {
        const types: Record<string, { color: string; label: string }> = {
            STUDENT_REGISTRATION: { color: 'bg-blue-500/20 text-blue-400', label: 'Student' },
            CLUB_AFFILIATION: { color: 'bg-purple-500/20 text-purple-400', label: 'Club' },
            EVENT_REGISTRATION: { color: 'bg-amber-500/20 text-amber-400', label: 'Event' },
            MEMBERSHIP_RENEWAL: { color: 'bg-green-500/20 text-green-400', label: 'Renewal' },
            REGISTRATION: { color: 'bg-blue-500/20 text-blue-400', label: 'Registration' },
        };
        const typeConfig = types[type] || { color: 'bg-slate-500/20 text-slate-400', label: type };
        return <span className={`px-2 py-0.5 ${typeConfig.color} text-xs font-medium rounded`}>{typeConfig.label}</span>;
    };

    const filteredPayments = payments.filter(payment =>
        payment.razorpayOrderId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (payment.razorpayPaymentId && payment.razorpayPaymentId.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return (
        <div className="bg-slate-800/50 rounded-xl border border-slate-700/50">
            {/* Header */}
            <div className="p-4 border-b border-slate-700/50">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                        <CreditCard className="w-5 h-5 text-blue-400" />
                        {title}
                    </h2>
                    <button className="px-3 py-1.5 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600 text-sm flex items-center gap-2">
                        <Download className="w-4 h-4" />
                        Export
                    </button>
                </div>

                {/* Filters */}
                {showFilters && (
                    <div className="flex flex-col md:flex-row gap-3 mt-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search by order ID..."
                                className="w-full pl-9 pr-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                            />
                        </div>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white text-sm focus:outline-none"
                        >
                            <option value="all">All Status</option>
                            <option value="COMPLETED">Success</option>
                            <option value="FAILED">Failed</option>
                            <option value="PENDING">Pending</option>
                        </select>
                        <select
                            value={typeFilter}
                            onChange={(e) => setTypeFilter(e.target.value)}
                            className="px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white text-sm focus:outline-none"
                        >
                            <option value="all">All Types</option>
                            <option value="STUDENT_REGISTRATION">Student</option>
                            <option value="CLUB_AFFILIATION">Club</option>
                            <option value="EVENT_REGISTRATION">Event</option>
                            <option value="MEMBERSHIP_RENEWAL">Renewal</option>
                        </select>
                    </div>
                )}
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-slate-700/50">
                            <th className="px-4 py-3 text-left text-xs font-medium text-slate-400">Date</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-slate-400">Order ID</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-slate-400">Type</th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-slate-400">Amount</th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-slate-400">Status</th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-slate-400">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            <tr>
                                <td colSpan={6} className="px-4 py-12 text-center">
                                    <Loader2 className="w-8 h-8 text-blue-400 animate-spin mx-auto" />
                                </td>
                            </tr>
                        ) : filteredPayments.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-4 py-12 text-center text-slate-400">
                                    No payments found
                                </td>
                            </tr>
                        ) : (
                            filteredPayments.map((payment, index) => (
                                <motion.tr
                                    key={payment.id}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: index * 0.05 }}
                                    className="border-b border-slate-700/30 hover:bg-slate-700/20"
                                >
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2 text-slate-300">
                                            <Calendar className="w-4 h-4 text-slate-500" />
                                            <span className="text-sm">
                                                {new Date(payment.createdAt).toLocaleDateString('en-IN')}
                                            </span>
                                        </div>
                                        <p className="text-xs text-slate-500 mt-0.5 ml-6">
                                            {new Date(payment.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </td>
                                    <td className="px-4 py-3">
                                        <p className="font-mono text-sm text-blue-400">{payment.razorpayOrderId}</p>
                                        {payment.razorpayPaymentId && (
                                            <p className="font-mono text-xs text-slate-500 mt-0.5">{payment.razorpayPaymentId}</p>
                                        )}
                                    </td>
                                    <td className="px-4 py-3">
                                        {getTypeBadge(payment.paymentType)}
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <span className="font-semibold text-white">{formatCurrency(payment.amount)}</span>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        {getStatusBadge(payment.status)}
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center justify-end gap-2">
                                            <button className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white" title="View Details">
                                                <Eye className="w-4 h-4" />
                                            </button>
                                            {(payment.status === 'COMPLETED' || payment.status === 'captured') && (
                                                <button className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white" title="Download Receipt">
                                                    <Download className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </motion.tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {showPagination && totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-slate-700/50">
                    <p className="text-sm text-slate-400">
                        Showing {(currentPage - 1) * limit + 1} to {Math.min(currentPage * limit, total)} of {total}
                    </p>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="p-2 bg-slate-700 rounded-lg text-slate-400 hover:text-white disabled:opacity-50"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <span className="text-sm text-slate-400 px-2">
                            Page {currentPage} of {totalPages}
                        </span>
                        <button
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className="p-2 bg-slate-700 rounded-lg text-slate-400 hover:text-white disabled:opacity-50"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
