'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import PaymentButton from '@/components/payment/PaymentButton';

function PaymentContent() {
    const searchParams = useSearchParams();
    const router = useRouter();

    const registrationId = searchParams.get('registrationId');
    const eventId = searchParams.get('eventId');
    const amountParam = searchParams.get('amount');
    const eventName = searchParams.get('eventName');

    const [amount, setAmount] = useState<number>(0);

    useEffect(() => {
        if (amountParam) {
            setAmount(Number(amountParam));
        }
    }, [amountParam]);

    if (!registrationId || !eventId) {
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

    return (
        <div className="min-h-screen bg-slate-950 py-12">
            <div className="container mx-auto px-4 max-w-md">
                <Link
                    href={`/events/${eventId}`}
                    className="inline-flex items-center gap-2 text-slate-400 hover:text-white mb-8 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Event
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
                            {eventName || 'Event Registration'}
                        </p>
                    </div>

                    <div className="bg-slate-800/50 rounded-xl p-4 mb-8 space-y-3">
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-slate-400">Registration ID</span>
                            <span className="text-white font-mono">{registrationId}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-slate-400">Amount to Pay</span>
                            <span className="text-xl font-bold text-green-400">₹{amount}</span>
                        </div>
                    </div>

                    <PaymentButton
                        amount={amount}
                        paymentType="EVENT_REGISTRATION"
                        entityId={Number(registrationId)}
                        entityType="event_registration"
                        buttonText="Pay Securely"
                        className="w-full"
                        notes={{
                            eventId: eventId,
                            registrationId: registrationId
                        }}
                        onSuccess={(payment) => {
                            setTimeout(() => {
                                router.push(`/payment/success?order_id=${encodeURIComponent(payment.razorpayOrderId || '')}&payment_id=${encodeURIComponent(payment.razorpayPaymentId || '')}`);
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
