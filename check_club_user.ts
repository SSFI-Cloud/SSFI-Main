
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const phone = '9900572668';
    console.log(`Checking for user/club with phone: ${phone}`);

    const user = await prisma.user.findFirst({ where: { phone } });
    console.log('User:', user);

    const club = await prisma.club.findFirst({ where: { phone } });
    console.log('Club:', club);
}

main().catch(console.error).finally(() => prisma.$disconnect());
