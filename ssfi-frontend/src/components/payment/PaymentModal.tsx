'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X,
    CreditCard,
    Loader2,
    CheckCircle,
    XCircle,
    Shield,
    IndianRupee,
    User,
    Mail,
    Phone,
    FileText,
} from 'lucide-react';
import { usePayment } from '@/hooks/usePayment';
import type { PaymentType, PaymentRecord, RazorpayError } from '@/types/payment';

interface PaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    amount: number;
    paymentType: PaymentType;
    entityId: number;
    entityType: 'skater' | 'club' | 'event_registration';
    title?: string;
    description?: string;
    details?: { label: string; value: string }[];
    prefill?: {
        name?: string;
        email?: string;
        contact?: string;
    };
    notes?: Record<string, string>;
    onSuccess?: (payment: PaymentRecord) => void;
    onFailure?: (error: RazorpayError) => void;
}

export default function PaymentModal({
    isOpen,
    onClose,
    amount,
    paymentType,
    entityId,
    entityType,
    title = 'Complete Payment',
    description,
    details = [],
    prefill,
    notes,
    onSuccess,
    onFailure,
}: PaymentModalProps) {
    const [status, setStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');
    const [userPrefill, setUserPrefill] = useState({
        name: prefill?.name || '',
        email: prefill?.email || '',
        contact: prefill?.contact || '',
    });

    const { initiatePayment, isLoading, error } = usePayment({
        onSuccess: (payment) => {
            setStatus('success');
            setMessage('Payment completed successfully!');
            onSuccess?.(payment);
            setTimeout(() => {
                onClose();
                setStatus('idle');
            }, 2000);
        },
        onFailure: (err) => {
            setStatus('error');
            setMessage(err.description || 'Payment failed. Please try again.');
            onFailure?.(err);
        },
        onDismiss: () => {
            setStatus('idle');
        },
    });

    const handlePayment = async () => {
        setStatus('processing');
        setMessage('');

        await initiatePayment(
            {
                amount,
                payment_type: paymentType,
                entity_id: entityId,
                entity_type: entityType,
                notes,
            },
            userPrefill
        );
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0,
        }).format(value);
    };

    const getPaymentTypeName = (type: PaymentType): string => {
        const names: Record<PaymentType, string> = {
            STUDENT_REGISTRATION: 'Student Registration Fee',
            CLUB_AFFILIATION: 'Club Affiliation Fee',
            EVENT_REGISTRATION: 'Event Registration Fee',
            MEMBERSHIP_RENEWAL: 'Membership Renewal Fee',
        };
        return names[type] || type;
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    className="bg-slate-800 rounded-2xl max-w-md w-full overflow-hidden shadow-2xl"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="relative bg-gradient-to-r from-emerald-500/20 to-teal-500/20 p-6">
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 p-2.5 bg-slate-900/50 rounded-lg text-white hover:bg-slate-900/70"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                                <CreditCard className="w-7 h-7 text-emerald-400" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-white">{title}</h2>
                                <p className="text-slate-400 text-sm">{getPaymentTypeName(paymentType)}</p>
                            </div>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="p-6 space-y-6">
                        {/* Amount Display */}
                        <div className="bg-slate-700/30 rounded-xl p-4 text-center">
                            <p className="text-slate-400 text-sm mb-1">Amount to Pay</p>
                            <div className="flex items-center justify-center gap-1">
                                <IndianRupee className="w-8 h-8 text-white" />
                                <span className="text-4xl font-bold text-white">{amount.toLocaleString()}</span>
                            </div>
                        </div>

                        {/* Description */}
                        {description && (
                            <p className="text-slate-400 text-sm text-center">{description}</p>
                        )}

                        {/* Payment Details */}
                        {details.length > 0 && (
                            <div className="space-y-2">
                                <h3 className="text-sm font-medium text-slate-400 flex items-center gap-2">
                                    <FileText className="w-4 h-4" />
                                    Payment Details
                                </h3>
                                <div className="bg-slate-700/20 rounded-lg divide-y divide-slate-700/50">
                                    {details.map((detail, index) => (
                                        <div key={index} className="flex justify-between py-2 px-3">
                                            <span className="text-slate-400 text-sm">{detail.label}</span>
                                            <span className="text-white text-sm font-medium">{detail.value}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* User Details (Prefill) */}
                        <div className="space-y-3">
                            <h3 className="text-sm font-medium text-slate-400">Your Details</h3>
                            <div className="space-y-2">
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                    <input
                                        type="text"
                                        value={userPrefill.name}
                                        onChange={(e) => setUserPrefill({ ...userPrefill, name: e.target.value })}
                                        placeholder="Full Name"
                                        className="w-full pl-10 pr-4 py-2.5 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                                    />
                                </div>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                    <input
                                        type="email"
                                        value={userPrefill.email}
                                        onChange={(e) => setUserPrefill({ ...userPrefill, email: e.target.value })}
                                        placeholder="Email Address"
                                        className="w-full pl-10 pr-4 py-2.5 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                                    />
                                </div>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                    <input
                                        type="tel"
                                        value={userPrefill.contact}
                                        onChange={(e) => setUserPrefill({ ...userPrefill, contact: e.target.value })}
                                        placeholder="Mobile Number"
                                        className="w-full pl-10 pr-4 py-2.5 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Error/Success Message */}
                        {(error || message) && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`flex items-center gap-2 p-3 rounded-lg ${status === 'success'
                                        ? 'bg-green-500/20 text-green-400'
                                        : 'bg-red-500/20 text-red-400'
                                    }`}
                            >
                                {status === 'success' ? (
                                    <CheckCircle className="w-5 h-5" />
                                ) : (
                                    <XCircle className="w-5 h-5" />
                                )}
                                <span className="text-sm">{error || message}</span>
                            </motion.div>
                        )}

                        {/* Pay Button */}
                        <motion.button
                            onClick={handlePayment}
                            disabled={isLoading || status === 'processing' || status === 'success'}
                            className="w-full py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-semibold rounded-lg hover:from-emerald-600 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            {(isLoading || status === 'processing') ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Processing...
                                </>
                            ) : status === 'success' ? (
                                <>
                                    <CheckCircle className="w-5 h-5" />
                                    Payment Successful
                                </>
                            ) : (
                                <>
                                    <CreditCard className="w-5 h-5" />
                                    Pay {formatCurrency(amount)}
                                </>
                            )}
                        </motion.button>

                        {/* Security Badge */}
                        <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
                            <Shield className="w-4 h-4" />
                            <span>Secured by Razorpay • 256-bit SSL Encryption</span>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
