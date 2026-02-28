
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

        if (!user || !user.district_id) {
            return NextResponse.json({ message: "User not associated with a district" }, { status: 400 });
        }

        const districtId = user.district_id;

        const [clubsCount, skatersCount, eventsCount] = await Promise.all([
            db.club.count({ where: { district_id: districtId } }),
            db.skater.count({ where: { district_id: districtId } }),
            db.event.count({ where: { district_id: districtId } })
        ]);

        const clubs = await db.club.findMany({
            where: { district_id: districtId },
            include: {
                _count: { select: { skaters: true } }
            }
        });

        const recentSkaters = await db.skater.findMany({
            where: { district_id: districtId },
            orderBy: { created_at: 'desc' },
            take: 10,
            include: {
                club: true
            }
        });

        return NextResponse.json({
            districtName: "Your District",
            counts: {
                clubs: clubsCount,
                skaters: skatersCount,
                events: eventsCount,
            },
            clubs: clubs.map(c => ({
                id: c.id,
                name: c.club_name,
                status: c.status,
                skatersCount: c._count.skaters,
                contactPerson: c.contact_person
            })),
            recentSkaters: recentSkaters.map(s => ({
                id: s.id,
                name: s.full_name,
                clubName: s.club?.club_name || "Independent",
                membershipId: s.membership_id,
                gender: s.gender,
                dob: s.date_of_birth
            }))
        });

    } catch (e) {
        console.error("District Stats Error:", e);
        return NextResponse.json({ message: "Error fetching stats" }, { status: 500 });
    }
}
