
import { NextResponse } from "next/server";
import { PrismaClient } from "@/generated/prisma";
import crypto from "crypto";

const db = new PrismaClient();

// Get webhook secret from database
async function getWebhookSecret(): Promise<string> {
    const setting = await db.tbl_settings.findUnique({
        where: { setting_key: "razorpay_webhook_secret" }
    });
    return setting?.setting_value || "";
}

export async function POST(req: Request) {
    try {
        const body = await req.text();
        const signature = req.headers.get("x-razorpay-signature") || "";

        // Get webhook secret from DB
        const webhookSecret = await getWebhookSecret();

        // Verify signature if webhook secret is set
        if (webhookSecret) {
            const expectedSignature = crypto
                .createHmac("sha256", webhookSecret)
                .update(body)
                .digest("hex");

            if (signature !== expectedSignature) {
                console.error("Webhook signature mismatch");
                return NextResponse.json({ message: "Invalid signature" }, { status: 400 });
            }
        }

        const payload = JSON.parse(body);
        const event = payload.event;

        console.log("Razorpay Webhook Event:", event);

        // Handle payment.captured event
        if (event === "payment.captured") {
            const payment = payload.payload.payment.entity;

            // Log payment
            await db.tbl_payments.create({
                data: {
                    razorpay_payment_id: payment.id,
                    razorpay_order_id: payment.order_id || null,
                    amount: payment.amount / 100, // Convert from paise
                    currency: payment.currency,
                    status: payment.status,
                    purpose: payment.notes?.purpose === "event_registration" ? "event_registration" : "membership_renewal",
                    user_id: payment.notes?.userId ? Number(payment.notes.userId) : null,
                    skater_id: payment.notes?.skaterId ? Number(payment.notes.skaterId) : null,
                    event_id: payment.notes?.eventId ? Number(payment.notes.eventId) : null,
                    webhook_payload: payload
                }
            });

            // Handle registration confirmation
            if (payment.notes?.purpose === "event_registration" && payment.notes?.skaterId && payment.notes?.eventId) {
                await db.eventRegistration.updateMany({
                    where: {
                        skater_id: Number(payment.notes.skaterId),
                        event_id: Number(payment.notes.eventId)
                    },
                    data: {
                        payment_id: payment.id,
                        order_id: payment.order_id || null
                    }
                });
            }

            // Handle membership renewal
            if (payment.notes?.purpose === "membership_renewal" && payment.notes?.userId) {
                const expiryDate = new Date();
                expiryDate.setFullYear(expiryDate.getFullYear() + 1);

                await db.user.update({
                    where: { id: Number(payment.notes.userId) },
                    data: { expiry_date: expiryDate }
                });
            }
        }

        // Handle payment_link.paid event
        if (event === "payment_link.paid") {
            const paymentLink = payload.payload.payment_link.entity;
            const payment = payload.payload.payment.entity;

            // Update payment link status
            await db.tbl_payment_links.updateMany({
                where: { razorpay_link_id: paymentLink.id },
                data: {
                    status: "paid",
                    payment_id: payment.id,
                    paid_at: new Date()
                }
            });

            // Log payment
            await db.tbl_payments.create({
                data: {
                    razorpay_payment_id: payment.id,
                    razorpay_link_id: paymentLink.id,
                    amount: payment.amount / 100,
                    currency: payment.currency,
                    status: "captured",
                    purpose: paymentLink.notes?.purpose === "event_registration" ? "event_registration" : "membership_renewal",
                    user_id: paymentLink.notes?.userId ? Number(paymentLink.notes.userId) : null,
                    skater_id: paymentLink.notes?.skaterId ? Number(paymentLink.notes.skaterId) : null,
                    event_id: paymentLink.notes?.eventId ? Number(paymentLink.notes.eventId) : null,
                    webhook_payload: payload
                }
            });

            // Handle event registration
            if (paymentLink.notes?.purpose === "event_registration" && paymentLink.notes?.skaterId && paymentLink.notes?.eventId) {
                await db.eventRegistration.updateMany({
                    where: {
                        skater_id: Number(paymentLink.notes.skaterId),
                        event_id: Number(paymentLink.notes.eventId)
                    },
                    data: {
                        payment_id: payment.id
                    }
                });
            }
        }

        return NextResponse.json({ status: "ok" });
    } catch (e) {
        console.error("Webhook Error:", e);
        return NextResponse.json({ message: "Webhook processing failed" }, { status: 500 });
    }
}
