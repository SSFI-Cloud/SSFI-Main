'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Copy, Download, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useRegistrationStore } from '@/lib/store/registrationStore';

export default function RegistrationSuccessPage() {
    const { studentUid, resetForm } = useRegistrationStore();
    const [copied, setCopied] = useState(false);

    const copyToClipboard = () => {
        if (studentUid) {
            navigator.clipboard.writeText(studentUid);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    useEffect(() => {
        // Clean up form state after showing success
        return () => {
            resetForm();
        };
    }, [resetForm]);

    return (
        <main className="min-h-screen bg-dark-950 flex items-center justify-center py-12 px-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="max-w-lg w-full"
            >
                <div className="bg-dark-800/50 backdrop-blur-xl rounded-2xl border border-white/10 p-8 text-center">
                    {/* Success Icon */}
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                        className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-accent-500/20 mb-6"
                    >
                        <CheckCircle2 className="w-12 h-12 text-accent-400" />
                    </motion.div>

                    {/* Title */}
                    <h1 className="text-3xl font-display font-bold text-white mb-2">
                        Registration Successful!
                    </h1>

                    <p className="text-gray-400 mb-8">
                        Your student registration has been submitted successfully.
                        Please save your unique ID below.
                    </p>

                    {/* UID Display */}
                    {studentUid && (
                        <div className="bg-dark-900/50 rounded-xl p-6 mb-8 border border-primary-500/20">
                            <p className="text-sm text-gray-400 mb-2">Your Student ID</p>
                            <div className="flex items-center justify-center gap-3">
                                <span className="text-2xl font-mono font-bold text-primary-400">
                                    {studentUid}
                                </span>
                                <button
                                    onClick={copyToClipboard}
                                    className="p-2 rounded-lg bg-primary-500/20 hover:bg-primary-500/30 text-primary-400 transition-colors"
                                    title="Copy to clipboard"
                                >
                                    {copied ? (
                                        <CheckCircle2 className="w-5 h-5" />
                                    ) : (
                                        <Copy className="w-5 h-5" />
                                    )}
                                </button>
                            </div>
                            {copied && (
                                <p className="text-sm text-accent-400 mt-2">Copied to clipboard!</p>
                            )}
                        </div>
                    )}

                    {/* Info Box */}
                    <div className="bg-blue-500/10 rounded-lg p-4 mb-8 border border-blue-500/20 text-left">
                        <h3 className="text-sm font-semibold text-blue-400 mb-2">What happens next?</h3>
                        <ul className="text-sm text-gray-300 space-y-2">
                            <li>• Your registration will be reviewed by your club admin</li>
                            <li>• You will receive a confirmation email once approved</li>
                            <li>• Your ID card will be generated after approval</li>
                        </ul>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col sm:flex-row gap-4">
                        <Link
                            href="/dashboard"
                            className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-primary-500 hover:bg-primary-600 text-white font-semibold transition-colors"
                        >
                            Go to Dashboard
                            <ArrowRight className="w-5 h-5" />
                        </Link>
                        <Link
                            href="/"
                            className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-white/5 hover:bg-white/10 text-white font-semibold border border-white/10 transition-colors"
                        >
                            Back to Home
                        </Link>
                    </div>
                </div>
            </motion.div>
        </main>
    );
}
