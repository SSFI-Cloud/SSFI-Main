
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    console.log('Checking Registration Windows...');
    const windows = await prisma.registrationWindow.findMany({
        where: { type: 'STATE_SECRETARY' }
    });
    console.log(JSON.stringify(windows, null, 2));

    const now = new Date();
    console.log('Current Server Time:', now.toISOString());
}

main().catch(console.error).finally(() => prisma.$disconnect());
