# SSFI — Speed Skating Federation of India Digital Platform

## Overview

Full-stack federation management platform for skating sports across India. Supports 5 hierarchical user roles: Global Admin, State Secretary, District Secretary, Club Owner, and Student (Skater).

**Core Features:** Hierarchical RBAC, UID generation (`SSFI-[STATE]-[DISTRICT]-[CLUB]-[NUM]`), event management with age-category auto-calculation, Razorpay payments (multi-account), certificate generation (PDFKit), CMS for all public content, Sharp image processing (WebP), email notifications (8 templates), top-5 race results with cascading eligibility.

## Live URLs

| Service | URL | Platform |
|---------|-----|----------|
| Frontend | `https://ssfiskate.com` | Vercel (free tier) |
| Backend API | `https://api.ssfiskate.com/api/v1` | Railway ($5/mo Hobby) |
| Database | `mysql://...@194.59.164.11:3306/u745371806_ssfi_prod` | Hostinger MySQL |
| DNS | Cloudflare (DNS only, grey cloud) | Cloudflare |

## Architecture

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Vercel     │────▶│   Railway    │────▶│  Hostinger   │
│  (Frontend)  │     │  (Backend)   │     │   (MySQL)    │
│  Next.js 14  │     │  Express +   │     │  MySQL 8.0   │
│  App Router  │     │  Prisma ORM  │     │              │
└──────────────┘     └──────────────┘     └──────────────┘
       ▲                    ▲
       │                    │
   Cloudflare DNS      Cloudflare DNS
   ssfiskate.com       api.ssfiskate.com
```

## Monorepo Structure

```
SSFI-Updated/
├── ssfi-backend/          # Express + Prisma + MySQL (→ GitHub: SSFI-Main)
├── ssfi-frontend/         # Next.js 14 App Router   (→ GitHub: ssfi-main-frontend)
├── README.md              # This file
├── SSFI-TODO.md           # Pending tasks
├── ssfi_handoff_doc.md    # Full handover document with credentials
└── SSFI_Production_Issues_and_Resolutions.md
```

## Tech Stack

**Backend:** Node.js 20+, Express 4.18, Prisma 5.8, MySQL 8.0, JWT, Zod, Sharp 0.33, Razorpay, Nodemailer, Winston, node-cache

**Frontend:** Next.js 14.2 (App Router), TypeScript 5.3, Tailwind CSS 3.4, Framer Motion 11, React Hook Form + Zod, Zustand, Axios

## Git Workflow

This is a monorepo that splits into two GitHub repositories via `git subtree`:

| GitHub Repo | Subtree Prefix | Remote | Branch |
|-------------|---------------|--------|--------|
| `SSFI-Cloud/SSFI-Main` | `ssfi-backend/` | `origin` | `main` |
| `SSFI-Cloud/ssfi-main-frontend` | `ssfi-frontend/` | `frontend` | `main` |

### Push changes to GitHub (triggers auto-deploy)

```bash
# Push backend → Railway auto-deploys
git subtree push --prefix=ssfi-backend origin main

# Push frontend → Vercel auto-deploys
git subtree push --prefix=ssfi-frontend frontend main
```

### Commit email requirement

Vercel blocks deployments from unrecognized committer emails. Always use:
```bash
GIT_AUTHOR_EMAIL="ssfiwebdev@gmail.com" GIT_COMMITTER_EMAIL="ssfiwebdev@gmail.com" git commit -m "your message"
```

## Local Development Setup

### Prerequisites
- Node.js 20+
- MySQL 8.0 (local or remote)

### Backend
```bash
cd ssfi-backend
npm install
cp .env.example .env          # Edit with your DB credentials
npx prisma generate
npx prisma migrate dev
npm run dev                    # Starts on port 5001
```

### Frontend
```bash
cd ssfi-frontend
npm install
cp .env.example .env.local    # Set NEXT_PUBLIC_API_URL=http://localhost:5001/api/v1
npm run dev                    # Starts on port 3000
```

## Deployment

Both services auto-deploy on push to their respective GitHub repos:

- **Frontend (Vercel):** Push to `ssfi-main-frontend` repo → Vercel builds and deploys automatically
- **Backend (Railway):** Push to `SSFI-Main` repo → Railway builds (`npm install && npx prisma generate && npm run build`) and deploys

### Railway environment notes
- `PRISMA_CLIENT_ENGINE_TYPE=library` (required for Railway's Linux containers)
- Start command: `node dist/app.js`
- Port: Railway assigns automatically via `PORT` env var

## Key Documentation

- **[ssfi_handoff_doc.md](./ssfi_handoff_doc.md)** — Full handover: credentials, SSH access, deployment, DNS, environment variables
- **[SSFI-TODO.md](./SSFI-TODO.md)** — All pending tasks and completed work
- **[SSFI_Production_Issues_and_Resolutions.md](./SSFI_Production_Issues_and_Resolutions.md)** — Production bug log with root causes and fixes
