
import { NextResponse } from "next/server";
import { PrismaClient } from "@/generated/prisma";

const db = new PrismaClient();

// GET all sponsors
export async function GET() {
    try {
        const sponsors = await db.tbl_sponsors.findMany({
            where: { active: true },
            orderBy: { display_order: "asc" }
        });
        return NextResponse.json(sponsors);
    } catch (e) {
        console.error("Sponsors Error:", e);
        return NextResponse.json({ message: "Error" }, { status: 500 });
    }
}

// POST new sponsor
export async function POST(req: Request) {
    try {
        const body = await req.json();
        const sponsor = await db.tbl_sponsors.create({
            data: {
                name: body.name,
                logo_url: body.logoUrl,
                website_url: body.websiteUrl,
                display_order: body.order || 0,
                active: true
            }
        });
        return NextResponse.json(sponsor, { status: 201 });
    } catch (e) {
        console.error("Sponsor POST Error:", e);
        return NextResponse.json({ message: "Error" }, { status: 500 });
    }
}
