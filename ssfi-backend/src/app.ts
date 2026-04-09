import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables
// Try project root first, then Hostinger's .builds/config path
dotenv.config();
if (!process.env.DATABASE_URL) {
  dotenv.config({ path: path.resolve(__dirname, '../../public_html/.builds/config/.env') });
}

// ── Process/thread limits ──
// Railway: higher defaults for dedicated container; Hostinger: restricted
const isRailway = !!process.env.RAILWAY_ENVIRONMENT;
if (!process.env.UV_THREADPOOL_SIZE) process.env.UV_THREADPOOL_SIZE = isRailway ? '8' : '2';
if (!process.env.VIPS_CONCURRENCY) process.env.VIPS_CONCURRENCY = isRailway ? '2' : '1';

import sharp from 'sharp';
sharp.concurrency(isRailway ? 2 : 1);

// ── Validate critical environment variables ──
const REQUIRED_ENV_VARS = [
  'DATABASE_URL',
  'JWT_SECRET',
  'ENCRYPTION_KEY',
  'RAZORPAY_KEY_ID',
  'RAZORPAY_KEY_SECRET',
] as const;

const missingVars = REQUIRED_ENV_VARS.filter((v) => !process.env[v]);
if (missingVars.length > 0) {
  console.error(`FATAL: Missing required environment variables: ${missingVars.join(', ')}`);
  process.exit(1);
}

// Import routes
import authRoutes from './routes/auth.routes';
import adminRoutes from './routes/admin.routes';
import registrationWindowRoutes from './routes/registration-window.routes';
import stateSecretaryRoutes from './routes/state-secretary.routes';
import districtSecretaryRoutes from './routes/district-secretary.routes';
import paymentRoutes from './routes/payment.routes';
import reportRoutes from './routes/report.routes';
import stateRoutes from './routes/state.routes';
import districtRoutes from './routes/district.routes';
import clubRoutes from './routes/club.routes';
import studentRoutes from './routes/student.routes';
import eventRoutes from './routes/event.routes';
import affiliationRoutes from './routes/affiliation.routes';
import dashboardRoutes from './routes/dashboard.routes';
import cmsRoutes from './routes/cms.routes';
import contactRoutes from './routes/contact.routes';
// LEGACY: import galleryRoutes from './routes/gallery.routes'; // Replaced by CMS gallery routes
import newsRoutes from './routes/news.routes';
import settingsRoutes from './routes/settings.routes';
import locationsRoutes from './routes/locations.routes';
import { statsRoutes } from './routes/stats.routes';
import renewalRoutes from './routes/renewal.routes';
import homepageRoutes from './routes/homepage.routes';
import stateDirectoryRoutes from './routes/state-directory.routes';
// import paymentRoutes from './routes/payment.routes';

// Import middleware
import { errorHandler } from './middleware/error.middleware';
import { notFound } from './middleware/error.middleware';
import { requestTimer, requestTimeout, httpCacheHeaders } from './middleware/performance.middleware';
import { cacheMiddleware } from './utils/cache.util';
import { authenticate } from './middleware/auth.middleware';

// Import utils
import logger from './utils/logger.util';

const app: Application = express();

// Trust Hostinger/Cloudflare reverse proxy headers
app.set('trust proxy', 1);

// Security Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Performance: log slow requests + kill hanging connections
app.use(requestTimer);
app.use(requestTimeout);

// CORS Configuration
// Build allowed origins from env, automatically including both www and non-www
// variants to prevent CORS mismatch when Cloudflare or DNS resolves differently
const rawOrigins = process.env.ALLOWED_ORIGINS?.split(',').map(o => o.trim()) || [];
const allowedOrigins = new Set<string>();
for (const origin of rawOrigins) {
  allowedOrigins.add(origin);
  // Auto-add www/non-www variant for any https domain
  if (origin.startsWith('https://www.')) {
    allowedOrigins.add(origin.replace('https://www.', 'https://'));
  } else if (origin.startsWith('https://') && !origin.includes('localhost')) {
    allowedOrigins.add(origin.replace('https://', 'https://www.'));
  }
}

// Allow Vercel preview/production deployments
const corsOptions = {
  origin: (origin: string | undefined, callback: Function) => {
    if (!origin || allowedOrigins.has(origin) || (origin.includes('ssfi') && origin.endsWith('.vercel.app'))) {
      callback(null, true);
    } else {
      logger.warn(`CORS blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Ensure CDN caches different responses per Origin (prevents CORS header mismatch)
app.use((_req: Request, res: Response, next: NextFunction) => {
  res.vary('Origin');
  next();
});

// Rate Limiting - tuned for real-world multi-user traffic
// Each page load triggers 2-3 API calls; 1000/15min allows ~40+ concurrent users per IP
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '1000'), // 1000 requests per 15min per IP
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Stricter rate limiting for auth endpoints (brute-force protection)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // 20 attempts per window
  message: 'Too many authentication attempts from this IP, please try again after 15 minutes.',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
});
app.use('/api/v1/auth/login', authLimiter);
app.use('/api/v1/auth/register', authLimiter);
app.use('/api/v1/auth/forgot-password', authLimiter);
app.use('/api/v1/auth/verify-otp', authLimiter);
app.use('/api/v1/auth/resend-otp', authLimiter);
app.use('/api/v1/auth/reset-password', authLimiter);

// Body Parser Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Compression Middleware
app.use(compression());

// Logging Middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined', {
    stream: {
      write: (message: string) => logger.info(message.trim())
    }
  }));
}

// Protected document access — requires authentication (Aadhaar, identity proofs, etc.)
app.use('/uploads/documents', authenticate, (req: Request, res: Response, next: NextFunction) => {
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
}, express.static(path.join(__dirname, '../uploads/documents'), {
  maxAge: '1d',
  etag: true,
  lastModified: true,
}));

// Static Files — with long cache + ETag + CORS headers (public: images, logos, photos)
app.use('/uploads', (req: Request, res: Response, next: NextFunction) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
}, express.static(path.join(__dirname, '../uploads'), {
  maxAge: '30d',
  etag: true,
  lastModified: true,
}));

// Health Check
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV
  });
});


// API Routes
const API_VERSION = process.env.API_VERSION || 'v1';

// HTTP cache headers for public read-only endpoints (60s browser cache)
const publicCache = httpCacheHeaders(60);
app.use(`/api/${API_VERSION}/news`, publicCache);
app.use(`/api/${API_VERSION}/locations`, publicCache);
app.use(`/api/${API_VERSION}/stats`, publicCache);
app.use(`/api/${API_VERSION}/results`, publicCache);
app.use(`/api/${API_VERSION}/team-members`, publicCache);
app.use(`/api/${API_VERSION}/milestones`, publicCache);
app.use(`/api/${API_VERSION}/events`, publicCache);
app.use(`/api/${API_VERSION}/beginner-cert`, publicCache);
app.use(`/api/${API_VERSION}/coach-cert`, publicCache);
app.use(`/api/${API_VERSION}/notifications`, publicCache);
app.use(`/api/${API_VERSION}/homepage`, publicCache);
app.use(`/api/${API_VERSION}/state-directory`, publicCache);

app.use(`/api/${API_VERSION}/auth`, authRoutes);
app.use(`/api/${API_VERSION}/admin`, adminRoutes);
app.use(`/api/${API_VERSION}/state-secretaries`, stateSecretaryRoutes);
app.use(`/api/${API_VERSION}/district-secretaries`, districtSecretaryRoutes);
app.use(`/api/${API_VERSION}/payments`, paymentRoutes);
app.use(`/api/${API_VERSION}/reports`, reportRoutes);
app.use(`/api/${API_VERSION}/states`, stateRoutes);
app.use(`/api/${API_VERSION}/districts`, districtRoutes);
app.use(`/api/${API_VERSION}/clubs`, clubRoutes);
app.use(`/api/${API_VERSION}/students`, studentRoutes);
app.use(`/api/${API_VERSION}/events`, eventRoutes);
import eventRegistrationRoutes from './routes/eventRegistration.routes';
app.use(`/api/${API_VERSION}/event-registration`, eventRegistrationRoutes);
app.use(`/api/${API_VERSION}/affiliations`, affiliationRoutes);
app.use(`/api/${API_VERSION}/dashboard`, dashboardRoutes);
app.use(`/api/${API_VERSION}/registration-windows`, registrationWindowRoutes);
app.use(`/api/${API_VERSION}/cms`, cmsRoutes);
app.use(`/api/${API_VERSION}/contact`, contactRoutes);
// LEGACY: app.use(`/api/${API_VERSION}/gallery`, galleryRoutes); // Use /api/v1/cms/gallery instead
app.use(`/api/${API_VERSION}/news`, newsRoutes);
app.use(`/api/${API_VERSION}/settings`, settingsRoutes);
app.use(`/api/${API_VERSION}/locations`, locationsRoutes);
app.use(`/api/${API_VERSION}/stats`, statsRoutes);
import resultRoutes from './routes/result.routes';
app.use(`/api/${API_VERSION}/results`, resultRoutes);
import certificateRoutes from './routes/certificate.routes';
app.use(`/api/${API_VERSION}/certificates`, certificateRoutes);
app.use(`/api/${API_VERSION}/renewal`, renewalRoutes);
import kycRoutes from './routes/kyc.routes';
app.use(`/api/${API_VERSION}/kyc`, kycRoutes);
import coachCertRoutes from './routes/coach-cert.routes';
app.use(`/api/${API_VERSION}/coach-cert`, coachCertRoutes);
// app.use(`/api/${API_VERSION}/payments`, paymentRoutes);
import beginnerCertRoutes from './routes/beginner-cert.routes';
import teamRoutes from './routes/team.routes';
import milestoneRoutes from './routes/milestone.routes';
import uploadRoutes from './routes/upload.routes';
app.use(`/api/${API_VERSION}/beginner-cert`, beginnerCertRoutes);
app.use(`/api/${API_VERSION}/team-members`, teamRoutes);
app.use(`/api/${API_VERSION}/milestones`, milestoneRoutes);
app.use(`/api/${API_VERSION}/upload`, uploadRoutes);
import donationRoutes from './routes/donation.routes';
app.use(`/api/${API_VERSION}/donations`, donationRoutes);
app.use(`/api/${API_VERSION}/homepage`, homepageRoutes);
app.use(`/api/${API_VERSION}/state-directory`, stateDirectoryRoutes);
import razorpayConfigRoutes from './routes/razorpayConfig.routes';
app.use(`/api/${API_VERSION}/razorpay-config`, razorpayConfigRoutes);

// Public notification ribbon — returns array of active registrations/programs
app.get(`/api/${API_VERSION}/notifications/public/active`, cacheMiddleware(300), async (_req: Request, res: Response) => {
  try {
    const { default: prisma } = await import('./config/prisma');
    const now = new Date();
    const notifications: { id: string; message: string; link: string; type: string }[] = [];

    // Active registration windows
    const windows = await prisma.registrationWindow.findMany({
      where: { startDate: { lte: now }, endDate: { gte: now }, isPaused: false },
      select: { id: true, type: true, title: true, endDate: true },
    }).catch(() => []);

    for (const w of windows) {
      const label = w.title || `${w.type.charAt(0).toUpperCase() + w.type.slice(1).toLowerCase()} Registration`;
      const linkMap: Record<string, string> = { student: '/register/student', club: '/register/club', state: '/register/state-secretary', district: '/register/district-secretary', state_secretary: '/register/state-secretary', district_secretary: '/register/district-secretary' };
      notifications.push({
        id: `rw-${w.id}`,
        message: `${label} is now open — Register before ${new Date(w.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}!`,
        link: linkMap[w.type.toLowerCase()] || '/events',
        type: 'info',
      });
    }

    // Active beginner certification programs
    const beginnerProgs = await prisma.beginnerCertProgram.findMany({
      where: { isActive: true, status: { in: ['PUBLISHED', 'REGISTRATION_OPEN'] } },
      select: { id: true, title: true, lastDateToApply: true },
    }).catch(() => []);

    for (const p of beginnerProgs) {
      notifications.push({
        id: `bc-${p.id}`,
        message: `${p.title} — Enroll before ${new Date(p.lastDateToApply).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}!`,
        link: '/beginner-certification',
        type: 'info',
      });
    }

    // Active coach certification programs
    const coachProgs = await prisma.coachCertProgram.findMany({
      where: { isActive: true, status: { in: ['PUBLISHED', 'REGISTRATION_OPEN'] } },
      select: { id: true, title: true, lastDateToApply: true },
    }).catch(() => []);

    for (const p of coachProgs) {
      notifications.push({
        id: `cc-${p.id}`,
        message: `${p.title} — Enroll before ${new Date(p.lastDateToApply).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}!`,
        link: '/coach-certification',
        type: 'info',
      });
    }

    // Live/upcoming events (PUBLISHED/ONGOING/REGISTRATION_OPEN with registration still open)
    const liveEvents = await prisma.event.findMany({
      where: {
        status: { in: ['PUBLISHED', 'ONGOING'] },
        registrationEndDate: { gte: now },
      },
      select: { id: true, name: true, eventDate: true, status: true, registrationEndDate: true },
      orderBy: { eventDate: 'asc' },
      take: 5,
    }).catch(() => []);

    for (const e of liveEvents) {
      const isLive = e.status === 'ONGOING';
      const eventDateStr = new Date(e.eventDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
      notifications.push({
        id: `ev-${e.id}`,
        message: isLive
          ? `${e.name} is LIVE now! Register to participate.`
          : `${e.name} — ${eventDateStr}. Register before ${new Date(e.registrationEndDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}!`,
        link: `/events/${e.id}`,
        type: isLive ? 'success' : 'info',
      });
    }

    // Fallback: env-based static notification (set NOTIFICATION_MESSAGE in Hostinger panel)
    if (notifications.length === 0 && process.env.NOTIFICATION_MESSAGE) {
      notifications.push({
        id: 'env-1',
        message: process.env.NOTIFICATION_MESSAGE,
        link: process.env.NOTIFICATION_LINK || '/events',
        type: 'info',
      });
    }

    res.json({ success: true, data: notifications.length > 0 ? notifications : null });
  } catch {
    // Fallback on error: still try env-based notification
    if (process.env.NOTIFICATION_MESSAGE) {
      return res.json({ success: true, data: [{ id: 'env-1', message: process.env.NOTIFICATION_MESSAGE, link: process.env.NOTIFICATION_LINK || '/events', type: 'info' }] });
    }
    res.json({ success: true, data: null });
  }
});

// Welcome Route
app.get('/', (req: Request, res: Response) => {
  res.json({
    message: 'SSFI API Server',
    version: API_VERSION,
    documentation: `${process.env.APP_URL}/api-docs`,
    status: 'Running'
  });
});

// 404 Handler
app.use(notFound);

// Error Handler (Must be last)
app.use(errorHandler);

// Start Server
const PORT = process.env.PORT || 5001;

let server: ReturnType<typeof app.listen>;

if (process.env.NODE_ENV !== 'test') {
  server = app.listen(PORT, () => {
    logger.info(`SSFI Server running on port ${PORT}`);
    logger.info(`Environment: ${process.env.NODE_ENV}`);
    logger.info(`API Version: ${API_VERSION}`);

    // ── Daily scheduled tasks (renewal emails + account locking) ──
    const runDailyTasks = async () => {
      try {
        const { lockExpiredAccounts, sendRenewalNotifications } = await import('./services/renewal.service');
        const locked = await lockExpiredAccounts();
        logger.info(`[cron] Locked ${locked} expired accounts`);
        const result = await sendRenewalNotifications();
        logger.info(`[cron] Sent ${result.notified} renewal reminders`);
      } catch (err) {
        logger.error('[cron] Daily tasks failed:', err);
      }
    };

    // Run once at startup (after 30s delay to let everything initialize)
    setTimeout(runDailyTasks, 30_000);

    // Then run every 24 hours
    setInterval(runDailyTasks, 24 * 60 * 60 * 1000);
  });

  // Keep-alive timeout: slightly higher than any load balancer / reverse proxy timeout
  server.keepAliveTimeout = 65000;
  server.headersTimeout = 66000;
}

// Graceful shutdown handler
const gracefulShutdown = async (signal: string) => {
  logger.info(`${signal} received. Starting graceful shutdown...`);

  // Stop accepting new connections
  if (server) {
    server.close(() => {
      logger.info('HTTP server closed');
    });
  }

  // Disconnect Prisma
  try {
    const { disconnectPrisma } = await import('./config/prisma');
    await disconnectPrisma();
    logger.info('Database connections closed');
  } catch (e) {
    logger.error('Error disconnecting database:', e);
  }

  // Force exit after 10 seconds if graceful shutdown stalls
  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000);

  process.exit(0);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle unhandled promise rejections (log but don't crash)
process.on('unhandledRejection', (err: Error) => {
  logger.error('Unhandled Rejection:', err);
});

// Handle uncaught exceptions (must exit, but gracefully)
process.on('uncaughtException', (err: Error) => {
  logger.error('Uncaught Exception:', err);
  gracefulShutdown('uncaughtException');
});

export default app;
