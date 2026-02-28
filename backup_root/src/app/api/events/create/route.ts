
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const eventSchema = z.object({
    eventName: z.string().min(5),
    eventDate: z.string(), // YYYY-MM-DD
    regStartDate: z.string(),
    regEndDate: z.string(),
    description: z.string().optional(),
    fees: z.number().min(0),

    // Config
    stateId: z.number().min(1),
    districtId: z.number().min(0), // 0 for State Level
    eventLevelTypeId: z.number().min(1), // Level Type ID

    venue: z.string().min(5),
});

export async function POST(req: Request) {
    try {
        const body = await req.json();

        // Simplified parsing for JSON body (assume admin sends proper types from frontend or we transform)
        // Ensure numbers are numbers
        const data = {
            ...body,
            fees: parseFloat(body.fees),
            stateId: parseInt(body.stateId),
            districtId: parseInt(body.districtId),
            eventLevelTypeId: parseInt(body.eventLevelTypeId),
        };

        const result = eventSchema.safeParse(data);
        if (!result.success) return NextResponse.json({ message: "Validation Error", errors: result.error.flatten() }, { status: 400 });

        const validData = result.data;

        // Create Event
        const newEvent = await prisma.event.create({
            data: {
                event_name: validData.eventName,
                event_date: new Date(validData.eventDate),
                reg_start_date: new Date(validData.regStartDate),
                reg_end_date: new Date(validData.regEndDate),
                event_description: validData.description,
                event_fees: validData.fees,

                state_id: validData.stateId,
                district_id: validData.districtId,
                event_level_type_id: validData.eventLevelTypeId,

                venue: validData.venue,
                status: "active",

                // Legacy / Required Fields from schema
                date: new Date(validData.eventDate),
                date1: new Date(validData.eventDate),
                // reg_no is optional? Yes.
                // session_id default 4
            }
        });

        return NextResponse.json({ message: "Event Created", eventId: newEvent.id }, { status: 201 });

    } catch (e: any) {
        console.error("Event Create Error:", e);
        if (e.code) console.error("Prisma Code:", e.code);
        if (e.meta) console.error("Prisma Meta:", e.meta);
        return NextResponse.json({ message: "Internal Error", detail: e.message }, { status: 500 });
    }
}
