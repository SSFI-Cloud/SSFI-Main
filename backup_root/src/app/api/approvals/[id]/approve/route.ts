
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const entityId = parseInt(id);

        const userId = req.headers.get("x-user-id");
        if (!userId) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        // Determine if it's a User or Club based on query param
        const { searchParams } = new URL(req.url);
        const type = searchParams.get("type") || "user"; // user or club

        if (type === "user") {
            await prisma.user.update({
                where: { id: entityId },
                data: {
                    verified: 1,
                    verified_by: parseInt(userId),
                    status: "active"
                }
            });
        } else if (type === "club") {
            await prisma.club.update({
                where: { id: entityId },
                data: {
                    verified: 1,
                    verified_by: parseInt(userId),
                    status: "active"
                }
            });
        }

        return NextResponse.json({ message: "Approved successfully" });

    } catch (e) {
        console.error("Approve Error:", e);
        return NextResponse.json({ message: "Internal Error" }, { status: 500 });
    }
}
