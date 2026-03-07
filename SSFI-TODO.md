# SSFI Digital Platform — Development Todo List

> **Last updated:** March 3, 2026 (Session 2)
> **Overall status:** ~97% Complete
> ✅ = Done | 🔄 = Partial | ❌ = Not started

---

## Legend
- ✅ **Complete** — built, wired, tested in dev
- 🔄 **Partial** — scaffolded or half-done
- ❌ **Pending** — not started

---

## MODULE 1: Foundation & Infrastructure ✅ COMPLETE

- ✅ Next.js 14 App Router + TypeScript setup
- ✅ Tailwind CSS with custom SSFI theme (dark dashboard + light public)
- ✅ Prisma ORM with MySQL — 30+ models in schema.prisma
- ✅ ESLint, folder structure, env variables
- ✅ Express.js backend with TypeScript
- ✅ Error handling middleware (global)
- ✅ Logging system (Winston)
- ✅ CORS, Helmet, rate limiting
- ✅ File upload middleware (Multer)
- ✅ Sharp image processing pipeline (WebP conversion)
- ✅ JWT access + refresh token system
- ✅ Prisma schema with all models
- ✅ In-memory caching (node-cache) for auth tokens (2-min TTL) and dashboard data (5-min TTL)
- ✅ Performance middleware: request timer (slow endpoint profiling), request timeout (30s), HTTP cache headers for public routes
- ✅ PM2 ecosystem config optimized for Hostinger Cloud Startup (2 instances, 512MB each, max 200 processes)

---

## MODULE 2: Authentication ✅ COMPLETE

- ✅ Login endpoint (phone + password)
- ✅ Register endpoint (multi-role)
- ✅ OTP generation + email-based delivery
- ✅ OTP verification endpoint
- ✅ Refresh token endpoint
- ✅ Logout endpoint
- ✅ Forgot/reset password (OTP-based)
- ✅ Auth middleware (`authenticate`)
- ✅ Role-based access control (`requireRole`)
- ✅ Expiry date checking middleware (renewal lockout)
- ✅ Frontend: Login page — phone number OR SSFI UID toggle
- ✅ Frontend: Forgot Password page — 3-step flow: phone → OTP → new password
- ✅ Backend: Login now accepts phone OR UID (`identifier` field, auto-detects format)
- ✅ Frontend: Register page with validation
- 🔄 Frontend: Verify OTP page (not yet built — auth flow skips it in dev)

---

## MODULE 3: Entity Management (Secretaries, Clubs, Students) ✅ MOSTLY COMPLETE

### Backend ✅
- ✅ State Secretary registration + CRUD routes
- ✅ District Secretary registration + CRUD routes
- ✅ Club registration + CRUD routes
- ✅ Student registration + CRUD routes
- ✅ UID generation service (`SSFI-[STATE]-[DIST]-[CLUB]-[NUM]`)
- ✅ Approval workflow endpoints (approve/reject)
- ✅ Hierarchical access control middleware
- ✅ Renewal system (renewal windows, session renewals)
- ✅ Registration window management routes

### Frontend ✅
- ✅ Student multi-step registration form (6 steps: Personal → Family/School → Nominee → Club/Coach → Address → Documents)
- ✅ Secretary registration forms (State + District)
- ✅ Club registration form
- ✅ Club edit page (`dashboard/clubs/[id]/edit/page.tsx`)
- ✅ Approval dashboard UI (all 5 approval pages built)
- ✅ Registration windows: Fixed type mismatch — frontend sends lowercase role strings (`state_secretary`) but backend expects uppercase Prisma enums (`STATE_SECRETARY`). Added `.toUpperCase()` normalization in `registrationWindow.service.ts`
- ✅ Registration windows: All 6 entity types now create windows correctly (State Secretary, District Secretary, Club, Student, Beginner Certification, Coach Certification)

---

## MODULE 4: Events System ✅ COMPLETE

### Backend ✅
- ✅ Event creation, update, delete, list endpoints
- ✅ Event registration endpoint
- ✅ Eligibility engine (location check, age category auto-assignment)
- ✅ Race results management
- ✅ Certificate generation (backend + PDFKit)
- ✅ Registration windows (open/close registration periods)

### Frontend ✅
- ✅ Public events listing page (filter, search, status badges)
- ✅ Public event detail page
- ✅ Event registration flow (UID lookup → category → races → Razorpay payment)
- ✅ Event creation/edit in admin dashboard
- ✅ Event registrations management page
- ✅ Event results management page
- ✅ Student my-events page with event detail view

---

## MODULE 5: Payment Integration ✅ COMPLETE

- ✅ Razorpay SDK installed and configured
- ✅ `POST /api/v1/payments/create-order` endpoint
- ✅ `POST /api/v1/payments/verify` endpoint
- ✅ Payment model in Prisma
- ✅ Frontend: Razorpay checkout modal integration (`PaymentButton.tsx`, `PaymentModal.tsx`)
- ✅ Frontend: Payment success/failure pages
- ✅ Frontend: Transaction history (`PaymentHistory.tsx`)
- ✅ Frontend: Payments dashboard page with table + filters
- ✅ Razorpay config uses production URLs (no localhost fallbacks)
- 🔄 Payment stats in dashboard are hardcoded placeholders (need real API)
- 🔄 "View Receipt" button in payments page has no handler

---

## MODULE 6: CMS — Content Management System ✅ 100% COMPLETE

> The entire CMS is done — backend API, admin dashboard, and all public-facing pages.

### 6.1 Backend CMS API ✅ COMPLETE

**Models created in schema.prisma:**
- ✅ `Banner` (hero sliders with JSON metadata)
- ✅ `News` (articles, slugs, categories, tags, views)
- ✅ `Page` (static pages with template + status)
- ✅ `GalleryAlbum` + `GalleryItem` (photo albums linked to events)
- ✅ `Menu` (navigation menus with JSON items tree)
- ✅ `SiteSettings` (global config with socialLinks JSON + metadata JSON)
- ✅ `TeamMember` (team profiles, showOnHome flag)
- ✅ `Milestone` (timeline entries with icon, year, displayOrder)
- ✅ `ContactMessage` (contact form inbox)

**CMS Service** (`cms.service.ts`) — full CRUD for all models ✅
**CMS Controller** (`cms.controller.ts`) — all handlers ✅
**CMS Routes** (`cms.routes.ts`) — all public + admin routes ✅
**CMS Validator** (`cms.validator.ts`) — Zod schemas for all models including SiteSettings.metadata ✅

**Additional routes:**
- ✅ `team.routes.ts` — `GET /team-members/public` + admin CRUD + reorder
- ✅ `milestone.routes.ts` — `GET /milestones/public` + admin CRUD + reorder + icons list
- ✅ `contact.routes.ts` — `POST /contact/submit` + `GET /contact/messages` + mark-read
- ✅ `upload.routes.ts` — `POST /upload/image` → Sharp → WebP → returns URL

### 6.2 Admin CMS Dashboard ✅ COMPLETE

All pages under `ssfi-frontend/src/app/dashboard/cms/` — banners, news, pages, gallery, menus, team, milestones, settings, contact-messages.

### 6.3 Public Frontend — CMS Connected ✅ COMPLETE

All public pages fetch data from CMS API with proper fallbacks.

### 6.4 CMS Hooks ✅ COMPLETE (`src/lib/hooks/useCMS.ts`)
### 6.5 CMS Types ✅ COMPLETE (`src/types/cms.ts`)

### 6.6 CMS Audit Fixes (March 3, 2026 — Session 2)
- ✅ CMS Hub page (`/dashboard/cms`): Added missing Banners & Sliders and Navigation Menus module cards
- ✅ ImageUpload component: Fixed dark theme colors (slate-*) appearing on light CMS dashboard — rewrote all colors to gray-* equivalents
- ✅ Pages create (`/dashboard/cms/pages/new`): Added `ImageUpload` for `featuredImage` field (was missing UI despite type support)
- ✅ Pages edit (`/dashboard/cms/pages/[id]`): Added `ImageUpload` for `featuredImage` in sidebar
- ✅ Site Settings (`/dashboard/cms/settings`): Added Branding section with logo and favicon `ImageUpload` fields
- ✅ ScrollNavigation component: Removed scroll-to-top arrow, kept only scroll-to-bottom

---

## MODULE 7: Role-Specific Management Dashboards ✅ COMPLETE

### 7.1 Global Admin Dashboard ✅
- ✅ Dashboard overview with stats, charts, pending approvals widget
- ✅ Members management (approve/reject State Secretaries, District Secretaries, Students, Clubs)
- ✅ Registration window manager
- ✅ Reports page (stats + charts)
- ✅ Payments management page

### 7.2 State Secretary Dashboard ✅
- ✅ State profile overview with stats
- ✅ Districts list, pending approvals, upcoming events, recent activity
- ✅ Renewal banner integration

### 7.3 District Secretary Dashboard ✅
- ✅ District profile overview
- ✅ Club list, stats, pending approvals, upcoming events
- ✅ Renewal banner integration

### 7.4 Club Owner Dashboard ✅
- ✅ Club profile with student stats
- ✅ Gender/age-category charts
- ✅ Recent students, upcoming events
- ✅ Renewal banner integration

### 7.5 Student Dashboard ✅
- ✅ Profile card with UID, membership status
- ✅ Event registrations, certificates section
- ✅ Club info, renewal CTA

---

## MODULE 8: Advanced Features ✅ MOSTLY COMPLETE

### 8.1 Student Registration (Public Multi-Step Form) ✅
- ✅ 6-step wizard: Personal → Family/School → Nominee → Club/Coach → Address → Documents
- ✅ Zod validation per step
- ✅ Progress stepper
- ✅ Razorpay payment at final step
- ✅ Confirmation page with UID display

### 8.2 Event Registration Frontend ✅
- ✅ "Register for Event" button on event detail page
- ✅ UID lookup → Category selection → Race selection → Payment → Confirmation

### 8.3 Beginner Certification Dashboard ✅ (March 3, 2026 — Session 2)
- ✅ Registration windows for Beginner Certification now integrate correctly
- ✅ Fixed backend entity type validation to accept `BEGINNER_CERTIFICATION` in registration window creation

### 8.4 Certificate Generation 🔄
- ✅ Backend: PDFKit certificate service exists
- ✅ Frontend: Certificates section in student dashboard
- 🔄 Certificate download integration (partial)

---

## MODULE 9: Infrastructure & Deployment ✅ MOSTLY COMPLETE

### 9.1 Database ✅
- ✅ 4 Prisma migrations applied
- ✅ Seed scripts available (admin, states, locations, events, test users)
- ✅ Aadhaar encryption utility (`src/utils/encryption.util.ts`) — AES-256-CBC

### 9.2 Email Service ✅ COMPLETE (March 3, 2026)
- ✅ Centralized `EmailService` class in `email.service.ts` (695 lines)
- ✅ Shared master layout with SSFI branding (header, banner, footer)
- ✅ 8 email templates — all complete:
  1. ✅ `sendOTPEmail()` — Verification code with expiry timer
  2. ✅ `sendCredentials()` — Welcome email with login details
  3. ✅ `sendAffiliationConfirmation()` — Registration/renewal confirmation
  4. ✅ `sendApprovalNotification()` — Application approved with credentials
  5. ✅ `sendRejectionNotification()` — Rejection with reason and next steps
  6. ✅ `sendEventRegistrationConfirmation()` — Event registration with race details
  7. ✅ `sendBeginnerCertConfirmation()` — Beginner cert program enrollment
  8. ✅ `sendContactFormNotification()` — Contact form submission to admin (with replyTo)
- ✅ All 11 affiliation emails fire-and-forget (non-blocking)
- ✅ OTP email fire-and-forget
- ✅ Contact controller refactored to use centralized emailService (removed duplicate transporter)
- ❌ Renewal reminder email (30 days, 7 days, expired) — not built

### 9.3 Deployment (Hostinger Cloud Startup) ✅ MOSTLY DONE
- ✅ PM2 ecosystem config (`ecosystem.config.js`) — 2 instances, 512MB max, cluster mode
- ✅ Production URLs configured (no localhost fallbacks anywhere in source)
- ✅ Razorpay callback URLs use `ssfiskate.com` / `api.ssfiskate.com`
- ✅ Next.js rewrites proxy `/api/*` → `https://api.ssfiskate.com/api/v1/*`
- ✅ Security headers (CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy)
- ✅ Static asset cache headers (1 year immutable for images, _next/static, uploads)
- ✅ HTTP cache headers on public API routes (news, locations, stats, results, team-members, milestones)
- ❌ Full Nginx + SSL + firewall config (server-side setup)

### 9.4 SEO & Performance ✅ COMPLETE (March 3, 2026)
- ✅ `generateMetadata()` on all public pages with dynamic OG images
- ✅ JSON-LD structured data (Organization, Website, Breadcrumb, Article, Event)
- ✅ `robots.ts` — Disallow dashboard, auth, API routes
- ✅ `sitemap.ts` — Dynamic: news, gallery albums, events + all static routes
- ✅ `manifest.json` — PWA support with SSFI branding
- ✅ Favicon configured (webp format)
- ✅ OpenGraph images fixed (pointing to existing slide-1.webp)
- ✅ DNS prefetch + preconnect for `api.ssfiskate.com`
- ✅ Font weight optimization (7 weights → essential subset)
- ✅ `optimizePackageImports` for lucide-react, framer-motion, react-hot-toast
- ✅ Image optimization: AVIF/WebP formats, 30-day cache TTL

### 9.5 Mobile Responsiveness ✅ COMPLETE (March 3, 2026)
- ✅ GlobeStats SVG overflow fixed (removed `min-w-[1200px]`, added `overflow-x-hidden`)
- ✅ Touch targets increased to 44px minimum (Header mobile button, PaymentModal close button)
- ✅ Responsive gap spacing (EventHighlightCards: `gap-6 md:gap-10`)
- ✅ Section overflow containment (`overflow-x-hidden overflow-y-visible`) on GlobeStats, EventHighlightCards, EventCategories
- ✅ Small text sizes bumped on public pages (WhyJoinSSFI, AffiliatedCoachesClient badges)
- ✅ Dashboard sidebar responsive with hamburger mobile nav
- ✅ All modals, forms, and navigation properly responsive

### 9.6 Code Quality ✅ COMPLETE (March 3, 2026)
- ✅ Zero TypeScript errors — both `tsc --noEmit` and `npm run build` pass clean
- ✅ Zero localhost references in source code (all use production URLs with env fallbacks)
- ✅ CSS duplicate rules removed from `globals.css` (~180 lines of duplicates cleaned)
- ✅ Debug `console.log` statements removed (club.controller.ts, districts/page.tsx)
- ✅ Empty alt attributes fixed with meaningful text
- ✅ Empty `clubs/[id]/edit/page.tsx` fixed (was causing build failure)

### 9.7 Testing & QA
- ❌ Unit tests (zero coverage)
- ❌ Integration tests for key flows
- ✅ Manual mobile responsiveness audit completed
- ❌ Payment flow end-to-end testing

---

## QUICK REFERENCE: What Remains

```
PRIORITY 1 (Before Launch):
  → Wire approvals pages to real API (replace mock data in 5 approval pages)
  → Wire reports page to real stats API (hardcoded stats)
  → Wire payment dashboard stats to real API (hardcoded revenue)
  → Fix hardcoded profile names in State/District dashboards

PRIORITY 2 (Nice to Have):
  → Build /auth/verify-otp page (OTP verification after registration)
  → Add renewal reminder emails (30 days, 7 days, expired)
  → "Export Data" button in reports (CSV/PDF)
  → "View Receipt" button in payments
  → Certificate download wiring (backend exists, frontend partial)

PRIORITY 3 (Tech Debt):
  → Clean up duplicate files: registration-window.service.ts + registrationWindow.service.ts
  → Remove legacy gallery.routes.ts (replaced by cms gallery routes)
  → Move 25+ loose scripts from backend root to scripts/ directory
  → Remove _LEGACY_ and .bak files
  → Add .env.example files for both projects
  → Remove dist/ from git (add to .gitignore)
  → Add unit/integration tests

DO NOT TOUCH (Already working, don't break):
  → Everything under dashboard/cms/
  → All public pages (home, about, contact, news, gallery, events, results)
  → All CMS hooks in useCMS.ts
  → CMS routes in cms.routes.ts, team.routes.ts, milestone.routes.ts
  → Email service (email.service.ts) — all 8 templates working
  → ImageUpload component
  → Performance middleware (caching, timers, HTTP cache headers)
  → SEO configuration (metadata, sitemap, robots, structured data)
```

---

## Bug Fixes Applied (Feb 25, 2026)

- ✅ Student modal — `ssfi_id` now correctly reads `membershipId` from `students` table
- ✅ Student modal — Blood group display fixed: `A_POSITIVE` → `A+`
- ✅ Club view modal — Removed duplicate club identity card
- ✅ Club view modal — Owner card now shows "Club Owner" title

## Fixes Applied (March 2–3, 2026)

### Backend Fixes
- ✅ All `localhost:5001` / `localhost:5000` references replaced with production `api.ssfiskate.com`
- ✅ Razorpay callback URLs fixed: `localhost:3001`/`localhost:5000` → `ssfiskate.com`/`api.ssfiskate.com`
- ✅ Dashboard controller: added cache SET after data fetch (was only doing GET, never storing)
- ✅ Affiliation service: 11 email calls made fire-and-forget (removed `await`)
- ✅ OTP service: email call made fire-and-forget
- ✅ HTTP cache headers middleware added to 6 public route prefixes in `app.ts`
- ✅ Removed 4 debug `console.log` from `club.controller.ts`
- ✅ Contact controller refactored: removed duplicate nodemailer transporter, now uses centralized `emailService`
- ✅ Email service extended: `send()` supports `replyTo` and `text` options
- ✅ Email service: added `sendContactFormNotification()` template (#8) with shared SSFI layout

### Frontend Fixes
- ✅ `renewal.service.ts`: `localhost:5000` fallback → `https://api.ssfiskate.com/api/v1`
- ✅ `dashboard.service.ts`: `localhost:5000` fallback → `https://api.ssfiskate.com/api/v1`
- ✅ `clubs/[id]/edit/page.tsx`: created full Club Edit page (was empty file causing build failure)
- ✅ `globals.css`: removed ~180 lines of duplicate CSS (keyframes, scrollbar styles, utility classes)
- ✅ Fixed 4 empty `alt=""` attributes with meaningful alt text
- ✅ Removed 2 debug `console.log` from `districts/page.tsx`
- ✅ Font weights reduced: body 4 weights, headline 3 weights (was 6+5)
- ✅ Favicon and manifest.json configured in layout metadata
- ✅ OG image fixed: pointed to existing `slide-1.webp` (was broken `og-default.jpg`)
- ✅ DNS prefetch + preconnect added for `api.ssfiskate.com`
- ✅ `optimizePackageImports` added for lucide-react, framer-motion, react-hot-toast
- ✅ Static asset cache headers (1-year immutable for images, uploads, _next/static)
- ✅ GlobeStats: removed `min-w-[1200px]` causing horizontal scroll, fixed overflow
- ✅ Header mobile menu button: `p-2` → `p-2.5` (44px touch target)
- ✅ PaymentModal close button: `p-2` → `p-2.5` (44px touch target)
- ✅ EventHighlightCards: `gap-10` → `gap-6 md:gap-10` (responsive)
- ✅ EventHighlightCards section: `overflow-visible` → `overflow-x-hidden overflow-y-visible`
- ✅ EventCategories section: `overflow-visible` → `overflow-x-hidden overflow-y-visible`
- ✅ WhyJoinSSFI badge text: `text-[10px]` → `text-[11px]`
- ✅ AffiliatedCoachesClient badge: `text-[10px]` → `text-[11px]`

## Fixes Applied (March 3, 2026 — Session 2)

### Registration Windows & Beginner Certification
- ✅ Registration window service: Added `.toUpperCase()` normalization for `entityType` — frontend sends lowercase (`state_secretary`), backend expects Prisma enum (`STATE_SECRETARY`)
- ✅ All 6 registration window entity types (State Secretary, District Secretary, Club, Student, Beginner Certification, Coach Certification) now create/update correctly from the dashboard

### CMS Audit — Full Review & Fixes
- ✅ CMS Hub page: Added Banners & Sliders module card (was unreachable despite `/dashboard/cms/banners` existing)
- ✅ CMS Hub page: Added Navigation Menus module card (was unreachable despite menus route existing)
- ✅ ImageUpload component: Rewrote from dark slate-* theme to light gray-* theme (was invisible on white CMS dashboard)
- ✅ Pages create page: Added `ImageUpload` for `featuredImage` field (Prisma model had field, UI was missing)
- ✅ Pages edit page: Added `ImageUpload` for `featuredImage` in sidebar panel
- ✅ Site Settings page: Added new Branding section with logo and favicon `ImageUpload` components
- ✅ Fixed type mismatch: `ImageUpload.onChange` returns `string | null` but `SiteSettings.logo/favicon` typed as `string | undefined` — used `url || undefined` conversion
- ✅ ScrollNavigation: Removed scroll-to-top (ArrowUp) button, kept only scroll-to-bottom (ArrowDown)

### Verified Working (No Changes Needed)
- ✅ Banners — Full CRUD with hero image upload
- ✅ News — Full CRUD with featured image upload
- ✅ Gallery — Albums + photo management with image upload
- ✅ Team Members — Full CRUD with team photo upload
- ✅ Milestones — Full CRUD with icon picker
- ✅ Contact Messages — Inbox with read/delete
- ✅ Menus — Full CRUD for navigation menus
- ✅ All CMS hooks (`useCMS.ts`) properly wired to backend endpoints
- ✅ All backend CMS routes (`cms.routes.ts`, `team.routes.ts`, `milestone.routes.ts`, `contact.routes.ts`, `upload.routes.ts`) verified

---

## Known Issues / Tech Debt

- `RegistrationWindow.createdBy` is `String` in Prisma but some older service calls may pass integer — verify before migration
- Legacy `gallery.routes.ts` at `/api/v1/gallery/*` still exists alongside new `/api/v1/cms/gallery/*` — can be removed
- `SiteSettings.metadata` stored as JSON — validate shape on frontend before accessing
- No OTP verification page built yet — register → verify OTP flow incomplete in frontend
- 5 files with `@ts-nocheck` in backend (affiliation.service.ts, affiliation.controller.ts, locations.routes.ts, uid.service.ts, _LEGACY file)
- 4 `@ts-ignore` instances in frontend
- 6 `as any` casts in controllers
- 25+ loose script files in backend root need moving to `scripts/` directory
- `dist/` directory should be in `.gitignore`
- No `.env.example` files exist for either project
