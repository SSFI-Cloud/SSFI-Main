
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const stateCount = await prisma.state.count();
    const districtCount = await prisma.district.count();

    console.log(`States count: ${stateCount}`);
    console.log(`Districts count: ${districtCount}`);

    if (stateCount > 0) {
        const states = await prisma.state.findMany({ take: 5 });
        console.log('Sample States:', states);
    }

    if (districtCount > 0) {
        const districts = await prisma.district.findMany({ take: 5 });
        console.log('Sample Districts:', districts);
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
