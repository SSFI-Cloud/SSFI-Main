
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyToken } from "@/lib/jwt";

// Paths that require authentication
const PROTECTED_PATHS = ["/api/secretaries", "/api/approvals", "/api/admin", "/dashboard", "/api/dashboard"];

// Paths excluded from auth (public admin APIs)
const PUBLIC_ADMIN_PATHS = ["/api/admin/settings", "/api/payments/webhook"];

export async function middleware(req: NextRequest) {
    const { pathname } = req.nextUrl;

    // Check if path is protected
    if (PROTECTED_PATHS.some((path) => pathname.startsWith(path))) {
        // Exclude registration endpoints
        if (pathname.includes("/register")) {
            return NextResponse.next();
        }

        // Exclude public admin paths (settings, webhooks)
        if (PUBLIC_ADMIN_PATHS.some((path) => pathname.startsWith(path))) {
            return NextResponse.next();
        }


        const authHeader = req.headers.get("authorization");
        const cookieToken = req.cookies.get("token")?.value;
        const token = authHeader?.split(" ")[1] || cookieToken;

        if (!token) {
            return NextResponse.json(
                { message: "Authentication required" },
                { status: 401 }
            );
        }

        const payload = await verifyToken(token);

        if (!payload) {
            return NextResponse.json(
                { message: "Invalid or expired token" },
                { status: 401 }
            );
        }

        // Attach user info to headers for downstream access if needed
        // Note: Request headers are immutable in some Next versions without cloning, 
        // but we can set response headers or pass info.
        // Ideally we pass it via modified headers to the backend route.
        const requestHeaders = new Headers(req.headers);
        requestHeaders.set("x-user-id", String(payload.userId));
        requestHeaders.set("x-user-role", String(payload.role));

        return NextResponse.next({
            request: {
                headers: requestHeaders,
            },
        });
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        "/api/:path*",
    ],
};
