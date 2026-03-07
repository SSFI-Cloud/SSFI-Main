'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
    CheckCircle,
    Download,
    Home,
    FileText,
    Loader2,
    IndianRupee,
    Calendar,
    Hash,
} from 'lucide-react';
import apiClient from '@/lib/api/client';

interface PaymentDetails {
    razorpayOrderId: string;
    razorpayPaymentId: string;
    amount: number;
    status: string;
    paymentType: string;
    createdAt: string;
}

export default function PaymentSuccessPage() {
    const searchParams = useSearchParams();
    const [payment, setPayment] = useState<PaymentDetails | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const orderId = searchParams.get('order_id');
    const paymentId = searchParams.get('payment_id');

    useEffect(() => {
        const fetchPaymentDetails = async () => {
            if (!orderId) {
                setIsLoading(false);
                return;
            }

            try {
                const response = await apiClient.get(`/payments/status/${orderId}`);
                if (response.data.status === 'success') {
                    setPayment(response.data.data.payment);
                }
            } catch (error) {
                console.error('Failed to fetch payment details:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchPaymentDetails();
    }, [orderId]);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const getPaymentTypeName = (type: string): string => {
        const names: Record<string, string> = {
            STUDENT_REGISTRATION: 'Student Registration',
            CLUB_AFFILIATION: 'Club Affiliation',
            EVENT_REGISTRATION: 'Event Registration',
            MEMBERSHIP_RENEWAL: 'Membership Renewal',
            REGISTRATION: 'Registration',
        };
        return names[type] || type;
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 text-emerald-400 animate-spin mx-auto" />
                    <p className="text-slate-400 mt-4">Loading payment details...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-md w-full"
            >
                {/* Success Card */}
                <div className="bg-slate-800 rounded-2xl overflow-hidden shadow-2xl">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 p-8 text-center">
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                            className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4"
                        >
                            <CheckCircle className="w-12 h-12 text-green-400" />
                        </motion.div>
                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="text-2xl font-bold text-white"
                        >
                            Payment Successful!
                        </motion.h1>
                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                            className="text-slate-400 mt-2"
                        >
                            Thank you for your payment
                        </motion.p>
                    </div>

                    {/* Payment Details */}
                    <div className="p-6 space-y-4">
                        {/* Amount */}
                        <div className="bg-slate-700/30 rounded-xl p-4 text-center">
                            <p className="text-slate-400 text-sm mb-1">Amount Paid</p>
                            <div className="flex items-center justify-center gap-1">
                                <IndianRupee className="w-6 h-6 text-green-400" />
                                <span className="text-3xl font-bold text-white">
                                    {payment ? payment.amount.toLocaleString() : '0'}
                                </span>
                            </div>
                        </div>

                        {/* Details */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between py-2 border-b border-slate-700/50">
                                <div className="flex items-center gap-2 text-slate-400">
                                    <Hash className="w-4 h-4" />
                                    <span>Order ID</span>
                                </div>
                                <span className="text-white font-mono text-sm">{orderId || '-'}</span>
                            </div>

                            <div className="flex items-center justify-between py-2 border-b border-slate-700/50">
                                <div className="flex items-center gap-2 text-slate-400">
                                    <Hash className="w-4 h-4" />
                                    <span>Payment ID</span>
                                </div>
                                <span className="text-white font-mono text-sm">{paymentId || payment?.razorpayPaymentId || '-'}</span>
                            </div>

                            {payment && (
                                <>
                                    <div className="flex items-center justify-between py-2 border-b border-slate-700/50">
                                        <div className="flex items-center gap-2 text-slate-400">
                                            <FileText className="w-4 h-4" />
                                            <span>Payment For</span>
                                        </div>
                                        <span className="text-white text-sm">
                                            {getPaymentTypeName(payment.paymentType)}
                                        </span>
                                    </div>

                                    <div className="flex items-center justify-between py-2 border-b border-slate-700/50">
                                        <div className="flex items-center gap-2 text-slate-400">
                                            <Calendar className="w-4 h-4" />
                                            <span>Date</span>
                                        </div>
                                        <span className="text-white text-sm">
                                            {new Date(payment.createdAt).toLocaleDateString('en-IN', {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit',
                                            })}
                                        </span>
                                    </div>
                                </>
                            )}

                            <div className="flex items-center justify-between py-2">
                                <span className="text-slate-400">Status</span>
                                <span className="px-3 py-1 bg-green-500/20 text-green-400 text-sm font-medium rounded-full">
                                    {payment?.status || 'Successful'}
                                </span>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="space-y-3 pt-4">
                            <button className="w-full py-3 bg-slate-700 text-white rounded-lg hover:bg-slate-600 flex items-center justify-center gap-2 transition-colors">
                                <Download className="w-5 h-5" />
                                Download Receipt
                            </button>

                            <Link
                                href="/dashboard"
                                className="w-full py-3 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 flex items-center justify-center gap-2 transition-colors"
                            >
                                <Home className="w-5 h-5" />
                                Go to Dashboard
                            </Link>
                        </div>

                        {/* Support */}
                        <p className="text-center text-xs text-slate-500 pt-4">
                            For any queries, contact support at{' '}
                            <a href="mailto:support@speedskatingfederation.in" className="text-emerald-400 hover:underline">
                                support@speedskatingfederation.in
                            </a>
                        </p>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
