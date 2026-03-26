# SSFI Frontend — Next.js 14 App Router

Public website and admin dashboard for the SSFI (Speed Skating Federation of India) platform.

## Tech Stack
Next.js 14.2 (App Router), TypeScript 5.3, Tailwind CSS 3.4, Framer Motion 11, React Hook Form + Zod, Zustand, Axios

## Deployment
- **Production:** Vercel (auto-deploys from `SSFI-Cloud/ssfi-main-frontend` GitHub repo)
- **URL:** `https://ssfiskate.com`
- **ISR:** Homepage, About, Contact pages revalidate every 60 seconds

## Local Setup

```bash
npm install
cp .env.example .env.local    # Edit with your API URL (see below)
npm run dev                    # Starts on port 3000
```

Open [http://localhost:3000](http://localhost:3000)

## Environment Variables

```bash
NEXT_PUBLIC_API_URL=http://localhost:5001/api/v1
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_RAZORPAY_KEY_ID=your-razorpay-key
```

## Scripts
- `npm run dev` — Start development server
- `npm run build` — Build for production
- `npm start` — Start production server
- `npm run lint` — Run ESLint

## Key Directories
```
src/
├── app/
│   ├── (pub)/              20+ public routes (renamed from (public) to fix LiteSpeed)
│   ├── auth/               Login, register, forgot-password
│   ├── register/           4 registration types + success
│   ├── dashboard/          30+ dashboard routes + cms/
│   ├── layout.tsx          Root layout (fonts, metadata, DNS prefetch)
│   ├── robots.ts           SEO robots
│   └── sitemap.ts          Dynamic sitemap
├── components/
│   ├── dashboard/          5 role-based dashboards
│   ├── forms/              Student registration wizard + affiliation forms
│   ├── home/               20+ homepage sections
│   ├── layout/             Header, Footer
│   └── ui/                 Reusable UI components
├── lib/
│   ├── api/client.ts       Axios with auto-retry + token refresh
│   ├── hooks/              useAuth, useCMS, useDashboard, useEvents, etc.
│   └── store/              Zustand stores
├── services/               API service wrappers
└── types/                  TypeScript type definitions
```

## Route Group Note
The public route group uses `(pub)` instead of the conventional `(public)`. This is intentional — parentheses in directory names cause chunk 404 errors on LiteSpeed servers and some CDNs. Do not rename back to `(public)`.

## Vercel Production Notes
- Auto-deploys on push to the `ssfi-main-frontend` GitHub repo
- Commits **must** use email `ssfiwebdev@gmail.com` or Vercel blocks the deployment
- Environment variables set in Vercel project settings dashboard
