import { PrismaClient, EventCategory } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Starting Test Scenario Data Creation...');

    // 1. Find a State Secretary
    const stateUser = await prisma.user.findFirst({
        where: { role: 'STATE_SECRETARY' },
        include: {
            statePerson: true
        }
    });

    if (!stateUser) {
        console.error('No STATE_SECRETARY found. Please create one first.');
    } else {
        console.log(`Found State Secretary: ${stateUser.email} (ID: ${stateUser.id})`);

        // Create Event for State
        if (stateUser.statePerson) {
            const stateEvent = await prisma.event.create({
                data: {
                    name: `Test State Event - ${new Date().toISOString().split('T')[0]}`,
                    code: `STATE-TEST-${Math.floor(Math.random() * 1000)}`,
                    description: 'A test event created by State Secretary',
                    eventLevel: 'STATE',
                    category: 'STATE' as EventCategory,
                    eventType: 'COMPETITION',
                    status: 'PUBLISHED',
                    eventDate: new Date(Date.now() + 86400000 * 30), // 30 days from now
                    registrationStartDate: new Date(),
                    registrationEndDate: new Date(Date.now() + 86400000 * 25),
                    venue: 'Test Stadium',
                    city: 'Test City',
                    entryFee: 500,
                    creatorId: stateUser.id,
                    stateId: stateUser.statePerson.stateId
                }
            });
            console.log(`Created State Event: ${stateEvent.name} (ID: ${stateEvent.id})`);
        } else {
            console.warn('State User has no linked StatePerson profile.');
        }
    }

    // 2. Find a District Secretary
    const districtUser = await prisma.user.findFirst({
        where: { role: 'DISTRICT_SECRETARY' },
        include: {
            districtPerson: {
                include: { district: true }
            }
        }
    });

    if (!districtUser) {
        console.error('No DISTRICT_SECRETARY found. Please create one first.');
    } else {
        console.log(`Found District Secretary: ${districtUser.email} (ID: ${districtUser.id})`);

        // Create Event for District
        if (districtUser.districtPerson) {
            const districtEvent = await prisma.event.create({
                data: {
                    name: `Test District Event - ${new Date().toISOString().split('T')[0]}`,
                    code: `DIST-TEST-${Math.floor(Math.random() * 1000)}`,
                    description: 'A test event created by District Secretary',
                    eventLevel: 'DISTRICT',
                    category: 'DISTRICT' as EventCategory,
                    eventType: 'COMPETITION',
                    status: 'PUBLISHED',
                    eventDate: new Date(Date.now() + 86400000 * 30),
                    registrationStartDate: new Date(),
                    registrationEndDate: new Date(Date.now() + 86400000 * 25),
                    venue: 'District Arena',
                    city: 'District City',
                    entryFee: 300,
                    creatorId: districtUser.id,
                    stateId: districtUser.districtPerson.district.stateId,
                    districtId: districtUser.districtPerson.districtId
                }
            });
            console.log(`Created District Event: ${districtEvent.name} (ID: ${districtEvent.id})`);
        } else {
            console.warn('District User has no linked DistrictPerson profile.');
        }
    }

    console.log('Test Scenario Setup Complete.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
