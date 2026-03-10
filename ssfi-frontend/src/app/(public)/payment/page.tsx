'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import PaymentButton from '@/components/payment/PaymentButton';

const PAYMENT_TYPE_CONFIG: Record<string, { label: string; backLink: string; backLabel: string }> = {
    EVENT_REGISTRATION: { label: 'Event Registration', backLink: '/events', backLabel: 'Back to Events' },
    STUDENT_REGISTRATION: { label: 'Student Registration', backLink: '/register/student', backLabel: 'Back' },
    AFFILIATION_FEE: { label: 'Registration Fee', backLink: '/', backLabel: 'Back to Home' },
    CLUB_AFFILIATION: { label: 'Club Affiliation', backLink: '/register/club', backLabel: 'Back' },
    COACH_CERTIFICATION: { label: 'Coach Certification', backLink: '/coach-certification', backLabel: 'Back' },
    BEGINNER_CERTIFICATION: { label: 'Beginner Certification', backLink: '/beginner-certification', backLabel: 'Back' },
    MEMBERSHIP_RENEWAL: { label: 'Membership Renewal', backLink: '/dashboard', backLabel: 'Back to Dashboard' },
    DONATION: { label: 'Donation', backLink: '/', backLabel: 'Back to Home' },
};

function PaymentContent() {
    const searchParams = useSearchParams();
    const router = useRouter();

    const registrationId = searchParams.get('registrationId');
    const eventId = searchParams.get('eventId');
    const amountParam = searchParams.get('amount');
    const eventName = searchParams.get('eventName');
    const typeParam = searchParams.get('type') || 'EVENT_REGISTRATION';
    const entityType = searchParams.get('entityType') || 'event_registration';
    const description = searchParams.get('description');

    const [amount, setAmount] = useState<number>(0);

    useEffect(() => {
        if (amountParam) {
            setAmount(Number(amountParam));
        }
    }, [amountParam]);

    const config = PAYMENT_TYPE_CONFIG[typeParam] || PAYMENT_TYPE_CONFIG.EVENT_REGISTRATION;

    // For event registration, require registrationId + eventId
    // For other types, require at least registrationId (entity ID) + amount
    const isEventType = typeParam === 'EVENT_REGISTRATION';
    const entityId = registrationId ? Number(registrationId) : (eventId ? Number(eventId) : 0);

    if (isEventType && (!registrationId || !eventId)) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] text-center px-4">
                <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
                <h2 className="text-2xl font-bold text-white mb-2">Invalid Payment Link</h2>
                <p className="text-slate-400 mb-6">Missing registration details.</p>
                <Link href="/events" className="text-emerald-400 hover:text-emerald-300">
                    Browse Events
                </Link>
            </div>
        );
    }

    if (!entityId || !amount) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] text-center px-4">
                <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
                <h2 className="text-2xl font-bold text-white mb-2">Invalid Payment Link</h2>
                <p className="text-slate-400 mb-6">Missing payment details.</p>
                <Link href="/" className="text-emerald-400 hover:text-emerald-300">
                    Go Home
                </Link>
            </div>
        );
    }

    const backLink = isEventType && eventId ? `/events/${eventId}` : config.backLink;

    return (
        <div className="min-h-screen bg-slate-950 py-12">
            <div className="container mx-auto px-4 max-w-md">
                <Link
                    href={backLink}
                    className="inline-flex items-center gap-2 text-slate-400 hover:text-white mb-8 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    {config.backLabel}
                </Link>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl"
                >
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
                            <span className="text-2xl">💳</span>
                        </div>
                        <h1 className="text-xl font-bold text-white mb-2">Complete Payment</h1>
                        <p className="text-slate-400 text-sm">
                            {description || eventName || config.label}
                        </p>
                    </div>

                    <div className="bg-slate-800/50 rounded-xl p-4 mb-8 space-y-3">
                        {registrationId && (
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-slate-400">Reference ID</span>
                                <span className="text-white font-mono text-xs">{registrationId}</span>
                            </div>
                        )}
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-slate-400">Payment Type</span>
                            <span className="text-white">{config.label}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-slate-400">Amount to Pay</span>
                            <span className="text-xl font-bold text-green-400">₹{amount.toLocaleString('en-IN')}</span>
                        </div>
                    </div>

                    <PaymentButton
                        amount={amount}
                        paymentType={typeParam as any}
                        entityId={entityId}
                        entityType={entityType}
                        buttonText="Pay Securely"
                        className="w-full"
                        notes={{
                            ...(eventId && { eventId }),
                            ...(registrationId && { registrationId }),
                            type: typeParam,
                        }}
                        onSuccess={(payment) => {
                            setTimeout(() => {
                                router.push(`/payment/success?order_id=${encodeURIComponent(payment.razorpayOrderId || '')}&payment_id=${encodeURIComponent(payment.razorpayPaymentId || '')}&type=${typeParam}`);
                            }, 1500);
                        }}
                    />

                    <p className="text-xs text-slate-500 text-center mt-6">
                        By proceeding, you agree to our terms and cancellation policy.
                    </p>
                </motion.div>
            </div>
        </div>
    );
}

export default function PaymentPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-slate-950 flex items-center justify-center"><span className="text-slate-400">Loading payment details...</span></div>}>
            <PaymentContent />
        </Suspense>
    );
}
