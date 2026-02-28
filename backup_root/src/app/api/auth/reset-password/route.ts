
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import { z } from "zod";

const resetPasswordSchema = z.object({
    identifier: z.string().min(1),
    otp: z.string().length(6),
    newPassword: z.string().min(6),
});

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const result = resetPasswordSchema.safeParse(body);

        if (!result.success) {
            return NextResponse.json({ message: "Validation failed" }, { status: 400 });
        }

        const { identifier, otp, newPassword } = result.data;

        const user = await prisma.user.findFirst({
            where: {
                OR: [{ email_address: identifier }, { mobile_number: identifier }],
            },
        });

        if (!user) {
            return NextResponse.json({ message: "Invalid Request" }, { status: 400 });
        }

        if (user.otp_code !== otp) {
            return NextResponse.json({ message: "Invalid OTP" }, { status: 400 });
        }

        if (user.otp_expiry && new Date() > user.otp_expiry) {
            return NextResponse.json({ message: "OTP expired" }, { status: 400 });
        }

        const hashedPassword = await hashPassword(newPassword);

        await prisma.user.update({
            where: { id: user.id },
            data: {
                password: hashedPassword,
                otp_code: null,
                otp_expiry: null,
            },
        });

        return NextResponse.json({ message: "Password reset successful" });

    } catch (e) {
        console.error("Reset Password Error:", e);
        return NextResponse.json({ message: "Internal Error" }, { status: 500 });
    }
}
