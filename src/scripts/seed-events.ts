import { PrismaClient, EventCategory, EventStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting seed for events...');

    // 1. Find a valid creator (Global Admin)
    const creator = await prisma.user.findFirst({
        where: { role: 'GLOBAL_ADMIN' }
    });

    if (!creator) {
        throw new Error('❌ Global Admin not found. Please run seed-test-users.ts first.');
    }

    console.log(`👤 Assigned Creator: ${creator.email} (ID: ${creator.id})`);

    // 2. Define Events
    const events = [
        {
            code: 'EVT-NAT-2026-001',
            name: '15th National Speed Skating Championship',
            description: 'The premier speed skating event of the year, bringing together the fastest skaters from across the country to compete for national glory. Categories include track and road races for all age groups.',
            shortDescription: 'National level speed skating championship held in New Delhi.',
            category: EventCategory.NATIONAL,
            eventType: 'COMPETITION',
            eventLevel: 'NATIONAL',
            status: EventStatus.PUBLISHED,
            eventDate: new Date('2026-03-15'),
            eventEndDate: new Date('2026-03-20'),
            registrationStartDate: new Date('2026-01-01'),
            registrationEndDate: new Date('2026-03-10'),
            venue: 'Jawaharlal Nehru Stadium',
            city: 'New Delhi',
            entryFee: 2500,
            image: '/images/hero/hero_speed.jpg'
        },
        {
            code: 'EVT-STA-MH-2026-001',
            name: 'Maharashtra State Roller Hockey Tournament',
            description: 'Annual state level tournament for Roller Hockey teams. Open to all registered clubs in Maharashtra. Selection trials for the state team will also be conducted.',
            shortDescription: 'State level roller hockey tournament in Mumbai.',
            category: EventCategory.STATE,
            eventType: 'COMPETITION',
            eventLevel: 'STATE',
            status: EventStatus.PUBLISHED,
            eventDate: new Date('2026-04-02'),
            eventEndDate: new Date('2026-04-05'),
            registrationStartDate: new Date('2026-02-01'),
            registrationEndDate: new Date('2026-03-25'),
            venue: 'Mumbai Sports Arena',
            city: 'Mumbai',
            entryFee: 1500,
            image: '/images/hero/hero_national.jpg'
        },
        {
            code: 'EVT-DIS-PUN-2026-001',
            name: 'Pune District School Games',
            description: 'Inter-school skating competition for students in Pune district. Promoting grassroots talent and healthy competition among schools.',
            shortDescription: 'District level school games in Pune.',
            category: EventCategory.DISTRICT,
            eventType: 'COMPETITION',
            eventLevel: 'DISTRICT',
            status: EventStatus.PUBLISHED,
            eventDate: new Date('2026-02-28'),
            eventEndDate: new Date('2026-02-28'),
            registrationStartDate: new Date('2026-01-15'),
            registrationEndDate: new Date('2026-02-20'),
            venue: 'District Sports Ground',
            city: 'Pune',
            entryFee: 500,
            image: '/images/events/district-event.webp'
        },
        {
            code: 'EVT-NAT-ART-2026-001',
            name: 'Interstate Artistic Skating Competition',
            description: 'A showcase of grace and skill. Artistic skaters from different states compete in figures, freestyle, and dance categories.',
            shortDescription: 'National level artistic skating competition.',
            category: EventCategory.NATIONAL,
            eventType: 'COMPETITION',
            eventLevel: 'NATIONAL',
            status: EventStatus.PUBLISHED,
            eventDate: new Date('2026-04-20'),
            eventEndDate: new Date('2026-04-22'),
            registrationStartDate: new Date('2026-02-15'),
            registrationEndDate: new Date('2026-04-10'),
            venue: 'Kanteerava Stadium',
            city: 'Bengaluru',
            entryFee: 2000,
            image: '/images/events/national-event.webp'
        },
        {
            code: 'EVT-STA-TN-2026-001',
            name: 'Tamil Nadu Junior Speed Skating Championship',
            description: 'Dedicated championship for junior age categories (U-10, U-14). Identify and nurture young speed skating talent in Tamil Nadu.',
            shortDescription: 'Junior speed skating championship in Chennai.',
            category: EventCategory.STATE,
            eventType: 'COMPETITION',
            eventLevel: 'STATE',
            status: EventStatus.PUBLISHED,
            eventDate: new Date('2026-05-10'),
            eventEndDate: new Date('2026-05-12'),
            registrationStartDate: new Date('2026-03-01'),
            registrationEndDate: new Date('2026-04-30'),
            venue: 'Nehru Park Skating Rink',
            city: 'Chennai',
            entryFee: 1200,
            image: '/images/events/state-event.webp'
        },
        {
            code: 'EVT-DIS-HYD-2026-001',
            name: 'Hyderabad Regional Inline Hockey League',
            description: 'Regional league matches for inline hockey clubs in and around Hyderabad. League format with playoffs.',
            shortDescription: 'District level inline hockey league.',
            category: EventCategory.DISTRICT,
            eventType: 'COMPETITION',
            eventLevel: 'DISTRICT',
            status: EventStatus.PUBLISHED,
            eventDate: new Date('2026-03-25'),
            eventEndDate: new Date('2026-03-30'),
            registrationStartDate: new Date('2026-02-01'),
            registrationEndDate: new Date('2026-03-15'),
            venue: 'Gachibowli Stadium',
            city: 'Hyderabad',
            entryFee: 800,
            image: '/images/events/district-event.webp'
        }
    ];

    // 3. Upsert Events
    for (const event of events) {
        const result = await prisma.event.upsert({
            where: { code: event.code },
            update: {
                name: event.name,
                description: event.description,
                shortDescription: event.shortDescription,
                category: event.category,
                eventType: event.eventType,
                eventLevel: event.eventLevel,
                status: event.status,
                eventDate: event.eventDate,
                eventEndDate: event.eventEndDate,
                registrationStartDate: event.registrationStartDate,
                registrationEndDate: event.registrationEndDate,
                venue: event.venue,
                city: event.city,
                entryFee: event.entryFee,
                eventImage: event.image // Using legacy field for now as it maps to frontend 'image' usually
            },
            create: {
                creatorId: creator.id,
                code: event.code,
                name: event.name,
                description: event.description,
                shortDescription: event.shortDescription,
                category: event.category,
                eventType: event.eventType,
                eventLevel: event.eventLevel,
                status: event.status,
                eventDate: event.eventDate,
                eventEndDate: event.eventEndDate,
                registrationStartDate: event.registrationStartDate,
                registrationEndDate: event.registrationEndDate,
                venue: event.venue,
                city: event.city,
                entryFee: event.entryFee,
                eventImage: event.image,
                ageCategories: ["U-10", "U-12", "U-14", "U-17", "SENIOR"],
                allowMultipleCategories: true,
                requiresApproval: false
            }
        });
        console.log(`✅ Upserted Event: ${event.name} (${event.code})`);
    }

    console.log('\n🎉 Events seeding completed successfully!');
}

main()
    .catch((e) => {
        console.error('❌ Error seeding events:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
