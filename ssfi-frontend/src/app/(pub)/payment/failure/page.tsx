'use client';

import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
    XCircle,
    RefreshCw,
    Home,
    Phone,
    Mail,
    AlertTriangle,
} from 'lucide-react';

export default function PaymentFailurePage() {
    const searchParams = useSearchParams();

    const orderId = searchParams.get('order_id');
    const errorCode = searchParams.get('error_code');
    const errorDescription = searchParams.get('error_description') || 'Payment could not be completed';

    return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-md w-full"
            >
                {/* Failure Card */}
                <div className="bg-slate-800 rounded-2xl overflow-hidden shadow-2xl">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-red-500/20 to-orange-500/20 p-8 text-center">
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                            className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4"
                        >
                            <XCircle className="w-12 h-12 text-red-400" />
                        </motion.div>
                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="text-2xl font-bold text-white"
                        >
                            Payment Failed
                        </motion.h1>
                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                            className="text-slate-400 mt-2"
                        >
                            We couldn't process your payment
                        </motion.p>
                    </div>

                    {/* Content */}
                    <div className="p-6 space-y-6">
                        {/* Error Message */}
                        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                            <div className="flex items-start gap-3">
                                <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-white font-medium">Error Details</p>
                                    <p className="text-slate-400 text-sm mt-1">{errorDescription}</p>
                                    {errorCode && (
                                        <p className="text-slate-500 text-xs mt-2">Error Code: {errorCode}</p>
                                    )}
                                    {orderId && (
                                        <p className="text-slate-500 text-xs">Order ID: {orderId}</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* What to do */}
                        <div className="space-y-3">
                            <h3 className="text-white font-medium">What can you do?</h3>
                            <ul className="space-y-2 text-sm text-slate-400">
                                <li className="flex items-start gap-2">
                                    <span className="text-emerald-400">•</span>
                                    Check if your card/bank has sufficient balance
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-emerald-400">•</span>
                                    Ensure your card is enabled for online transactions
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-emerald-400">•</span>
                                    Try using a different payment method
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-emerald-400">•</span>
                                    Contact your bank if the issue persists
                                </li>
                            </ul>
                        </div>

                        {/* Actions */}
                        <div className="space-y-3">
                            <Link
                                href="/dashboard"
                                className="w-full py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-lg hover:from-emerald-600 hover:to-emerald-700 flex items-center justify-center gap-2 transition-all"
                            >
                                <RefreshCw className="w-5 h-5" />
                                Try Again
                            </Link>

                            <Link
                                href="/dashboard"
                                className="w-full py-3 bg-slate-700 text-white rounded-lg hover:bg-slate-600 flex items-center justify-center gap-2 transition-colors"
                            >
                                <Home className="w-5 h-5" />
                                Go to Dashboard
                            </Link>
                        </div>

                        {/* Support */}
                        <div className="bg-slate-700/30 rounded-xl p-4">
                            <p className="text-slate-400 text-sm text-center mb-3">Need help? Contact our support team</p>
                            <div className="flex flex-col sm:flex-row gap-2">
                                <a
                                    href="tel:+911234567890"
                                    className="flex-1 py-2 px-4 bg-slate-600/50 rounded-lg text-slate-300 hover:bg-slate-600 flex items-center justify-center gap-2 text-sm transition-colors"
                                >
                                    <Phone className="w-4 h-4" />
                                    Call Support
                                </a>
                                <a
                                    href="mailto:support@speedskatingfederation.in"
                                    className="flex-1 py-2 px-4 bg-slate-600/50 rounded-lg text-slate-300 hover:bg-slate-600 flex items-center justify-center gap-2 text-sm transition-colors"
                                >
                                    <Mail className="w-4 h-4" />
                                    Email Support
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
