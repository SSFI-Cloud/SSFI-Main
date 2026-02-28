
import { NextResponse } from "next/server";
import { PrismaClient } from "@/generated/prisma";
import Razorpay from "razorpay";

const db = new PrismaClient();

// Get Razorpay instance from DB settings
async function getRazorpay(): Promise<Razorpay | null> {
    const keyId = await db.tbl_settings.findUnique({
        where: { setting_key: "razorpay_key_id" }
    });
    const keySecret = await db.tbl_settings.findUnique({
        where: { setting_key: "razorpay_key_secret" }
    });

    if (!keyId?.setting_value || !keySecret?.setting_value) {
        return null;
    }

    return new Razorpay({
        key_id: keyId.setting_value,
        key_secret: keySecret.setting_value
    });
}

// GET - List payment links
export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const eventId = searchParams.get("eventId");

        const where: any = {};
        if (eventId) {
            where.event_id = Number(eventId);
        }

        const links = await db.tbl_payment_links.findMany({
            where,
            orderBy: { created_at: "desc" },
            take: 50
        });

        return NextResponse.json(links);
    } catch (e) {
        console.error("Payment Links GET Error:", e);
        return NextResponse.json({ message: "Error" }, { status: 500 });
    }
}

// POST - Create payment link
export async function POST(req: Request) {
    try {
        const razorpay = await getRazorpay();
        if (!razorpay) {
            return NextResponse.json(
                { message: "Razorpay not configured. Please set API keys in Admin Settings." },
                { status: 400 }
            );
        }

        const body = await req.json();
        const { purpose, amount, userId, skaterId, eventId, description, customerName, customerEmail, customerPhone } = body;

        if (!purpose || !amount) {
            return NextResponse.json(
                { message: "purpose and amount are required" },
                { status: 400 }
            );
        }

        // Create Razorpay payment link
        const linkOptions: any = {
            amount: amount * 100, // Convert to paise
            currency: "INR",
            accept_partial: false,
            description: description || (purpose === "event_registration"
                ? "Event Registration Fee"
                : "SSFI Membership Renewal"),
            notify: {
                sms: !!customerPhone,
                email: !!customerEmail
            },
            notes: {
                purpose,
                userId: String(userId || ""),
                skaterId: String(skaterId || ""),
                eventId: String(eventId || "")
            },
            callback_url: `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/payments/success`,
            callback_method: "get"
        };

        if (customerName) linkOptions.customer = { name: customerName };
        if (customerEmail && linkOptions.customer) linkOptions.customer.email = customerEmail;
        if (customerPhone && linkOptions.customer) linkOptions.customer.contact = customerPhone;

        const paymentLink = await razorpay.paymentLink.create(linkOptions);

        // Save to database
        await db.tbl_payment_links.create({
            data: {
                razorpay_link_id: paymentLink.id,
                purpose: purpose as any,
                user_id: userId ? Number(userId) : null,
                skater_id: skaterId ? Number(skaterId) : null,
                event_id: eventId ? Number(eventId) : null,
                amount,
                short_url: paymentLink.short_url,
                status: "created"
            }
        });

        return NextResponse.json({
            success: true,
            linkId: paymentLink.id,
            shortUrl: paymentLink.short_url,
            amount: Number(paymentLink.amount) / 100
        });
    } catch (e: any) {
        console.error("Payment Link Error:", e);
        return NextResponse.json(
            { message: "Failed to create payment link", error: e.message },
            { status: 500 }
        );
    }
}
