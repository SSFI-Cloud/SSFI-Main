"use client";

import { useState } from "react";

declare global {
    interface Window {
        Razorpay: any;
    }
}

interface PaymentButtonProps {
    amount: number;
    userId: number;
    purpose: "membership_renewal" | "event_registration";
    eventId?: number;
    onSuccess?: (paymentId: string) => void;
    onError?: (error: string) => void;
    buttonText?: string;
    className?: string;
}

export default function PaymentButton({
    amount,
    userId,
    purpose,
    eventId,
    onSuccess,
    onError,
    buttonText = "Pay Now",
    className = ""
}: PaymentButtonProps) {
    const [loading, setLoading] = useState(false);

    async function handlePayment() {
        setLoading(true);

        try {
            // 1. Create order
            const orderRes = await fetch("/api/payments/create-order", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId, purpose, eventId, amount })
            });

            const orderData = await orderRes.json();

            if (!orderRes.ok) {
                throw new Error(orderData.message || "Failed to create order");
            }

            // 2. Open Razorpay checkout
            const options = {
                key: orderData.keyId,
                amount: orderData.amount,
                currency: orderData.currency,
                name: "SSFI",
                description: purpose === "membership_renewal"
                    ? "Membership Renewal"
                    : "Event Registration",
                order_id: orderData.orderId,
                handler: async function (response: any) {
                    // 3. Verify payment
                    const verifyRes = await fetch("/api/payments/verify", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                            userId,
                            purpose,
                            eventId
                        })
                    });

                    const verifyData = await verifyRes.json();

                    if (verifyData.success) {
                        onSuccess?.(response.razorpay_payment_id);
                    } else {
                        onError?.(verifyData.message);
                    }
                },
                prefill: {
                    name: "",
                    email: "",
                    contact: ""
                },
                theme: {
                    color: "#1e3a8a"
                }
            };

            const rzp = new window.Razorpay(options);
            rzp.open();
        } catch (e: any) {
            onError?.(e.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <>
            {/* Load Razorpay SDK */}
            <script src="https://checkout.razorpay.com/v1/checkout.js" async />

            <button
                onClick={handlePayment}
                disabled={loading}
                className={`bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium transition disabled:opacity-50 ${className}`}
            >
                {loading ? "Processing..." : buttonText}
            </button>
        </>
    );
}
