
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, generateOTP } from "@/lib/auth";
import { z } from "zod";

const registerSchema = z.object({
    name: z.string().min(3),
    email: z.string().email(),
    mobile: z.string().min(10),
    password: z.string().min(6),
    confirmPassword: z.string().min(6),
    role: z.enum(["STATE_ADMIN", "DISTRICT_ADMIN", "CLUB_ADMIN", "STUDENT"]).optional(),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
});

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const result = registerSchema.safeParse(body);

        if (!result.success) {
            return NextResponse.json(
                { message: "Validation failed", errors: result.error.flatten() },
                { status: 400 }
            );
        }

        const { name, email, mobile, password, role } = result.data;

        // Check if user exists
        const existingUser = await prisma.user.findFirst({
            where: {
                OR: [{ email_address: email }, { mobile_number: mobile }],
            },
        });

        if (existingUser) {
            return NextResponse.json(
                { message: "User already exists with this email or mobile" },
                { status: 409 }
            );
        }

        const hashedPassword = await hashPassword(password);
        const otp = generateOTP();
        const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        // Create user (unverified)
        // Note: Creating user with default valid fields.
        // user_id, branch_id, state_id, district_id are required in DB but not in simple register form yet.
        // Assuming we start with core fields and fill others or use defaults.
        // Schema says: branch_id, state_id, district_id are Int (NOT NULL).
        // This implies the registration form MUST provide state/district or we default them.
        // For now, I will use placeholder integers (e.g., 0) as defaults if not provided, assuming "Common" or "Pending".
        // Or I should request State/District in the form.
        // The Todo says "State Secretary Registration" has state dropdown. "Student" has multi-step.
        // This is a generic /register endpoint. I will assume for now we are testing auth flow.
        // I will add default values for required fields to bypass DB constraints for this test execution.

        const newUser = await prisma.user.create({
            data: {
                username: email, // Using email as username initially
                password: hashedPassword,
                full_name: name,
                email_address: email,
                mobile_number: mobile,
                gender: "Other", // Default
                aadhar_number: "PENDING", // Default
                residential_address: "PENDING", // Default
                identity_proof: "PENDING", // Default
                profile_photo: "PENDING", // Default
                user_id: `TEMP-${Date.now()}`, // Generic ID
                branch_id: 0,
                state_id: 0,
                district_id: 0,
                created_by: 0,
                updated_by: 0,
                otp_code: otp,
                otp_expiry: otpExpiry,
                otp_verified: false,
                role: role || "STUDENT",
            },
        });

        // In a real app, send SMS here.
        console.log(`[DEV ONLY] generated OTP for ${mobile}: ${otp}`);

        return NextResponse.json(
            { message: "Registration successful. OTP sent.", userId: newUser.id },
            { status: 201 }
        );
    } catch (error) {
        console.error("Registration error:", error);
        return NextResponse.json(
            { message: "Internal server error" },
            { status: 500 }
        );
    }
}
