
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const stateId = searchParams.get("stateId");

        const whereClause: any = {
            status: "active"
        };

        if (stateId) {
            whereClause.state_id = parseInt(stateId);
        }

        const events = await prisma.event.findMany({
            where: whereClause,
            orderBy: { event_date: "asc" },
            include: {
                state: { select: { state_name: true } }
            }
        });

        return NextResponse.json(events);

    } catch (e) {
        console.error("Event List Error:", e);
        return NextResponse.json({ message: "Internal Error" }, { status: 500 });
    }
}
