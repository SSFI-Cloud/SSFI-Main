
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkOrphans() {
    try {
        // Find users with role DISTRICT_SECRETARY
        const users = await prisma.user.findMany({
            where: { role: 'DISTRICT_SECRETARY' },
            include: {
                districtPerson: true
            }
        });

        console.log(`Found ${users.length} users with role DISTRICT_SECRETARY.`);

        for (const user of users) {
            // Check if they have a DistrictSecretary application
            // We look up by uid, or phone/email if possible.
            // DistrictSecretary has phone/email.

            const filters: any[] = [{ phone: user.phone }];
            if (user.email) filters.push({ email: user.email });
            if (user.uid) filters.push({ uid: user.uid });

            const app = await prisma.districtSecretary.findFirst({
                where: {
                    OR: filters
                }
            });

            if (!app) {
                console.log(`[ORPHAN FOUND] User ID: ${user.id}, Phone: ${user.phone}, Email: ${user.email}, UID: ${user.uid}`);
                console.log(`  - Has DistrictPerson record? ${user.districtPerson ? 'YES' : 'NO'}`);
            } else {
                console.log(`[OK] User ${user.uid} has application ${app.id} (${app.status})`);
            }
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkOrphans();
