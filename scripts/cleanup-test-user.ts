
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanup() {
    const phone = '7892641101';
    const email = 'lakshmanan1413@gmail.com';

    console.log(`Cleaning up data for phone: ${phone}, email: ${email}`);

    try {
        // 1. Find User
        const user = await prisma.user.findFirst({
            where: { OR: [{ phone }, { email }] }
        });

        if (user) {
            console.log(`Found user: ${user.id} (${user.email})`);

            // Check for Student record and delete dependencies
            const student = await prisma.student.findUnique({
                where: { userId: user.id }
            });

            if (student) {
                console.log(`Found student record: ${student.id}`);
                // Delete Event Registrations
                await prisma.eventRegistration.deleteMany({ where: { studentId: student.id } });
                // Delete Certificates
                await prisma.certificate.deleteMany({ where: { studentId: student.id } });
                // Delete Race Results
                await prisma.raceResult.deleteMany({ where: { studentId: student.id } });

                // Delete Student (User deletion would cascade, but explicit is safer for debugging)
                // await prisma.student.delete({ where: { id: student.id } });
                console.log('Cleaned up student dependencies.');
            }

            // 2. Delete District Secretary Application linked to this user (if any, via userId? or just by phone/email)
            // Note: In current schema, DistrictSecretary might not strictly link to User via FK in a way that cascades, 
            // or we manually linked them. 
            // Let's find DistrictSecretary by phone/email too to be sure.
            const secretary = await prisma.districtSecretary.findFirst({
                where: { OR: [{ phone }, { email }] }
            });

            if (secretary) {
                // Delete related payments first assuming they might link to entity
                // But payments link to User usually.
                console.log(`Found District Secretary application: ${secretary.id}`);
                await prisma.districtSecretary.delete({ where: { id: secretary.id } });
                console.log('Deleted District Secretary application.');
            }

            // 3. Delete Payments linked to User
            const payments = await prisma.payment.deleteMany({ where: { userId: user.id } });
            console.log(`Deleted ${payments.count} payment records.`);

            // 4. Delete the User
            await prisma.user.delete({ where: { id: user.id } });
            console.log('Deleted User record.');

        } else {
            console.log('User not found. Checking for orphaned District Secretary records...');
            const secretary = await prisma.districtSecretary.findFirst({
                where: { OR: [{ phone }, { email }] }
            });

            if (secretary) {
                console.log(`Found orphaned District Secretary application: ${secretary.id}`);
                await prisma.districtSecretary.delete({ where: { id: secretary.id } });
                console.log('Deleted District Secretary application.');
            } else {
                console.log('No records found to clean up.');
            }
        }

        console.log('Cleanup complete.');

    } catch (error) {
        console.error('Cleanup failed:', error);
    } finally {
        await prisma.$disconnect();
    }
}

cleanup();
