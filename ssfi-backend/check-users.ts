import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkUsers() {
    const users = await prisma.user.findMany({
        where: {
            phone: { in: ['9999999993', '9999999994'] }
        },
        include: {
            clubOwner: true,
            student: true
        }
    });

    console.log('=== Club Owner & Student Data ===');
    users.forEach(user => {
        console.log('\nUser:', user.phone, '- Role:', user.role);
        console.log('clubOwner:', user.clubOwner);
        console.log('student:', user.student);
    });

    await prisma.$disconnect();
}

checkUsers().catch(console.error);
