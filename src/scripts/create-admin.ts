
import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    const phone = '9999999999';
    const password = 'password123';
    const hashedPassword = await bcrypt.hash(password, 12);

    const existingAdmin = await prisma.user.findUnique({
        where: { phone },
    });

    if (existingAdmin) {
        console.log('Admin user already exists. Updating...');
        await prisma.user.update({
            where: { phone },
            data: {
                otpVerified: true,
                isActive: true,
                isApproved: true,
                role: 'GLOBAL_ADMIN',
                password: hashedPassword
            }
        });
        console.log('Admin user updated.');
        return;
    }

    const admin = await prisma.user.create({
        data: {
            uid: 'SSFI-ADMIN-0001',
            phone,
            email: 'admin@ssfiskate.com',
            password: hashedPassword,
            role: 'GLOBAL_ADMIN',
            isActive: true,
            isApproved: true,
            otpVerified: true,
            approvalStatus: 'APPROVED'
        },
    });

    console.log(`Admin created: ${admin.phone} / ${password}`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
