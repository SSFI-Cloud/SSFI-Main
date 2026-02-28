
import { PrismaClient, UserRole, Gender, Status } from "@/generated/prisma";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
    console.log("Starting seed...");

    // 1. Create Roles
    const roles = [
        { id: 1, name: "GLOBAL_ADMIN", is_system: "Y" },
        { id: 2, name: "STATE_ADMIN", is_system: "Y" },
        { id: 3, name: "DISTRICT_ADMIN", is_system: "Y" },
        { id: 4, name: "CLUB_ADMIN", is_system: "Y" },
        { id: 5, name: "STUDENT", is_system: "Y" }
    ];

    for (const role of roles) {
        await prisma.role.upsert({
            where: { id: role.id },
            update: {},
            create: {
                id: role.id,
                name: role.name,
                is_system: role.is_system
            }
        });
    }

    // 2. Create State (Tamil Nadu)
    const state = await prisma.state.upsert({
        where: { id: 1 },
        update: {},
        create: {
            id: 1,
            state_name: "Tamil Nadu",
            code: "TN"
        }
    });

    // 3. Create District (Chennai)
    const district = await prisma.district.upsert({
        where: { id: 1 },
        update: {},
        create: {
            id: 1,
            district_name: "Chennai",
            state_id: state.id
        }
    });

    // 4. Create Club
    const club = await prisma.club.upsert({
        where: { id: 1 },
        update: {},
        create: {
            id: 1,
            club_name: "Chennai Skaters Club",
            district_id: district.id,
            state_id: state.id,
            status: "active",
            contact_person: "Club Admin Person",
            email_address: "club@example.com"
        }
    });

    // 5. Create Skater
    const skater = await prisma.skater.upsert({
        where: { id: 1 },
        update: {},
        create: {
            id: 1,
            full_name: "Student Skater",
            father_name: "Father Skater",
            date_of_birth: new Date("2010-01-01"),
            gender: Gender.Male,
            category_type_id: 1,
            membership_id: "TN/CHN/001",
            state_id: state.id,
            district_id: district.id,
            club_id: club.id,
            mobile_number: "9876543210",
            nominee_name: "Nominee",
            nominee_age: 40,
            nominee_relation: "Father"
        }
    });

    // Password hashing
    const hashedPassword = await bcrypt.hash("password123", 10);

    // 6. Create Users

    // Global Admin
    await prisma.user.upsert({
        where: { id: 1 },
        update: {
            password: hashedPassword,
            role: UserRole.GLOBAL_ADMIN,
            username: "admin",
            user_id: "admin",
            state_id: state.id
        },
        create: {
            id: 1,
            user_id: "admin",
            username: "admin", // Login username
            password: hashedPassword,
            full_name: "Global Administrator",
            email_address: "admin@ssfi.in",
            mobile_number: "9999999999",
            gender: Gender.Male,
            aadhar_number: "000000000000",
            residential_address: "Admin HQ",
            identity_proof: "",
            profile_photo: "",
            role_id: 1,
            role: UserRole.GLOBAL_ADMIN,
            state_id: state.id, // Linked to state 1 by default structure constraints
            branch_id: 1,
            created_by: 0,
            updated_by: 0
        }
    });

    // State Admin
    await prisma.user.upsert({
        where: { id: 2 },
        update: {
            password: hashedPassword,
            role: UserRole.STATE_ADMIN,
            username: "state_admin",
            user_id: "state_admin",
            state_id: state.id
        },
        create: {
            id: 2,
            user_id: "state_admin",
            username: "state_admin", // Login username
            password: hashedPassword,
            full_name: "TN State Secretary",
            email_address: "state@ssfi.in",
            mobile_number: "8888888888",
            gender: Gender.Male,
            aadhar_number: "111111111111",
            residential_address: "Chennai, TN",
            identity_proof: "",
            profile_photo: "",
            role_id: 2,
            role: UserRole.STATE_ADMIN,
            state_id: state.id,
            branch_id: 1,
            created_by: 1,
            updated_by: 1
        }
    });

    // District Admin
    await prisma.user.upsert({
        where: { id: 3 },
        update: {
            password: hashedPassword,
            role: UserRole.DISTRICT_ADMIN,
            username: "district_admin",
            user_id: "district_admin",
            state_id: state.id,
            district_id: district.id
        },
        create: {
            id: 3,
            user_id: "district_admin",
            username: "district_admin", // Login username
            password: hashedPassword,
            full_name: "Chennai District Secretary",
            email_address: "district@ssfi.in",
            mobile_number: "7777777777",
            gender: Gender.Male,
            aadhar_number: "222222222222",
            residential_address: "Chennai",
            identity_proof: "",
            profile_photo: "",
            role_id: 3,
            role: UserRole.DISTRICT_ADMIN,
            state_id: state.id,
            district_id: district.id,
            branch_id: 1,
            created_by: 1,
            updated_by: 1
        }
    });

    // Club Admin
    await prisma.user.upsert({
        where: { id: 4 },
        update: {
            password: hashedPassword,
            role: UserRole.CLUB_ADMIN,
            username: "club_admin",
            user_id: "club_admin",
            state_id: state.id,
            district_id: district.id,
            club_id: club.id
        },
        create: {
            id: 4,
            user_id: "club_admin",
            username: "club_admin", // Login username
            password: hashedPassword,
            full_name: "Club Secretary",
            email_address: "club@ssfi.in",
            mobile_number: "6666666666",
            gender: Gender.Male,
            aadhar_number: "333333333333",
            residential_address: "Anna Nagar, Chennai",
            identity_proof: "",
            profile_photo: "",
            role_id: 4,
            role: UserRole.CLUB_ADMIN,
            state_id: state.id,
            district_id: district.id,
            club_id: club.id,
            branch_id: 1,
            created_by: 1,
            updated_by: 1
        }
    });

    // Student (Skater)
    await prisma.user.upsert({
        where: { id: 5 },
        update: {
            password: hashedPassword,
            role: UserRole.STUDENT,
            username: "student",
            user_id: "student",
            member_id: skater.membership_id,
            state_id: state.id,
            district_id: district.id,
            club_id: club.id
        },
        create: {
            id: 5,
            user_id: "student",
            username: "student", // Login username
            password: hashedPassword,
            full_name: "Student Skater",
            email_address: "student@ssfi.in",
            mobile_number: "5555555555",
            gender: Gender.Male,
            aadhar_number: "444444444444",
            residential_address: "Chennai",
            identity_proof: "",
            profile_photo: "",
            role_id: 5,
            role: UserRole.STUDENT,
            member_id: skater.membership_id, // Links to Skater table
            state_id: state.id,
            district_id: district.id,
            club_id: club.id,
            branch_id: 1,
            created_by: 1,
            updated_by: 1
        }
    });

    console.log("Seeding completed successfully.");
    console.log("Users created:");
    console.log("- Global Admin: admin / password123");
    console.log("- State Admin: state_admin / password123");
    console.log("- District Admin: district_admin / password123");
    console.log("- Club Admin: club_admin / password123");
    console.log("- Student: student / password123");
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });
