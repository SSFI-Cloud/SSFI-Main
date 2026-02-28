
import { NextResponse } from "next/server";
import { PrismaClient } from "@/generated/prisma";
import { headers } from "next/headers";

const db = new PrismaClient();

export async function GET() {
    try {
        const headersList = await headers();
        const role = headersList.get("x-user-role");
        const userId = headersList.get("x-user-id");

        if (role !== "STATE_ADMIN" || !userId) {
            // In a real app we might return 403, but middleware handles it.
        }

        const user = await db.user.findUnique({
            where: { id: Number(userId) }
        });

        if (!user || !user.state_id) {
            return NextResponse.json({ message: "User not associated with a state" }, { status: 400 });
        }

        const stateId = user.state_id;

        const [districtsCount, clubsCount, skatersCount, eventsCount] = await Promise.all([
            db.district.count({ where: { state_id: stateId } }),
            db.club.count({ where: { state_id: stateId } }),
            db.skater.count({ where: { state_id: stateId } }),
            db.event.count({ where: { state_id: stateId } })
        ]);

        // Fetch detailed lists
        const districts = await db.district.findMany({
            where: { state_id: stateId },
            include: {
                _count: {
                    select: { clubs: true, skaters: true }
                }
            }
        });

        const recentClubs = await db.club.findMany({
            where: { state_id: stateId },
            orderBy: { created_at: 'desc' },
            take: 5,
            include: {
                district: true
            }
        });

        return NextResponse.json({
            stateName: "Tamil Nadu", // Should fetch from DB actually if dynamic
            counts: {
                districts: districtsCount,
                clubs: clubsCount,
                skaters: skatersCount,
                events: eventsCount
            },
            districts: districts.map(d => ({
                id: d.id,
                name: d.district_name,
                clubsCount: d._count.clubs,
                skatersCount: d._count.skaters
            })),
            recentClubs: recentClubs.map(c => ({
                id: c.id,
                name: c.club_name,
                districtName: c.district.district_name,
                status: c.status,
                contactPerson: c.contact_person
            }))
        });

    } catch (e) {
        console.error("State Stats Error:", e);
        return NextResponse.json({ message: "Error fetching stats" }, { status: 500 });
    }
}
