
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const regSchema = z.object({
    skaterId: z.number(),
    eventId: z.number(),
    suitSize: z.string().optional(),
});

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const result = regSchema.safeParse(body);
        if (!result.success) return NextResponse.json({ message: "Validation Error" }, { status: 400 });

        const { skaterId, eventId, suitSize } = result.data;

        // 1. Fetch Event and Skater
        const event = await prisma.event.findUnique({ where: { id: eventId } });
        const skater = await prisma.skater.findUnique({ where: { id: skaterId } });

        if (!event || !skater) return NextResponse.json({ message: "Invalid Event or Skater" }, { status: 404 });

        // 2. Check Expiry
        if (new Date() > new Date(event.reg_end_date)) {
            return NextResponse.json({ message: "Registration Closed" }, { status: 400 });
        }

        // 3. Eligibility Checks (Simple: State)
        // If event is State Level, Skater must match State
        // TODO: Enforce more strict rules based on `event_level_type_id`
        if (event.state_id !== skater.state_id) {
            // Unless it's a National event (level type logic needed here)
            return NextResponse.json({ message: "Skater not eligibility for this state event" }, { status: 403 });
        }

        // 4. Check Duplicate
        const existing = await prisma.eventRegistration.findFirst({
            where: { skater_id: skaterId, event_id: eventId }
        });
        if (existing) return NextResponse.json({ message: "Already Registered" }, { status: 409 });

        // 5. Register
        const reg = await prisma.eventRegistration.create({
            data: {
                skater_id: skaterId,
                event_id: eventId,
                event_level_type_id: event.event_level_type_id,
                eligible_event_level_id: event.event_level_type_id, // Simplified

                // Payment fields pending
                payment_id: null,
                order_id: null,

                suit_size: suitSize,
            }
        });

        return NextResponse.json({ message: "Registered Successfully", registrationId: reg.id }, { status: 201 });

    } catch (e) {
        console.error("Event Reg Error:", e);
        return NextResponse.json({ message: "Internal Error" }, { status: 500 });
    }
}
