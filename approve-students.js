const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function approveAllStudents() {
    try {
        // Count first
        const pending = await prisma.user.count({
            where: { role: 'STUDENT', isApproved: false }
        });
        console.log(`Found ${pending} pending students`);

        if (pending === 0) {
            console.log('Nothing to do.');
            return;
        }

        // Bulk approve all pending students
        const result = await prisma.user.updateMany({
            where: {
                role: 'STUDENT',
                isApproved: false
            },
            data: {
                isApproved: true,
                approvalStatus: 'APPROVED',
                isActive: true,
                accountStatus: 'ACTIVE',
            }
        });

        console.log(`✅ Approved ${result.count} students successfully`);

        // Verify
        const stillPending = await prisma.user.count({
            where: { role: 'STUDENT', isApproved: false }
        });
        console.log(`Remaining pending: ${stillPending}`);

    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        await prisma.$disconnect();
    }
}

approveAllStudents();
