"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";

function SuccessContent() {
    const searchParams = useSearchParams();
    const paymentId = searchParams.get("razorpay_payment_id");
    const linkId = searchParams.get("razorpay_payment_link_id");

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
            <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md text-center">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                </div>

                <h1 className="text-2xl font-bold text-gray-800 mb-2">Payment Successful!</h1>
                <p className="text-gray-600 mb-6">
                    Thank you for your payment. Your transaction has been completed successfully.
                </p>

                {paymentId && (
                    <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
                        <p className="text-sm text-gray-500">Payment ID</p>
                        <p className="font-mono text-sm break-all">{paymentId}</p>
                    </div>
                )}

                <div className="space-y-3">
                    <Link
                        href="/"
                        className="block w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium transition"
                    >
                        Go to Homepage
                    </Link>
                    <Link
                        href="/events"
                        className="block w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-lg font-medium transition"
                    >
                        View Events
                    </Link>
                </div>
            </div>
        </div>
    );
}

export default function PaymentSuccessPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
            <SuccessContent />
        </Suspense>
    );
}
