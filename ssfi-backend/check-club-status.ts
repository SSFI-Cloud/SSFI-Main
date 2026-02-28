
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkClubStatus() {
    try {
        const clubs = await prisma.club.groupBy({
            by: ['status', 'verified', 'isActive', 'stateId'],
            _count: {
                id: true
            }
        });

        console.log('Club Status Distribution:');
        console.table(clubs);

        // Also check for total clubs
        const total = await prisma.club.count();
        console.log('Total Clubs:', total);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkClubStatus();
