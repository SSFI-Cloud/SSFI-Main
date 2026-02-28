
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const userId = parseInt(id, 10);

        const token = req.headers.get("cookie")?.split("token=")[1]?.split(";")[0];
        const userPayload = verifyToken(token || "");

        if (!userPayload) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const { role: approverRole, userId: approverId } = userPayload as any;

        const targetUser = await prisma.user.findUnique({ where: { id: userId }, include: { club: true } });
        if (!targetUser) return NextResponse.json({ message: "User not found" }, { status: 404 });

        // Authorization Logic (Same as Approve)
        let authorized = false;

        // Fix: declared variable `authorized` but used `authorization` in Approve. Here correcting logic.
        if (approverRole === "GLOBAL_ADMIN" && targetUser.role === "STATE_ADMIN") authorized = true;

        if (approverRole === "STATE_ADMIN" && targetUser.role === "DISTRICT_ADMIN") {
            const approver = await prisma.user.findUnique({ where: { id: approverId } });
            if (approver?.state_id === targetUser.state_id) authorized = true;
        }

        if (approverRole === "DISTRICT_ADMIN" && targetUser.role === "CLUB_ADMIN") {
            const approver = await prisma.user.findUnique({ where: { id: approverId } });
            if (approver?.district_id === targetUser.district_id) authorized = true;
        }

        if (!authorized) {
            return NextResponse.json({ message: "Forbidden" }, { status: 403 });
        }

        // Reject User (Delete?) or Set Status Inactive/Rejected? 
        // Schema Enum `status`: 'active', 'inactive'.
        // We could delete them or keep them inactive.
        // Deleting lets them re-register.
        // Let's delete for now to allow retry, or just set inactive.
        // If we delete, we must also delete Club if exists.

        // Let's delete user and club if applicable.
        if (targetUser.role === "CLUB_ADMIN" && targetUser.club_id) {
            await prisma.club.delete({ where: { id: targetUser.club_id } });
        }

        await prisma.user.delete({ where: { id: userId } });

        return NextResponse.json({ message: "Rejected (Deleted) successfully" }, { status: 200 });

    } catch (error) {
        console.error("Reject Error:", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}
