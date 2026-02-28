
import { getStateSecretaryDashboard } from './src/services/dashboard.service';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testStateDashboard() {
    try {
        const dashboardData = await getStateSecretaryDashboard(1); // Tamil Nadu
        console.log('State Dashboard Data:', JSON.stringify(dashboardData, null, 2));

        // Also verify raw counts
        const totalClubs = await prisma.club.count({ where: { stateId: 1 } });
        const approvedClubs = await prisma.club.count({ where: { stateId: 1, status: 'APPROVED' } });
        console.log('Raw Counts:', { totalClubs, approvedClubs });

    } catch (error) {
        console.error('Error:', error);
    }
}

testStateDashboard();
