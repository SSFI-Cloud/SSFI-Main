
import { PrismaClient } from "@/generated/prisma";

const prisma = new PrismaClient();

async function main() {
    console.log("Seeding District 0...");

    // Ensure State 1 exists (Tamil Nadu)
    const state = await prisma.state.upsert({
        where: { id: 1 },
        update: {},
        create: { id: 1, state_name: "Tamil Nadu", code: "TN" }
    });

    // Create District 0 explicitly
    // Note: Auto-increment usually skips 0, but we can force it if sql_mode allows or if not strict.
    // Or we just use a high ID for "None"? Schema says default 0.
    // Use raw SQL to force ID 0
    // Try setting sql_mode first
    try {
        await prisma.$executeRaw`SET SESSION sql_mode='NO_AUTO_VALUE_ON_ZERO'`;
        await prisma.$executeRaw`INSERT IGNORE INTO tbl_districts (id, state_id, district_name, created_at, updated_at) VALUES (0, ${state.id}, 'All Districts', NOW(), NOW())`;
        console.log("District 0 seed attempted via Raw SQL (with NO_AUTO_VALUE_ON_ZERO).");

        // Check if it exists now
        const d0 = await prisma.district.findUnique({ where: { id: 0 } });
        console.log("District 0 Check:", d0);

    } catch (e) {
        console.error("Failed to seed District 0:", e);
    }
}

main()
    .then(async () => { await prisma.$disconnect(); })
    .catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });
