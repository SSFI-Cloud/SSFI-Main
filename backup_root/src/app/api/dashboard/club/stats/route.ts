
import { NextResponse } from "next/server";
import { PrismaClient } from "@/generated/prisma";
import { headers } from "next/headers";

const db = new PrismaClient();

export async function GET() {
    try {
        const headersList = await headers();
        const role = headersList.get("x-user-role");
        const userId = headersList.get("x-user-id");

        const user = await db.user.findUnique({
            where: { id: Number(userId) }
        });

        if (!user || !user.club_id) {
            return NextResponse.json({ message: "User not associated with a club" }, { status: 400 });
        }

        const clubId = user.club_id;
        const club = await db.club.findUnique({
            where: { id: clubId }
        });

        const skatersCount = await db.skater.count({ where: { club_id: clubId } });

        const skaters = await db.skater.findMany({
            where: { club_id: clubId },
            orderBy: { created_at: 'desc' },
            take: 20
        });

        return NextResponse.json({
            clubName: club?.club_name || "Your Club",
            skatersCount: skatersCount,
            skaters: skaters.map(s => ({
                id: s.id,
                name: s.full_name,
                membershipId: s.membership_id,
                gender: s.gender,
                category: s.category_type_id,
                dob: s.date_of_birth
            }))
        });

    } catch (e) {
        console.error("Club Stats Error:", e);
        return NextResponse.json({ message: "Error fetching stats" }, { status: 500 });
    }
}
