import { PrismaClient } from '@prisma/client';
import axios from 'axios';

const prisma = new PrismaClient();
const API_URL = process.env.BACKEND_URL ? `${process.env.BACKEND_URL}/api/v1` : 'https://api.ssfiskate.com/api/v1';

async function verifyPortals() {
    console.log('🚀 Starting Portal Verification...');

    try {
        // 1. Fetch a state directly from DB to get ID
        const dbState = await prisma.state.findFirst({
            where: { isActive: true },
            include: { _count: { select: { districts: true } } }
        });

        if (!dbState) {
            console.log('⚠️ No active states found in DB. Skipping API test.');
            return;
        }

        console.log(`\n📋 Found Active State in DB: ${dbState.name} (ID: ${dbState.id})`);

        // 2. Test Get State API
        try {
            console.log(`   Testing GET ${API_URL}/states/${dbState.id}...`);
            const stateRes = await axios.get(`${API_URL}/states/${dbState.id}`);

            if (stateRes.data.status === 'success' && stateRes.data.data.state.id === dbState.id) {
                console.log('   ✅ State API Success!', stateRes.data.data.state);
            } else {
                console.error('   ❌ State API Failed:', stateRes.data);
            }
        } catch (err: any) {
            console.error('   ❌ State API Error:', err.message);
            if (err.response) console.error('      Response:', err.response.data);
        }

        // 3. Fetch a district
        const dbDistrict = await prisma.district.findFirst({
            where: { stateId: dbState.id, isActive: true }
        });

        if (!dbDistrict) {
            console.log('⚠️ No active districts found for this state in DB.');
        } else {
            console.log(`\n📋 Found Active District in DB: ${dbDistrict.name} (ID: ${dbDistrict.id})`);

            // 4. Test Get District API
            try {
                console.log(`   Testing GET ${API_URL}/districts/${dbDistrict.id}...`);
                const districtRes = await axios.get(`${API_URL}/districts/${dbDistrict.id}`);

                if (districtRes.data.status === 'success' && districtRes.data.data.district.id === dbDistrict.id) {
                    console.log('   ✅ District API Success!', districtRes.data.data.district);
                } else {
                    console.error('   ❌ District API Failed:', districtRes.data);
                }
            } catch (err: any) {
                console.error('   ❌ District API Error:', err.message);
                if (err.response) console.error('      Response:', err.response.data);
            }
        }

    } catch (error) {
        console.error('Major Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

verifyPortals();
