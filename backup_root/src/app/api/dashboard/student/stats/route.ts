
import { NextResponse } from "next/server";
import { PrismaClient } from "@/generated/prisma";
import { headers } from "next/headers";

const db = new PrismaClient();

export async function GET() {
    try {
        const headersList = await headers();
        const role = headersList.get("x-user-role");
        const userId = headersList.get("x-user-id");

        // Ideally we link User -> Skater.
        // User table has `member_id`. Skater table has `membership_id`.
        // Or if the User IS a skater account.

        // Let's assumet User ID maps to a skater if role is STUDENT.
        // But the schema doesn't have a direct `skater_id` in User table?
        // Wait, User table has `member_id` which might be the link.
        // Or maybe we find Skater by `email` or `mobile_number` matching User.

        // CHECK SCHEMA: User does not have skater_id.
        // But Skater table doesn't have `user_id` either.
        // However, User has `member_id`. Skater has `membership_id`.
        // Let's try to match by `member_id`.

        // First get the user
        const user = await db.user.findUnique({
            where: { id: Number(userId) }
        });

        if (!user) return NextResponse.json({ message: "User not found" }, { status: 404 });

        let skater = null;
        if (user.member_id) {
            skater = await db.skater.findFirst({
                where: { membership_id: user.member_id }
            });
        }

        const eventsCount = skater ? await db.eventRegistration.count({
            where: { skater_id: skater.id }
        }) : 0;

        return NextResponse.json({
            fullName: user.full_name,
            memberId: user.member_id,
            totalEvents: eventsCount,
            skaterDetails: skater
        });

    } catch (e) {
        console.error("Student Stats Error:", e);
        return NextResponse.json({ message: "Error fetching stats" }, { status: 500 });
    }
}
