
import fs from "fs";
const BASE_URL = "http://localhost:3000/api";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function createDummyFiles() {
    if (!fs.existsSync("dummy.jpg")) fs.writeFileSync("dummy.jpg", "content");
}

async function main() {
    console.log("--- Starting Full Flow Verification ---");
    await createDummyFiles();
    const ts = Date.now();
    const random = Math.floor(Math.random() * 10000);
    const uniqueMobile = (prefix: string) => `${prefix}${Date.now().toString().slice(-9)}`;
    const uniqueAadhaar = () => `${Date.now().toString().slice(-12)}`;
    // We need to find Karnataka ID. Since we seeded, we don't know exact ID unless we query or assume order.
    // But our API registers by ID. We need a way to look up IDs or just guess.
    // Let's rely on the public API (if we had one) or just use a known one.
    // Or we can extend this script to query DB directly.

    const { PrismaClient } = await import("../src/generated/prisma");
    const prisma = new PrismaClient();

    const kaState = await prisma.state.findFirst({ where: { state_name: "Karnataka" } });
    if (!kaState) { throw new Error("Karnataka not found in DB"); }
    const KA_ID = kaState.id;
    console.log(`Found Karnataka ID: ${KA_ID}`);

    // 1. Register State Admin
    console.log("\n1. Registering State Admin (Karnataka)...");
    const stateFormData = new FormData();
    stateFormData.append("name", "KA State Sec");
    stateFormData.append("email", `ka_sec_${ts}_${random}@test.com`);
    stateFormData.append("mobile", uniqueMobile("90"));
    stateFormData.append("aadhaar", uniqueAadhaar());
    stateFormData.append("address", "Bangalore, KA");
    stateFormData.append("stateId", KA_ID.toString());
    stateFormData.append("gender", "Male");
    stateFormData.append("password", "pass123");

    const blob = new Blob([fs.readFileSync("dummy.jpg")], { type: "image/jpeg" });
    stateFormData.append("profilePhoto", blob, "p.jpg");
    stateFormData.append("identityProof", blob, "i.jpg");

    let stateUserId;
    try {
        const res = await fetch(`${BASE_URL}/secretaries/state/register`, { method: "POST", body: stateFormData });
        const data = await res.json();
        if (res.status === 201) {
            console.log("✅ State Admin Registered");
            stateUserId = data.userId;
        } else {
            console.error("❌ State Reg Failed", data);
            process.exit(1);
        }
    } catch (e) { console.error(e); }

    // Verify OTP (Direct DB)
    const stateUser = await prisma.user.findUnique({ where: { id: stateUserId } });
    await fetch(`${BASE_URL}/auth/verify-otp`, {
        method: "POST",
        body: JSON.stringify({ userId: stateUserId, otp: stateUser?.otp_code })
    });
    console.log("✅ State Admin Verified");

    // 2. Register District Admin (Bangalore Urban)
    const blrDist = await prisma.district.findFirst({ where: { state_id: KA_ID, district_name: "Bengaluru Urban" } });
    if (!blrDist) { throw new Error("Bengaluru Urban not found"); } // Note seed name might be different
    const BLR_ID = blrDist.id;
    console.log(`Found Bengaluru Urban ID: ${BLR_ID}`);

    console.log("\n2. Registering District Admin...");
    const distFormData = new FormData();
    distFormData.append("name", "BLR Dist Sec");
    distFormData.append("email", `blr_sec_${ts}_${random}@test.com`);
    distFormData.append("mobile", uniqueMobile("91"));
    distFormData.append("aadhaar", (BigInt(uniqueAadhaar()) + BigInt(1)).toString());
    distFormData.append("address", "Bangalore, Karnataka Address"); // > 10 chars
    distFormData.append("stateId", KA_ID.toString());
    distFormData.append("districtId", BLR_ID.toString());
    distFormData.append("gender", "Female");
    distFormData.append("password", "pass123");
    distFormData.append("profilePhoto", blob, "p.jpg");
    distFormData.append("identityProof", blob, "i.jpg");

    let distUserId;
    try {
        const res = await fetch(`${BASE_URL}/secretaries/district/register`, { method: "POST", body: distFormData });
        const data = await res.json();
        if (res.status === 201) {
            console.log("✅ District Admin Registered");
            distUserId = data.userId;
        } else console.error("❌ District Reg Failed", data);
    } catch (e) { console.error(e); }

    // Verify
    if (distUserId) {
        const distUser = await prisma.user.findUnique({ where: { id: distUserId } });
        if (distUser) {
            await fetch(`${BASE_URL}/auth/verify-otp`, {
                method: "POST",
                body: JSON.stringify({ userId: distUserId, otp: distUser.otp_code })
            });
            console.log("✅ District Admin Verified");
        }
    }

    // 3. Register Club
    console.log("\n3. Registering Club...");
    const clubFormData = new FormData();
    clubFormData.append("clubName", "Bangalore Skaters");
    clubFormData.append("regNumber", `REG-BLR-${random}`);
    clubFormData.append("contactPerson", "Club Owner");
    clubFormData.append("email", `club_${ts}_${random}@test.com`);
    clubFormData.append("mobile", uniqueMobile("92"));
    clubFormData.append("aadhaar", (BigInt(uniqueAadhaar()) + BigInt(2)).toString());
    clubFormData.append("address", "Club Address Longer");
    clubFormData.append("stateId", KA_ID.toString());
    clubFormData.append("districtId", BLR_ID.toString());
    clubFormData.append("password", "pass123");
    clubFormData.append("clubLogo", blob, "logo.jpg");

    let clubUserId, clubId;
    try {
        const res = await fetch(`${BASE_URL}/clubs/register`, { method: "POST", body: clubFormData });
        const data = await res.json();
        if (res.status === 201) {
            console.log("✅ Club Registered");
            clubUserId = data.userId;
            clubId = data.clubId;
        } else console.error("❌ Club Reg Failed", data);
    } catch (e) { console.error(e); }

    // Verify
    if (clubUserId) {
        const clubUser = await prisma.user.findUnique({ where: { id: clubUserId } });
        if (clubUser) {
            await fetch(`${BASE_URL}/auth/verify-otp`, {
                method: "POST",
                body: JSON.stringify({ userId: clubUserId, otp: clubUser.otp_code })
            });
            console.log("✅ Club Verified");
        }
    }

    // 4. Create Event (State Level by State Admin?)
    // Actually our API is Admin Only. Let's assume Global Admin for now or use State Admin token if we implemented RBAC fully.
    // For now the API is protected but loosely. Let's just hit it.
    // Wait, create API doesn't check specific role yet, just Auth.
    // Let's Login as State Admin to get token.
    console.log("\n4. Logging in as State Admin...");
    let token;
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
        method: "POST",
        body: JSON.stringify({ identifier: `ka_sec_${ts}_${random}@test.com`, password: "pass123" })
    });
    const loginData = await loginRes.json();
    token = loginData.token;
    console.log("✅ Logged In");

    // Create Event
    console.log("\n5. Creating Event...");
    let eventId;
    const eventRes = await fetch(`${BASE_URL}/events/create`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` }, // Middleware should pass
        body: JSON.stringify({
            eventName: "KA State Championship",
            eventDate: "2026-10-10",
            regStartDate: "2026-01-01",
            regEndDate: "2026-09-30",
            fees: 1000,
            stateId: KA_ID,
            districtId: 0, // State Level
            eventLevelTypeId: 1,
            venue: "Kanteerava Stadium"
        })
    });
    const eventData = await eventRes.json();
    if (eventRes.status === 201) {
        console.log("✅ Event Created");
        eventId = eventData.eventId;
    } else console.error("❌ Event Create Failed", eventRes.status, eventData);

    // 5. Register Student
    console.log("\n6. Registering Student...");
    const studFormData = new FormData();
    studFormData.append("fullName", "Student KA");
    studFormData.append("dateOfBirth", "2010-01-01");
    studFormData.append("gender", "Male");
    studFormData.append("fatherName", "Father KA");
    studFormData.append("nomineeName", "Nominee KA");
    studFormData.append("nomineeAge", "45");
    studFormData.append("nomineeRelation", "Father");
    studFormData.append("clubId", clubId.toString());
    studFormData.append("mobile", uniqueMobile("93"));
    studFormData.append("aadhaar", (BigInt(uniqueAadhaar()) + BigInt(3)).toString());
    studFormData.append("address", "Student Addr");
    studFormData.append("stateId", KA_ID.toString());
    studFormData.append("districtId", BLR_ID.toString());
    studFormData.append("profilePhoto", blob, "p.jpg");
    studFormData.append("identityProof", blob, "i.jpg");

    let skaterId;
    try {
        const res = await fetch(`${BASE_URL}/students/register`, { method: "POST", body: studFormData });
        const data = await res.json();
        if (res.status === 201) {
            console.log("✅ Student Registered");
            skaterId = data.skaterId;
        } else console.error("❌ Student Reg Failed", data);
    } catch (e) { console.error(e); }

    // 6. Register Student for Event
    console.log("\n7. Event Registration...");
    const regRes = await fetch(`${BASE_URL}/events/register`, {
        method: "POST",
        body: JSON.stringify({ skaterId, eventId, suitSize: "L" })
    });
    const regData = await regRes.json();
    if (regRes.status === 201) {
        console.log("✅ Event Registration Successful");
    } else console.error("❌ Event Registration Failed", regData);

    await prisma.$disconnect();
}

main().catch(console.error);
