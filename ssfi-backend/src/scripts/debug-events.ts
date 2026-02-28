import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Checking Events in Database...');

    const events = await prisma.event.findMany({
        include: {
            state: true,
            district: true,
        }
    });

    console.log(`Total Events Found: ${events.length}`);

    if (events.length === 0) {
        console.log('No events found in the database.');
    } else {
        events.forEach(event => {
            console.log('------------------------------------------------');
            console.log(`ID: ${event.id}`);
            console.log(`Name: ${event.name}`);
            console.log(`Code: ${event.code}`);
            console.log(`Status: ${event.status}`);
            console.log(`Date: ${event.eventDate}`);
            console.log(`State: ${event.state?.name || 'N/A'} (ID: ${event.stateId})`);
            console.log(`District: ${event.district?.name || 'N/A'} (ID: ${event.districtId})`);
            console.log('------------------------------------------------');
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
