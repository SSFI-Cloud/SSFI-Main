import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Checking Registration Windows in Database...\n');

    const windows = await prisma.registrationWindow.findMany({
        orderBy: { createdAt: 'desc' }
    });

    console.log(`Total Windows Found: ${windows.length}\n`);

    if (windows.length === 0) {
        console.log('No registration windows found in the database.');
    } else {
        windows.forEach((window, idx) => {
            console.log(`[${idx + 1}] ${window.title || 'Untitled'}`);
            console.log(`    Type: ${window.type}`);
            console.log(`    Dates: ${window.startDate.toISOString().split('T')[0]} to ${window.endDate.toISOString().split('T')[0]}`);
            console.log(`    Base Fee: ₹${window.baseFee}`);
            console.log(`    Is Paused: ${window.isPaused}`);
            console.log(`    Active: ${!window.isPaused && new Date() >= window.startDate && new Date() <= window.endDate ? 'YES' : 'NO'}`);
            console.log('');
        });
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
