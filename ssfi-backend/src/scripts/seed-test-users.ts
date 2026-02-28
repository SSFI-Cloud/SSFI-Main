import dotenv from 'dotenv';
dotenv.config();

import { PrismaClient, UserRole, Gender, BloodGroup, AcademicBoard, ApprovalStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Test password for all users
const TEST_PASSWORD = 'Test@123';

async function hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 12);
}

async function main() {
    console.log('🌱 Starting seed for test users...');

    const hashedPassword = await hashPassword(TEST_PASSWORD);

    // Calculate expiry date (1 year from now)
    const expiryDate = new Date();
    expiryDate.setFullYear(expiryDate.getFullYear() + 1);

    try {
        // 1. Create State (Tamil Nadu)
        let state = await prisma.state.findFirst({ where: { code: 'TN' } });
        if (!state) {
            state = await prisma.state.create({
                data: {
                    name: 'Tamil Nadu',
                    code: 'TN',
                    isActive: true
                }
            });
            console.log('✅ Created State: Tamil Nadu');
        }

        // 2. Create District (Chennai)
        let district = await prisma.district.findFirst({
            where: { code: 'CHE', stateId: state.id }
        });
        if (!district) {
            district = await prisma.district.create({
                data: {
                    stateId: state.id,
                    name: 'Chennai',
                    code: 'CHE',
                    isActive: true
                }
            });
            console.log('✅ Created District: Chennai');
        }

        // 3. Create Club
        let club = await prisma.club.findFirst({
            where: { code: 'TSC', districtId: district.id }
        });
        if (!club) {
            club = await prisma.club.create({
                data: {
                    districtId: district.id,
                    stateId: state.id,
                    uid: 'SSFI-TN-CHE-TSC-0001',
                    name: 'Test Skating Club',
                    code: 'TSC',
                    registrationNumber: 'REG-TSC-2024-001',
                    establishedYear: 2024,
                    contactPerson: 'Test Contact',
                    phone: '9999999994',
                    email: 'club@test.com',
                    address: '123 Test Street, Chennai',
                    isActive: true,
                    status: 'APPROVED',
                }
            });
            console.log('✅ Created Club: Test Skating Club');
        }

        // 4. Create Global Admin
        console.log('\n👤 Creating test users...\n');

        let adminUser = await prisma.user.findUnique({ where: { phone: '9999999990' } });
        if (!adminUser) {
            adminUser = await prisma.user.create({
                data: {
                    uid: 'SSFI-GA-0001',
                    phone: '9999999990',
                    email: 'admin@test.com',
                    password: hashedPassword,
                    role: UserRole.GLOBAL_ADMIN,
                    otpVerified: true,
                    isActive: true,
                    isApproved: true,
                    approvalStatus: ApprovalStatus.APPROVED,
                    expiryDate: null, // Global admin doesn't expire
                }
            });
            console.log('✅ Global Admin created');
            console.log('   Phone: 9999999990');
            console.log('   Password: Test@123\n');
        }

        // 5. Create State Secretary
        let stateUser = await prisma.user.findUnique({ where: { phone: '9999999991' } });
        if (!stateUser) {
            stateUser = await prisma.user.create({
                data: {
                    uid: 'SSFI-TN-SS-0001',
                    phone: '9999999991',
                    email: 'state@test.com',
                    password: hashedPassword,
                    role: UserRole.STATE_SECRETARY,
                    otpVerified: true,
                    isActive: true,
                    isApproved: true,
                    approvalStatus: ApprovalStatus.APPROVED,
                    expiryDate: expiryDate,
                    statePerson: {
                        create: {
                            stateId: state.id,
                            name: 'Test State Secretary',
                            gender: Gender.MALE,
                            aadhaarNumber: '111111111111',
                            addressLine1: 'State Office Address',
                            city: 'Chennai',
                            pincode: '600001',
                            identityProof: '/uploads/test-id.pdf',
                        }
                    }
                }
            });
            console.log('✅ State Secretary created');
            console.log('   Phone: 9999999991');
            console.log('   Password: Test@123\n');
        }

        // 6. Create District Secretary
        let districtUser = await prisma.user.findUnique({ where: { phone: '9999999992' } });
        if (!districtUser) {
            districtUser = await prisma.user.create({
                data: {
                    uid: 'SSFI-TN-CHE-DS-0001',
                    phone: '9999999992',
                    email: 'district@test.com',
                    password: hashedPassword,
                    role: UserRole.DISTRICT_SECRETARY,
                    otpVerified: true,
                    isActive: true,
                    isApproved: true,
                    approvalStatus: ApprovalStatus.APPROVED,
                    expiryDate: expiryDate,
                    districtPerson: {
                        create: {
                            districtId: district.id,
                            name: 'Test District Secretary',
                            gender: Gender.FEMALE,
                            aadhaarNumber: '222222222222',
                            addressLine1: 'District Office Address',
                            city: 'Chennai',
                            pincode: '600002',
                            identityProof: '/uploads/test-id.pdf',
                        }
                    }
                }
            });
            console.log('✅ District Secretary created');
            console.log('   Phone: 9999999992');
            console.log('   Password: Test@123\n');
        }

        // 7. Create Club Owner
        let clubOwnerUser = await prisma.user.findUnique({ where: { phone: '9999999993' } });
        if (!clubOwnerUser) {
            clubOwnerUser = await prisma.user.create({
                data: {
                    uid: 'SSFI-TN-CHE-TSC-CO-0001',
                    phone: '9999999993',
                    email: 'clubowner@test.com',
                    password: hashedPassword,
                    role: UserRole.CLUB_OWNER,
                    otpVerified: true,
                    isActive: true,
                    isApproved: true,
                    approvalStatus: ApprovalStatus.APPROVED,
                    expiryDate: expiryDate,
                    clubOwner: {
                        create: {
                            clubId: club.id,
                            name: 'Test Club Owner',
                            gender: Gender.MALE,
                            aadhaarNumber: '333333333333',
                            addressLine1: 'Club Owner Address',
                            city: 'Chennai',
                            pincode: '600003',
                            identityProof: '/uploads/test-id.pdf',
                        }
                    }
                }
            });
            console.log('✅ Club Owner created');
            console.log('   Phone: 9999999993');
            console.log('   Password: Test@123\n');
        }

        // 8. Create Student
        let studentUser = await prisma.user.findUnique({ where: { phone: '9999999994' } });
        if (!studentUser) {
            studentUser = await prisma.user.create({
                data: {
                    uid: 'SSFI-TN-CHE-TSC-ST-0001',
                    phone: '9999999994',
                    email: 'student@test.com',
                    password: hashedPassword,
                    role: UserRole.STUDENT,
                    otpVerified: true,
                    isActive: true,
                    isApproved: true,
                    approvalStatus: ApprovalStatus.APPROVED,
                    expiryDate: expiryDate,
                    student: {
                        create: {
                            stateId: state.id,
                            districtId: district.id,
                            clubId: club.id,
                            name: 'Test Student',
                            dateOfBirth: new Date('2010-01-01'),
                            gender: Gender.MALE,
                            bloodGroup: BloodGroup.O_POSITIVE,
                            aadhaarNumber: '444444444444',
                            fatherName: 'Test Father',
                            motherName: 'Test Mother',
                            schoolName: 'Test School',
                            academicBoard: AcademicBoard.STATE_BOARD,
                            nomineeName: 'Test Father',
                            nomineeAge: 45,
                            nomineeRelation: 'Father',
                            coachName: 'Test Coach',
                            coachPhone: '9999999995',
                            addressLine1: 'Student Address',
                            city: 'Chennai',
                            pincode: '600004',
                            aadhaarCard: '/uploads/test-aadhaar.pdf',
                        }
                    }
                }
            });
            console.log('✅ Student created');
            console.log('   Phone: 9999999994');
            console.log('   Password: Test@123\n');
        }

        console.log('\n🎉 Seed completed successfully!\n');
        console.log('📋 Test User Credentials Summary:');
        console.log('=====================================');
        console.log('Password for ALL users: Test@123\n');
        console.log('1. Global Admin:');
        console.log('   Phone: 9999999990\n');
        console.log('2. State Secretary (Tamil Nadu):');
        console.log('   Phone: 9999999991\n');
        console.log('3. District Secretary (Chennai):');
        console.log('   Phone: 9999999992\n');
        console.log('4. Club Owner (Test Skating Club):');
        console.log('   Phone: 9999999993\n');
        console.log('5. Student (Test Student):');
        console.log('   Phone: 9999999994\n');
        console.log('=====================================\n');

    } catch (error) {
        console.error('❌ Error seeding database:', error);
        throw error;
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
