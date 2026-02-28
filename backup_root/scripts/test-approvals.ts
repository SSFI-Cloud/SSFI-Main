
import fs from "fs";
const BASE_URL = "http://localhost:3000/api";

async function main() {
    console.log("--- Testing Approval Workflow ---");

    const { PrismaClient } = await import("../src/generated/prisma");
    const prisma = new PrismaClient();

    // 1. Find the most recent State Admin (likely from full-flow test)
    const stateAdmin = await prisma.user.findFirst({
        where: { role: "STATE_ADMIN", otp_verified: true },
        orderBy: { created_at: "desc" }
    });

    if (!stateAdmin) {
        console.error("No State Admin found. Run test-full-flow.ts first.");
        await prisma.$disconnect();
        return;
    }
    console.log(`Found State Admin: ${stateAdmin.full_name} (${stateAdmin.email_address})`);

    // 2. Login
    console.log("\n1. Logging in as State Admin...");
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: stateAdmin.email_address, password: "pass123" })
    });
    const loginData = await loginRes.json();

    if (!loginData.token) {
        console.error("Login failed:", loginData);
        await prisma.$disconnect();
        return;
    }
    const token = loginData.token;
    console.log("✅ Logged In");

    // 3. Fetch Pending Approvals
    console.log("\n2. Fetching Pending Approvals...");
    const pendingRes = await fetch(`${BASE_URL}/approvals/pending`, {
        headers: { "Authorization": `Bearer ${token}` }
    });
    const pendingData = await pendingRes.json();
    console.log("Pending Status:", pendingRes.status);
    console.log("Pending Users:", pendingData.users?.length || 0);
    console.log("Pending Clubs:", pendingData.clubs?.length || 0);

    // 4. Create a new District Admin to approve (if none pending)
    if (pendingData.users?.length === 0) {
        console.log("\n3. Creating new District Admin for approval test...");
        const ts = Date.now();
        const formData = new FormData();
        formData.append("name", "Test Dist Sec");
        formData.append("email", `dist_approval_${ts}@test.com`);
        formData.append("mobile", `94${ts.toString().slice(-8)}`);
        formData.append("aadhaar", ts.toString().slice(-12));
        formData.append("address", "Test Approval Address");
        formData.append("stateId", stateAdmin.state_id.toString());

        // Get first district in state
        const dist = await prisma.district.findFirst({ where: { state_id: stateAdmin.state_id, id: { not: 0 } } });
        if (!dist) { console.error("No district found"); return; }
        formData.append("districtId", dist.id.toString());
        formData.append("gender", "Male");
        formData.append("password", "pass123");

        if (!fs.existsSync("dummy.jpg")) fs.writeFileSync("dummy.jpg", "x");
        const blob = new Blob([fs.readFileSync("dummy.jpg")], { type: "image/jpeg" });
        formData.append("profilePhoto", blob, "p.jpg");
        formData.append("identityProof", blob, "i.jpg");

        const regRes = await fetch(`${BASE_URL}/secretaries/district/register`, { method: "POST", body: formData });
        const regData = await regRes.json();
        console.log("Reg Status:", regRes.status);

        if (regRes.status === 201) {
            // Verify OTP to make user eligible for approval
            const newUser = await prisma.user.findUnique({ where: { id: regData.userId } });
            if (newUser?.otp_code) {
                await fetch(`${BASE_URL}/auth/verify-otp`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ userId: regData.userId, otp: newUser.otp_code })
                });
                console.log("✅ New District Admin Created & OTP Verified");
            }
        }

        // Refetch pending
        const pending2Res = await fetch(`${BASE_URL}/approvals/pending`, {
            headers: { "Authorization": `Bearer ${token}` }
        });
        const pending2Data = await pending2Res.json();
        console.log("Updated Pending Users:", pending2Data.users?.length || 0);

        if (pending2Data.users?.length > 0) {
            const toApprove = pending2Data.users[0];
            console.log(`\n4. Approving User ID: ${toApprove.id}...`);

            const approveRes = await fetch(`${BASE_URL}/approvals/${toApprove.id}/approve?type=user`, {
                method: "POST",
                headers: { "Authorization": `Bearer ${token}` }
            });
            const approveData = await approveRes.json();
            console.log("Approve Status:", approveRes.status);
            console.log("Response:", approveData);

            // Verify
            const approved = await prisma.user.findUnique({ where: { id: toApprove.id } });
            console.log(`Verified Status: ${approved?.verified === 1 ? '✅ Approved' : '❌ Not Approved'}`);
        }
    } else {
        // Approve the first one
        const toApprove = pendingData.users[0];
        console.log(`\n3. Approving User ID: ${toApprove.id}...`);

        const approveRes = await fetch(`${BASE_URL}/approvals/${toApprove.id}/approve?type=user`, {
            method: "POST",
            headers: { "Authorization": `Bearer ${token}` }
        });
        console.log("Approve Status:", approveRes.status);

        const approved = await prisma.user.findUnique({ where: { id: toApprove.id } });
        console.log(`Verified: ${approved?.verified === 1 ? '✅' : '❌'}`);
    }

    await prisma.$disconnect();
}

main().catch(console.error);
