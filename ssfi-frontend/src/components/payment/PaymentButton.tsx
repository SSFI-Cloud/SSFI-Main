'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2, CreditCard, CheckCircle, XCircle } from 'lucide-react';
import { usePayment } from '@/hooks/usePayment';
import type { PaymentType, PaymentRecord, RazorpayError } from '@/types/payment';

interface PaymentButtonProps {
    amount: number;
    paymentType: PaymentType;
    entityId: number;
    entityType: string;
    prefill?: {
        name?: string;
        email?: string;
        contact?: string;
    };
    notes?: Record<string, string>;
    buttonText?: string;
    className?: string;
    onSuccess?: (payment: PaymentRecord) => void;
    onFailure?: (error: RazorpayError) => void;
    disabled?: boolean;
}

export default function PaymentButton({
    amount,
    paymentType,
    entityId,
    entityType,
    prefill,
    notes,
    buttonText = 'Pay Now',
    className = '',
    onSuccess,
    onFailure,
    disabled = false,
}: PaymentButtonProps) {
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');

    const { initiatePayment, isLoading, error } = usePayment({
        onSuccess: (payment) => {
            setStatus('success');
            setMessage('Payment successful!');
            onSuccess?.(payment);
        },
        onFailure: (err) => {
            setStatus('error');
            setMessage(err.description || 'Payment failed');
            onFailure?.(err);
        },
        onDismiss: () => {
            setStatus('idle');
        },
    });

    const handleClick = async () => {
        setStatus('loading');
        setMessage('');

        await initiatePayment(
            {
                amount,
                payment_type: paymentType,
                entity_id: entityId,
                entity_type: entityType,
                notes,
            },
            prefill
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
            STUDENT_REGISTRATION: 'Student Registration',
            CLUB_AFFILIATION: 'Club Affiliation',
            EVENT_REGISTRATION: 'Event Registration',
            MEMBERSHIP_RENEWAL: 'Membership Renewal',
            COACH_CERTIFICATION: 'Coach Certification',
            BEGINNER_CERTIFICATION: 'Beginner Certification',
            AFFILIATION_FEE: 'Registration Fee',
            DONATION: 'Donation',
        };
        return names[type] || type;
    };

    return (
        <div className="space-y-2">
            <motion.button
                onClick={handleClick}
                disabled={disabled || isLoading || status === 'loading'}
                className={`
          relative flex items-center justify-center gap-2 px-6 py-3 
          bg-gradient-to-r from-emerald-500 to-emerald-600 
          text-white font-medium rounded-lg
          hover:from-emerald-600 hover:to-emerald-700
          disabled:opacity-50 disabled:cursor-not-allowed
          transition-all duration-200
          ${className}
        `}
                whileHover={{ scale: disabled ? 1 : 1.02 }}
                whileTap={{ scale: disabled ? 1 : 0.98 }}
            >
                {(isLoading || status === 'loading') ? (
                    <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Processing...</span>
                    </>
                ) : status === 'success' ? (
                    <>
                        <CheckCircle className="w-5 h-5" />
                        <span>Payment Successful</span>
                    </>
                ) : status === 'error' ? (
                    <>
                        <XCircle className="w-5 h-5" />
                        <span>Try Again</span>
                    </>
                ) : (
                    <>
                        <CreditCard className="w-5 h-5" />
                        <span>{buttonText}</span>
                        <span className="ml-1 font-bold">{formatCurrency(amount)}</span>
                    </>
                )}
            </motion.button>

            {/* Payment Info */}
            <div className="text-xs text-slate-500 text-center">
                {getPaymentTypeName(paymentType)} • Secure payment via Razorpay
            </div>

            {/* Error/Success Message */}
            {(error || message) && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`text-sm text-center ${status === 'success' ? 'text-green-400' : 'text-red-400'
                        }`}
                >
                    {error || message}
                </motion.div>
            )}
        </div>
    );
}
