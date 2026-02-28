
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, generateOTP } from "@/lib/auth";
import { uploadFile } from "@/lib/upload";
import { z } from "zod";

const districtSecretarySchema = z.object({
    name: z.string().min(3),
    email: z.string().email(),
    mobile: z.string().min(10),
    aadhaar: z.string().length(12),
    address: z.string().min(10),
    stateId: z.string().transform((val) => parseInt(val, 10)),
    districtId: z.string().transform((val) => parseInt(val, 10)),
    gender: z.enum(["Male", "Female", "Other"]),
    password: z.string().min(6),
});

export async function POST(req: Request) {
    try {
        const formData = await req.formData();

        const body = {
            name: formData.get("name") as string,
            email: formData.get("email") as string,
            mobile: formData.get("mobile") as string,
            aadhaar: formData.get("aadhaar") as string,
            address: formData.get("address") as string,
            stateId: formData.get("stateId") as string,
            districtId: formData.get("districtId") as string,
            gender: formData.get("gender") as string,
            password: formData.get("password") as string,
        };

        const photoFile = formData.get("profilePhoto") as File;
        const proofFile = formData.get("identityProof") as File;

        const result = districtSecretarySchema.safeParse(body);
        if (!result.success) {
            return NextResponse.json(
                { message: "Validation failed", errors: result.error.flatten() },
                { status: 400 }
            );
        }

        if (!photoFile || !proofFile) {
            return NextResponse.json({ message: "Files required" }, { status: 400 });
        }

        const { name, email, mobile, aadhaar, address, stateId, districtId, gender, password } = result.data;

        const existingUser = await prisma.user.findFirst({
            where: { OR: [{ email_address: email }, { mobile_number: mobile }, { aadhar_number: aadhaar }] }
        });

        if (existingUser) {
            return NextResponse.json({ message: "User exists" }, { status: 409 });
        }

        const state = await prisma.state.findUnique({ where: { id: stateId } });
        if (!state) return NextResponse.json({ message: "Invalid State" }, { status: 400 });

        // Assuming we might have District Code in DB or we generate/use ID.
        // Schema `tbl_districts` has `district_name` but no `code`. 
        // We'll generate a code like D01, D02 based on ID or just use ID padded.
        // Let's assume we use ID padded to 2 digits for now or 4.
        const districtCode = districtId.toString().padStart(4, "0");

        // Count existing District Secretaries in this district
        const count = await prisma.user.count({
            where: {
                state_id: stateId,
                district_id: districtId,
                role: "DISTRICT_ADMIN"
            }
        });

        // Unique ID: SSFI-[STATE_CODE]-[DIST_CODE]-[0001]
        const sequence = (count + 1).toString().padStart(4, "0");
        const uniqueId = `SSFI-${state.code}-${districtCode}-${sequence}`;

        const photoPath = await uploadFile(photoFile, "profile-photos");
        const proofPath = await uploadFile(proofFile, "identity-proofs");

        if (!photoPath || !proofPath) return NextResponse.json({ message: "Upload failed" }, { status: 500 });

        const hashedPassword = await hashPassword(password);
        const otp = generateOTP();
        const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

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
                district_id: districtId,
                branch_id: 0,
                user_id: uniqueId,
                role: "DISTRICT_ADMIN",
                profile_photo: photoPath,
                identity_proof: proofPath,
                created_by: 0,
                updated_by: 0,
                status: "inactive",
                otp_code: otp,
                otp_expiry: otpExpiry,
                otp_verified: false
            }
        });

        console.log(`[DEV ONLY] District Secretary OTP for ${mobile}: ${otp}`);

        return NextResponse.json({
            message: "Registration successful. Please verify OTP.",
            userId: newUser.id,
            uniqueId: uniqueId
        }, { status: 201 });

    } catch (error) {
        console.error("District Secretary Register Error:", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}
