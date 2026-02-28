import { PrismaClient, AccountStatus, UserRole } from '@prisma/client';

const prisma = new PrismaClient();

async function createTestUsersWithExpiry() {
    console.log('Setting up test users with various expiry statuses...\n');

    const now = new Date();

    // Get existing users (non-admin) to update their expiry dates
    const users = await prisma.user.findMany({
        where: {
            role: { not: UserRole.GLOBAL_ADMIN }
        },
        include: {
            student: true,
            clubOwner: true,
            districtPerson: true,
            statePerson: true
        },
        take: 10
    });

    if (users.length === 0) {
        console.log('No non-admin users found. Creating test cases manually...');
        return;
    }

    console.log(`Found ${users.length} users. Updating expiry dates...\n`);

    // Assign different expiry statuses
    for (let i = 0; i < users.length; i++) {
        const user = users[i];
        const name = user.student?.name || user.clubOwner?.name ||
            user.districtPerson?.name || user.statePerson?.name || `User ${user.uid}`;

        let expiryDate: Date;
        let status: AccountStatus = AccountStatus.ACTIVE;
        let description: string;

        if (i % 4 === 0) {
            // Expiring in 7 days - RED banner
            expiryDate = new Date(now);
            expiryDate.setDate(expiryDate.getDate() + 7);
            description = 'Expires in 7 days - RED banner';
        } else if (i % 4 === 1) {
            // Expiring in 20 days - ORANGE banner
            expiryDate = new Date(now);
            expiryDate.setDate(expiryDate.getDate() + 20);
            description = 'Expires in 20 days - ORANGE banner';
        } else if (i % 4 === 2) {
            // Already expired
            expiryDate = new Date(now);
            expiryDate.setDate(expiryDate.getDate() - 5);
            status = AccountStatus.EXPIRED;
            description = 'Already expired 5 days ago';
        } else {
            // Active with distant expiry (safe)
            expiryDate = new Date(now);
            expiryDate.setMonth(expiryDate.getMonth() + 10);
            description = 'Expires in 10 months - OK';
        }

        await prisma.user.update({
            where: { id: user.id },
            data: {
                expiryDate,
                accountStatus: status,
                renewalNotificationSent: false,
                registrationDate: user.registrationDate || now,
                renewalPeriodMonths: 12
            }
        });

        console.log(`✅ ${name} (${user.uid}) - ${user.role}`);
        console.log(`   ${description}`);
        console.log(`   Expiry: ${expiryDate.toLocaleDateString()}\n`);
    }

    // Print summary
    const expiring7Days = await prisma.user.count({
        where: {
            role: { not: UserRole.GLOBAL_ADMIN },
            expiryDate: {
                gte: now,
                lte: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
            },
            accountStatus: AccountStatus.ACTIVE
        }
    });

    const expiring30Days = await prisma.user.count({
        where: {
            role: { not: UserRole.GLOBAL_ADMIN },
            expiryDate: {
                gte: now,
                lte: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
            },
            accountStatus: AccountStatus.ACTIVE
        }
    });

    const expired = await prisma.user.count({
        where: {
            role: { not: UserRole.GLOBAL_ADMIN },
            accountStatus: AccountStatus.EXPIRED
        }
    });

    console.log('\n========== SUMMARY ==========');
    console.log(`Expiring in 7 days:  ${expiring7Days}`);
    console.log(`Expiring in 30 days: ${expiring30Days}`);
    console.log(`Already expired:     ${expired}`);
    console.log('\n✅ Done! Now:');
    console.log('1. Login as Global Admin and go to /dashboard/renewals');
    console.log('2. Login as an expiring user to see the banner on their dashboard');
}

createTestUsersWithExpiry()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
