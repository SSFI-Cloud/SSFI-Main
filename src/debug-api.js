
const fetch = require('node-fetch'); // Ensure node-fetch is available or use native fetch in newer node

async function testEndpoints() {
    const baseUrl = 'http://localhost:5001/api/v1';

    console.log('--- Testing API Endpoints ---');

    // 1. Test Events
    console.log('\n1. Fetching Events (Default Filters)...');
    try {
        const url = `${baseUrl}/events?page=1&limit=12&upcoming=true&sortBy=eventDate&sortOrder=asc`;
        const res = await fetch(url);
        console.log(`Status: ${res.status} ${res.statusText}`);
        const data = await res.json();
        if (res.ok) {
            console.log('Events Data Summary:');
            console.log(`- Total: ${data.data?.meta?.total}`);
            console.log(`- Events Count: ${data.data?.events?.length}`);
            if (data.data?.events?.length > 0) {
                console.log('- Sample Event:', JSON.stringify(data.data.events[0], null, 2));
            }
        } else {
            console.log('Error Body:', JSON.stringify(data, null, 2));
        }
    } catch (e) {
        console.error('Events Fetch Failed:', e.message);
    }

    // 2. Test States (Guessing endpoint based on common patterns if search fails)
    // Common: /states, /locations/states, /master/states
    // I'll try /states first as it matches state.routes.ts likely
    console.log('\n2. Fetching States (/states)...');
    try {
        const url = `${baseUrl}/states`;
        const res = await fetch(url);
        console.log(`Status: ${res.status} ${res.statusText}`);
        const text = await res.text();
        try {
            const data = JSON.parse(text);
            console.log('States Data:', JSON.stringify(data).substring(0, 200) + '...');
        } catch {
            console.log('States Response (Text):', text.substring(0, 200));
        }

    } catch (e) {
        console.error('States Fetch Failed:', e.message);
    }
}

testEndpoints();
