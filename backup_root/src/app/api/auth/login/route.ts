
import { NextResponse } from "next/server";
import { PrismaClient } from "@/generated/prisma";
import bcrypt from "bcryptjs";
import { signToken } from "@/lib/jwt";

const db = new PrismaClient();

export async function POST(req: Request) {
    try {
        const { username, password } = await req.json();

        if (!username || !password) {
            return NextResponse.json({ message: "Username and password are required" }, { status: 400 });
        }

        const user = await db.user.findFirst({
            where: { username }
        });

        if (!user) {
            return NextResponse.json({ message: "Invalid credentials" }, { status: 401 });
        }

        // Verify password
        // Note: If you generated users without hashing, this might fail. 
        // For dev/test, if password is exactly "password123" and stored as plain text, we might want a fallback?
        // But let's assume hashed.
        const isValid = await bcrypt.compare(password, user.password);

        // Fallback for plain text passwords in dev/migration phase (OPTIONAL - REMOVE IN PROD)
        const isPlainTextMatch = user.password === password;

        if (!isValid && !isPlainTextMatch) {
            return NextResponse.json({ message: "Invalid credentials" }, { status: 401 });
        }

        // Determine role
        // Prioritize the 'role' enum field, fallback to checking legacy logic if needed
        const role = user.role || "STUDENT";

        const token = await signToken({
            userId: user.id,
            username: user.username,
            role: role
        });

        const response = NextResponse.json({
            success: true,
            user: {
                id: user.id,
                username: user.username,
                fullName: user.full_name,
                role: role
            }
        });

        // Set cookie
        response.cookies.set("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            path: "/",
            maxAge: 86400 // 1 day
        });

        return response;

    } catch (e) {
        console.error("Login Error:", e);
        return NextResponse.json({ message: "An error occurred" }, { status: 500 });
    }
}
