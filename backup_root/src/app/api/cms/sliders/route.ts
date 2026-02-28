
import { NextResponse } from "next/server";
import { PrismaClient } from "@/generated/prisma";

// Create fresh instance to ensure access to all models
const db = new PrismaClient();

// GET all sliders
export async function GET() {
    try {
        const sliders = await db.tbl_sliders.findMany({
            where: { active: true },
            orderBy: { display_order: "asc" }
        });
        return NextResponse.json(sliders);
    } catch (e) {
        console.error("Sliders GET Error:", e);
        return NextResponse.json({ message: "Error", error: String(e) }, { status: 500 });
    }
}

// POST new slider
export async function POST(req: Request) {
    try {
        const body = await req.json();
        const slider = await db.tbl_sliders.create({
            data: {
                image_url: body.imageUrl,
                caption: body.caption,
                link_url: body.linkUrl,
                display_order: body.order || 0,
                active: true
            }
        });
        return NextResponse.json(slider, { status: 201 });
    } catch (e) {
        console.error("Slider POST Error:", e);
        return NextResponse.json({ message: "Error", error: String(e) }, { status: 500 });
    }
}
