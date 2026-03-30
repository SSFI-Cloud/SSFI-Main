
import axios from 'axios';

async function main() {
    try {
        // Login first to get token (using the fixed user credentials)
        const loginRes = await axios.post('https://api.ssfiskate.com/api/v1/auth/login', {
            phone: '7892641107',
            password: '7892641107'
        });

        const token = loginRes.data.token;
        console.log('Got token:', token ? 'Yes' : 'No');

        // Fetch districts with registeredOnly=true
        const res = await axios.get('https://api.ssfiskate.com/api/v1/districts', {
            params: { registeredOnly: 'true' },
            headers: { Authorization: `Bearer ${token}` }
        });

        console.log('Status:', res.data.status);
        console.log('Total Registered Districts:', res.data.data.meta.total);

        if (res.data.data.districts.length > 0) {
            const first = res.data.data.districts[0];
            console.log('First District Sample:');
            console.log('Name:', first.district_name);
            console.log('Secretary:', first.secretaryName);
            console.log('Phone:', first.secretaryPhone);
            console.log('Registered At:', first.secretaryRegisteredAt, typeof first.secretaryRegisteredAt);
            console.log('Clubs Count:', first.clubsCount, typeof first.clubsCount);
            console.log('Skaters Count:', first.skatersCount);
            console.log('Events Count:', first.eventsCount);
        } else {
            console.log('No registered districts found to verify structure.');
        }

    } catch (error: any) {
        console.error('Error:', error.response?.data || error.message);
    }
}

main();
