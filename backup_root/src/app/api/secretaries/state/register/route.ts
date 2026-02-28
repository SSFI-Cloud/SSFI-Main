
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, generateOTP } from "@/lib/auth";
import { uploadFile } from "@/lib/upload";
import { z } from "zod";

// Schema for State Secretary
// Note: We're accepting FormData, so we validate fields after parsing.
const secretarySchema = z.object({
    name: z.string().min(3),
    email: z.string().email(),
    mobile: z.string().min(10),
    aadhaar: z.string().length(12),
    address: z.string().min(10),
    stateId: z.string().transform((val) => parseInt(val, 10)), // FormData sends strings
    gender: z.enum(["Male", "Female", "Other"]),
    password: z.string().min(6), // Initial password set by secretary or system? Assuming secretary sets it strictly for now.
});

export async function POST(req: Request) {
    try {
        console.log("State Register: Request received");
        const formData = await req.formData();
        console.log("State Register: FormData parsed");

        // Extract fields
        const body = {
            name: formData.get("name") as string,
            email: formData.get("email") as string,
            mobile: formData.get("mobile") as string,
            aadhaar: formData.get("aadhaar") as string,
            address: formData.get("address") as string,
            stateId: formData.get("stateId") as string,
            gender: formData.get("gender") as string,
            password: formData.get("password") as string,
        };

        const photoFile = formData.get("profilePhoto") as File;
        const proofFile = formData.get("identityProof") as File;

        // Validate
        const result = secretarySchema.safeParse(body);
        if (!result.success) {
            console.error("State Register: Validation failed", result.error.flatten());
            return NextResponse.json(
                { message: "Validation failed", errors: result.error.flatten() },
                { status: 400 }
            );
        }

        if (!photoFile || !proofFile) {
            return NextResponse.json(
                { message: "Profile photo and identity proof are required" },
                { status: 400 }
            );
        }

        const { name, email, mobile, aadhaar, address, stateId, gender, password } = result.data;

        // Check duplicates
        const existingUser = await prisma.user.findFirst({
            where: {
                OR: [{ email_address: email }, { mobile_number: mobile }, { aadhar_number: aadhaar }],
            },
        });

        if (existingUser) {
            // More specific error message in production might leak info, but helpful here.
            return NextResponse.json(
                { message: "User with this email, mobile, or Aadhaar already exists" },
                { status: 409 }
            );
        }

        // Get State Code
        const state = await prisma.state.findUnique({
            where: { id: stateId }
        });

        if (!state) {
            return NextResponse.json({ message: "Invalid State ID" }, { status: 400 });
        }

        // Generate Unique ID: SSFI-[STATE_CODE]-[0001]
        // Count existing secretaries for this state to increment. 
        // We can filter by role or just generic user count in state if we want unique IDs per state user.
        // Spec says: SSFI-[STATE_CODE]-[0001].
        // Let's count users in this state with role STATE_ADMIN
        const count = await prisma.user.count({
            where: {
                state_id: stateId,
                role: "STATE_ADMIN"
            }
        });
        const sequence = (count + 1).toString().padStart(4, "0");
        const uniqueId = `SSFI-${state.code}-${sequence}`;

        // Upload files
        const photoPath = await uploadFile(photoFile, "profile-photos");
        const proofPath = await uploadFile(proofFile, "identity-proofs");

        if (!photoPath || !proofPath) {
            return NextResponse.json({ message: "File upload failed" }, { status: 500 });
        }

        const hashedPassword = await hashPassword(password);
        const otp = generateOTP();
        const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

        // Create User
        const newUser = await prisma.user.create({
            data: {
                username: uniqueId,
                password: hashedPassword,
                full_name: name,
                email_address: email,
                mobile_number: mobile,
                gender: gender as any,
                aadhar_number: aadhaar,
                residential_address: address,
                state_id: stateId,
                district_id: null, // Not applicable for State Secretary
                branch_id: 0,
                user_id: uniqueId,
                role: "STATE_ADMIN",
                profile_photo: photoPath,
                identity_proof: proofPath,
                created_by: 0, // Self-registered
                updated_by: 0,
                status: "inactive", // Pending approval or OTP verification logic
                otp_code: otp,
                otp_expiry: otpExpiry,
                otp_verified: false
            }
        });

        // Send OTP (Shim)
        console.log(`[DEV ONLY] State Secretary OTP for ${mobile}: ${otp}`);

        return NextResponse.json({
            message: "Registration successful. Please verify OTP.",
            userId: newUser.id,
            uniqueId: uniqueId
        }, { status: 201 });

    } catch (error) {
        console.error("State Secretary Register Error:", error);
        return NextResponse.json(
            { message: "Internal server error" },
            { status: 500 }
        );
    }
}
