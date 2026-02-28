
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Status } from "@/generated/prisma";

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

        const body = await req.json().catch(() => ({}));
        const reason = body.reason || "Rejected by admin";

        const { searchParams } = new URL(req.url);
        const type = searchParams.get("type") || "user";

        if (type === "user") {
            await prisma.user.update({
                where: { id: entityId },
                data: {
                    status: Status.inactive,
                    verified_by: parseInt(userId)
                }
            });
        } else if (type === "club") {
            await prisma.club.update({
                where: { id: entityId },
                data: {
                    status: Status.inactive,
                    verified_by: parseInt(userId)
                }
            });
        }

        return NextResponse.json({ message: "Rejected successfully" });

    } catch (e) {
        console.error("Reject Error:", e);
        return NextResponse.json({ message: "Internal Error" }, { status: 500 });
    }
}
