
import { PrismaClient } from "@/generated/prisma";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
    console.log("Checking users in DB...");
    const users = await prisma.user.findMany();
    console.log(`Found ${users.length} users.`);

    for (const user of users) {
        console.log(`User: ${user.username}, Role: ${user.role}, ID: ${user.id}`);
        // Test password
        const isMatch = await bcrypt.compare("password123", user.password);
        console.log(`Password match for 'password123': ${isMatch}`);
    }
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
