
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    console.log('Seeding Registration Windows...');

    // Create active windows for all types
    const windows = [
        {
            type: 'STATE_SECRETARY',
            title: 'State Secretary Registration 2026',
            description: 'Registration for State Secretaries for the year 2026-27',
            startDate: new Date(),
            endDate: new Date(new Date().setMonth(new Date().getMonth() + 2)), // 2 months from now
            baseFee: 5000,
            isPaused: false,
            createdBy: '1',
        },
        {
            type: 'DISTRICT_SECRETARY',
            title: 'District Secretary Registration 2026',
            description: 'Registration for District Secretaries for the year 2026-27',
            startDate: new Date(),
            endDate: new Date(new Date().setMonth(new Date().getMonth() + 2)),
            baseFee: 2500,
            isPaused: false,
            createdBy: '1',
        },
        {
            type: 'CLUB',
            title: 'Skating Club Affiliation 2026',
            description: 'Affiliation for Skating Clubs for the year 2026-27',
            startDate: new Date(),
            endDate: new Date(new Date().setMonth(new Date().getMonth() + 2)),
            baseFee: 10000,
            isPaused: false,
            createdBy: '1',
        },
    ];

    for (const window of windows) {
        const exists = await prisma.registrationWindow.findFirst({
            where: { type: window.type, isPaused: false }
        });

        if (!exists) {
            await prisma.registrationWindow.create({
                data: window
            });
            console.log(`Created window for ${window.type}`);
        } else {
            console.log(`Window already exists for ${window.type}`);
        }
    }

    console.log('Seeding completed.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
