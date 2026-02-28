
import { NextResponse } from "next/server";
import { PrismaClient } from "@/generated/prisma";

const db = new PrismaClient();

// GET Razorpay settings (masked secret)
export async function GET() {
    try {
        const settings = await db.tbl_settings.findMany({
            where: {
                setting_key: {
                    in: ["razorpay_key_id", "razorpay_key_secret", "razorpay_webhook_secret"]
                }
            }
        });

        // Mask sensitive values
        const maskedSettings = settings.map(s => ({
            key: s.setting_key,
            value: s.is_encrypted
                ? (s.setting_value ? "••••••••" + (s.setting_value?.slice(-4) || "") : "")
                : s.setting_value,
            hasValue: !!s.setting_value
        }));

        return NextResponse.json(maskedSettings);
    } catch (e) {
        console.error("Settings GET Error:", e);
        return NextResponse.json({ message: "Error" }, { status: 500 });
    }
}

// POST - Update Razorpay settings
export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { keyId, keySecret, webhookSecret } = body;

        // Update settings
        const updates = [];

        if (keyId !== undefined) {
            updates.push(
                db.tbl_settings.upsert({
                    where: { setting_key: "razorpay_key_id" },
                    update: { setting_value: keyId },
                    create: { setting_key: "razorpay_key_id", setting_value: keyId, is_encrypted: false }
                })
            );
        }

        if (keySecret !== undefined && keySecret !== "") {
            updates.push(
                db.tbl_settings.upsert({
                    where: { setting_key: "razorpay_key_secret" },
                    update: { setting_value: keySecret },
                    create: { setting_key: "razorpay_key_secret", setting_value: keySecret, is_encrypted: true }
                })
            );
        }

        if (webhookSecret !== undefined && webhookSecret !== "") {
            updates.push(
                db.tbl_settings.upsert({
                    where: { setting_key: "razorpay_webhook_secret" },
                    update: { setting_value: webhookSecret },
                    create: { setting_key: "razorpay_webhook_secret", setting_value: webhookSecret, is_encrypted: true }
                })
            );
        }

        await Promise.all(updates);

        return NextResponse.json({ success: true, message: "Settings updated" });
    } catch (e) {
        console.error("Settings POST Error:", e);
        return NextResponse.json({ message: "Error updating settings" }, { status: 500 });
    }
}
