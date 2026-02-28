
import { NextResponse } from "next/server";
import { createOrder } from "@/lib/razorpay";
import { PrismaClient } from "@/generated/prisma";

const db = new PrismaClient();

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { userId, purpose, eventId, amount } = body;

        if (!userId || !purpose || !amount) {
            return NextResponse.json(
                { message: "userId, purpose, and amount are required" },
                { status: 400 }
            );
        }

        // Validate purpose
        if (!["membership_renewal", "event_registration"].includes(purpose)) {
            return NextResponse.json(
                { message: "Invalid purpose. Must be 'membership_renewal' or 'event_registration'" },
                { status: 400 }
            );
        }

        // Create receipt ID
        const receipt = `${purpose}_${userId}_${Date.now()}`;

        // Create Razorpay order
        const order = await createOrder({
            amount: amount * 100, // Convert to paise
            receipt,
            notes: {
                userId: String(userId),
                purpose,
                eventId: eventId ? String(eventId) : ""
            }
        });

        return NextResponse.json({
            orderId: order.id,
            amount: order.amount,
            currency: order.currency,
            receipt: order.receipt,
            keyId: process.env.RAZORPAY_KEY_ID || "rzp_test_xxxxxxxxxxxxx"
        });
    } catch (e) {
        console.error("Create Order Error:", e);
        return NextResponse.json(
            { message: "Failed to create order", error: String(e) },
            { status: 500 }
        );
    }
}
