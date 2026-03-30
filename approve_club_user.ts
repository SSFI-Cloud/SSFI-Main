
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const phone = '9900572668';
    console.log(`Approving user with phone: ${phone}`);

    await prisma.user.updateMany({
        where: { phone },
        data: {
            otpVerified: true,
            isApproved: true,
            approvalStatus: 'APPROVED',
            isActive: true
        }
    });

    // Also approve the Club
    await prisma.club.updateMany({
        where: { phone },
        data: {
            status: 'APPROVED',
            isActive: true,
            approvedAt: new Date(),
            approvedBy: 'SYSTEM_SCRIPT'
        }
    });

    console.log('User and Club approved.');
}

main().catch(console.error).finally(() => prisma.$disconnect());
