# SSFI Platform — Comprehensive Handoff Document

**Project:** Skating Sports Federation of India Digital Platform  
**Last Updated:** February 25, 2026  
**Status:** Backend ~97% | Frontend ~95% | CMS 100% | Overall ~96%

---

## 📋 Table of Contents
1. [Project Overview](#project-overview)
2. [Technology Stack](#technology-stack)
3. [What's Completed](#whats-completed)
4. [What's Actually Pending](#whats-actually-pending)
5. [File Structure Reference](#file-structure-reference)
6. [Database & Migrations](#database--migrations)
7. [API Endpoints Reference](#api-endpoints-reference)
8. [Environment Variables](#environment-variables)
9. [Known Issues / Tech Debt](#known-issues--tech-debt)
10. [How to Continue in New Chat](#how-to-continue-in-new-chat)

---

## 📊 Project Overview

SSFI is a hierarchical federation management platform for skating sports across India with 5 user levels:
1. **Global Admin** (SSFI HQ) — Full system access, manages all content
2. **State Secretary** — Manages state associations and district approvals
3. **District Secretary** — Manages district associations and club approvals
4. **Club Owner** — Manages clubs and student approvals
5. **Student (Skater)** — Registers, competes, downloads certificates

**Core features:** Hierarchical RBAC, UID generation (`SSFI-[STATE]-[DISTRICT]-[CLUB]-[NUM]`), event management with age-category auto-calculation, Razorpay payments, certificate generation (PDFKit), CMS for all public content, Sharp image processing (WebP).

---

## 🛠 Technology Stack

**Backend:** Node.js 20+, Express 4.18, Prisma 5.8, MySQL 8.0, JWT, Zod, Sharp 0.33, Twilio, Razorpay, Nodemailer, Winston

**Frontend:** Next.js 14.1 (App Router), TypeScript 5.3, Tailwind CSS 3.4, Framer Motion 11, React Hook Form + Zod, Zustand, Axios, Razorpay SDK

**Design System:**
```
Primary Blue:  #003399   Dashboard BG: slate-900 (#0f172a)
Accent Green:  #28A745   Card BG:      slate-800 (#1e293b)
Alert Red:     #DC3545   Public BG:    light grey
Fonts: Poppins (headings) / Inter (body)
```

---

## ✅ What's Completed

### Backend (97% Complete)

#### Core Infrastructure ✅
- Express + TypeScript, Prisma ORM, all middleware (auth, error, upload, validation, scope)
- Winston logging, Helmet + CORS + rate limiting
- Razorpay config, AES-256-CBC encryption utility for Aadhaar (`src/utils/encryption.util.ts`)
- Email service with Nodemailer (`src/services/email.service.ts`) — credentials email done

#### Authentication (100%) ✅
- JWT access + refresh tokens, bcrypt, Twilio OTP, login/register/refresh/logout
- Forgot/reset password (OTP-based), expiry date renewal middleware
- Login now accepts **phone number OR SSFI UID** as identifier (auto-detected in `auth.service.ts`)

#### All Services (100%) ✅
```
auth.service.ts              student.service.ts          event.service.ts
eventRegistration.service.ts payment.service.ts          dashboard.service.ts
cms.service.ts               club.service.ts             state.service.ts
district.service.ts          state-secretary.service.ts  district-secretary.service.ts
affiliation.service.ts       renewal.service.ts          registration-window.service.ts
report.service.ts            stats.service.ts            result.service.ts
coach-cert.service.ts        beginner-cert.service.ts    image.service.ts
otp.service.ts               uid.service.ts              email.service.ts
```

#### All Controllers (100%) ✅
One controller per service domain. All CRUD operations implemented.

Note: Two duplicate files exist that should be cleaned up:
- `registration-window.controller.ts` AND `registrationWindow.controller.ts` (same logic, different names)
- `registration-window.service.ts` AND `registrationWindow.service.ts` (same logic, different names)

#### All Routes (100%) ✅
Every route registered in `app.ts`:
```
auth, student, event, eventRegistration, club, state, district
state-secretary, district-secretary, affiliation, payment, dashboard
cms, team, milestone, contact, upload, gallery (legacy), locations
stats, result, certificate, renewal, registration-window, report
settings, coach-cert, beginner-cert, news, renewal
```

#### Database Migrations ✅ (4 migrations applied)
```
prisma/migrations/
  20260127101056_add_event_fields/
  20260127125045_add_affiliation_models_fixed/
  20260209_add_renewal_system/
  20260217033953_sync_schema/
```

#### Seed Scripts ✅
All in `src/scripts/`:
```
create-admin.ts        seed-states.ts         seed-locations.ts
seed-events.ts         seed-test-users.ts     seed-affiliation.ts
seed_approvals.ts      check-windows.ts
```
Also `prisma/seed-locations.ts` and `prisma/seed-states.sql`.

#### CMS Backend (100%) ✅
Full CRUD for: Banners, News, Pages, GalleryAlbum+GalleryItem, Menus, SiteSettings, TeamMember, Milestone, ContactMessage.
All routes at `/api/v1/cms/*` (public) and `/api/v1/cms/admin/*` (admin).

---

### Frontend (94% Complete)

#### Public Pages — All Complete ✅
```
/ (Home)                          /about
/events                           /events/[id]
/events/[id]/register             /gallery
/gallery/[slug]                   /news
/news/[slug]                      /contact
/results                          /affiliated-coaches
/coach-certification              /coach-certification/register
/beginner-certification           /beginner-certification/register
/beginner-program                 /state/[id]
/district/[id]                    /register (hub)
/register/student                 /register/state-secretary
/register/district-secretary      /register/club
/register/success                 /register-student (alt)
/registration-success             /payment
/payment/success                  /payment/failure
/privacy                          /refund
/terms
```

#### Error/Loading Pages ✅
`error.tsx`, `global-error.tsx`, `not-found.tsx`, `loading.tsx` — all exist.

#### Auth Pages ✅
`/auth/login` — updated with Phone / SSFI UID toggle, sends `identifier` field to backend.
`/auth/register` — complete with Zod validation.
`/auth/forgot-password` — **NEW** (Feb 25): Full 3-step flow — enter phone → OTP with 60s resend countdown → new password with strength validation + success screen.
⚠️ `/auth/verify-otp` — **DOES NOT EXIST** (OTP verify after register is not yet a page).

#### Registration Forms — All Complete ✅
| Form | Location | Status |
|------|----------|--------|
| Student (6-step wizard) | `components/forms/StudentRegistrationForm.tsx` | ✅ Full form with API + Razorpay |
| State Secretary | `components/forms/affiliation/StateSecretaryForm.tsx` | ✅ Full form with API + Razorpay |
| District Secretary | `components/forms/affiliation/DistrictSecretaryForm.tsx` | ✅ Full form |
| Club Registration | `components/forms/affiliation/ClubRegistrationForm.tsx` | ✅ Full form |

Student registration wizard steps: Personal Info → Family/School → Nominee → Club/Coach → Address → Documents

#### Event Registration Flow — Complete ✅
`/events/[id]/register/page.tsx` — 3-step flow:
1. Student UID lookup (`POST /api/event-registration/lookup`)
2. Category selection (BEGINNER/RECREATIONAL/QUAD/PRO_INLINE)
3. Race selection with mandatory race logic → `POST /api/event-registration/register` → redirect to `/payment?registrationId=...`

Payment page (`/payment`) uses `PaymentButton.tsx` with full Razorpay checkout.

#### Payment System — Complete ✅
- `PaymentButton.tsx` — Razorpay modal integration
- `PaymentModal.tsx`, `PaymentHistory.tsx` — Additional components
- `hooks/usePayment.ts` — Razorpay hook
- `hooks/useEventRegistration.ts` — Event registration hook
- `/payment/success` and `/payment/failure` pages exist

#### All 5 Role-Based Dashboards — Complete ✅

**Dashboard routing:** `dashboard/page.tsx` reads `user.role` and renders the correct component.
**Dashboard layout:** `dashboard/layout.tsx` — role-filtered sidebar nav, hamburger mobile, renewal banner, logout.

| Dashboard | Component | Features |
|-----------|-----------|----------|
| Global Admin | `dashboard/admin/AdminDashboard.tsx` | Stats overview, pending approvals widget, charts (registration/revenue trends), recent activity, quick actions |
| State Secretary | `dashboard/state/StateSecretaryDashboard.tsx` | District stats, pending approvals (clubs/students/events), district performance table, upcoming events, recent activity, renewal banner |
| District Secretary | `dashboard/district/DistrictSecretaryDashboard.tsx` | Club list, stats, pending approvals, upcoming events, recent activity, renewal banner |
| Club Owner | `dashboard/club/ClubDashboard.tsx` | Student stats, renewal banner, gender/age-category donut charts, recent students, upcoming events |
| Student | `dashboard/student/StudentDashboard.tsx` | Profile card with UID, membership status + renewal CTA, event registrations, certificates section, club info |

#### Dashboard Sub-Pages — All Built ✅
```
dashboard/                             (overview page)
dashboard/approvals/students/          ✅ Table + view/approve/reject modal
dashboard/approvals/clubs/             ✅
dashboard/approvals/state-secretaries/ ✅
dashboard/approvals/district-secretaries/ ✅
dashboard/approvals/events/            ✅
dashboard/events/                      ✅ List
dashboard/events/new/                  ✅ Create event form
dashboard/events/[id]/edit/            ✅ Edit event form
dashboard/events/[id]/registrations/   ✅ Registration list
dashboard/manage-events/[id]/results/  ✅ Results management
dashboard/students/                    ✅ Students list
dashboard/students/new/                ✅ Add student
dashboard/clubs/                       ✅ Clubs list
dashboard/clubs/new/                   ✅ Create club
dashboard/states/                      ✅
dashboard/districts/                   ✅
dashboard/my-events/                   ✅ Student events list
dashboard/my-events/[id]/              ✅ Event detail
dashboard/payments/                    ✅ Payments table with API
dashboard/registration-windows/        ✅
dashboard/renewals/                    ✅
dashboard/reports/                     ✅ Stats + charts (partial mock data)
dashboard/settings/                    ✅
dashboard/coach-certification/         ✅ List
dashboard/coach-certification/create/  ✅
dashboard/coach-certification/[id]/    ✅
dashboard/beginner-certification/      ✅ List
dashboard/beginner-certification/create/ ✅
dashboard/beginner-certification/[id]/ ✅
```

#### CMS Dashboard — 100% Complete ✅
All pages under `dashboard/cms/` for: banners, news, pages, gallery, menus, team, milestones, settings, contact-messages.

#### Supporting Components ✅
```
components/home/            (HeroSection, OurTeam, StatsCounter, FeaturedEvents, NewsSection, etc.)
components/events/          (EventCard, EventRegistrationModal)
components/forms/           (StudentRegistrationForm + 6 step sub-components + 3 affiliation forms)
components/dashboard/       (all 5 role dashboards + shared DashboardComponents)
components/payment/         (PaymentButton, PaymentModal, PaymentHistory)
components/admin/           (ImageUpload)
components/common/          (RenewalBanner)
components/auth/            (RegistrationGuard)
components/ui/              (MagneticCard, MovingBorderButton, Particles, etc.)
components/layout/          (Header, Footer)
```

#### Hooks & Services ✅
```
lib/hooks/useAuth.ts           lib/hooks/useCMS.ts
lib/hooks/useDashboard.ts      lib/hooks/useEvents.ts
lib/hooks/useStudent.ts        lib/hooks/useAffiliation.ts
hooks/usePayment.ts            hooks/useEventRegistration.ts
services/dashboard.service.ts  services/certificate.service.ts
services/renewal.service.ts    services/result.service.ts
services/portal.service.ts
```

#### Types ✅
```
types/cms.ts        types/dashboard.ts   types/student.ts
types/event.ts      types/payment.ts     types/affiliation.ts
types/eventRegistration.ts
```

---

## ⏳ What's Actually Pending

### Backend (~3% Remaining)

#### ❌ Email Templates (Partial)
`email.service.ts` exists and has `sendCredentials()` implemented. Missing:
- Approval notification email (user approved as State/District Secretary)
- Rejection email with reason
- Renewal reminder email (30 days, 7 days, expired)
- Event registration confirmation email

#### ❌ Duplicate Files to Clean Up
- `src/controllers/registration-window.controller.ts` AND `registrationWindow.controller.ts` — same logic
- `src/services/registration-window.service.ts` AND `registrationWindow.service.ts` — same logic
One of each pair should be deleted and all imports consolidated.

#### ❌ Aadhaar Encryption Not Applied
`encryption.util.ts` is fully built (AES-256-CBC), but the student registration service may not be calling `encryptAadhaar()` before saving to DB. Verify `student.service.ts` uses it.

#### ❌ Razorpay Webhook Signature Verification
Payment webhook handler should verify `razorpay_signature` using `crypto.createHmac`. Needs hardening before production.

---

### Frontend (~6% Remaining)

#### ❌ Approvals Pages Use Mock/Stub Data
The approval pages exist and look complete but use **hardcoded mock data**:
- `dashboard/approvals/students/page.tsx` — uses `mockPendingStudents[]` array with fake approve/reject that just uses `setTimeout`
- Other approval pages likely similar

**Fix needed:** Replace mock data with real API calls:
```typescript
// Should call:
GET  /api/v1/students?status=PENDING&page=1
PUT  /api/v1/students/:id/approve
PUT  /api/v1/students/:id/reject  (with reason body)
// Same pattern for clubs, state/district secretaries
```

#### ❌ Reports Page Uses Mock Data
`dashboard/reports/page.tsx` has hardcoded stats (`totalRegistrations: 1250`, `totalRevenue: 450000`, etc.) and a `useEffect` comment saying "Here we could fetch real stats". 

**Fix needed:** Connect to `GET /api/v1/reports/dashboard` or `GET /api/v1/stats/*`.

#### ❌ Payment Stats Are Hardcoded
`dashboard/payments/page.tsx` has `totalRevenue: 125000`, `lastMonthRevenue: 45000` hardcoded as placeholders. The transaction table itself fetches from API correctly.

**Fix needed:** Fetch revenue stats from `GET /api/v1/payments/stats` or similar.

#### ✅ Forgot Password Page (NEW — Feb 25)
`/auth/forgot-password` — 3-step animated flow: phone → OTP verification → new password reset. Wired to existing backend endpoints (`/auth/forgot-password` + `/auth/reset-password`). Includes 60s resend timer, back navigation, auto-return to OTP step on expired token error.

#### ❌ OTP Verification Page Missing
`/auth/verify-otp` page does not exist. After registration, the OTP flow has no UI page. The backend endpoint exists (`POST /api/v1/auth/verify-otp`).

#### ❌ Profile Name Hardcoded in State/District Dashboards
- `StateSecretaryDashboard.tsx`: title is hardcoded `"Tamil Nadu Speed Skating Federation"` 
- `DistrictSecretaryDashboard.tsx`: subtitle is hardcoded `"District Dashboard"` (no dynamic district name)

**Fix needed:** Fetch user profile from `GET /api/v1/auth/me` or the dashboard API to get the actual state/district name.

#### ❌ Export Functionality (Reports)
The "Export Data" button in reports page is a visual placeholder — no CSV/PDF export implemented.

#### ❌ View Receipt in Payments
The "View Receipt" button in `dashboard/payments/page.tsx` has no `onClick` handler.

---

## 📁 File Structure Reference

### Backend
```
H:\SSFI-New-Back\SSFI-Updated\ssfi-backend\
├── prisma/
│   ├── schema.prisma                    ← 30+ models
│   ├── migrations/                      ← 4 applied migrations
│   ├── seed-locations.ts
│   └── seed-states.sql
├── src/
│   ├── app.ts                           ← All route registrations
│   ├── config/razorpay.config.ts
│   ├── controllers/                     ← 24 controller files
│   ├── services/                        ← 24 service files (incl. 2 duplicates)
│   ├── routes/                          ← 27 route files
│   ├── middleware/                      ← auth, error, scope, upload, validation
│   ├── validators/                      ← 8 Zod validator files
│   ├── utils/                           ← asyncHandler, encryption, errors, logger, response, cache
│   ├── types/                           ← index.ts, payment.types.ts
│   └── scripts/                         ← 8 seed/utility scripts
```

### Frontend
```
H:\SSFI-New-Back\SSFI-Updated\ssfi-frontend\
├── src/
│   ├── app/
│   │   ├── (public)/                    ← All public pages (20+ routes)
│   │   ├── auth/login/, auth/register/  ← Auth pages
│   │   ├── register/                    ← All registration forms (4 types)
│   │   ├── dashboard/                   ← All dashboard pages (30+ routes)
│   │   │   └── cms/                     ← CMS management (9 sections)
│   │   ├── error.tsx, not-found.tsx, loading.tsx, global-error.tsx
│   │   └── layout.tsx, globals.css
│   ├── components/
│   │   ├── dashboard/admin/             ← AdminDashboard + 4 sections
│   │   ├── dashboard/state/             ← StateSecretaryDashboard
│   │   ├── dashboard/district/          ← DistrictSecretaryDashboard
│   │   ├── dashboard/club/              ← ClubDashboard
│   │   ├── dashboard/student/           ← StudentDashboard + CertificatesSection
│   │   ├── dashboard/shared/            ← DashboardComponents (StatCard, RecentList, etc.)
│   │   ├── forms/                       ← StudentRegistrationForm + 6 steps + 3 affiliation forms
│   │   ├── payment/                     ← PaymentButton, PaymentModal, PaymentHistory
│   │   ├── home/                        ← All home section components
│   │   ├── events/                      ← EventCard, EventRegistrationModal
│   │   ├── admin/                       ← ImageUpload
│   │   ├── common/                      ← RenewalBanner
│   │   ├── auth/                        ← RegistrationGuard
│   │   └── ui/                          ← MagneticCard, Particles, etc.
│   ├── lib/
│   │   ├── api/client.ts                ← Axios + auto-retry + token refresh
│   │   ├── hooks/                       ← useAuth, useCMS, useDashboard, useEvents, useStudent, useAffiliation
│   │   ├── store/registrationStore.ts   ← Zustand store for student registration wizard
│   │   ├── utils/status.ts
│   │   └── validations/student.ts
│   ├── hooks/                           ← usePayment.ts, useEventRegistration.ts
│   ├── services/                        ← dashboard, certificate, renewal, result, portal
│   ├── types/                           ← 7 type files
│   └── config/roles.tsx                 ← ROLE_CONFIG (colors, labels per role)
```

---

## 🗄 Database & Migrations

**Schema:** `prisma/schema.prisma` — 30+ models including all federation entities and CMS models.

**Migrations applied (4):**
1. `20260127101056_add_event_fields` — Event model enhancements
2. `20260127125045_add_affiliation_models_fixed` — State/District/Club affiliation models
3. `20260209_add_renewal_system` — Renewal, session, expiry tracking
4. `20260217033953_sync_schema` — Full schema sync

**Seed scripts available** (run manually from `src/scripts/`):
- `create-admin.ts` — Creates initial Global Admin user
- `seed-states.ts` — Seeds all Indian states
- `seed-locations.ts` — Seeds state+district data (also in `prisma/`)
- `seed-events.ts` — Seeds sample events
- `seed-test-users.ts` — Seeds test users for each role

**CMS-specific models:** Banner, News, Page, GalleryAlbum, GalleryItem, Menu, SiteSettings, TeamMember, Milestone, ContactMessage

**SiteSettings.metadata JSON shape:**
```json
{
  "departments": [{ "name": "string", "email": "string", "phone": "string?" }],
  "officeHours": { "weekdays": "string", "saturday": "string" },
  "mapEmbedUrl": "string",
  "phone2": "string"
}
```

---

## 🔌 API Endpoints Reference

### Auth
```
POST /api/v1/auth/register, /login, /verify-otp, /resend-otp
POST /api/v1/auth/refresh, /logout, /change-password
POST /api/v1/auth/forgot-password, /reset-password
GET  /api/v1/auth/me
```

### CMS (Public)
```
GET /api/v1/cms/banners?position=HOME_HERO&status=PUBLISHED
GET /api/v1/cms/news?page=1&limit=10&status=PUBLISHED
GET /api/v1/cms/news/slug/:slug
GET /api/v1/cms/gallery?status=PUBLISHED
GET /api/v1/cms/gallery/slug/:slug
GET /api/v1/cms/settings
GET /api/v1/cms/menus/location/HEADER
GET /api/v1/team-members/public
GET /api/v1/milestones/public
POST /api/v1/contact/submit
```

### CMS (Admin — GLOBAL_ADMIN role)
```
Full CRUD: /cms/admin/banners, /cms/admin/news, /cms/admin/pages
           /cms/admin/gallery/albums, /cms/admin/gallery/items
           /cms/admin/menus
PUT /api/v1/cms/admin/settings
GET /api/v1/contact/messages (admin inbox)
PATCH /api/v1/contact/messages/:id/read
```

### Federation Management
```
GET/POST/PUT/DEL /api/v1/students/*
GET/POST/PUT/DEL /api/v1/events/*
POST /api/v1/event-registration/lookup
POST /api/v1/event-registration/races
POST /api/v1/event-registration/register
GET  /api/v1/event-registration/races?category=X&ageGroup=Y
GET/POST/PUT/DEL /api/v1/clubs/*
GET /api/v1/dashboard/stats               ← Role-aware dashboard data
GET /api/v1/payments/*
POST /api/v1/payments/create-order
POST /api/v1/payments/verify
POST /api/v1/upload/image                 ← Sharp → WebP
GET /api/v1/stats/*
GET/POST /api/v1/registration-windows/*
GET/POST /api/v1/renewals/*
GET /api/v1/reports/*
GET /api/v1/certificates/*
GET/POST /api/v1/result/*
GET/POST /api/v1/coach-cert/*
GET/POST /api/v1/beginner-cert/*
```

---

## 🔑 Environment Variables

**Backend (`ssfi-backend/.env`):**
```bash
NODE_ENV=development
PORT=5001
DATABASE_URL="mysql://user:pass@localhost:3306/ssfi_db"
JWT_SECRET=...
JWT_REFRESH_SECRET=...
FRONTEND_URL=http://localhost:3000
ENCRYPTION_KEY=32-char-key-for-aes256
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=...
RAZORPAY_KEY_ID=...
RAZORPAY_KEY_SECRET=...
SMTP_HOST=...
SMTP_PORT=587
SMTP_USER=...
SMTP_PASS=...
SEASON_CUTOFF_DATE=2025-01-01
```

**Frontend (`ssfi-frontend/.env.local`):**
```bash
NEXT_PUBLIC_API_URL=http://localhost:5001/api/v1
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_RAZORPAY_KEY_ID=...
```

---

## ⚠️ Known Issues / Tech Debt

---

## 🐛 Bug Fixes Applied (Feb 25, 2026)

| Component | Bug | Fix |
|-----------|-----|-----|
| `StudentViewModal` | `ssfi_id` showed hash-based `user.uid` (e.g. `STU-03FF8BFB`) instead of real membership ID | `student.service.ts` now maps `ssfi_id: student.membershipId \|\| user.uid` — all 5615+ students have `SSFI/BS/TN/25/S0001` format in `students.membershipId` column |
| `StudentViewModal` | Blood group rendered as `A++`, `B++` | Fixed replace chain: `A_POSITIVE` → `A+`, `A_NEGATIVE` → `A-` (was `.replace('_','+').replace('POSITIVE','+')` causing double `+`) |
| `ClubViewModal` | Club name card appeared twice in modal body | Removed duplicate club identity strip — header already shows name |
| `ClubViewModal` | Owner card title showed club/org name instead of owner info | Owner card now shows `"Club Owner"` as title with `gender · phone` as subtitle |

---

1. **Approvals pages use mock data** — Highest priority fix. All 5 approval sub-pages need real API wiring.

2. **Reports & payment stats are hardcoded** — Need real API connections.

3. **Duplicate service/controller files** — `registration-window` vs `registrationWindow` (both exist). Delete one set and fix all imports.

4. **Aadhaar encryption** — `encryptAadhaar()` exists in `encryption.util.ts` but verify it's being called in `student.service.ts` before DB write.

5. **OTP verification page missing** — `/auth/verify-otp` route doesn't exist. The backend endpoint works but there's no UI for it.

6. **State/District profile names hardcoded** — State dashboard shows "Tamil Nadu Speed Skating Federation", District shows "District Dashboard". Should come from API.

7. **Email templates minimal** — Only credentials email done. Approval, rejection, renewal emails not built.

8. **Export buttons are placeholders** — "Export Data" in reports and "View Receipt" in payments have no implementation.

9. **Legacy gallery routes** — `gallery.routes.ts` at `/api/v1/gallery/*` still exists alongside new `/api/v1/cms/gallery/*`. Can be removed.

10. **No tests** — Zero test coverage across both frontend and backend.

---

## 📝 How to Continue in New Chat

Paste this into the next conversation:

```
I'm continuing development of the SSFI platform.

Project: H:\SSFI-New-Back\SSFI-Updated\
Backend:  ssfi-backend\   (Node.js/Express/Prisma/MySQL)
Frontend: ssfi-frontend\  (Next.js 14/TypeScript/Tailwind)

OVERALL STATUS: ~95% complete

WHAT IS 100% DONE:
- Auth system (JWT, OTP, refresh)
- All 5 role-based dashboards (Admin, State Secretary, District Secretary, Club Owner, Student)
- Complete dashboard layout with role-filtered sidebar + mobile nav
- All registration forms (Student 6-step wizard, State Secretary, District Secretary, Club)
- Event registration flow (UID lookup → category → races → Razorpay payment)
- Payment system (PaymentButton with Razorpay, success/failure pages)
- All dashboard sub-pages (approvals, events CRUD, students, clubs, states, districts, payments, reports, renewals, registration windows, coach/beginner certs, my-events)
- CMS system 100% (backend API + admin dashboard + public pages)
- Public website (home, about, contact, news, gallery, events, results, register forms, legal pages)
- Database with 4 migrations applied, seed scripts available

WHAT IS PENDING (fix these):
1. HIGHEST PRIORITY: Wire approvals pages to real API (replace mock data)
   - dashboard/approvals/students/page.tsx uses mockPendingStudents[] hardcoded array
   - Needs: GET /api/v1/students?status=PENDING, PUT /students/:id/approve, PUT /students/:id/reject
   - Same fix needed for clubs, state-secretaries, district-secretaries approval pages

2. Wire reports page to real API (dashboard/reports/page.tsx uses hardcoded stats)
   - Connect to GET /api/v1/stats/* or GET /api/v1/reports/dashboard

3. Fix hardcoded profile names in dashboards:
   - StateSecretaryDashboard: "Tamil Nadu Speed Skating Federation" should be dynamic
   - DistrictSecretaryDashboard: shows generic "District Dashboard" instead of actual district name
   - Pull from GET /api/v1/auth/me or the dashboard response

4. Build /auth/verify-otp page (OTP verification after registration — backend works, no UI)

5. Email templates: add approval/rejection/renewal reminder emails to email.service.ts

6. Fix hardcoded revenue stats in dashboard/payments/page.tsx

7. Clean up duplicate files: registration-window.service.ts + registrationWindow.service.ts

TECH CONVENTIONS:
- API base: http://localhost:5001/api/v1 (NEXT_PUBLIC_API_URL env)
- Image upload: POST /upload/image → { url: "/uploads/x.webp" }
- Dashboard dark theme: slate-900/slate-800/slate-700 with blue-600 accents
- Hooks in: src/lib/hooks/ (useAuth, useDashboard, etc.) and src/hooks/ (usePayment, useEventRegistration)
- Role type: 'GLOBAL_ADMIN' | 'STATE_SECRETARY' | 'DISTRICT_SECRETARY' | 'CLUB_OWNER' | 'STUDENT'
- All approval actions require Bearer token + role check in backend

I want to build: [DESCRIBE WHAT YOU WANT NEXT]
```
