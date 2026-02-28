
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, generateOTP } from "@/lib/auth";
import { uploadFile } from "@/lib/upload";
import { z } from "zod";

const clubSchema = z.object({
    clubName: z.string().min(3),
    regNumber: z.string().optional(),
    contactPerson: z.string().min(3), // Owner/Admin
    email: z.string().email(),
    mobile: z.string().min(10),
    address: z.string().min(10),
    stateId: z.string().transform((val) => parseInt(val, 10)),
    districtId: z.string().transform((val) => parseInt(val, 10)),
    password: z.string().min(6),
    // Additional fields based on schema: tshirt_size, established_year
    tshirtSize: z.string().optional(),
    estYear: z.string().optional(),
    aadhaar: z.string().min(12).optional(), // Club admin aadhaar
});

export async function POST(req: Request) {
    try {
        const formData = await req.formData();

        // Extract fields
        const body = {
            clubName: formData.get("clubName") as string,
            regNumber: formData.get("regNumber") as string,
            contactPerson: formData.get("contactPerson") as string,
            email: formData.get("email") as string,
            mobile: formData.get("mobile") as string,
            address: formData.get("address") as string,
            stateId: formData.get("stateId") as string,
            districtId: formData.get("districtId") as string,
            password: formData.get("password") as string,
            tshirtSize: (formData.get("tshirtSize") as string) || undefined,
            estYear: (formData.get("estYear") as string) || undefined,
            aadhaar: (formData.get("aadhaar") as string) || undefined,
        };

        const logoFile = formData.get("clubLogo") as File;
        const proofFile = formData.get("identityProof") as File; // Club Admin proof

        const result = clubSchema.safeParse(body);
        if (!result.success) {
            return NextResponse.json(
                { message: "Validation failed", errors: result.error.flatten() },
                { status: 400 }
            );
        }

        if (!logoFile) return NextResponse.json({ message: "Club logo required" }, { status: 400 });

        const { clubName, regNumber, contactPerson, email, mobile, address, stateId, districtId, password, tshirtSize, estYear, aadhaar } = result.data;

        // Check Duplicate Club (Email/Mobile typically checks User, but here checking Club table primarily?)
        // Actually per schema, we create a Club entry AND a User entry (for the admin).
        // Let's check User first.
        const existingUser = await prisma.user.findFirst({
            where: { OR: [{ email_address: email }, { mobile_number: mobile }] }
        });
        if (existingUser) return NextResponse.json({ message: "Admin user already exists" }, { status: 409 });

        const state = await prisma.state.findUnique({ where: { id: stateId } });
        if (!state) return NextResponse.json({ message: "Invalid State" }, { status: 400 });

        const districtCode = districtId.toString().padStart(4, "0");

        // Create Club Entry First
        const logoPath = await uploadFile(logoFile, "club-logos");
        const proofPath = proofFile ? await uploadFile(proofFile, "identity-proofs") : null;

        // Generate Club Code (Count clubs in district)
        const clubCount = await prisma.club.count({
            where: { district_id: districtId }
        });
        const clubCode = (clubCount + 1).toString().padStart(4, "0");

        // Unique ID for Club: SSFI-[STATE_CODE]-[DIST_CODE]-[CLUB_CODE]-[0001]
        // Wait, the unique ID format in Todo is `SSFI-[STATE_CODE]-[DIST_CODE]-[CLUB_CODE]-[0001]`.
        // This implies the ID is for the USER (Secretarty/Admin) of the club? Or the Club itself?
        // "Club Registration -> Generate Unique ID".
        // Usually Clubs have a Reg No.
        // Let's assume this is the Club's System ID or the Club Admin's ID.
        // Given the previous patterns, it's likely the User ID for the Club Admin.
        // But Club has "registration_number" field too.
        // Let's generate a Club System ID: `SSFI-C-${state.code}-${districtCode}-${clubCode}`?
        // The Todo format `SSFI-[STATE_CODE]-[DIST_CODE]-[CLUB_CODE]-[0001]` seems to imply multiple users per club?
        // [0001] being the user sequence in that club.
        // So the Club ID would be `SSFI-[STATE_CODE]-[DIST_CODE]-[CLUB_CODE]`.

        // Let's Construct Club System ID roughly:
        const clubSystemId = `${state.code}${districtCode}${clubCode}`; // Simplified internal reference

        const newClub = await prisma.club.create({
            data: {
                club_name: clubName,
                registration_number: regNumber,
                contact_person: contactPerson,
                mobile_number: mobile,
                email_address: email,
                district_id: districtId,
                state_id: stateId,
                club_address: address,
                tshirt_size: tshirtSize,
                established_year: estYear,
                logo_path: logoPath,
                status: "inactive",
                verified: 0,
                passport: null, // Additional docs if needed
                proof: proofPath,
                aadhar_number: aadhaar
            }
        });

        // Valid Club Admin User ID
        const userSequence = "0001"; // First admin
        const uniqueId = `SSFI-${state.code}-${districtCode}-${clubCode}-${userSequence}`;

        const hashedPassword = await hashPassword(password);
        const otp = generateOTP();
        const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

        // Create User (Club Admin)
        const newUser = await prisma.user.create({
            data: {
                username: uniqueId,
                password: hashedPassword,
                full_name: contactPerson,
                email_address: email,
                mobile_number: mobile,
                gender: "Other", // Default if not asked
                aadhar_number: aadhaar || "PENDING",
                residential_address: address,
                state_id: stateId,
                district_id: districtId,
                club_id: newClub.id, // Link to Club
                branch_id: 0,
                user_id: uniqueId,
                role: "CLUB_ADMIN",
                profile_photo: logoPath || "PENDING",
                identity_proof: proofPath || "PENDING",
                created_by: 0,
                updated_by: 0,
                status: "inactive",
                otp_code: otp,
                otp_expiry: otpExpiry,
                otp_verified: false
            }
        });

        console.log(`[DEV ONLY] Club Admin OTP for ${mobile}: ${otp}`);

        return NextResponse.json({
            message: "Club Registration successful. please verify OTP.",
            clubId: newClub.id,
            userId: newUser.id,
            uniqueId: uniqueId
        }, { status: 201 });

    } catch (error) {
        console.error("Club Register Error:", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}
