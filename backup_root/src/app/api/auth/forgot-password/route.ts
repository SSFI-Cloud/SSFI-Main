
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateOTP } from "@/lib/auth";
import { z } from "zod";

const forgotPasswordSchema = z.object({
    identifier: z.string().min(1), // email or mobile
});

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const result = forgotPasswordSchema.safeParse(body);

        if (!result.success) {
            return NextResponse.json({ message: "Validation failed" }, { status: 400 });
        }

        const { identifier } = result.data;

        const user = await prisma.user.findFirst({
            where: {
                OR: [{ email_address: identifier }, { mobile_number: identifier }],
            },
        });

        if (!user) {
            // Return success even if user not found to prevent enumeration
            return NextResponse.json(
                { message: "If account exists, OTP sent." },
                { status: 200 }
            );
        }

        const otp = generateOTP();
        const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

        await prisma.user.update({
            where: { id: user.id },
            data: {
                otp_code: otp,
                otp_expiry: otpExpiry,
            },
        });

        // Send OTP (Shim)
        console.log(`[DEV ONLY] Password Reset OTP for ${user.email_address}: ${otp}`);

        return NextResponse.json({
            message: "If account exists, OTP sent.",
            devOtp: otp // Remove in prod
        });

    } catch (e) {
        console.error("Forgot Password Error:", e);
        return NextResponse.json({ message: "Internal Error" }, { status: 500 });
    }
}
