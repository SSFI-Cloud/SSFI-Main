
import { NextResponse } from "next/server";
import { PrismaClient } from "@/generated/prisma";
import crypto from "crypto";

const db = new PrismaClient();

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            userId,
            purpose,
            eventId
        } = body;

        // Verify signature
        const secret = process.env.RAZORPAY_KEY_SECRET || "your_test_secret_key";
        const generatedSignature = crypto
            .createHmac("sha256", secret)
            .update(`${razorpay_order_id}|${razorpay_payment_id}`)
            .digest("hex");

        if (generatedSignature !== razorpay_signature) {
            return NextResponse.json(
                { message: "Invalid payment signature" },
                { status: 400 }
            );
        }

        // Payment verified - update database based on purpose
        if (purpose === "membership_renewal" && userId) {
            // Update user expiry date (1 year from now)
            const expiryDate = new Date();
            expiryDate.setFullYear(expiryDate.getFullYear() + 1);

            await db.user.update({
                where: { id: Number(userId) },
                data: { expiry_date: expiryDate }
            });
        }

        if (purpose === "event_registration" && eventId) {
            // Update event registration with payment details
            await db.eventRegistration.updateMany({
                where: {
                    skater_id: Number(userId),
                    event_id: Number(eventId)
                },
                data: {
                    payment_id: razorpay_payment_id,
                    order_id: razorpay_order_id
                }
            });
        }

        return NextResponse.json({
            success: true,
            message: "Payment verified successfully",
            paymentId: razorpay_payment_id
        });
    } catch (e) {
        console.error("Verify Payment Error:", e);
        return NextResponse.json(
            { message: "Payment verification failed", error: String(e) },
            { status: 500 }
        );
    }
}
