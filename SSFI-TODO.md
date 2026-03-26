# SSFI Digital Platform — Development Todo List

> **Last updated:** March 26, 2026 (Session 4)
> **Overall status:** ~98% Complete
> ✅ = Done | 🔄 = Partial | ❌ = Not started

---

## Legend
- ✅ **Complete** — built, wired, tested
- 🔄 **Partial** — scaffolded or half-done
- ❌ **Pending** — not started

---

## MODULE 1: Foundation & Infrastructure ✅ COMPLETE

- ✅ Next.js 14 App Router + TypeScript setup
- ✅ Tailwind CSS with custom SSFI theme (dark dashboard + light public)
- ✅ Prisma ORM with MySQL — 30+ models in schema.prisma
- ✅ Express.js backend with TypeScript
- ✅ Error handling, logging (Winston), CORS, Helmet, rate limiting
- ✅ File upload middleware (Multer) + Sharp image processing (WebP)
- ✅ JWT access + refresh token system
- ✅ In-memory caching (node-cache) for auth tokens (2-min TTL) and dashboard data (5-min TTL)
- ✅ Performance middleware: request timer, timeout (30s), HTTP cache headers
- ✅ **Infrastructure migrated:** Vercel (frontend) + Railway (backend) + Hostinger MySQL (DB) + Cloudflare (DNS)

---

## MODULE 2: Authentication ✅ COMPLETE

- ✅ Login endpoint (phone + password OR SSFI UID)
- ✅ Register, OTP verification, Refresh token, Logout
- ✅ Forgot/reset password (OTP-based)
- ✅ Auth middleware + Role-based access control + Expiry checking
- ✅ Frontend: Login page, Register page, Forgot Password page
- 🔄 Frontend: Verify OTP page (not yet built — auth flow skips it)

---

## MODULE 3: Entity Management ✅ COMPLETE

- ✅ State/District Secretary + Club + Student CRUD (backend + frontend)
- ✅ UID generation (`SSFI-[STATE]-[DIST]-[CLUB]-[NUM]`)
- ✅ Approval workflows (approve/reject) for all entities
- ✅ Hierarchical access control middleware
- ✅ Renewal system + Registration window management
- ✅ Registration windows: `.toUpperCase()` normalization fix applied
- ✅ Student 6-step registration form (Personal → Family/School → Nominee → Club/Coach → Address → Documents)
- ✅ Student registration revamp: single name field, Jan 1 age cutoff, new age categories (U-4 through Masters 30+), father's occupation, academic board
- ✅ Mandatory logo + registration copy for State/District/Club registration
- ✅ Removed Digilocker KYC from State/District/Club (kept for Student)

---

## MODULE 4: Events System ✅ COMPLETE

- ✅ Event CRUD, registration, eligibility engine
- ✅ Race results: top 5 positions with ties allowed
- ✅ Cascading eligibility: District top 5 → State, State top 5 → National (hard block)
- ✅ Certificate generation (backend PDFKit)
- ✅ Configurable race rules per event (raceConfig JSON + RaceConfigEditor component)
- ✅ Event approve/reject (REJECTED added to EventStatus enum)
- ✅ Public events listing, detail, registration flow
- ✅ Admin event creation/edit, registrations management, results management

---

## MODULE 5: Payment Integration ✅ COMPLETE

- ✅ Razorpay SDK: create-order, verify endpoints
- ✅ Frontend: Razorpay checkout modal, success/failure pages, transaction history
- ✅ Razorpay multi-account: per State/District secretary keys with AES-256-GCM encryption
- ✅ Automatic fallback to central SSFI Razorpay account
- ✅ Offline payment mode for State/District events (cash, admin marks paid/unpaid)
- 🔄 Payment stats in dashboard are hardcoded placeholders (need real API)
- 🔄 "View Receipt" button has no handler

---

## MODULE 6: CMS ✅ 100% COMPLETE

- ✅ Backend API: Banner, News, Page, Gallery, Menu, SiteSettings, TeamMember, Milestone, ContactMessage
- ✅ Admin CMS Dashboard: all 9 sections fully functional
- ✅ Public frontend: all CMS-connected with proper fallbacks
- ✅ CMS audit fixes: ImageUpload colors, Pages featuredImage, Site Settings branding
- ✅ Hub page: Banners + Menus module cards added
- ✅ CMS banner editor: stroke + highlight fields added
- ✅ Site Settings: certified coaches count override (metadata.certifiedCoachesOverride)
- ✅ CMS data seeded: team members, milestones, banners

---

## MODULE 7: Dashboards ✅ COMPLETE

- ✅ All 5 role-based dashboards (Admin, State, District, Club, Student)
- ✅ Student dashboard: profile photo upload/change
- ✅ Dashboard sidebar: wide logo (`logo-wide.webp`)
- ✅ Navigation: State Directory + News → footer, Results → under Events dropdown

---

## MODULE 8: Infrastructure & Deployment ✅ COMPLETE

### Hosting Migration (March 2026)
- ✅ Frontend: Hostinger → **Vercel** (free tier, auto-deploy, global CDN)
- ✅ Backend: Hostinger → **Railway** ($5/mo Hobby plan, auto-deploy)
- ✅ Database: stays on **Hostinger MySQL** (remote access enabled)
- ✅ DNS: moved to **Cloudflare** (DNS only, grey cloud, not proxied)
- ✅ LiteSpeed chunk 404 fix: permanently renamed `(public)` → `(pub)` route group
- ✅ Vercel deploy email fix: commits use `ssfiwebdev@gmail.com`
- ✅ Railway: `PRISMA_CLIENT_ENGINE_TYPE=library` for Linux containers
- ✅ CORS/CSP updated for Vercel + Railway URLs

### SEO & Performance ✅
- ✅ `generateMetadata()` on all pages, JSON-LD, robots.ts, sitemap.ts
- ✅ ISR: homepage, about, contact revalidate every 60s
- ✅ Image optimization (AVIF/WebP), font optimization (7 weights)
- ✅ Package tree-shaking, static asset caching (1-year immutable)
- ✅ API caching: HTTP 60s on public routes, node-cache 5-min dashboard

### Email Service ✅
- ✅ 8 email templates, all fire-and-forget (non-blocking)
- ❌ Renewal reminder emails (30 days, 7 days, expired) — not built

### Database
- ✅ 4 Prisma migrations + additional SQL migrations via phpMyAdmin
- ✅ Database cleanup: removed non-TN data, kept test users + GLOBAL_ADMIN

---

## REMAINING TODO

### Priority 1 — Features
- ❌ Admin StudentRegistrationWizard — needs same field changes as public form
- ❌ INTERNATIONAL event level — National top 5 → eligible for International
- ❌ Hero section CMS stroke/accent text rendering on frontend

### Priority 2 — Wiring & Content
- ❌ Wire approvals pages to real API (may still use mock data)
- ❌ Wire reports page to real stats API (hardcoded placeholders)
- ❌ Wire payment dashboard stats to real API
- ❌ Renewal reminder emails
- ❌ Certificate download integration (backend exists, frontend partial)
- ❌ Contact page content update
- ❌ About page founders text update
- ❌ Dashboard loading speed optimization (~4 sec per tab switch)

### Priority 3 — Tech Debt
- ❌ Build /auth/verify-otp page
- ❌ Unit/integration tests (zero coverage)
- ❌ Clean up duplicate files: registration-window vs registrationWindow
- ❌ Remove legacy gallery.routes.ts
- ❌ Add .env.example files
- ❌ Export Data / View Receipt button implementations
- ❌ Fix hardcoded profile names in State/District dashboards

### DO NOT TOUCH (Already working)
```
- Everything under dashboard/cms/
- All public pages (home, about, contact, news, gallery, events, results)
- All CMS hooks in useCMS.ts
- CMS routes (cms.routes.ts, team.routes.ts, milestone.routes.ts)
- Email service (email.service.ts) — all 8 templates working
- ImageUpload component
- Performance middleware
- SEO configuration
- Infrastructure (Vercel, Railway, Cloudflare, Hostinger MySQL)
```

---

## Schema Changes Applied (March 2026)

- ✅ `razorpay_configs` table (multi-account Razorpay)
- ✅ `payments.razorpayConfigId` column
- ✅ `events.paymentMode` column (ONLINE/OFFLINE)
- ✅ `events.raceConfig` JSON column
- ✅ `students.fatherOccupation` column
- ✅ `AcademicBoard` enum: added IGCSE, GOVERNMENT, NIOS
- ✅ `EventStatus` enum: added REJECTED
- ✅ `race_results` unique constraint → index (allows ties)
- ✅ `state_secretaries/district_secretaries`: added `logo` + `associationRegistrationCopy`
- ✅ `RAZORPAY_ENCRYPTION_KEY` env var — 64-char hex for multi-account encryption
