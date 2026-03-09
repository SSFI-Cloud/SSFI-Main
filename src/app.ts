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

// ── Process/thread limits (Hostinger has a 200 process cap) ──
// UV_THREADPOOL_SIZE must be set BEFORE any async I/O — controls libuv threads
// for DNS lookups, fs operations, crypto, etc.
if (!process.env.UV_THREADPOOL_SIZE) process.env.UV_THREADPOOL_SIZE = '2';

// Limit libvips (sharp's image library) thread pool via env var
// This MUST be set before sharp is imported
if (!process.env.VIPS_CONCURRENCY) process.env.VIPS_CONCURRENCY = '1';

// Now import and configure sharp
import sharp from 'sharp';
sharp.concurrency(1);

// Import routes
import authRoutes from './routes/auth.routes';
// import adminRoutes from './routes/admin.routes';
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
// import paymentRoutes from './routes/payment.routes';

// Import middleware
import { errorHandler } from './middleware/error.middleware';
import { notFound } from './middleware/error.middleware';
import { requestTimer, requestTimeout, httpCacheHeaders } from './middleware/performance.middleware';

// Import utils
import logger from './utils/logger.util';

const app: Application = express();

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

const corsOptions = {
  origin: (origin: string | undefined, callback: Function) => {
    if (!origin || allowedOrigins.has(origin)) {
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

// Rate Limiting - tuned for 100-150 concurrent users
// Each page load triggers 5-10 API calls, so 100/15min is far too low
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '500'), // 500 requests per 15min per IP
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

// Static Files — with long cache + ETag
app.use('/uploads', express.static(path.join(__dirname, '../uploads'), {
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

app.use(`/api/${API_VERSION}/auth`, authRoutes);
// app.use(`/api/${API_VERSION}/admin`, adminRoutes);
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

// Public notification ribbon — returns active site-wide notification (if any)
// For now returns empty until an admin notification system is built
app.get(`/api/${API_VERSION}/notifications/public/active`, (_req: Request, res: Response) => {
  res.json({ success: true, data: null });
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
