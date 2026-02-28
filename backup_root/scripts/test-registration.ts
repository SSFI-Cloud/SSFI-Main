
import fs from "fs";
import path from "path";

const BASE_URL = "http://localhost:3000/api";

// Helper to wait
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function createTestFiles() {
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

    // Dummy Image
    const imagePath = "test-photo.jpg";
    fs.writeFileSync(imagePath, "dummy image content");

    // Dummy Proof
    const proofPath = "test-proof.jpg";
    fs.writeFileSync(proofPath, "dummy proof content");

    return { imagePath, proofPath };
}

async function testHealthCheck() {
    console.log("\n--- Testing Health Check (Prisma) ---");
    try {
        const res = await fetch(`${BASE_URL}/test`);
        console.log("Health Check Status:", res.status);
        const data = await res.json();
        console.log("Health Check Response:", data);
    } catch (e) {
        console.error("Health Check Failed:", e);
    }

    console.log("\n--- Testing Debug Env ---");
    try {
        const res = await fetch(`${BASE_URL}/debug`);
        console.log("Debug Status:", res.status);
        const data = await res.json();
        console.log("Debug Response:", data);
    } catch (e) {
        console.error("Debug Failed:", e);
    }

    console.log("\n--- Testing Health Check (FormData) ---");
    try {
        const formData = new FormData();
        formData.append("test", "data");
        const res = await fetch(`${BASE_URL}/test`, { method: "POST", body: formData });
        console.log("FormData Check Status:", res.status);
        const data = await res.json();
        console.log("FormData Check Response:", data);
    } catch (e) {
        console.error("FormData Check Failed:", e);
    }
}

async function testStateRegister() {
    console.log("\n--- Testing State Secretary Registration ---");
    const { imagePath, proofPath } = await createTestFiles();

    const formData = new FormData();
    formData.append("name", "Test State Sec");
    formData.append("email", `state${Date.now()}@test.com`);
    formData.append("mobile", `9${Date.now().toString().slice(0, 9)}`);
    formData.append("aadhaar", "123456789012");
    formData.append("address", "123 Main St, State Capital");
    formData.append("stateId", "1");
    formData.append("gender", "Male");
    formData.append("password", "password123");

    const imageBlob = new Blob([fs.readFileSync(imagePath)], { type: "image/jpeg" });
    const proofBlob = new Blob([fs.readFileSync(proofPath)], { type: "image/jpeg" });

    formData.append("profilePhoto", imageBlob, "photo.jpg");
    formData.append("identityProof", proofBlob, "proof.jpg");

    try {
        const res = await fetch(`${BASE_URL}/secretaries/state/register`, {
            method: "POST",
            body: formData,
        });

        const text = await res.text();
        try {
            const data = JSON.parse(text);
            console.log("Status:", res.status);
            console.log("Response:", data);
            return data;
        } catch {
            console.error("State Register JSON Parse Failed.");
            console.error("Status:", res.status);
            console.error("Body:", text.substring(0, 1000));
        }
    } catch (e) {
        console.error("State Register Failed:", e);
    }
}

async function testDistrictRegister() {
    console.log("\n--- Testing District Secretary Registration ---");
    const { imagePath, proofPath } = await createTestFiles();

    const formData = new FormData();
    formData.append("name", "Test District Sec");
    formData.append("email", `dist${Date.now()}@test.com`);
    formData.append("mobile", `8${Date.now().toString().slice(0, 9)}`);
    formData.append("aadhaar", "123456789012");
    formData.append("address", "456 Dist St, District HQ");
    formData.append("stateId", "1");
    formData.append("districtId", "1");
    formData.append("gender", "Female");
    formData.append("password", "password123");

    const imageBlob = new Blob([fs.readFileSync(imagePath)], { type: "image/jpeg" });
    const proofBlob = new Blob([fs.readFileSync(proofPath)], { type: "image/jpeg" });

    formData.append("profilePhoto", imageBlob, "photo.jpg");
    formData.append("identityProof", proofBlob, "proof.jpg");

    try {
        const res = await fetch(`${BASE_URL}/secretaries/district/register`, {
            method: "POST",
            body: formData,
        });

        const text = await res.text();
        try {
            const data = JSON.parse(text);
            console.log("Status:", res.status);
            console.log("Response:", data);
            return data;
        } catch {
            console.error("District Register JSON Parse Failed.");
            console.error("Status:", res.status);
            console.error("Body:", text.substring(0, 1000));
        }
    } catch (e) {
        console.error("District Register Failed:", e);
    }
}

async function testClubRegister() {
    console.log("\n--- Testing Club Registration ---");
    const { imagePath, proofPath } = await createTestFiles();

    const formData = new FormData();
    formData.append("clubName", "Super Skaters Club");
    formData.append("regNumber", "REG-999");
    formData.append("contactPerson", "Club Owner");
    formData.append("email", `club${Date.now()}@test.com`);
    formData.append("mobile", `7${Date.now().toString().slice(0, 9)}`);
    formData.append("address", "789 Club Rd");
    formData.append("stateId", "1");
    formData.append("districtId", "1");
    formData.append("password", "password123");
    formData.append("aadhaar", "123456789012");

    // Optional
    formData.append("tshirtSize", "L");
    formData.append("estYear", "2020");

    const imageBlob = new Blob([fs.readFileSync(imagePath)], { type: "image/jpeg" });

    formData.append("clubLogo", imageBlob, "logo.jpg");

    try {
        const res = await fetch(`${BASE_URL}/clubs/register`, {
            method: "POST",
            body: formData,
        });

        const text = await res.text();
        try {
            const data = JSON.parse(text);
            console.log("Status:", res.status);
            console.log("Response:", data);
            return data;
        } catch {
            console.error("Club Register JSON Parse Failed.");
            console.error("Status:", res.status);
            console.error("Body:", text.substring(0, 1000));
        }
    } catch (e) {
        console.error("Club Register Failed:", e);
    }
}

async function main() {
    try {
        await testHealthCheck();
        await testStateRegister();
        await testDistrictRegister();
        await testClubRegister();
    } catch (e) {
        console.error("Test Suite Failed:", e);
    }
}

main();
