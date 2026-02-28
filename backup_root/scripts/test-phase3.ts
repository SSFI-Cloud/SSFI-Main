
import fs from "fs";
import path from "path";

const BASE_URL = "http://localhost:3000/api";

async function createDummyPhoto() {
    const p = "skater_test.jpg";
    if (!fs.existsSync(p)) fs.writeFileSync(p, "dummy content");
    return p;
}

async function main() {
    console.log("--- Starting Phase 3 Tests (Skater & Events) ---");

    // 1. Register Skater
    console.log("\n1. Registering Skater...");
    const p = await createDummyPhoto();

    const formData = new FormData();
    formData.append("fullName", "Master Skater");
    formData.append("dateOfBirth", "2015-05-15");
    formData.append("gender", "Male");
    formData.append("fatherName", "Father Skater");
    formData.append("nomineeName", "Mother Skater");
    formData.append("nomineeAge", "40");
    formData.append("nomineeRelation", "Mother");
    formData.append("clubId", "1"); // Assuming club 1 exists from previous phase
    formData.append("mobile", "9998887776");
    formData.append("aadhaar", Date.now().toString().slice(0, 12));
    formData.append("address", "Skater House Address");
    formData.append("stateId", "1");
    formData.append("districtId", "1");

    const blob = new Blob([fs.readFileSync(p)], { type: "image/jpeg" });
    formData.append("profilePhoto", blob, "p.jpg");
    formData.append("identityProof", blob, "i.jpg");

    let skaterId = 0;
    try {
        const res = await fetch(`${BASE_URL}/students/register`, { method: "POST", body: formData });
        const data = await res.json();
        console.log("Skater Reg Status:", res.status);
        console.log(data);
        if (res.status === 201) skaterId = data.skaterId;
    } catch (e) { console.error(e); }

    if (!skaterId) {
        console.error("Skater registration failed, skipping event tests.");
        return;
    }

    // 2. Create Event
    console.log("\n2. Creating Event...");
    let eventId = 0;
    try {
        // Need admin token? Our create route currently checks nothing (logic not in middleware yet?)
        // Middleware checks /api/admin, but we put it at /api/events/create.
        // We should protect it later.
        const res = await fetch(`${BASE_URL}/events/create`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                eventName: "State Championship 2025",
                eventDate: "2025-12-01",
                regStartDate: "2025-01-01",
                regEndDate: "2025-11-30",
                fees: 500,
                stateId: 1,
                districtId: 0,
                eventLevelTypeId: 1, // State Level
                venue: "Nehru Stadium"
            })
        });
        const data = await res.json();
        console.log("Event Create Status:", res.status);
        console.log(data);
        if (res.status === 201) eventId = data.eventId;
    } catch (e) { console.error(e); }

    // 3. List Events
    console.log("\n3. Listing Events...");
    try {
        const res = await fetch(`${BASE_URL}/events/list?stateId=1`);
        const data = await res.json();
        console.log("List Events Status:", res.status);
        console.log("Events Found:", data.length);
    } catch (e) { console.error(e); }

    // 4. Register for Event
    console.log("\n4. Registering for Event...");
    try {
        const res = await fetch(`${BASE_URL}/events/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                skaterId,
                eventId,
                suitSize: "M"
            })
        });
        const data = await res.json();
        console.log("Event Reg Status:", res.status);
        console.log(data);
    } catch (e) { console.error(e); }

}

main();
