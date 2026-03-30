
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const email = 'voltspacefuture@gmail.com';
    console.log(`Fetching user with email: ${email}`);

    const user = await prisma.user.findUnique({
        where: { email }
    });

    if (!user) {
        console.log('User not found.');
    } else {
        console.log('User found:');
        console.log(`ID: ${user.id}`);
        console.log(`UID: ${user.uid}`);
        console.log(`Phone: ${user.phone}`); // Crucial check
        console.log(`Email: ${user.email}`);
        console.log(`Role: ${user.role}`);
        console.log(`Is Active: ${user.isActive}`);
        console.log(`Is Approved: ${user.isApproved}`);
        console.log(`Approval Status: ${user.approvalStatus}`);
        console.log(`OTP Verified: ${user.otpVerified}`);

        // Check District Secretary App
        // Manual query since relation is not named districtSecretary
        const ds = await prisma.districtSecretary.findFirst({
            where: { email: email }
        });
        console.log('District Secretary Application (via email match):', ds);

        if (ds) {
            console.log(`DS Phone: ${ds.phone}`);
        }
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
