import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function debugEventQuery() {
    console.log('🔍 Debugging Event Query\n');

    // Check total events
    const totalEvents = await prisma.event.count();
    console.log(`Total Events in DB: ${totalEvents}`);

    // Check events by status
    const draftCount = await prisma.event.count({ where: { status: 'DRAFT' } });
    const publishedCount = await prisma.event.count({ where: { status: 'PUBLISHED' } });
    console.log(`  - DRAFT: ${draftCount}`);
    console.log(`  - PUBLISHED: ${publishedCount}`);

    // Check events by level
    const nationalCount = await prisma.event.count({ where: { eventLevel: 'NATIONAL' } });
    const stateCount = await prisma.event.count({ where: { eventLevel: 'STATE' } });
    const districtCount = await prisma.event.count({ where: { eventLevel: 'DISTRICT' } });
    console.log(`\nEvents by Level:`);
    console.log(`  - NATIONAL: ${nationalCount}`);
    console.log(`  - STATE: ${stateCount}`);
    console.log(`  - DISTRICT: ${districtCount}`);

    // Show sample events
    console.log(`\n📋 Sample Events:`);
    const sampleEvents = await prisma.event.findMany({
        take: 5,
        select: {
            id: true,
            name: true,
            eventLevel: true,
            status: true,
            stateId: true,
            districtId: true,
        }
    });
    console.table(sampleEvents);

    // Check states
    const stateCount_db = await prisma.state.count();
    console.log(`\n🗺️  States in DB: ${stateCount_db}`);

    await prisma.$disconnect();
}

debugEventQuery().catch(console.error);
