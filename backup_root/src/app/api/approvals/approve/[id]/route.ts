
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

        // Authorization Logic
        let authorized = false;

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

        // Approve User
        await prisma.user.update({
            where: { id: userId },
            data: {
                status: "active",
                verified: 1,
                verified_by: approverId
            }
        });

        // If Club Admin, Approve Club
        if (targetUser.role === "CLUB_ADMIN" && targetUser.club_id) {
            await prisma.club.update({
                where: { id: targetUser.club_id },
                data: {
                    status: "active",
                    verified: 1,
                    verified_by: approverId
                }
            });
        }

        return NextResponse.json({ message: "Approved successfully" }, { status: 200 });

    } catch (error) {
        console.error("Approve Error:", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}
