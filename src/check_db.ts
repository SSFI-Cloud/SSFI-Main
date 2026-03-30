
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Checking database connection...');
    try {
        // Legacy Users
        const userCount = await prisma.legacyUser.count();
        console.log(`Legacy Users: ${userCount}`);

        // News
        try {
            const newsCount = await prisma.newsArticle.count();
            console.log(`News Articles: ${newsCount} (Table Exists!)`);
        } catch (e: any) {
            console.log('News Query Failed (Table Missing): ' + e.message);
        }

        // Front Settings
        try {
            const settingsCount = await prisma.frontCmsSetting.count();
            console.log(`Front Settings: ${settingsCount}`);
        } catch (e: any) {
            console.log('Front Settings Query Failed: ' + e.message);
        }

        // Students
        try {
            const studentCount = await prisma.student.count();
            console.log(`Students: ${studentCount}`);
        } catch (e: any) {
            console.log('Student Query Failed: ' + e.message);
        }

    } catch (error) {
        console.error('General Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
