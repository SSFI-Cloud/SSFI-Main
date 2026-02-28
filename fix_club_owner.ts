
import { PrismaClient, Gender } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const phone = '9900572668';

    const user = await prisma.user.findUnique({ where: { phone } });
    const club = await prisma.club.findFirst({ where: { phone } });

    if (!user || !club) {
        console.log('User or Club not found');
        return;
    }

    console.log(`Creating ClubOwner for User ${user.id} and Club ${club.id}`);

    try {
        const clubOwner = await prisma.clubOwner.create({
            data: {
                userId: user.id,
                clubId: club.id,
                name: club.contactPerson || 'Club Owner',
                gender: Gender.MALE, // Default
                aadhaarNumber: `TEMP-${phone}`, // Placeholder
                addressLine1: club.address || 'Address',
                city: 'City',
                pincode: '000000',
                identityProof: 'temp_proof.jpg'
            }
        });
        console.log('ClubOwner Created:', clubOwner);
    } catch (error) {
        console.error('Error creating ClubOwner:', error);
    }
}

main().catch(console.error).finally(() => prisma.$disconnect());
