"use client";

import PaymentButton from "@/components/PaymentButton";
import Link from "next/link";
import { useState } from "react";

export default function PaymentDemoPage() {
    const [status, setStatus] = useState<string>("");
    const [paymentId, setPaymentId] = useState<string>("");

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-blue-900 text-white py-4 px-6">
                <Link href="/" className="text-xl font-bold">SSFI</Link>
            </header>

            <main className="max-w-2xl mx-auto py-12 px-4">
                <h1 className="text-3xl font-bold mb-8 text-gray-800">Payment Demo</h1>

                {/* Membership Renewal Card */}
                <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
                    <h2 className="text-xl font-bold mb-2">Membership Renewal</h2>
                    <p className="text-gray-600 mb-4">
                        Renew your SSFI membership for 1 year
                    </p>
                    <div className="flex items-center justify-between">
                        <span className="text-2xl font-bold text-blue-600">₹500</span>
                        <PaymentButton
                            amount={500}
                            userId={1} // Demo user ID
                            purpose="membership_renewal"
                            buttonText="Renew Membership"
                            onSuccess={(id) => {
                                setPaymentId(id);
                                setStatus("success");
                            }}
                            onError={(err) => setStatus(`Error: ${err}`)}
                        />
                    </div>
                </div>

                {/* Event Registration Card */}
                <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
                    <h2 className="text-xl font-bold mb-2">Event Registration</h2>
                    <p className="text-gray-600 mb-4">
                        Register for State Championship 2026
                    </p>
                    <div className="flex items-center justify-between">
                        <span className="text-2xl font-bold text-blue-600">₹250</span>
                        <PaymentButton
                            amount={250}
                            userId={1} // Demo user ID
                            purpose="event_registration"
                            eventId={1} // Demo event ID
                            buttonText="Register & Pay"
                            onSuccess={(id) => {
                                setPaymentId(id);
                                setStatus("success");
                            }}
                            onError={(err) => setStatus(`Error: ${err}`)}
                        />
                    </div>
                </div>

                {/* Status Display */}
                {status && (
                    <div className={`p-4 rounded-lg ${status === "success"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}>
                        {status === "success" ? (
                            <div>
                                <p className="font-bold">✅ Payment Successful!</p>
                                <p className="text-sm">Payment ID: {paymentId}</p>
                            </div>
                        ) : (
                            <p>{status}</p>
                        )}
                    </div>
                )}

                {/* Instructions */}
                <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <h3 className="font-bold text-yellow-800">⚠️ Test Mode</h3>
                    <p className="text-sm text-yellow-700 mt-2">
                        This is using Razorpay test keys. To test payments:
                    </p>
                    <ol className="text-sm text-yellow-700 mt-2 list-decimal ml-4">
                        <li>Add your Razorpay test keys to `.env`</li>
                        <li>Use test card: 4111 1111 1111 1111</li>
                        <li>Any future expiry date and CVV</li>
                    </ol>
                </div>
            </main>
        </div>
    );
}
