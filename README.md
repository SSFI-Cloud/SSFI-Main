# SSFI Backend — Express + Prisma + MySQL

REST API for the SSFI (Speed Skating Federation of India) platform.

## Tech Stack
Node.js 20+, Express 4.18, Prisma 5.8, MySQL 8.0, JWT, Zod, Sharp 0.33, Razorpay, Nodemailer, Winston, node-cache

## Deployment
- **Production:** Railway (auto-deploys from `SSFI-Cloud/SSFI-Main` GitHub repo)
- **URL:** `https://api.ssfiskate.com/api/v1`
- **Database:** Hostinger MySQL at `194.59.164.11:3306`

## Local Setup

```bash
npm install
cp .env.example .env          # Edit with your credentials (see below)
npx prisma generate
npx prisma migrate dev
npm run dev                    # Starts on port 5001
```

## Environment Variables

```bash
NODE_ENV=development
PORT=5001
DATABASE_URL="mysql://user:pass@localhost:3306/ssfi_db"
BACKEND_URL=http://localhost:5001
FRONTEND_URL=http://localhost:3000
ALLOWED_ORIGINS=http://localhost:3000
JWT_SECRET=your-jwt-secret
JWT_REFRESH_SECRET=your-refresh-secret
ENCRYPTION_KEY=32-char-key-for-aes256
RAZORPAY_KEY_ID=your-razorpay-key
RAZORPAY_KEY_SECRET=your-razorpay-secret
RAZORPAY_ENCRYPTION_KEY=64-char-hex-for-multi-account
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=noreply@ssfiskate.com
SMTP_PASS=your-smtp-password
SMTP_FROM_NAME=SSFI
CONTACT_RECEIVER_EMAIL=admin@ssfiskate.com
SEASON_CUTOFF_DATE=2025-01-01
PRISMA_CLIENT_ENGINE_TYPE=library    # Use 'library' on Railway/Linux
```

## Scripts
- `npm run dev` — Start development server (ts-node with nodemon)
- `npm run build` — Compile TypeScript to `dist/`
- `npm start` — Start production server (`node dist/app.js`)
- `npx prisma generate` — Generate Prisma client
- `npx prisma migrate dev` — Run migrations in development
- `npx prisma studio` — Open Prisma Studio (DB GUI)

## Key Directories
```
src/
├── app.ts              Route registrations + middleware
├── controllers/        24 controllers
├── services/           24 services + email.service.ts
├── routes/             27 route files
├── middleware/          auth, error, performance, scope, upload, validation
├── validators/         8 Zod schema validators
├── utils/              cache, encryption, logger, response helpers
└── scripts/            Seed scripts (admin, states, locations, events, test users)
```

## Railway Production Notes
- Build command: `npm install && npx prisma generate && npm run build`
- Start command: `node dist/app.js`
- `PRISMA_CLIENT_ENGINE_TYPE=library` is required (Railway uses Linux containers)
- Port is assigned automatically via `PORT` env var
