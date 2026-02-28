
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
    try {
        // Get user info from middleware headers
        const userId = req.headers.get("x-user-id");
        const userRole = req.headers.get("x-user-role");

        if (!userId || !userRole) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        // Get user's state/district for filtering
        const user = await prisma.user.findUnique({
            where: { id: parseInt(userId) },
            select: { state_id: true, district_id: true }
        });

        if (!user) {
            return NextResponse.json({ message: "User not found" }, { status: 404 });
        }

        let pendingUsers: any[] = [];
        let pendingClubs: any[] = [];

        // Role-based filtering
        if (userRole === "GLOBAL_ADMIN") {
            // Global Admin sees pending State Admins
            pendingUsers = await prisma.user.findMany({
                where: {
                    role: "STATE_ADMIN",
                    verified: 0,
                    otp_verified: true
                },
                select: {
                    id: true,
                    full_name: true,
                    email_address: true,
                    mobile_number: true,
                    state: { select: { state_name: true } },
                    created_at: true
                }
            });
        } else if (userRole === "STATE_ADMIN") {
            // State Admin sees pending District Admins in their state
            pendingUsers = await prisma.user.findMany({
                where: {
                    role: "DISTRICT_ADMIN",
                    state_id: user.state_id,
                    verified: 0,
                    otp_verified: true
                },
                select: {
                    id: true,
                    full_name: true,
                    email_address: true,
                    mobile_number: true,
                    district: { select: { district_name: true } },
                    created_at: true
                }
            });
        } else if (userRole === "DISTRICT_ADMIN") {
            // District Admin sees pending Clubs in their district
            pendingClubs = await prisma.club.findMany({
                where: {
                    district_id: user.district_id!,
                    verified: 0
                },
                select: {
                    id: true,
                    club_name: true,
                    email_address: true,
                    mobile_number: true,
                    created_at: true
                }
            });
        }

        return NextResponse.json({
            users: pendingUsers,
            clubs: pendingClubs
        });

    } catch (e) {
        console.error("Pending Approvals Error:", e);
        return NextResponse.json({ message: "Internal Error" }, { status: 500 });
    }
}
