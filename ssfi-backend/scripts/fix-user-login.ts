
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    const email = 'voltspacefuture@gmail.com';
    const correctPhone = '7892641107'; // From DistrictSecretary record

    console.log(`Fixing user login for email: ${email}`);

    const user = await prisma.user.findUnique({
        where: { email }
    });

    if (!user) {
        console.log('User not found.');
        return;
    }

    console.log(`Current User Phone: ${user.phone}`);
    console.log(`Target Phone: ${correctPhone}`);

    // Hash the new password (phone number)
    const hashedPassword = await bcrypt.hash(correctPhone, 12);

    // Update User
    const updatedUser = await prisma.user.update({
        where: { id: user.id },
        data: {
            phone: correctPhone,
            password: hashedPassword,
            isApproved: true,
            approvalStatus: 'APPROVED',
            otpVerified: true,
            isActive: true
        }
    });

    console.log('User updated successfully!');
    console.log(`New Phone: ${updatedUser.phone}`);
    console.log(`Is Approved: ${updatedUser.isApproved}`);
    console.log(`OTP Verified: ${updatedUser.otpVerified}`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
