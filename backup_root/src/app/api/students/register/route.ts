
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { uploadFile } from "@/lib/upload";
import { z } from "zod";

// Schema for Skater Registration
const skaterSchema = z.object({
    fullName: z.string().min(3),
    dateOfBirth: z.string(), // YYYY-MM-DD
    gender: z.enum(["Male", "Female", "Other"]),
    fatherName: z.string().min(3),
    schoolName: z.string().optional(),
    bloodGroup: z.string().optional(),

    // Guardian / Nominee
    nomineeName: z.string().min(3),
    nomineeAge: z.string().transform((val) => parseInt(val, 10)),
    nomineeRelation: z.string().min(3),

    // Coach / Club
    clubId: z.string().transform((val) => parseInt(val, 10)), // 0 if none
    coachName: z.string().optional(),
    coachMobile: z.string().optional(),

    // Contact
    mobile: z.string().min(10),
    email: z.string().email().optional().or(z.literal("")),
    aadhaar: z.string().length(12),
    address: z.string().min(10),

    // Location
    stateId: z.string().transform((val) => parseInt(val, 10)),
    districtId: z.string().transform((val) => parseInt(val, 10)),
});

export async function POST(req: Request) {
    try {
        const formData = await req.formData();

        // Extract Data
        const body = {
            fullName: formData.get("fullName"),
            dateOfBirth: formData.get("dateOfBirth"),
            gender: formData.get("gender"),
            fatherName: formData.get("fatherName"),
            schoolName: formData.get("schoolName") || undefined,
            bloodGroup: formData.get("bloodGroup") || undefined,

            nomineeName: formData.get("nomineeName"),
            nomineeAge: formData.get("nomineeAge"),
            nomineeRelation: formData.get("nomineeRelation"),

            clubId: formData.get("clubId"),
            coachName: formData.get("coachName") || undefined,
            coachMobile: formData.get("coachMobile") || undefined,

            mobile: formData.get("mobile"),
            email: formData.get("email") || undefined,
            aadhaar: formData.get("aadhaar"),
            address: formData.get("address"),

            stateId: formData.get("stateId"),
            districtId: formData.get("districtId"),
        };

        const photoFile = formData.get("profilePhoto") as File;
        const proofFile = formData.get("identityProof") as File; // Aadhaar Scan

        const result = skaterSchema.safeParse(body);
        if (!result.success) {
            return NextResponse.json({ message: "Validation Validation", errors: result.error.flatten() }, { status: 400 });
        }

        if (!photoFile || !proofFile) {
            return NextResponse.json({ message: "Documents required" }, { status: 400 });
        }

        const data = result.data;

        // Check Duplicates (Aadhaar)
        const existing = await prisma.skater.findFirst({
            where: { aadhar_number: data.aadhaar }
        });
        if (existing) return NextResponse.json({ message: "Skater already registered" }, { status: 409 });

        // Calculate Category (Dummy Logic for now - e.g., 0)
        // Todo: Implement real age calculator
        const categoryId = 1;

        // Upload Files
        const photoPath = await uploadFile(photoFile, "skater-photos");
        const proofPath = await uploadFile(proofFile, "skater-proofs");

        // Generate Membership ID
        // SSFI-[STATE]-[DIST]-[CLUB]-[NUM]
        // Get Codes
        const state = await prisma.state.findUnique({ where: { id: data.stateId } });
        // District code... 
        // Note: Code is not in District Schema, just name? 
        // Schema says: `district_name` but no `code`. 
        // We might need to generate one or use ID padded. 
        // Let's use ID padded for now: D01

        const districtCode = data.districtId.toString().padStart(4, "0");
        const clubCode = data.clubId.toString().padStart(4, "0");

        const count = await prisma.skater.count({
            where: { district_id: data.districtId }
        });
        const num = (count + 1).toString().padStart(4, "0");

        const membershipId = `SSFI-${state?.code || 'XX'}-${districtCode}-${clubCode}-${num}`;

        // Create Skater
        const newSkater = await prisma.skater.create({
            data: {
                membership_id: membershipId,
                full_name: data.fullName,
                date_of_birth: new Date(data.dateOfBirth),
                gender: data.gender as any,
                father_name: data.fatherName,
                school_name: data.schoolName,
                blood_group: data.bloodGroup,

                nominee_name: data.nomineeName,
                nominee_age: data.nomineeAge,
                nominee_relation: data.nomineeRelation,

                club_id: data.clubId === 0 ? null : data.clubId,
                coach_name: data.coachName,
                coach_mobile_number: data.coachMobile,

                mobile_number: data.mobile,
                email_address: data.email || null,
                aadhar_number: data.aadhaar,
                residential_address: data.address,

                state_id: data.stateId,
                district_id: data.districtId,
                category_type_id: categoryId,

                profile_photo: photoPath,
                identity_proof: proofPath,

                verified: 0,
                i_am: "Student", // Default
            }
        });

        return NextResponse.json({
            message: "Student Registration Successful",
            membershipId,
            skaterId: newSkater.id
        }, { status: 201 });

    } catch (e) {
        console.error("Student Reg Error:", e);
        return NextResponse.json({ message: "Internal Error" }, { status: 500 });
    }
}
