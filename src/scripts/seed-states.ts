import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// All Indian States and Union Territories
const indianStates = [
    { name: 'Andaman and Nicobar Islands', code: 'AN' },
    { name: 'Andhra Pradesh', code: 'AP' },
    { name: 'Arunachal Pradesh', code: 'AR' },
    { name: 'Assam', code: 'AS' },
    { name: 'Bihar', code: 'BR' },
    { name: 'Chandigarh', code: 'CH' },
    { name: 'Chhattisgarh', code: 'CT' },
    { name: 'Dadra and Nagar Haveli and Daman and Diu', code: 'DH' },
    { name: 'Delhi', code: 'DL' },
    { name: 'Goa', code: 'GA' },
    { name: 'Gujarat', code: 'GJ' },
    { name: 'Haryana', code: 'HR' },
    { name: 'Himachal Pradesh', code: 'HP' },
    { name: 'Jammu and Kashmir', code: 'JK' },
    { name: 'Jharkhand', code: 'JH' },
    { name: 'Karnataka', code: 'KA' },
    { name: 'Kerala', code: 'KL' },
    { name: 'Ladakh', code: 'LA' },
    { name: 'Lakshadweep', code: 'LD' },
    { name: 'Madhya Pradesh', code: 'MP' },
    { name: 'Maharashtra', code: 'MH' },
    { name: 'Manipur', code: 'MN' },
    { name: 'Meghalaya', code: 'ML' },
    { name: 'Mizoram', code: 'MZ' },
    { name: 'Nagaland', code: 'NL' },
    { name: 'Odisha', code: 'OR' },
    { name: 'Puducherry', code: 'PY' },
    { name: 'Punjab', code: 'PB' },
    { name: 'Rajasthan', code: 'RJ' },
    { name: 'Sikkim', code: 'SK' },
    { name: 'Tamil Nadu', code: 'TN' },
    { name: 'Telangana', code: 'TS' },
    { name: 'Tripura', code: 'TR' },
    { name: 'Uttar Pradesh', code: 'UP' },
    { name: 'Uttarakhand', code: 'UK' },
    { name: 'West Bengal', code: 'WB' },
];

async function seedStates() {
    console.log('🌍 Seeding Indian States...');

    let created = 0;
    let existing = 0;

    for (const state of indianStates) {
        const existingState = await prisma.state.findFirst({
            where: {
                OR: [
                    { name: state.name },
                    { code: state.code }
                ]
            }
        });

        if (existingState) {
            console.log(`✓ ${state.name} already exists`);
            existing++;
        } else {
            await prisma.state.create({
                data: {
                    name: state.name,
                    code: state.code,
                }
            });
            console.log(`✅ Created ${state.name}`);
            created++;
        }
    }

    const total = await prisma.state.count();

    console.log('\n📊 Summary:');
    console.log(`   Created: ${created}`);
    console.log(`   Existing: ${existing}`);
    console.log(`   Total in DB: ${total}`);
    console.log('\n✅ States seeding completed!');
}

seedStates()
    .catch((error) => {
        console.error('❌ Error seeding states:', error);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
