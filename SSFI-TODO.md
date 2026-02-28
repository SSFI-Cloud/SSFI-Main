# SSFI Digital Platform — Development Todo List

> **Last updated:** February 25, 2026  
> **Overall status:** ~93% Complete  
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

---

## MODULE 2: Authentication ✅ COMPLETE

- ✅ Login endpoint (phone + password)
- ✅ Register endpoint (multi-role)
- ✅ OTP generation + Twilio SMS delivery
- ✅ OTP verification endpoint
- ✅ Refresh token endpoint
- ✅ Logout endpoint
- ✅ Forgot/reset password (OTP-based)
- ✅ Auth middleware (`authenticate`)
- ✅ Role-based access control (`requireRole`)
- ✅ Expiry date checking middleware (renewal lockout)
- ✅ Frontend: Login page — phone number OR SSFI UID toggle (updated Feb 25)
- ✅ Frontend: Forgot Password page — 3-step flow: phone → OTP → new password (built Feb 25)
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

### Frontend ❌ PENDING
- ❌ Student multi-step registration form (5 steps: Personal → Family/School → Nominee → Coaching → Documents)
- ❌ Secretary registration forms (State + District)
- ❌ Club registration form
- 🔄 Approval dashboard UI (backend done, no admin UI yet)

---

## MODULE 4: Events System ✅ BACKEND COMPLETE / FRONTEND PARTIAL

### Backend ✅
- ✅ Event creation, update, delete, list endpoints
- ✅ Event registration endpoint
- ✅ Eligibility engine (location check, age category auto-assignment)
- ✅ Race results management
- ✅ Certificate generation (backend + PDFKit)
- ✅ Registration windows (open/close registration periods)

### Frontend
- ✅ Public events listing page (filter, search, status badges)
- ✅ Public event detail page (view only)
- ❌ Event registration flow (Register button → eligibility check → payment → confirmation)
- ❌ Certificate download page
- ❌ Event creation wizard in admin (UI not built)

---

## MODULE 5: Payment Integration 🔄 PARTIAL

- ✅ Razorpay SDK installed and configured
- ✅ `POST /api/v1/payments/create-order` endpoint
- ✅ `POST /api/v1/payments/verify` endpoint
- ✅ Payment model in Prisma
- ❌ Frontend: Razorpay checkout modal integration
- ❌ Frontend: Payment success/failure pages
- ❌ Frontend: Transaction history component
- ❌ Renewal payment UI (Club/Student)
- ❌ Update `expiry_date` on successful payment (backend handler)

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

All pages under `ssfi-frontend/src/app/dashboard/cms/`:

- ✅ `banners/` — list page with status badges + sorting
- ✅ `banners/new/` — create form: title, subtitle, image upload, CTA, position, gradient metadata
- ✅ `banners/[id]/` — edit form, loads via `GET /cms/admin/banners/:id`
- ✅ `news/` — list with search + status filter
- ✅ `news/new/` — create: title, auto-slug, excerpt, content, category picker, cover image
- ✅ `news/[id]/` — edit, loads via `GET /cms/admin/news/:id`; uses `featuredImage` field (not `coverImage`)
- ✅ `pages/` — static pages list
- ✅ `pages/new/` — create: title, slug, content (markdown), template, status, sortOrder
- ✅ `pages/[id]/` — edit, loads via `GET /cms/admin/pages/:id`
- ✅ `gallery/` — albums list with photo count
- ✅ `gallery/new/` — create album: title, slug, description, cover image, event link
- ✅ `gallery/[id]/` — edit album metadata + add/delete photos inline; loads via `GET /cms/admin/gallery/albums/:id`
- ✅ `menus/` — navigation menus per location
- ✅ `menus/new/` — create menu with location + initial items
- ✅ `menus/[id]/` — menu item builder, loads via `GET /cms/admin/menus/:id`
- ✅ `team/` — team member manager: photo upload, role, bio, displayOrder, showOnHome toggle
- ✅ `milestones/` — timeline manager: year, title, description, icon picker, displayOrder
- ✅ `settings/` — full settings: logo, tagline, contact info, social links, departments list, office hours, map embed URL, secondary phone
- ✅ `contact-messages/` — inbox: view messages, mark as read

**Support component:**
- ✅ `components/admin/ImageUpload.tsx` — upload to `/upload/image` → Sharp WebP → preview + remove

### 6.3 Public Frontend — CMS Connected ✅ COMPLETE

- ✅ `HeroSection.tsx` — fetches `GET /cms/banners?position=HOME_HERO&status=PUBLISHED`, 6s auto-rotate, fallback to 4 hardcoded slides
- ✅ `OurTeam.tsx` — fetches `GET /team-members/public?showOnHome=true`, fallback to 2 founders
- ✅ `about/page.tsx` — milestones section fetches `GET /milestones/public`, dynamic icon mapping, 6-item fallback
- ✅ `contact/page.tsx` — fetches `GET /cms/settings` for dynamic departments, office hours, map embed; submits to `POST /contact/submit`
- ✅ `news/page.tsx` — fetches `GET /cms/news` with pagination, search, category filter
- ✅ `news/[slug]/page.tsx` — fetches `GET /cms/news/slug/:slug`, hero image, markdown renderer, related articles
- ✅ `gallery/page.tsx` — fetches `GET /cms/gallery?status=PUBLISHED`, 3D carousel + album grid, all links use `album.slug`
- ✅ `gallery/[slug]/page.tsx` — fetches `GET /cms/gallery/slug/:slug`, masonry grid, full-screen lightbox

### 6.4 CMS Hooks ✅ COMPLETE (`src/lib/hooks/useCMS.ts`)
- ✅ `usePublicGalleryAlbums()` — `GET /cms/gallery?status=PUBLISHED`
- ✅ `usePublicGalleryAlbum()` — `GET /cms/gallery/slug/:slug` (slug-based)
- ✅ `useTeamMembers()`, `useMilestones()`, `useContactMessages()`

### 6.5 CMS Types ✅ COMPLETE (`src/types/cms.ts`)
- ✅ `Banner`, `News`, `Page`, `GalleryAlbum`, `GalleryItem`, `Menu`, `MenuItem`
- ✅ `SiteSettings` with `SiteSettingsMetadata` (departments, officeHours, mapEmbedUrl, phone2)
- ✅ `PAGE_TEMPLATES`, `MENU_LOCATIONS`, `BANNER_POSITIONS` constants

---

## MODULE 7: Role-Specific Management Dashboards ❌ PENDING (NEXT PRIORITY)

> The CMS dashboard under `dashboard/cms/` is 100% done. The **federation management** dashboards below are pending.

### 7.1 Global Admin Dashboard ❌
- 🔄 Dashboard shell (sidebar + overview cards — basic structure exists)
- ❌ **Members management**: View/approve/reject State Secretaries, District Secretaries
- ❌ **Fee structure editor**: Set registration/renewal fees per entity type
- ❌ **Registration window manager**: Open/close registration periods
- ❌ **Reports page**: Registration counts, revenue, exports (CSV/PDF)
- ❌ **Bulk actions**: Mass approve, mass export

### 7.2 State Secretary Dashboard ❌
- ❌ State profile overview with stats
- ❌ Districts list within state + approval workflow
- ❌ Clubs list within state (view only)
- ❌ Students count aggregation
- ❌ State-level event management

### 7.3 District Secretary Dashboard ❌
- ❌ District profile overview
- ❌ Clubs list within district + approval workflow
- ❌ Students within district
- ❌ District-level event management

### 7.4 Club Owner Dashboard ❌
- ❌ Club profile editor
- ❌ Students list registered to club + verification workflow
- ❌ Club renewal payment integration
- ❌ Affiliation certificate download

### 7.5 Student Dashboard ❌
- ❌ Profile view with Unique ID card display
- ❌ Edit personal details (address, photo)
- ❌ Event registration history
- ❌ Certificate downloads
- ❌ Membership renewal payment (Razorpay)

---

## MODULE 8: Advanced Features ❌ PENDING

### 8.1 Student Registration (Public Multi-Step Form) ❌
- ❌ Step 1: Personal info (name, DOB, gender, blood group)
- ❌ Step 2: Family & School (father name, school, academic board)
- ❌ Step 3: Insurance nominee (name, age, relation)
- ❌ Step 4: Coaching details (coach name, coach phone, select club)
- ❌ Step 5: Documents (Aadhaar upload — private dir, profile photo with cropper)
- ❌ Zod validation per step
- ❌ Progress stepper with green checkmarks
- ❌ Fee payment via Razorpay at final step
- ❌ Confirmation page with Unique ID display

### 8.2 Event Registration Frontend ❌
- ❌ "Register for Event" button on event detail page
- ❌ Eligibility display (age category, location check result)
- ❌ Registration form (suit size, skate category, race selection)
- ❌ Razorpay payment modal
- ❌ Registration confirmation page

### 8.3 Certificate Generation ❌
- ✅ Backend: PDFKit certificate service exists
- ❌ Frontend: Certificate preview page
- ❌ Frontend: Download PDF button wired to backend
- ❌ Frontend: Student dashboard certificate list

---

## MODULE 9: Infrastructure & Deployment ❌ PENDING

### 9.1 Database
- ❌ Run `prisma migrate dev` or `prisma db push` against live MySQL
- ❌ Create seed script: initial states + districts, admin user, fee structures
- ❌ Aadhaar encryption utility (`src/utils/encryption.util.ts`) — **compliance critical**

### 9.2 Email Service
- ✅ Nodemailer installed
- ❌ Welcome email template (HTML)
- ❌ Approval notification email
- ❌ Rejection notification email
- ❌ Renewal reminder email

### 9.3 Deployment (Hostinger VPS)
- ❌ Provision VPS, install Node.js 20, MySQL 8, Nginx, PM2
- ❌ Configure Nginx as reverse proxy
- ❌ SSL via Let's Encrypt
- ❌ PM2 ecosystem config
- ❌ Production environment variables
- ❌ Uploads directory permissions + backup strategy
- ❌ UFW firewall + fail2ban

### 9.4 Testing & QA
- ❌ Unit tests (zero coverage)
- ❌ Integration tests for key flows
- ❌ Mobile responsiveness testing
- ❌ Payment flow end-to-end testing

---

## QUICK REFERENCE: What To Build Next

```
PRIORITY 1 (Immediate):
  → Federation Management Dashboards (Module 7)
    Start with Global Admin: member approvals, fee structures, registration windows
    Then: State → District → Club → Student dashboards

PRIORITY 2:
  → Student multi-step registration form (Module 8.1)
  → Event registration frontend flow (Module 8.2)

PRIORITY 3:
  → Certificate download page (Module 8.3)
  → Payment frontend flows (Razorpay modal in registration)
  → OTP verification page

PRIORITY 4 (Before launch):
  → Database migration + seed data
  → Aadhaar encryption utility
  → Email templates
  → Deployment

DO NOT TOUCH (Already working, don't break):
  → Everything under dashboard/cms/
  → All public pages (home, about, contact, news, gallery, events)
  → All CMS hooks in useCMS.ts
  → CMS routes in cms.routes.ts, team.routes.ts, milestone.routes.ts
  → ImageUpload component
```

---

## Bug Fixes Applied (Feb 25, 2026)

- ✅ Student modal — `ssfi_id` now correctly reads `membershipId` from `students` table (was showing hash-based `user.uid`; all 5615+ students have `SSFI/BS/TN/25/S0001` format)
- ✅ Student modal — Blood group display fixed: `A_POSITIVE` → `A+`, `B_NEGATIVE` → `B-` (was broken as `A++`)
- ✅ Club view modal — Removed duplicate club identity card in body (club name was showing twice)
- ✅ Club view modal — Owner card now shows "Club Owner" title instead of repeating club/org name

---

## Known Issues / Tech Debt

- `RegistrationWindow.createdBy` is `String` in Prisma but some older service calls may pass integer — verify before migration
- The legacy `gallery.routes.ts` at `/api/v1/gallery/*` still exists alongside the new `/api/v1/cms/gallery/*` — the old one can be removed once public pages are confirmed using only the new routes
- `news/[id]/page.tsx` and `news/new/page.tsx` use `featuredImage` field — ensure this matches the Prisma `News.featuredImage` column (it does)
- `SiteSettings.metadata` is stored as JSON — validate shape on frontend before accessing `.departments`, `.officeHours` etc.
- No OTP verification page built yet — the register → verify OTP flow is incomplete in frontend
