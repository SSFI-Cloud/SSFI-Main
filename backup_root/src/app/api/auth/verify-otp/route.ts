
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const verifyOtpSchema = z.object({
    userId: z.number(),
    otp: z.string().length(6),
});

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const result = verifyOtpSchema.safeParse(body);

        if (!result.success) {
            return NextResponse.json(
                { message: "Validation failed", errors: result.error.flatten() },
                { status: 400 }
            );
        }

        const { userId, otp } = result.data;

        const user = await prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user) {
            return NextResponse.json({ message: "User not found" }, { status: 404 });
        }

        if (user.otp_verified) {
            return NextResponse.json(
                { message: "User already verified" },
                { status: 200 }
            );
        }

        if (!user.otp_code || user.otp_code !== otp) {
            return NextResponse.json({ message: "Invalid OTP" }, { status: 400 });
        }

        if (user.otp_expiry && new Date() > user.otp_expiry) {
            return NextResponse.json({ message: "OTP expired" }, { status: 400 });
        }

        // Verify user
        await prisma.user.update({
            where: { id: userId },
            data: {
                otp_verified: true,
                otp_code: null,
                otp_expiry: null,
                status: "active", // Activate user upon verification
            },
        });

        return NextResponse.json(
            { message: "OTP verified successfully" },
            { status: 200 }
        );
    } catch (error) {
        console.error("Verify OTP error:", error);
        return NextResponse.json(
            { message: "Internal server error" },
            { status: 500 }
        );
    }
}
