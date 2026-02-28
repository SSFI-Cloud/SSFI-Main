import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkEverything() {
    console.log('='.repeat(60));
    console.log('COMPLETE DATABASE & LOGIC CHECK');
    console.log('='.repeat(60));

    // 1. Check States
    console.log('\n1️⃣  STATES CHECK');
    const stateCount = await prisma.state.count();
    console.log(`   Total States: ${stateCount}`);
    if (stateCount < 36) {
        console.log('   ⚠️  WARNING: Only', stateCount, 'states found. Expected 36.');
        const states = await prisma.state.findMany({ select: { name: true } });
        console.log('   States:', states.map(s => s.name).join(', '));
    } else {
        console.log('   ✅ All 36 states present');
    }

    // 2. Check Events
    console.log('\n2️⃣  EVENTS CHECK');
    const totalEvents = await prisma.event.count();
    const publishedEvents = await prisma.event.count({ where: { status: 'PUBLISHED' } });
    const draftEvents = await prisma.event.count({ where: { status: 'DRAFT' } });

    console.log(`   Total Events: ${totalEvents}`);
    console.log(`   Published: ${publishedEvents}`);
    console.log(`   Draft: ${draftEvents}`);

    const eventsByLevel = await prisma.event.groupBy({
        by: ['eventLevel', 'status'],
        _count: true
    });

    console.log('\n   Events by Level & Status:');
    eventsByLevel.forEach(e => {
        console.log(`     ${e.eventLevel} - ${e.status}: ${e._count}`);
    });

    // 3. Check a sample event query (simulating unauthenticated user)
    console.log('\n3️⃣  SIMULATED QUERY (Unauthenticated User)');
    const unauthQuery = await prisma.event.findMany({
        where: {
            eventLevel: 'NATIONAL',
            status: 'PUBLISHED',
            eventDate: { gte: new Date() }
        },
        take: 5,
        select: { id: true, name: true, eventLevel: true, status: true }
    });
    console.log(`   Found ${unauthQuery.length} upcoming national published events`);
    if (unauthQuery.length > 0) {
        console.table(unauthQuery);
    }

    // 4. Check Global Admin user
    console.log('\n4️⃣  GLOBAL ADMIN CHECK');
    const globalAdmin = await prisma.user.findFirst({
        where: { role: 'GLOBAL_ADMIN' },
        select: {
            id: true,
            uid: true,
            email: true,
            phone: true,
            isActive: true,
            isApproved: true
        }
    });

    if (globalAdmin) {
        console.log('   ✅ Global Admin found:', globalAdmin.email || globalAdmin.phone);
        console.log('   Active:', globalAdmin.isActive);
        console.log('   Approved:', globalAdmin.isApproved);
    } else {
        console.log('   ❌ No Global Admin found!');
    }

    // 5. Check State Secretary
    console.log('\n5️⃣  STATE SECRETARY CHECK');
    const stateSecretary = await prisma.user.findFirst({
        where: { role: 'STATE_SECRETARY' },
        include: {
            statePerson: { include: { state: true } }
        }
    });

    if (stateSecretary) {
        console.log('   ✅ State Secretary found');
        console.log('   State:', stateSecretary.statePerson?.state?.name || 'NONE');
        console.log('   StateId:', stateSecretary.statePerson?.stateId || 'NONE');
    } else {
        console.log('   ℹ️  No State Secretary found');
    }

    console.log('\n' + '='.repeat(60));
    console.log('RECOMMENDATIONS:');
    console.log('='.repeat(60));

    if (stateCount < 36) {
        console.log('❗ Run: npx prisma studio');
        console.log('   Then execute the SQL in prisma/seed-states.sql');
    }

    if (publishedEvents === 0) {
        console.log('❗ No PUBLISHED events! Change some events from DRAFT to PUBLISHED');
        console.log('   In Prisma Studio: events table → Edit → Change status to PUBLISHED');
    }

    if (unauthQuery.length === 0) {
        console.log('❗ No upcoming NATIONAL PUBLISHED events');
        console.log('   Create or publish a national event with future date');
    }

    await prisma.$disconnect();
}

checkEverything().catch(console.error);
