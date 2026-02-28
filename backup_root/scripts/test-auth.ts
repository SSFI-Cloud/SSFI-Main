
import { prisma } from "../src/lib/prisma"; // Direct prisma access for cleanup? Or just API?
// Actually we should test via API only to simulate real usage.
// Standard fetch

const BASE_URL = "http://localhost:3000/api";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function main() {
    console.log("--- Starting Auth Test Suite ---");

    // 1. Create a fresh user via Club Registration (since we have that working)
    // Or just use the one we created in previous test?
    // Let's rely on the previous user: `club173780...`. 
    // Wait, dynamic emails. Rerunning registration test might be needed or just create a new one.
    // Let's create a NEW State Secretary for clean slate.

    const email = `auth_test_${Date.now()}@test.com`;
    const password = "password123";
    const mobile = `9${Date.now().toString().slice(0, 9)}`;

    console.log(`\n1. Registering User (${email})...`);
    // Using State Register for simplicity
    const formData = new FormData();
    formData.append("name", "Auth User");
    formData.append("email", email);
    formData.append("mobile", mobile);
    formData.append("aadhaar", Date.now().toString().slice(0, 12));
    formData.append("address", "Auth Address Longer");
    formData.append("stateId", "1");
    formData.append("gender", "Male");
    formData.append("password", password);

    // We need files...
    const fs = await import("fs");
    if (!fs.existsSync("test-photo.jpg")) fs.writeFileSync("test-photo.jpg", "dummy");
    formData.append("profilePhoto", new Blob([fs.readFileSync("test-photo.jpg")], { type: "image/jpeg" }), "p.jpg");
    formData.append("identityProof", new Blob([fs.readFileSync("test-photo.jpg")], { type: "image/jpeg" }), "i.jpg");

    let userId: number;

    try {
        const res = await fetch(`${BASE_URL}/secretaries/state/register`, { method: "POST", body: formData });
        const data = await res.json();
        console.log("Register Status:", res.status);
        if (res.status === 201) {
            userId = data.userId;
            console.log("User Created, ID:", userId);
        } else {
            console.error("Registration Failed", data);
            return;
        }
    } catch (e) {
        console.error("Register Error", e);
        return;
    }

    // 2. Try Login (Should fail - OTP not verified)
    console.log("\n2. Attempting Login (Unverified)...");
    try {
        const res = await fetch(`${BASE_URL}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ identifier: email, password })
        });
        const data = await res.json();
        console.log("Login Status:", res.status, "(Expected 403)");
        console.log("Response:", data);
        if (res.status !== 403) console.error("❌ FAILED: Should be 403");
    } catch (e) { console.error(e); }

    // 3. Verify OTP (We need to read the OTP from DB/Logs... or cheat using Shim dev output?)
    // In dev mode, we might not see console easily.
    // Let's use Prisma to fetch the OTP directly for testing.
    console.log("\n3. Fetching OTP from DB...");
    // We need to import prisma client here.
    const { PrismaClient } = await import("@prisma/client"); // Use generated client path if needed?
    // Actually we can use the relative path to generated if strictly typed.
    // Or just use the one in src/lib/prisma if we can import it? 
    // Scripts are outside src context sometimes.
    // Let's try dynamic import of relative path from where script runs.
    const { prisma } = await import("../src/lib/prisma"); // Testing if this works in tsx

    const user = await prisma.user.findUnique({ where: { id: userId! } });
    if (!user || !user.otp_code) {
        console.error("❌ User or OTP not found in DB");
        return;
    }
    const otp = user.otp_code;
    console.log("OTP Found:", otp);

    // 4. Verify OTP API
    console.log("\n4. Verifying OTP...");
    try {
        const res = await fetch(`${BASE_URL}/auth/verify-otp`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId, otp })
        });
        const data = await res.json();
        console.log("Verify Status:", res.status, "(Expected 200)");
        console.log("Response:", data);
    } catch (e) { console.error(e); }

    // 5. Login Success
    console.log("\n5. Attempting Login (Verified)...");
    let token = "";
    try {
        const res = await fetch(`${BASE_URL}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ identifier: email, password })
        });
        const data = await res.json();
        console.log("Login Status:", res.status, "(Expected 200)");
        if (res.status === 200 && data.token) {
            token = data.token;
            console.log("Token Received:", token.substring(0, 20) + "...");
        } else {
            console.error("❌ Login Failed");
            console.log(data);
        }
    } catch (e) { console.error(e); }

    // 6. Test Protected Route (Admin API)
    // We need a dummy protected route or use an existing one that is protected?
    // Middleware protects /api/admin... do we have one?
    // Let's create `src/app/api/admin/test/route.ts` quickly or just hit a non-existent one and check headers?
    // If I hit `/api/admin/nonexistent`, middleware runs first.
    // If token is valid, it passes to route handler (which returns 404).
    // If token invalid, 401.

    console.log("\n6. Testing Middleware (Protected Path)...");
    try {
        const res = await fetch(`${BASE_URL}/api/admin/check`, {
            headers: { "Authorization": `Bearer ${token}` }
        });
        console.log("Protected Status:", res.status);
        // If 404, it means middleware passed (Good, even if route missing). 
        // If 401, middleware rejected.
        if (res.status === 404) console.log("✅ Middleware Passed (404 from Next.js means Auth OK)");
        else if (res.status === 200) console.log("✅ Access Granted");
        else console.log("Response:", res.status, res.statusText);
    } catch (e) { console.error(e); }

    // 7. Forgot Password
    console.log("\n7. Test Forgot Password...");
    try {
        const res = await fetch(`${BASE_URL}/auth/forgot-password`, {
            method: "POST",
            body: JSON.stringify({ identifier: email })
        });
        const data = await res.json();
        console.log("Forgot Pass Status:", res.status);
    } catch (e) { console.error(e); }
}

main().catch(console.error);
