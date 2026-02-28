
import { NextResponse } from "next/server";
import { PrismaClient } from "@/generated/prisma";

const db = new PrismaClient();

// GET active news ticker items
export async function GET() {
    try {
        const items = await db.tbl_news_ticker.findMany({
            where: { active: true },
            orderBy: { priority: "desc" }
        });
        return NextResponse.json(items);
    } catch (e) {
        console.error("Ticker Error:", e);
        return NextResponse.json({ message: "Error" }, { status: 500 });
    }
}

// POST new ticker message
export async function POST(req: Request) {
    try {
        const body = await req.json();
        const item = await db.tbl_news_ticker.create({
            data: {
                message: body.message,
                priority: body.priority || 0,
                active: true
            }
        });
        return NextResponse.json(item, { status: 201 });
    } catch (e) {
        console.error("Ticker POST Error:", e);
        return NextResponse.json({ message: "Error" }, { status: 500 });
    }
}
