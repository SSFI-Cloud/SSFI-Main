
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkStates() {
    try {
        const states = await prisma.state.findMany({
            select: { id: true, name: true, code: true }
        });
        console.table(states);
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkStates();
