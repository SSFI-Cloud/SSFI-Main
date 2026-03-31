import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Toggle maintenance mode via env var (set NEXT_PUBLIC_MAINTENANCE_MODE=true to enable)
const MAINTENANCE_MODE = process.env.NEXT_PUBLIC_MAINTENANCE_MODE === 'true';

// Routes that should ALWAYS be accessible, even during maintenance
const ALLOWED_PREFIXES = [
  '/dashboard',
  '/auth',
  '/api',
  '/maintenance',
  '/_next',
  '/favicon',
  '/images',
  '/manifest.json',
];

export function middleware(request: NextRequest) {
  if (!MAINTENANCE_MODE) return NextResponse.next();

  const { pathname } = request.nextUrl;

  // Allow static assets, dashboard, auth, and API routes
  if (ALLOWED_PREFIXES.some(prefix => pathname.startsWith(prefix))) {
    return NextResponse.next();
  }

  // Redirect all public pages to maintenance
  const url = request.nextUrl.clone();
  url.pathname = '/maintenance';
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image).*)'],
};
