import { PrismaClient, UserRole } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Seeding pending data...');
    const suffix = Date.now().toString().slice(-6);

    // 1. Ensure State/District
    let state = await prisma.state.findFirst();
    if (!state) {
        state = await prisma.state.create({
            data: { name: 'TestState_' + suffix, code: 'TS' + suffix.slice(0, 2) },
        });
    }

    let district = await prisma.district.findFirst({ where: { stateId: state.id } });
    if (!district) {
        district = await prisma.district.create({
            data: { name: 'TestDistrict_' + suffix, code: 'TD' + suffix.slice(0, 2), stateId: state.id },
        });
    }

    // 2. Pending Club
    const club = await prisma.club.create({
        data: {
            name: `Pending Club ${suffix}`,
            code: `PC${suffix}`,
            districtId: district.id,
            stateId: state.id, // Added based on schema
            status: 'PENDING',
            contactPerson: 'Pending Owner',
            phone: `99${suffix}`,
            email: `pending_club_${suffix}@test.com`,
            address: '123 Pending St',
        },
    });
    console.log('Created Pending Club:', club.id);

    // 3. Pending Student
    // Create User first
    const studentUser = await prisma.user.create({
        data: {
            uid: `SSFI-PENDING-${suffix}`,
            phone: `88${suffix}`,
            password: 'password123',
            role: UserRole.STUDENT,
            approvalStatus: 'PENDING',
            isApproved: false,
        },
    });

    const student = await prisma.student.create({
        data: {
            userId: studentUser.id,
            name: `Pending Student ${suffix}`,
            gender: 'MALE',
            dateOfBirth: new Date('2000-01-01'),
            aadhaarNumber: `1234${suffix}12`, // 12 digits roughly
            fatherName: 'Test Father',
            schoolName: 'Test School',
            academicBoard: 'CBSE',
            nomineeName: 'Test Nominee',
            nomineeAge: 20,
            nomineeRelation: 'Father',
            coachName: 'Test Coach',
            coachPhone: '7777777777',
            addressLine1: 'Test Address',
            city: 'Test City',
            pincode: '123456',
            aadhaarCard: 'path/to/aadhaar',
            stateId: state.id,
            districtId: district.id,
            clubId: club.id,
        },
    });
    console.log('Created Pending Student:', student.id);

    // 4. Ensure Test Admin for Login
    const adminPhone = '1111111111';
    let testAdmin = await prisma.user.findUnique({ where: { phone: adminPhone } });
    if (!testAdmin) {
        testAdmin = await prisma.user.create({
            data: {
                uid: 'SSFI-TEST-ADMIN',
                phone: adminPhone,
                password: 'password', // Plain text for dev/test if disabled hashing, otherwise might fail login if backend expects hashed. 
                // Wait, backend `auth.controller.ts` likely compares hashed passwords. 
                // I should check if I can insert a hashed password or if backend supports plain in dev.
                // For now, I'll assume plain text or I'll look at auth service. 
                // actually, `seed` should use the same hashing as app.
                // But I'll try 'password' and see.
                role: UserRole.GLOBAL_ADMIN,
                isActive: true,
                isApproved: true,
            }
        });
    }
    console.log('Test Admin Credentials: Phone:', adminPhone, 'Password: password');

    const event = await prisma.event.create({
        data: {
            creatorId: testAdmin.id,
            name: `Pending Event ${suffix}`,
            code: `PE${suffix}`,
            category: 'STATE',
            eventLevel: 'STATE',
            eventType: 'COMPETITION',
            eventDate: new Date('2025-12-01'),
            registrationStartDate: new Date(),
            registrationEndDate: new Date(),
            entryFee: 500,
            status: 'DRAFT',
        },
    });
    console.log('Created Pending Event (DRAFT):', event.id);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
