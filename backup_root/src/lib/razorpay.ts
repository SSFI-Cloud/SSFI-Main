
import Razorpay from "razorpay";

// Initialize Razorpay with test keys (replace with production keys in .env)
export const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || "rzp_test_xxxxxxxxxxxxx",
    key_secret: process.env.RAZORPAY_KEY_SECRET || "your_test_secret_key"
});

// Payment types
export type PaymentPurpose = "membership_renewal" | "event_registration";

export interface CreateOrderParams {
    amount: number; // Amount in paise (1 INR = 100 paise)
    currency?: string;
    receipt: string;
    notes?: Record<string, string>;
}

export async function createOrder(params: CreateOrderParams) {
    return razorpay.orders.create({
        amount: params.amount,
        currency: params.currency || "INR",
        receipt: params.receipt,
        notes: params.notes
    });
}
