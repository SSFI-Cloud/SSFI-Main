# SSFI Production Issues & Resolutions Log

**Project:** Skating Sports Federation of India — Digital Platform
**Environment:** Vercel (frontend) + Railway (backend) + Hostinger MySQL (database)
**Previous Environment:** Hostinger Cloud Startup (LiteSpeed + Passenger + Node.js) — migrated March 2026
**Domains:** `ssfiskate.com` (frontend) | `api.ssfiskate.com` (backend)
**Period Covered:** March 7–26, 2026 (Production Deployment, Stabilization & Migration)

---

## Table of Contents

### Hostinger Era (March 7–20, 2026)
1. [CORS Blocking All API Calls](#1-cors-blocking-all-api-calls)
2. [CDN Caching Wrong CORS Origin Header](#2-cdn-caching-wrong-cors-origin-header)
3. [CDN Serving Stale HTML After Deployment (ChunkLoadError)](#3-cdn-serving-stale-html-after-deployment-chunkloaderror)
4. [Backend Build Failure — Missing performance.middleware.ts](#4-backend-build-failure--missing-performancemiddlewarets)
5. [Prisma Binary Not Found on Linux Server](#5-prisma-binary-not-found-on-linux-server)
6. [LiteSpeed Rejecting Parentheses in Chunk URLs (404s)](#6-litespeed-rejecting-parentheses-in-chunk-urls-404s)
7. [Notification Ribbon Not Visible](#7-notification-ribbon-not-visible)
8. ["Resource Not Found" Toast on Page Load](#8-resource-not-found-toast-on-page-load)
9. [manifest.json 404 Error](#9-manifestjson-404-error)
10. [Max Process Limits on Hostinger](#10-max-process-limits-on-hostinger)
11. [Hostinger .env Symlink Wiped on Deploy](#11-hostinger-env-symlink-wiped-on-deploy)
12. [Frontend scripts/ Directory Not Deployed](#12-frontend-scripts-directory-not-deployed)

### Migration Era (March 21–26, 2026)
13. [Permanent LiteSpeed Fix — Route Group Rename](#13-permanent-litespeed-fix--route-group-rename)
14. [Railway Prisma Engine Type Error](#14-railway-prisma-engine-type-error)
15. [Railway Not Showing Private GitHub Repos](#15-railway-not-showing-private-github-repos)
16. [Railway Backend Returning Zero Data](#16-railway-backend-returning-zero-data)
17. [Vercel Blocking Deployments — Unrecognized Committer Email](#17-vercel-blocking-deployments--unrecognized-committer-email)
18. [CORS/CSP Errors After Vercel + Railway Migration](#18-corscsp-errors-after-vercel--railway-migration)

---

## 1. CORS Blocking All API Calls

**Date Identified:** March 9, 2026
**Severity:** Critical (all API calls blocked, site non-functional)

### Symptoms
- Browser console: `Access-Control-Allow-Origin header has a value 'https://www.ssfiskate.com' that is not equal to the supplied origin`
- All API requests from `https://ssfiskate.com` (non-www) blocked
- Stats, events, programs, contact pages all showed "Network Error"
- Site worked only after Ctrl+Shift+R (bypassing cache)

### Root Cause
Hostinger stores environment variables set from its panel at:
```
~/domains/api.ssfiskate.com/public_html/.builds/config/.env
```
But the backend's `dotenv.config()` looks for `.env` in the project root:
```
~/domains/api.ssfiskate.com/nodejs/.env  (does NOT exist)
```
Result: `process.env.ALLOWED_ORIGINS` was `undefined`, making the `allowedOrigins` Set empty. CORS rejected all cross-origin requests.

### Resolution

**Step 1 — Immediate fix (SSH):**
```bash
# Create symlink so dotenv.config() finds Hostinger's .env
ln -sf ~/domains/api.ssfiskate.com/public_html/.builds/config/.env ~/domains/api.ssfiskate.com/nodejs/.env

# Restart the app
touch ~/domains/api.ssfiskate.com/nodejs/tmp/restart.txt
```

**Step 2 — Code fix (permanent):**
Added fallback dotenv path in `ssfi-backend/src/app.ts`:
```typescript
dotenv.config();
if (!process.env.DATABASE_URL) {
  dotenv.config({ path: path.resolve(__dirname, '../../public_html/.builds/config/.env') });
}
```

### Verification
```bash
curl -s -D - -H "Origin: https://ssfiskate.com" \
  "https://api.ssfiskate.com/api/v1/stats/public" | grep access-control
# Expected: access-control-allow-origin: https://ssfiskate.com
```

### Files Changed
- `ssfi-backend/src/app.ts` (lines 11-16)

---

## 2. CDN Caching Wrong CORS Origin Header

**Date Identified:** March 9, 2026
**Severity:** High (intermittent CORS failures for www vs non-www)

### Symptoms
- Request from `https://ssfiskate.com` got `Access-Control-Allow-Origin: https://www.ssfiskate.com`
- Same endpoint worked with cache-busting query parameter (`?_t=...`)
- Response headers showed `x-hcdn-cache-status: HIT`

### Root Cause
Hostinger CDN cached the first response including its `Access-Control-Allow-Origin` header. Subsequent requests from a different origin (www vs non-www) received the cached CORS header from the first request, causing a mismatch.

### Resolution
Added `Vary: Origin` header so CDN caches separate responses per origin:
```typescript
// In app.ts, after cors middleware:
app.use((_req: Request, res: Response, next: NextFunction) => {
  res.vary('Origin');
  next();
});
```

**Important:** Use `res.vary('Origin')` (appends) not `res.setHeader('Vary', 'Origin')` (overwrites). The compression middleware already sets `Vary: Accept-Encoding`, and overwriting it breaks gzip negotiation.

### Verification
```bash
# Test with different origins — each should reflect its own origin:
curl -H "Origin: https://ssfiskate.com" "https://api.ssfiskate.com/api/v1/stats/public?_t=$(date +%s)"
curl -H "Origin: https://www.ssfiskate.com" "https://api.ssfiskate.com/api/v1/stats/public?_t=$(date +%s)"
```

### Files Changed
- `ssfi-backend/src/app.ts` (after CORS middleware)

---

## 3. CDN Serving Stale HTML After Deployment (ChunkLoadError)

**Date Identified:** March 8, 2026
**Severity:** Critical (site broken after every deploy)

### Symptoms
- After pushing new frontend code, browser showed `ChunkLoadError: Loading chunk app/(public)/events/page-xxx failed`
- HTML referenced old chunk hashes that no longer existed on server
- Response headers: `x-hcdn-cache-status: HIT`, `Age: 224`, `stale-while-revalidate=300`
- Ctrl+Shift+R (hard refresh) fixed the issue

### Root Cause
`next.config.js` had cache headers allowing CDN to serve stale HTML:
```javascript
value: 'public, max-age=0, s-maxage=60, stale-while-revalidate=300'
```
CDN served HTML from cache for up to 60s + 300s stale window. During this time, the HTML referenced old chunk filenames that were deleted in the new deployment.

### Resolution
Changed to prevent CDN caching of HTML:
```javascript
value: 'public, max-age=0, s-maxage=0, must-revalidate'
```

After deploying: **purge CDN cache from Hostinger panel.**

### Verification
```bash
curl -D - https://ssfiskate.com | grep -i "cache-control\|x-hcdn"
# Expected: cache-control: public, max-age=0, s-maxage=0, must-revalidate
# Expected: x-hcdn-cache-status: DYNAMIC (not HIT)
```

### Files Changed
- `ssfi-frontend/next.config.js` (security headers section)

---

## 4. Backend Build Failure — Missing performance.middleware.ts

**Date Identified:** March 8, 2026
**Severity:** Critical (backend fails to build and deploy)

### Symptoms
- Hostinger build logs: `TS2307: Cannot find module './middleware/performance.middleware'`
- Backend deployment stuck on failed build
- `app.ts` line 59 imports `{ requestTimer, requestTimeout, httpCacheHeaders }` but file didn't exist

### Root Cause
The file was created in a previous session but was lost when the git worktree was recreated. The subtree split also didn't include it.

### Resolution
Recreated `ssfi-backend/src/middleware/performance.middleware.ts` with three exports:
- `requestTimer` — Logs slow requests exceeding threshold (default 3000ms)
- `requestTimeout` — Kills hanging connections (default 30000ms)
- `httpCacheHeaders(maxAgeSeconds)` — Sets Cache-Control for public GET routes

### Verification
```bash
# On server after deploy:
ls ~/domains/api.ssfiskate.com/nodejs/dist/middleware/performance.middleware.js
# Should exist
```

### Files Changed
- `ssfi-backend/src/middleware/performance.middleware.ts` (created)

---

## 5. Prisma Binary Not Found on Linux Server

**Date Identified:** March 8, 2026
**Severity:** High (backend crashes on startup)

### Symptoms
- Backend startup error related to Prisma binary engine not found
- Worked fine locally on Windows but failed on Hostinger Linux server

### Root Cause
`prisma/schema.prisma` had:
```prisma
binaryTargets = ["native"]
```
This only generates the binary for the build machine (Windows). Hostinger runs Linux.

### Resolution
Added Linux binary targets:
```prisma
generator client {
  provider      = "prisma-client-js"
  binaryTargets = ["native", "debian-openssl-1.1.x", "debian-openssl-3.0.x", "linux-musl", "linux-musl-openssl-3.0.x"]
}
```

### Files Changed
- `ssfi-backend/prisma/schema.prisma`

---

## 6. LiteSpeed Rejecting Parentheses in Chunk URLs (404s)

**Date Identified:** March 8, 2026
**Severity:** High (route group pages don't load)

### Symptoms
- Pages under Next.js route groups like `(public)` returned 404 for their JS chunks
- URL: `/_next/static/chunks/app/(public)/events/page-xxx.js` → 404
- Same URL with encoded parens `%28public%29` → 200

### Root Cause
Hostinger's LiteSpeed web server rejects literal parentheses `()` in URL paths. Next.js App Router creates route groups with parentheses in the directory name (e.g., `(public)`), and these appear in chunk file paths.

### Resolution
Created `ssfi-frontend/scripts/fix-litespeed-paths.js` — a postbuild script that:
1. Walks all files in `.next/` directory
2. Finds patterns matching `static/chunks/app/(...)` (browser-facing URLs only)
3. Encodes `(` → `%28` and `)` → `%29`
4. Does NOT touch server-side paths like `app-paths-manifest.json` (would break SSR)

Added to `package.json`:
```json
"build": "next build && node scripts/fix-litespeed-paths.js"
```

**Critical Warning:** The first version of this script was too aggressive and encoded ALL `app/(public)/` patterns including server manifests, which broke SSR with 500 errors. The fix was to narrow the regex to ONLY `static/chunks/app/(...)` patterns.

### Files Changed
- `ssfi-frontend/scripts/fix-litespeed-paths.js` (created)
- `ssfi-frontend/package.json` (build script)

---

## 7. Notification Ribbon Not Visible

**Date Identified:** March 9, 2026
**Severity:** Medium (feature not working)

### Symptoms
- Green notification ribbon above navbar not visible on production site
- No errors in console (silently caught)

### Root Cause (Multi-step)
1. **Initially:** Backend had no `/api/v1/notifications/public/active` endpoint → 404
2. **After creating endpoint:** Returned static `null` → ribbon hidden
3. **After adding DB queries:** Queries returned empty because programs didn't have `REGISTRATION_OPEN` status
4. **Final fix:** Added env-variable fallback + widened the query

### Resolution

**Step 1 — Created endpoint** in `app.ts`:
```typescript
app.get(`/api/${API_VERSION}/notifications/public/active`, async (_req, res) => {
  // Queries RegistrationWindow, BeginnerCertProgram, CoachCertProgram
  // Falls back to NOTIFICATION_MESSAGE env var
});
```

**Step 2 — Updated frontend** `NotificationRibbon.tsx`:
- Supports array of notifications (one per active registration/program)
- Auto-rotates every 4 seconds with slide-up animation
- Dot indicators when multiple notifications are active
- Dismiss button (X) hides ribbon for current session

**Step 3 — Set env fallback** on Hostinger panel:
```
NOTIFICATION_MESSAGE=Beginner Certification Program is now live — Enroll today!
NOTIFICATION_LINK=/beginner-certification
```

### Files Changed
- `ssfi-backend/src/app.ts` (notification endpoint)
- `ssfi-frontend/src/components/layout/NotificationRibbon.tsx` (rewritten)

---

## 8. "Resource Not Found" Toast on Page Load

**Date Identified:** March 8, 2026
**Severity:** Low (UX annoyance)

### Symptoms
- Every page load showed a "Resource not found" toast notification
- Appeared briefly then disappeared

### Root Cause
`NotificationRibbon.tsx` used the global `api` client (from `lib/api/client.ts`) which has an Axios interceptor that shows a toast on 404 responses. When the notifications endpoint didn't exist, the 404 triggered the toast.

### Resolution
Changed `NotificationRibbon.tsx` to use raw `axios` instead of the global `api` client:
```typescript
import axios from 'axios';
const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api';
// ...
const res = await axios.get(`${API_BASE}/notifications/public/active`, { timeout: 5000 });
```

### Files Changed
- `ssfi-frontend/src/components/layout/NotificationRibbon.tsx`

---

## 9. manifest.json 404 Error

**Date Identified:** March 9, 2026
**Severity:** Low (PWA metadata missing)

### Symptoms
- Console: `GET https://ssfiskate.com/manifest.json 404 (Not Found)`

### Root Cause
`manifest.json` was referenced in layout metadata but the file didn't exist in `public/`.

### Resolution
Created `ssfi-frontend/public/manifest.json` with SSFI branding (name, icons, theme color).

### Files Changed
- `ssfi-frontend/public/manifest.json` (created)

---

## 10. Max Process Limits on Hostinger

**Date Identified:** March 8, 2026
**Severity:** High (server crashes when process limit exceeded)

### Symptoms
- Hostinger panel showed processes hitting 200 limit
- SSH connections getting forcibly closed (`ConnectionResetError`)
- Backend intermittently unreachable

### Root Cause
Hostinger Cloud Startup has a 200-process cap. During builds, process count spikes. The Node.js process also spawns libuv threads and sharp threads.

### Resolution
Backend start script already optimized:
```json
"start": "UV_THREADPOOL_SIZE=2 VIPS_CONCURRENCY=1 node --max-old-space-size=256 dist/app.js"
```

In `app.ts`, programmatic enforcement:
```typescript
if (!process.env.UV_THREADPOOL_SIZE) process.env.UV_THREADPOOL_SIZE = '2';
if (!process.env.VIPS_CONCURRENCY) process.env.VIPS_CONCURRENCY = '1';
sharp.concurrency(1);
```

**Additional measures:**
- PM2 config limits to 2 instances, 512MB max memory
- Non-blocking emails (fire-and-forget) prevent connection pileup
- 30s request timeout kills hanging connections

### Files Changed
- `ssfi-backend/src/app.ts` (process limits)
- `ssfi-backend/package.json` (start script)
- `ssfi-backend/ecosystem.config.js` (PM2 config)

---

## 11. Hostinger .env Symlink Wiped on Deploy

**Date Identified:** March 9, 2026
**Severity:** Medium (CORS/DB breaks after each deploy)

### Symptoms
- After Hostinger auto-deploys from GitHub, backend loses database connection
- CORS starts blocking again
- `ls ~/domains/api.ssfiskate.com/nodejs/.env` → "No such file"

### Root Cause
Hostinger's git deployment replaces the `nodejs/` directory contents from the git repo. The symlink `nodejs/.env → .builds/config/.env` is not in git and gets deleted.

### Resolution
**Two-layer defense:**

1. **Code fallback** (automatic): `app.ts` tries `.builds/config/.env` if project-root `.env` is missing
2. **Post-deploy symlink** (manual/scripted): Re-create after each deploy

```bash
# Run after every deploy:
ln -sf ~/domains/api.ssfiskate.com/public_html/.builds/config/.env ~/domains/api.ssfiskate.com/nodejs/.env
touch ~/domains/api.ssfiskate.com/nodejs/tmp/restart.txt
```

**Recommended future improvement:** Add a Hostinger deploy hook or CI/CD step that automatically creates the symlink after each deployment.

### Files Changed
- `ssfi-backend/src/app.ts` (dotenv fallback path)

---

## 12. Frontend scripts/ Directory Not Deployed

**Date Identified:** March 9, 2026
**Severity:** Medium (postbuild LiteSpeed fix doesn't run on server)

### Symptoms
- `scripts/fix-litespeed-paths.js` exists in git but NOT on Hostinger server
- `ls ~/domains/ssfiskate.com/nodejs/scripts/` → directory doesn't exist
- Postbuild step in `package.json` references script that isn't there

### Root Cause
The frontend on Hostinger is NOT a git checkout — it has no `.git` directory. Hostinger copies files from a build step but doesn't include the `scripts/` directory.

### Current Status
- The script works locally during development builds
- On Hostinger, it doesn't run (but the CDN cache fix mitigates the impact)
- URL-encoded parentheses in chunk paths still work if the script ran during a local build that was then deployed

### Recommended Fix
Either:
1. Inline the postbuild script in `package.json` using a one-liner
2. Upload `scripts/` manually to the server via SSH
3. Add a Hostinger build hook that runs the script

### Files Affected
- `ssfi-frontend/scripts/fix-litespeed-paths.js`
- `ssfi-frontend/package.json`

---

## Quick Reference: Post-Deploy Checklist

After every backend deploy to Hostinger:
```bash
# 1. SSH into server
ssh -p 65002 u745371806@156.67.211.248

# 2. Verify deployment
cd ~/domains/api.ssfiskate.com/nodejs && git log --oneline -1

# 3. Re-create .env symlink
ln -sf ~/domains/api.ssfiskate.com/public_html/.builds/config/.env ~/domains/api.ssfiskate.com/nodejs/.env

# 4. Restart app
touch ~/domains/api.ssfiskate.com/nodejs/tmp/restart.txt

# 5. Verify API works
curl -s https://api.ssfiskate.com/api/v1/stats/public | head -c 100
```

After every frontend deploy:
```bash
# 1. Purge CDN cache from Hostinger panel (Website > Cache Manager > Purge All)
# 2. Verify site loads: https://ssfiskate.com
# 3. Test in incognito window to bypass browser cache
```

> **NOTE:** The above Hostinger-specific checklist is now obsolete. Frontend is on Vercel and backend is on Railway. Both auto-deploy on git push. See issues 13-18 below for the migration-era issues.

---

## 13. Permanent LiteSpeed Fix — Route Group Rename

**Date Identified:** March 22, 2026
**Severity:** Critical (resolved permanently)

### Background
Issue #6 (LiteSpeed Rejecting Parentheses) was worked around with a postbuild script (`fix-litespeed-paths.js`). This was fragile — it didn't run on Hostinger's build pipeline and required manual intervention.

### Permanent Resolution
Renamed the Next.js route group directory from `(public)` to `(pub)` in source code:
- `ssfi-frontend/src/app/(public)/` → `ssfi-frontend/src/app/(pub)/`
- Updated all imports and references

This eliminates parentheses from chunk URLs entirely, fixing the issue on LiteSpeed, Vercel, and any CDN.

### Files Changed
- `ssfi-frontend/src/app/(pub)/` (renamed directory)
- All layout and page files within the route group

---

## 14. Railway Prisma Engine Type Error

**Date Identified:** March 23, 2026
**Severity:** Critical (backend crashes on Railway)

### Symptoms
- Railway build succeeds but backend crashes on startup
- Error: `PrismaClientValidationError: Invalid client engine type`

### Root Cause
The Hostinger start command included `PRISMA_CLIENT_ENGINE_TYPE=binary` which doesn't work on Railway's Linux containers. Railway needs the `library` engine type.

### Resolution
Added `PRISMA_CLIENT_ENGINE_TYPE=library` as an environment variable in Railway project settings. Changed start command to just `node dist/app.js` (no engine type override in command).

### Files Changed
- Railway environment variables (not in code)

---

## 15. Railway Not Showing Private GitHub Repos

**Date Identified:** March 23, 2026
**Severity:** Medium (blocks deployment setup)

### Symptoms
- Railway's "Deploy from GitHub" page didn't list the `SSFI-Main` private repository
- Reinstalling the Railway GitHub App didn't help

### Resolution
Temporarily made `SSFI-Main` repo public, connected it to Railway, then made the repo private again. Railway retains access once connected.

---

## 16. Railway Backend Returning Zero Data

**Date Identified:** March 23, 2026
**Severity:** Critical (API returns empty responses)

### Symptoms
- Backend deployed successfully on Railway, APIs responded with 200 but returned 0 records
- Database queries returned empty results despite data existing in MySQL

### Root Cause
Two issues:
1. **Remote MySQL not enabled on Hostinger** — Railway's IP couldn't connect to the database
2. **Wrong MySQL IP in DATABASE_URL** — Was using `156.67.211.248` (Hostinger's SSH IP), needed `194.59.164.11` (actual MySQL IP)

### Resolution
1. Enabled remote MySQL access in Hostinger hPanel → Databases → Remote MySQL → "Any Host" (`%`)
2. Updated `DATABASE_URL` in Railway to use `194.59.164.11` as the MySQL host

---

## 17. Vercel Blocking Deployments — Unrecognized Committer Email

**Date Identified:** March 24, 2026
**Severity:** High (frontend deploys blocked)

### Symptoms
- Vercel dashboard showed "Deployment Blocked" after git push
- Error: committer email not associated with any GitHub account

### Root Cause
Commits made with `admin@ssfi.com` or other non-GitHub emails are rejected by Vercel's security policy. The committer email must match a GitHub account that has access to the repository.

### Resolution
All commits must use:
```bash
GIT_AUTHOR_EMAIL="ssfiwebdev@gmail.com" GIT_COMMITTER_EMAIL="ssfiwebdev@gmail.com" git commit -m "message"
```

---

## 18. CORS/CSP Errors After Vercel + Railway Migration

**Date Identified:** March 24, 2026
**Severity:** High (API calls blocked from new domains)

### Symptoms
- Frontend on Vercel couldn't reach backend on Railway
- CORS errors in browser console
- CSP violations blocking API connections

### Resolution
1. Added Vercel and Railway URLs to `ALLOWED_ORIGINS` env var on Railway:
   ```
   ALLOWED_ORIGINS=https://ssfiskate.com,https://www.ssfiskate.com,https://ssfi-main-frontend.vercel.app
   ```
2. Updated CSP headers in `next.config.js` to allow connections to Railway domain
3. Ensured Cloudflare DNS records are set to "DNS only" (grey cloud), not proxied — proxying would interfere with Vercel/Railway's own SSL certificates

---

## Quick Reference: Current Post-Deploy Checklist

### After pushing code (auto-deploy)

```bash
# 1. Push backend → Railway auto-deploys
git subtree push --prefix=ssfi-backend origin main

# 2. Push frontend → Vercel auto-deploys
git subtree push --prefix=ssfi-frontend frontend main

# 3. Verify
curl -s https://api.ssfiskate.com/api/v1/stats/public | head -c 100
# Open https://ssfiskate.com in incognito
```

No manual SSH, restart, or cache purge needed anymore.
