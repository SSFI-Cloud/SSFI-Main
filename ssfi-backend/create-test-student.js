// Run this script to create a test student
// Usage: node create-test-student.js

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        // First, check if student already exists
        const existing = await prisma.student.findFirst({
            where: { membershipId: 'SSFI-TN-CHE-TSC-ST-0001' }
        });

        if (existing) {
            console.log('✅ Student already exists:');
            console.log(existing);
            return;
        }

        // Get the first available club, district, and state
        const club = await prisma.club.findFirst();
        const district = await prisma.district.findFirst();
        const state = await prisma.state.findFirst();

        if (!club || !district || !state) {
            console.error('❌ Please create at least one club, district, and state first');
            return;
        }

        // Create a test user for the student
        const user = await prisma.user.create({
            data: {
                uid: 'SSFI-TN-CHE-TSC-ST-0001',
                phone: '9876543210',
                email: 'teststudent@example.com',
                password: '$2a$10$abcdefghijklmnopqrstuvwxyz', // hashed "password123"
                role: 'STUDENT',
                otpVerified: true,
                isApproved: true,
                approvalStatus: 'APPROVED',
            }
        });

        // Create the student
        const student = await prisma.student.create({
            data: {
                userId: user.id,
                stateId: state.id,
                districtId: district.id,
                clubId: club.id,
                membershipId: 'SSFI-TN-CHE-TSC-ST-0001',
                name: 'Test Student',
                dateOfBirth: new Date('2010-01-01'),
                gender: 'MALE',
                bloodGroup: 'A_POSITIVE',
                aadhaarNumber: '123456789012',
                fatherName: 'Test Father',
                motherName: 'Test Mother',
                schoolName: 'Test School',
                academicBoard: 'STATE_BOARD',
                nomineeName: 'Test Guardian',
                nomineeAge: 35,
                nomineeRelation: 'FATHER',
                coachName: 'Test Coach',
                coachPhone: '9876543210',
                addressLine1: '123 Test Street',
                city: 'Test City',
                pincode: '600001',
                aadhaarCard: 'test-aadhaar.jpg',
                profilePhoto: 'test-photo.jpg',
                verified: 1,
            }
        });

        console.log('✅ Test student created successfully!');
        console.log('📝 UID: SSFI-TN-CHE-TSC-ST-0001');
        console.log('👤 Name:', student.name);
        console.log('🏢 Club:', club.name);
        console.log('📍 District:', district.name);
        console.log('🗺️  State:', state.name);

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

main();
