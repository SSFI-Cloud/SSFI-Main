
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const phone = '9900572668';

    const user = await prisma.user.findUnique({
        where: { phone },
        include: { clubOwner: true, student: true }
    });

    const club = await prisma.club.findFirst({ where: { phone } });

    console.log('User:', user);
    console.log('Club:', club);

    if (user && club) {
        console.log('Checking ClubOwner table...');
        const clubOwner = await prisma.clubOwner.findFirst({
            where: {
                userId: user.id
            }
        });
        console.log('ClubOwner Record:', clubOwner);
    }
}

main().catch(console.error).finally(() => prisma.$disconnect());
