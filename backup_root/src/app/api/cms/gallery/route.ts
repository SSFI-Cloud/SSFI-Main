
import { NextResponse } from "next/server";
import { PrismaClient } from "@/generated/prisma";

const db = new PrismaClient();

// GET all albums
export async function GET() {
    try {
        const albums = await db.tbl_gallery_albums.findMany({
            orderBy: { created_at: "desc" },
            include: {
                tbl_gallery_images: {
                    take: 1,
                    orderBy: { display_order: "asc" }
                }
            }
        });
        return NextResponse.json(albums);
    } catch (e) {
        console.error("Gallery Error:", e);
        return NextResponse.json({ message: "Error" }, { status: 500 });
    }
}

// POST new album
export async function POST(req: Request) {
    try {
        const body = await req.json();
        const album = await db.tbl_gallery_albums.create({
            data: {
                title: body.title,
                cover_image: body.coverImage,
                description: body.description,
                event_date: body.eventDate ? new Date(body.eventDate) : null
            }
        });
        return NextResponse.json(album, { status: 201 });
    } catch (e) {
        console.error("Gallery POST Error:", e);
        return NextResponse.json({ message: "Error" }, { status: 500 });
    }
}
